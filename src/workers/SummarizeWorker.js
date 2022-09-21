/* eslint-disable no-console */
const { SummarizeQueue } = require('../app/controllers/Queue');
const db = require('../app/db');
const { default: status } = require('./status');

/**
 *
 * @param {import("bull/lib/job")} job
 */
function processSummarize(job) {
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
