const Queue = require('bull');
const redis = require('../utils/redis');

const redisUrl =
  process.env.NODE_ENV === 'local'
    ? `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`
    : {
        createClient: process.env.REDIS_SENTINEL ? redis.createClientSentinel : redis,
      };

const LoadPut02Queue = new Queue('load-put-02', redisUrl);
const LoadPut03Queue = new Queue('load-put-03', redisUrl);
const SummarizeQueue = new Queue('summarize', redisUrl);
const LoadPut02Producer = new Queue('load-put-02-producer', redisUrl);
const LoadPut03Producer = new Queue('load-put-03-producer', redisUrl);
const SummarizeProducer = new Queue('summarize-producer', redisUrl);

module.exports = {
  LoadPut02Queue,
  LoadPut03Queue,
  SummarizeQueue,
  LoadPut02Producer,
  LoadPut03Producer,
  SummarizeProducer,
};
