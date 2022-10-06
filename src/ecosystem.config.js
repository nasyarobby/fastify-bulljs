module.exports = {
  apps: [
    {
      name: 'Worker API',
      script: 'server.js',
      env_development: {
        NODE_ENV: 'development',
        REDIS_PASS: 'redisdev',
        REDIS_SENTINEL: '10.244.65.16:26379,10.244.65.17:26379,10.244.65.18:26379',
        REDIS_SENTINEL_MASTER: 'mymaster',
      },
    },
    {
      script: 'workers/Producers.js',
      env_development: {
        NODE_ENV: 'development',
        REDIS_PASS: 'redisdev',
        REDIS_SENTINEL: '10.244.65.16:26379,10.244.65.17:26379,10.244.65.18:26379',
        REDIS_SENTINEL_MASTER: 'mymaster',
      },
    },
    {
      script: 'workers/LoadPut02Worker.js',
      instance: 4,
      env_development: {
        NODE_ENV: 'development',
        REDIS_PASS: 'redisdev',
        REDIS_SENTINEL: '10.244.65.16:26379,10.244.65.17:26379,10.244.65.18:26379',
        REDIS_SENTINEL_MASTER: 'mymaster',
      },
    },
    {
      script: 'workers/LoadPut03Worker.js',
      instance: 4,
      env_development: {
        NODE_ENV: 'development',
        REDIS_PASS: 'redisdev',
        REDIS_SENTINEL: '10.244.65.16:26379,10.244.65.17:26379,10.244.65.18:26379',
        REDIS_SENTINEL_MASTER: 'mymaster',
      },
    },
    {
      script: 'workers/SummarizeWorker.js',
      instance: 4,
      env_development: {
        NODE_ENV: 'development',
        REDIS_PASS: 'redisdev',
        REDIS_SENTINEL: '10.244.65.16:26379,10.244.65.17:26379,10.244.65.18:26379',
        REDIS_SENTINEL_MASTER: 'mymaster',
      },
    },
  ],
};
