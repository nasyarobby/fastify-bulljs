const db = require('../app/db');

const CHUNK_SIZE = 2;

function insertFpToDb(data) {
  return db.batchInsert('LAMP_PUT02', data, CHUNK_SIZE);
}

function insertDataPihakLainToDb(data) {
  return db.batchInsert('LAMP_PUT03', data, CHUNK_SIZE);
}

module.exports.insertFpToDb = insertFpToDb;
module.exports.insertDataPihakLainToDb = insertDataPihakLainToDb;
