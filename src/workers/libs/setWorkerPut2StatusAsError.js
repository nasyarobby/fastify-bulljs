const db = require('../../app/db');
const { JobLogger } = require('./JobLogger');
const { default: status } = require('./status');
const WorkerNameList = require('./WorkerNameList');

async function setWorkerPut2StatusAsError(job, err) {
  const log = JobLogger(WorkerNameList.LOAD_PUT2_WORKER, job);
  log.error({ err }, `ERROR: Job LoadPUT02 %s`, job.id);
  return db('SPT_1107PUT').where('ID', job.data.sptId).update({
    WPUT02_STATUS: status.ERROR,
    WPUT02_TIMESTAMP: new Date(),
  });
}

module.exports.setWorkerPut2StatusAsError = setWorkerPut2StatusAsError;
