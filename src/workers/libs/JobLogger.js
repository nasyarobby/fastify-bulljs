const { ChildLogger } = require('./Logger');

module.exports.JobLogger = function JobLogger(name, job) {
  return ChildLogger(name, { jobData: job.data, jobId: job.id });
};
