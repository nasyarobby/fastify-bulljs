const db = require('../../app/db');

async function flushDataPut3(npwp, sptId) {
  return db('LAMP_PUT03').where('ID_SPT', sptId).delete();
}

module.exports.flushDataPut3 = flushDataPut3;
