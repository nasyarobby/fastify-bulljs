const { LoadPut03Queue } = require('../Queue');

module.exports = async function getRoot(req, res) {
  const { npwp } = req.params;
  const sptId = req.params.spt_id;
  const jobId = `${npwp}:${sptId}`;
  const exists = await LoadPut03Queue.getJobFromId(jobId);
  if (exists) {
    const status = await exists.getState();
    if (status === 'failed') {
      exists.retry();
      return res.xsend(
        'Job berhasil diretry.',
        { job: exists },
        { code: 'JOB_RETRIED', status: 'success' }
      );
    }

    return res.xsend(
      'Job sudah ada pada queue',
      { job: exists },
      { code: 'JOB_ALREADY_EXISTS', status: 'fail' }
    );
  }

  const job = await LoadPut03Queue.add({ npwp, sptId }, { jobId, removeOnComplete: true });
  return res.xsend('Berhasil menambahkan job', { job }, { code: 'JOB_ADDED' });
};
