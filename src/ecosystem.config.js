module.exports = {
  apps: [
    {
      script: 'server.js',
    },
    {
      script: 'workers/Producers.js',
    },
    {
      script: 'workers/LoadPut02Worker.js',
      instance: 4,
    },
    {
      script: 'workers/LoadPut03Worker.js',
      instance: 4,
    },
    {
      script: 'workers/SummarizeWorker.js',
      instance: 4,
    },
  ],
};
