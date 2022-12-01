/* eslint-disable no-console */
const { LoadPut02Queue } = require('../app/controllers/Queue');
const db = require('../app/db');
const { processJobLoadPut2 } = require('./Put2/processJobLoadPut2');
const { default: status } = require('./libs/status');
const WorkerNameList = require('./libs/WorkerNameList');
const { JobLogger } = require('./libs/JobLogger');
const { setWorkerPut2StatusAsError } = require('./libs/setWorkerPut2StatusAsError');

LoadPut02Queue.process(processJobLoadPut2);

// when a new job is active, print to console
LoadPut02Queue.on('active', async (job) => {
  const log = new JobLogger(WorkerNameList.LOAD_PUT2_WORKER, job);
  log.info({}, 'Job %s is active', job.id);
  return db('SPT_1107PUT').where('ID', job.data.sptId).update({
    WSUMMARY_STATUS: status.UNSYNCED,
    WSUMMARY_TIMESTAMP: new Date(),
    WPUT02_STATUS: status.PROCESSING,
    WPUT02_TIMESTAMP: new Date(),
  });
});

// On job completed, print to console job is completed
LoadPut02Queue.on('completed', async (job) => {
  const log = new JobLogger(WorkerNameList.LOAD_PUT2_WORKER, job);
  log.info({}, 'Job %s is finished', job.id);
  return db('SPT_1107PUT').where('ID', job.data.sptId).update({
    WPUT02_STATUS: status.DONE,
    WPUT02_TIMESTAMP: new Date(),
  });
});

LoadPut02Queue.on('failed', setWorkerPut2StatusAsError);
