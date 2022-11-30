/* eslint-disable no-console */
const { spawn } = require('child_process');
const dayjs = require('dayjs');
const { LoadPut02Queue } = require('../app/controllers/Queue');
const db = require('../app/db');
const { getAllFakturFromEfaktur, filterFP } = require('./getAllFakturFromEfaktur');
const { insertFpToDb } = require('./insertFpToDb');
// const { generateFakturPajak } = require('./dev/createFakturPajak');
const { default: status } = require('./status');

async function flushData(npwp, sptId) {
  const flushDb = await db('LAMP_PUT02')
    .where('NPWP_PEMUNGUT', npwp)
    .where('ID_SPT', sptId)
    .delete();
  console.log('Flushed DB', flushDb);
}

/**
 *
 * @param {import("bull/lib/job")} job
 */
async function processJobLoadPut02(job) {
  const { npwp, sptId } = job.data;
  console.log({ jobData: job.data }, 'Job Data');

  if (process.env.USE_JAR_INSIDE_CONTAINER) {
    return new Promise((res, rej) => {
      console.log('Using JAR inside container');
      const child = spawn(
        `java`,
        ['-Duser.timezone=UTC', '-jar', './workers/bin/load-put2-1.3.jar', npwp, sptId, 100],
        { env: process.env }
      );
      let currentError;
      child.stdout.on('data', (chunk) => {
        Buffer.from(chunk)
          .toString()
          .split('\n')
          .forEach((row, index) => {
            try {
              if (row) job.log(row);
              // const {
              //   // status,
              //   // message,
              //   // idSpt,
              //   totalData,
              //   processed,
              // } = JSON.parse(row);
              // const progress = Math.ceil((processed * 100) / totalData);
              job.progress(index);
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

      child.on('error', (err) => {
        console.log('ERROR!');
        console.error(err);
        currentError = err;
      });

      child.on('close', (code) => {
        console.log('Closed ', code);
        if (code === 1) rej(currentError);
        return res('ok');
      });
    });
  }

  const draftSpt = await db('SPT_1107PUT').where('ID', sptId).first();
  console.log({ draftSpt });
  await flushData(npwp, sptId);
  const data = await getAllFakturFromEfaktur(npwp, draftSpt.MS_PAJAK, draftSpt.TH_PAJAK);
  const fp = (await filterFP(data)).map((row) => ({
    ID_SPT: sptId,
    ID_FAKTUR: row.idFaktur,
    NPWP_PEMUNGUT: npwp,
    NPWP_REKANAN: row.npwpPenjual,
    NAMA_REKANAN: row.namaPenjual,
    NOMOR_FAKTUR: row.nomorFaktur,
    TANGGAL_FAKTUR: dayjs(row.tanggalFaktur.replace(/-/g, '/')).toDate(),
    ID_FAKTUR_DIGANTI: row.idFakturPenggant,
    DPP: row.jumlahDpp,
    PPN: row.jumlahPpn,
    PPNBM: row.jumlahPpnbm,
    MASA_PAJAK: row.masaPajak,
    TAHUN_PAJAK: row.tahunPajak,
    KODE_JENIS_TRANSAKSI: row.kdJenisTransaksi,
    STATUS_FAKTUR: row.statusFaktur,
    // CREATED_AT: db.raw('SYSTIMESTAMP'),
    SUMBER: 1,
    NOMOR_DOK: null,
  }));

  const getDok = await db('DOK_DIPERSAMAKAN')
    .select(
      'DOK_DIPERSAMAKAN.*',
      db.raw(
        `(CASE WHEN DOK_DIPERSAMAKAN.FG_BATAL = 1 
      THEN 'batal' 
      ELSE (
        CASE 
          WHEN TDIGANTI.ID_DOK_PERNAH_DIGANTI IS NULL
          THEN
            (CASE
              WHEN DOK_DIPERSAMAKAN.ID_DOK_DIGANTI=0
              THEN 'normal'
              ELSE 'normal diganti'
            END)
          ELSE 'diganti'
        END)
      END)
      AS STATUS_DOK`
      )
    )
    .joinRaw(
      `LEFT JOIN (SELECT ID_DOK_DIGANTI ID_DOK_PERNAH_DIGANTI
    FROM DOK_DIPERSAMAKAN
    WHERE ID_DOK_DIGANTI IS NOT NULL 
    GROUP BY ID_DOK_DIGANTI) TDIGANTI
    ON TDIGANTI.ID_DOK_PERNAH_DIGANTI=DOK_DIPERSAMAKAN.ID_DOK`
    )
    .where('JENIS_LAMP', 2)
    .where('NPWP_PEMUNGUT', npwp)
    .where('MASA_PAJAK', draftSpt.MS_PAJAK)
    .where('TAHUN_PAJAK', draftSpt.TH_PAJAK);

  const getDokPayload = await getDok.map((row) => {
    let statusDok;
    if (row.STATUS_DOK === 'batal') statusDok = 2;
    else if (row.STATUS_DOK.startsWith('normal')) {
      statusDok = 0;
    } else statusDok = 1;
    return {
      ID_SPT: sptId,
      ID_FAKTUR: row.ID_DOK,
      NPWP_PEMUNGUT: npwp,
      NPWP_REKANAN: row.NPWP_PENJUAL,
      NAMA_REKANAN: row.NAMA_PENJUAL,
      NOMOR_FAKTUR: null,
      TANGGAL_FAKTUR: row.TANGGAL_DOK,
      ID_FAKTUR_DIGANTI: row.ID_DOK_DIGANTI,
      DPP: row.DPP,
      PPN: row.PPN,
      PPNBM: row.PPNBM,
      MASA_PAJAK: row.MASA_PAJAK,
      TAHUN_PAJAK: row.TAHUN_PAJAK,
      KODE_JENIS_TRANSAKSI: '03',
      STATUS_FAKTUR: statusDok,
      // CREATED_AT: db.raw('SYSTIMESTAMP'),
      SUMBER: 2,
      NOMOR_DOK: row.NOMOR_DOK,
    };
  });
  await insertFpToDb([...fp, ...getDokPayload]);
  console.log('Finished inserting FP to DB');

  return true;
}

LoadPut02Queue.process(processJobLoadPut02);

async function updateDbStatusError(job, err) {
  console.log(`ERROR: Job LoadPUT02:${job.id}`, { err });
  return db('SPT_1107PUT').where('ID', job.data.sptId).update({
    WPUT02_STATUS: status.ERROR,
    WPUT02_TIMESTAMP: new Date(),
  });
}

// when a new job is active, print to console
LoadPut02Queue.on('active', async (job) => {
  console.log(`STARTED: Job LoadPUT02:${job.id}`);
  return db('SPT_1107PUT').where('ID', job.data.sptId).update({
    WSUMMARY_STATUS: status.UNSYNCED,
    WSUMMARY_TIMESTAMP: new Date(),
    WPUT02_STATUS: status.PROCESSING,
    WPUT02_TIMESTAMP: new Date(),
  });
});

// On job completed, print to console job is completed
LoadPut02Queue.on('completed', async (job) => {
  console.log(`DONE: Job LoadPUT02:${job.id}`);
  return db('SPT_1107PUT').where('ID', job.data.sptId).update({
    WPUT02_STATUS: status.DONE,
    WPUT02_TIMESTAMP: new Date(),
  });
});

LoadPut02Queue.on('failed', updateDbStatusError);

module.exports.processJobLoadPut02 = processJobLoadPut02;
