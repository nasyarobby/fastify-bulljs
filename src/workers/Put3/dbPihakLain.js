const knex = require('knex')({
  client: 'oracledb',
  connection: {
    connectString: process.env.DBPL_CONNECTION_STRING || '10.254.215.153:1521/pajak',
    user: process.env.DBPL_USER || 'apipihaklain',
    password: process.env.DBPL_PASSWORD || 'cnaDKO6rg865',
    database: process.env.DBPL_DB || 'apipihaklain',
  },
  acquireConnectionTimeout: 10000,
  fetchAsString: ['clob'],
  pool: {
    min: process.env.DBPL_MIN_POOL ? Number(process.env.DBPL_MIN_POOL) : 2,
    max: process.env.DBPL_MAX_POOL ? Number(process.env.DBPL_MAX_POOL) : 10,
  },
  debug: process.env.DBPL_LOG === 'true',
});

module.exports = knex;
