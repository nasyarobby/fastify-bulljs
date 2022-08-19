const knex = require('knex')({
  client: 'oracledb',
  connection: {
    connectString: process.env.DBBM_CONNECTION_STRING || '10.254.208.36:1521/pajak',
    user: process.env.DBBM_USER || 'DJP1107PUT',
    password: process.env.DBBM_PASSWORD || 'error403',
    database: process.env.DBBM_DB || 'DJP1107PUT',
  },
  acquireConnectionTimeout: 10000,
  fetchAsString: ['clob'],
  pool: {
    min: process.env.DBBM_MIN_POOL ? Number(process.env.DBBM_MIN_POOL) : 2,
    max: process.env.DBBM_MAX_POOL ? Number(process.env.DBBM_MAX_POOL) : 10,
  },
  debug: process.env.NODE_ENV !== 'production',
});

module.exports = knex
