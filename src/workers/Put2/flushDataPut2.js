const db = require('../../app/db');
const { Logger } = require('../libs/Logger');
const WorkerNameList = require('../libs/WorkerNameList');

const log = new Logger(WorkerNameList.LOAD_PUT2_WORKER);

module.exports.flushDataPut2 = async function flushDataPut2(npwp, sptId) {
  const flushDb = await db('LAMP_PUT02')
    .where('NPWP_PEMUNGUT', npwp)
    .where('ID_SPT', sptId)
    .delete();
  log.trace({}, 'Flushed Data PUT2: %d rows', flushDb);
};
