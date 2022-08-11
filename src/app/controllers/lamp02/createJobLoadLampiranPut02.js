const { LoadPut02Queue } = require('./Queue');

module.exports = async function getRoot(req, res) {
  const { npwp } = req.params;
  const sptId = req.params.spt_id;
  const jobId = `${npwp}:${sptId}`;
  const exists = await LoadPut02Queue.getJobFromId(jobId);
  if (exists)
    return res.xsend(
      'Job sudah ada pada queue',
      { job: exists },
      { code: 'JOB_ALREADY_EXISTS', status: 'fail' }
    );

  const job = await LoadPut02Queue.add({ npwp, sptId }, { jobId, removeOnComplete: true });
  return res.xsend('Berhasil menambahkan job', { job });
};
