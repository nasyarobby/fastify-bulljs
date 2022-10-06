const db = require('../../db');
const { default: status } = require('../../../workers/status');

module.exports = async function createJobSummarize(req, res) {
  const { npwp } = req.params;
  const sptId = req.params.spt_id;

  await db('SPT_1107PUT')
    .where('ID', sptId)
    .where('NPWP', npwp)
    .where('DELETED_AT', null)
    .where('SUBMITTED_AT', null)
    .whereIn('WSUMMARY_STATUS', [status.UNSYNCED, status.ERROR, status.WAITING, status.DONE])
    .where('WPUT02_STATUS', status.DONE)
    .where('WPUT03_STATUS', status.DONE)
    .update({
      WSUMMARY_STATUS: status.WAITING,
      WSUMMARY_TIMESTAMP: new Date(),
    });
  return res.xsend(
    'Berhasil membuat job summary SPT',
    { status: 'waiting' },
    { code: 'JOB_ADDED' }
  );
};
