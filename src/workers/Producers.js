const db = require('../app/db');
const {
  LoadPut03Producer,
  LoadPut02Producer,
  SummarizeProducer,
  LoadPut02Queue,
  LoadPut03Queue,
  SummarizeQueue,
} = require('../app/controllers/Queue');
const { default: STATUS } = require('./status');

// get from table SPT_1107PUT WHERE WSPUT03_STATUS = 1
const getJobLoadLampiranPut03 = async () => {
  const pending = await db('SPT_1107PUT')
    .where('WPUT03_STATUS', STATUS.WAITING)
    .where('SUBMITTED_AT', null);
  return pending;
};

const getJobLoadLampiranPut02 = async () => {
  const pending = await db('SPT_1107PUT')
    .where('WPUT02_STATUS', STATUS.WAITING)
    .where('SUBMITTED_AT', null);
  return pending;
};
const getJobSummarize = async () => {
  const pending = await db('SPT_1107PUT')
    .where('WPUT02_STATUS', STATUS.DONE)
    .where('WPUT03_STATUS', STATUS.DONE)
    .whereIn('WSUMMARY_STATUS', [STATUS.WAITING, STATUS.UNSYNCED])
    .where('SUBMITTED_AT', null);
  return pending;
};

LoadPut02Producer.add({}, { jobId: 'LoadPut02Queue', repeat: { cron: '*/5 * * * * *' } });

LoadPut02Producer.process(() =>
  getJobLoadLampiranPut02().then((jobs) => {
    LoadPut02Queue.addBulk(
      jobs.map((job) => ({
        data: { npwp: job.NPWP, sptId: job.ID },
        opts: { jobId: `${job.NPWP}:${job.ID}`, removeOnComplete: true },
      }))
    );
  })
);

LoadPut03Producer.add({}, { jobId: 'LoadPut03Queue', repeat: { cron: '*/5 * * * * *' } });

LoadPut03Producer.process(() =>
  getJobLoadLampiranPut03().then((jobs) => {
    LoadPut03Queue.addBulk(
      jobs.map((job) => ({
        data: { npwp: job.NPWP, sptId: job.ID },
        opts: { jobId: `${job.NPWP}:${job.ID}`, removeOnComplete: true },
      }))
    );
  })
);

SummarizeProducer.add({}, { jobId: 'SummarizeQueue', repeat: { cron: '*/5 * * * * *' } });

SummarizeProducer.process(() =>
  getJobSummarize().then((jobs) => {
    SummarizeQueue.addBulk(
      jobs.map((job) => ({
        data: { npwp: job.NPWP, sptId: job.ID },
        opts: { jobId: `${job.NPWP}:${job.ID}`, removeOnComplete: true },
      }))
    );
  })
);
