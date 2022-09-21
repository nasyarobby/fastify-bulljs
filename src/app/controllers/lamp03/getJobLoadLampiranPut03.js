const _ = require('lodash');
const { LoadPut03Queue } = require('../Queue');
const db = require('../../db');

module.exports = async function getRoot(req, res) {
  const { npwp } = req.params;
  const sptId = req.params.spt_id;
  const job = await LoadPut03Queue.getJob(`${npwp}:${sptId}`);
  const spt = await db('SPT_1107PUT').where('ID', sptId).where('NPWP', npwp).first();
  if (job) {
    const status = await job.getState();
    return res.xsend(
      'Berhasil mengambil data job',
      {
        job: Object.assign(job, { status }),
        db: _.pick(spt, ['WPUT03_STATUS', 'WPUT03_TIMESTAMP']),
      },
      { code: 'JOB_FOUND' }
    );
  }

  return res.xsend(
    'Job tidak ditemukan',
    { job, db: _.pick(spt, ['WPUT03_STATUS', 'WPUT03_TIMESTAMP']) },
    { code: 'JOB_NOT_FOUND' }
  );
};
