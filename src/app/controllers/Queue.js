const Queue = require('bull');
const redis = require('../utils/redis');

const redisUrl =
  process.env.NODE_ENV === 'local'
    ? `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`
    : {
        createClient: process.env.REDIS_SENTINEL ? redis.createClientSentinel : redis,
      };

const defaultJobOptions = {
  removeOnComplete: 100,
  removeOnFail: 500,
};

const queueOptions = redisUrl.createClient
  ? [{ ...redisUrl, defaultJobOptions }]
  : [redisUrl, { defaultJobOptions }];

const LoadPut02Queue = new Queue('load-put-02', ...queueOptions);
const LoadPut03Queue = new Queue('load-put-03', ...queueOptions);
const SummarizeQueue = new Queue('summarize', ...queueOptions);
const LoadPut02Producer = new Queue('load-put-02-producer', ...queueOptions);
const LoadPut03Producer = new Queue('load-put-03-producer', ...queueOptions);
const SummarizeProducer = new Queue('summarize-producer', ...queueOptions);

module.exports = {
  LoadPut02Queue,
  LoadPut03Queue,
  SummarizeQueue,
  LoadPut02Producer,
  LoadPut03Producer,
  SummarizeProducer,
};
