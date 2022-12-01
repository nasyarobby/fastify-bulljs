const knex = require('knex')({
  client: 'oracledb',
  connection: {
    connectString: process.env.DB1107PUT_CONNECTION_STRING || '10.254.208.36:1521/pajak',
    user: process.env.DB1107PUT_USER || 'DJP1107PUT',
    password: process.env.DB1107PUT_PASSWORD || 'error403',
    database: process.env.DB1107PUT_DB || 'DJP1107PUT',
  },
  acquireConnectionTimeout: 10000,
  fetchAsString: ['clob'],
  pool: {
    min: process.env.DB1107PUT_MIN_POOL ? Number(process.env.DB1107PUT_MIN_POOL) : 2,
    max: process.env.DB1107PUT_MAX_POOL ? Number(process.env.DB1107PUT_MAX_POOL) : 10,
  },
  debug: process.env.DB1107PUT_LOG === 'true',
});

module.exports = knex;
