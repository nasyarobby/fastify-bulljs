const envDevelopment = {
  DB_DJP1107PUT: 'jdbc:oracle:thin:@10.254.208.36:1521:pajak;DJP1107PUT;error403',
  NODE_ENV: 'production',
  DB_PIHAK_LAIN: 'jdbc:oracle:thin:@10.254.215.153:1521:pajak;apipihaklain;cnaDKO6rg865',
  REDIS_PASS: 'redisdev',
  REDIS_SENTINEL: '10.244.65.16:26379,10.244.65.17:26379,10.244.65.18:26379',
  REDIS_SENTINEL_MASTER: 'mymaster',
  API_EFAKTUR:
    'http://10.254.214.207:8080/faktur-external-service/faktur/;AAAACVDa+gWR2GWpsNOyxIfDEk0=',
  USE_JAR_INSIDE_CONTAINER: true,
};

module.exports = {
  apps: [
    {
      name: 'Worker API',
      script: 'server.js',
      env_development: envDevelopment,
    },
    {
      script: 'workers/Producers.js',
      env_development: envDevelopment,
    },
    {
      script: 'workers/LoadPut02Worker.js',
      env_development: envDevelopment,
    },
    {
      script: 'workers/LoadPut03Worker.js',
      env_development: envDevelopment,
    },
    {
      script: 'workers/SummarizeWorker.js',
      env_development: envDevelopment,
    },
  ],
};
