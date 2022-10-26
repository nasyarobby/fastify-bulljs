module.exports = {
  apps: [
    {
      name: 'PUT03',
      script: 'workers/testPut03.js',
      env_development: {
        NODE_ENV: 'development',
        REDIS_PASS: 'redisdev',
        REDIS_SENTINEL: '10.244.65.16:26379,10.244.65.17:26379,10.244.65.18:26379',
        REDIS_SENTINEL_MASTER: 'mymaster',
      },
    },
  ],
};
