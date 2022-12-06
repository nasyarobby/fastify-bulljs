/* eslint-disable no-console */
const { spawn } = require('child_process');
const { SummarizeQueue } = require('../app/controllers/Queue');
const db = require('../app/db');
const { JobLogger } = require('./libs/JobLogger');
const { default: status } = require('./libs/status');
const WorkerNameList = require('./libs/WorkerNameList');

function summarizePut2(sptId) {
  return db.raw(
    `
  select
count(*) COUNT_FAKTUR_PUT2,
SUM(DPP) DPP_PUT2,
sum(PPN) PPN_PUT2,
sum(PPNBM) PPNBM_PUT2,
max(CREATED_AT) MAX_TGL_PUT2
from LAMP_PUT02 lp 
where ID_SPT =?
AND STATUS_FAKTUR = 0`,
    [sptId]
  );
}

function summarizePut3(sptId) {
  return db.raw(
    `
  select
count(*) COUNT_FAKTUR_PUT3,
SUM(DPP) DPP_PUT3,
sum(PPN) PPN_PUT3,
sum(PPNBM) PPNBM_PUT3,
max(LOADED_AT) MAX_TGL_PUT3
from LAMP_PUT03 lp 
where ID_SPT = ?
AND FG_HISTORY = 0`,
    [sptId]
  );
}

function summarizeSetoran(sptId) {
  return db.raw(
    `
  SELECT KAP, KJS, COUNT(*) COUNT_SETORAN, SUM(NILAI) NILAI FROM SETORAN
WHERE ID_SPT = ?
GROUP BY KAP, KJS
  `,
    [sptId]
  );
}

function getDraft(sptId) {
  return db('SPT_1107PUT').where('ID', sptId).first();
}

/**
 *
 * @param {import("bull/lib/job")} job
 */
async function processSummarize(job) {
  const { npwp, sptId } = job.data;
  const log = JobLogger(WorkerNameList.SUMMARIZER, job);
  log.debug('Job Data');
  if (process.env.USE_JAR_INSIDE_CONTAINER) {
    return new Promise((res) => {
      console.log('Started');
      const child = spawn(
        `java`,
        ['-Duser.timezone=UTC', '-jar', './workers/bin/load-SPT-1.5.jar', npwp, sptId],
        { shell: '/bin/bash' }
      );
      child.stdout.on('data', (chunk) => {
        Buffer.from(chunk)
          .toString()
          .split('\n')
          .forEach((row) => {
            try {
              console.log(row);
              const {
                // status,
                // message,
                // idSpt,
                totalData,
                processed,
              } = JSON.parse(row);
              const progress = Math.ceil((processed * 100) / totalData);
              job.progress(progress);
            } catch (err) {
              if (err.name === 'SyntaxError') {
                console.log(row);
              } else {
                throw err;
              }
            }
          });
      });

      child.stderr.on('data', (chunk) => {
        console.log(Buffer.from(chunk).toString());
      });

      child.on('close', (code) => {
        console.log('Closed ', code);
        return res('ok');
      });
    });
  }

  const [sumPut2, sumPut3, sumSetoran, draftSpt] = await Promise.all([
    summarizePut2(sptId),
    summarizePut3(sptId),
    summarizeSetoran(sptId),
    getDraft(sptId),
  ]);

  log.debug({ sumPut2, sumPut3, sumSetoran, draftSpt });

  const dataSetoran = sumSetoran.reduce(
    (prev, curr) => {
      const newObj = { ...prev };
      if (['411211', '411219'].includes(curr.KAP)) {
        newObj.nilaiSspPpn += curr.NILAI;
        newObj.jmlSspPpn += 1;
      } else if (['411221', '411229'].includes(curr.KAP)) {
        newObj.nilaiSspPpnBm += curr.NILAI;
        newObj.jmlSspPpnBm += 1;
      } else {
        throw new Error(`Unknown KAP KJS ${curr.KAP}${curr.KJS}`);
      }
      return newObj;
    },
    {
      nilaiSspPpn: 0,
      jmlSspPpn: 0,
      nilaiSspPpnBm: 0,
      jmlSspPpnBm: 0,
    }
  );

  const data = {
    ...dataSetoran,
    npwp,
    masaPjk: draftSpt.MS_PAJAK.toString().padStart(2, '0'),
    tahunPjk: draftSpt.TH_PAJAK.toString(),
    noPembetulan: draftSpt.KD_PEMBETULAN_KE.toString(),
    ppnDipungut: sumPut2[0].PPN_PUT2 + sumPut3[0].PPN_PUT3,
    ppnBmDipungut: sumPut2[0].PPNBM_PUT2 + sumPut3[0].PPNBM_PUT3,
    nilaiDipungut:
      sumPut2[0].PPN_PUT2 + sumPut3[0].PPN_PUT3 + sumPut2[0].PPNBM_PUT2 + sumPut3[0].PPNBM_PUT3,
    dppPut2: sumPut2[0].DPP_PUT2,
    ppnPut2: sumPut2[0].PPN_PUT2,
    ppnBmPut2: sumPut2[0].PPNBM_PUT2,
    countFakturPut2: sumPut2[0].COUNT_FAKTUR_PUT2,
    maxTglPut2: sumPut2[0].MAX_TGL_PUT2,
    dppPut3: sumPut3[0].DPP_PUT3,
    ppnPut3: sumPut3[0].PPN_PUT3,
    ppnBmPut3: sumPut3[0].PPNBM_PUT3,
    countFakturPut3: sumPut3[0].COUNT_FAKTUR_PUT3,
    maxTglPut3: sumPut3[0].MAX_TGL_PUT3,
  };
  log.debug({ data }, 'Generated SPT data');

  await db('SPT_1107PUT').update({
    SUMMARY_DATA: JSON.stringify(data),
    UPDATED_AT: db.raw('SYSTIMESTAMP'),
  });
  return 'OK';
}

SummarizeQueue.process(processSummarize);

async function updateDbStatusError(job, err) {
  console.log(`ERROR: Job Summarize:${job.id}`, { err });
  return db('SPT_1107PUT').where('ID', job.data.sptId).update({
    WSUMMARY_STATUS: status.ERROR,
    WSUMMARY_TIMESTAMP: new Date(),
  });
}

// when a new job is active, print to console
SummarizeQueue.on('active', async (job) => {
  console.log(`STARTED: Job Summarize:${job.id}`);
  return db('SPT_1107PUT').where('ID', job.data.sptId).update({
    WSUMMARY_STATUS: status.PROCESSING,
    WSUMMARY_TIMESTAMP: new Date(),
  });
});

// On job completed, print to console job is completed
SummarizeQueue.on('completed', async (job) => {
  console.log(`DONE: Job Summarize:${job.id}`);
  return db('SPT_1107PUT').where('ID', job.data.sptId).update({
    WSUMMARY_STATUS: status.DONE,
    WSUMMARY_TIMESTAMP: new Date(),
  });
});

SummarizeQueue.on('failed', updateDbStatusError);

module.exports.processSummarize = processSummarize;
