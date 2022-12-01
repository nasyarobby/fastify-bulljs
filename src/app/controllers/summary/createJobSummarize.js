const db = require('../../db');
const { default: status } = require('../../../workers/libs/status');

module.exports = async function createJobSummarize(req, res) {
  const { npwp } = req.params;
  const sptId = req.params.spt_id;

  const update = await db('SPT_1107PUT')
    .where('ID', sptId)
    .where('NPWP', npwp)
    .where('DELETED_AT', null)
    .where('SUBMITTED_AT', null)
    .whereNotIn('WSUMMARY_STATUS', [status.PROCESSING])
    .where('WPUT02_STATUS', status.DONE)
    .where('WPUT03_STATUS', status.DONE)
    .update({
      WSUMMARY_STATUS: status.WAITING,
      WSUMMARY_TIMESTAMP: new Date(),
    })
    .returning(['WSUMMARY_STATUS']);

  if (update.length) {
    return res.xsend(
      'Berhasil membuat job summary SPT',
      {
        job: {
          status: 'waiting',
        },
      },
      { code: 'JOB_ADDED' }
    );
  }

  return res.xsend('');
};
