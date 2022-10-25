/* eslint-disable no-console */
const { spawn } = require('child_process');
const { LoadPut03Queue } = require('../app/controllers/Queue');
const db = require('../app/db');
const { default: status } = require('./status');

/**
 *
 * @param {import("bull/lib/job")} job
 */
function processJobLoadPut03(job) {
  return new Promise((res, rej) => {
    const { npwp, sptId } = job.data;
    const child = spawn(
      `java`,
      ['-Duser.timezone=UTC', '-jar', './workers/bin/load-put3-1.6.jar', npwp, sptId],
      { shell: '/bin/bash' }
    );
    let currentError;
    child.stdout.on('data', (chunk) => {
      Buffer.from(chunk)
        .toString()
        .split('\n')
        .forEach((row) => {
          try {
            if (row) job.log(row);
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

LoadPut03Queue.process(processJobLoadPut03);

async function updateDbStatusError(job, err) {
  console.log(`ERROR: Job LoadPUT03:${job.id}`, { err });
  return db('SPT_1107PUT').where('ID', job.data.sptId).update({
    WPUT03_STATUS: status.ERROR,
    WPUT03_TIMESTAMP: new Date(),
  });
}

// when a new job is active, print to console
LoadPut03Queue.on('active', async (job) => {
  console.log(`STARTED: Job LoadPUT03:${job.id}`);
  return db('SPT_1107PUT').where('ID', job.data.sptId).update({
    WSUMMARY_STATUS: status.UNSYNCED,
    WSUMMARY_TIMESTAMP: new Date(),
    WPUT03_STATUS: status.PROCESSING,
    WPUT03_TIMESTAMP: new Date(),
  });
});

// On job completed, print to console job is completed
LoadPut03Queue.on('completed', async (job) => {
  console.log(`DONE: Job LoadPUT03:${job.id}`);
  return db('SPT_1107PUT').where('ID', job.data.sptId).update({
    WPUT03_STATUS: status.DONE,
    WPUT03_TIMESTAMP: new Date(),
  });
});

LoadPut03Queue.on('failed', updateDbStatusError);
module.exports = {
  processJobLoadPut03,
};
