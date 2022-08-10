const { LoadPut02Queue } = require('./Queue');

module.exports = async function getRoot(req, res) {
  const { npwp } = req.params;
  const sptId = req.params.spt_id;
  const job = await LoadPut02Queue.getJob(`${npwp}:${sptId}`);
  return res.xsend('Success', { job });
};
