/* eslint-disable no-console */
const { LoadPut02Queue } = require('../app/controllers/Queue');
const db = require('../app/db');
const { default: status } = require('./status');

/**
 *
 * @param {import("bull/lib/job")} job
 */
function processJobLoadPut02(job) {
  return new Promise((res) => {
    let x = 10;
    const fn = setInterval(() => {
      x += 10;
      job.progress(x);
      if (x === 50) {
        clearInterval(fn);
        res('OK');
      }
      // if (Math.random() * 2 > 1) rej(new Error('Ups, error.'));
    }, 5000);
  });
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