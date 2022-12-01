/* eslint-disable no-console */
const { spawn } = require('child_process');
const { SummarizeQueue } = require('../app/controllers/Queue');
const db = require('../app/db');
const { default: status } = require('./libs/status');

/**
 *
 * @param {import("bull/lib/job")} job
 */
function processSummarize(job) {
  return new Promise((res) => {
    const { npwp, sptId } = job.data;
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
