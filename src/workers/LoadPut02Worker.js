/* eslint-disable no-console */
const { spawn } = require('child_process');
const { LoadPut02Queue } = require('../app/controllers/Queue');
const db = require('../app/db');
const executeJarWithPipe = require('./executeJarWithPipe');
// const { generateFakturPajak } = require('./dev/createFakturPajak');
const { default: status } = require('./status');

/**
 *
 * @param {import("bull/lib/job")} job
 */
function processJobLoadPut02(job) {
  const { npwp, sptId } = job.data;
  if (process.env.USE_JAR_INSIDE_CONTAINER) {
    return new Promise((res, rej) => {
      const child = spawn(
        `java`,
        ['-Duser.timezone=UTC', '-jar', './workers/bin/load-put2-1.3.jar', npwp, sptId, 100],
        { shell: '/bin/bash' }
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

  return executeJarWithPipe(`${npwp}-${sptId}`, 'ls -alh /data/services/');
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
