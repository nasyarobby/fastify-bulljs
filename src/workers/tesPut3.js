process.env.REDIS_SENTINEL = '10.244.65.16:26379,10.244.65.17:26379,10.244.65.18:26379';
process.env.REDIS_SENTINEL_MASTER = 'mymaster';
process.env.REDIS_PASS = 'redisdev';
process.env.LOG_LEVEL = 'trace';
process.env.DBPL_LOG = 'true';
const { processJobLoadPut03 } = require('./LoadPut03Worker');
// const { getTransactionsFromDbPihakLain } = require('./Put3/getTransactionsFromDbPihakLain');

processJobLoadPut03({ data: { npwp: '010611739093000', sptId: 207604 }, id: 'test' });
// getTransactionsFromDbPihakLain('010611739093000', 2022, 8);
