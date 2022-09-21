const Queue = require('bull');

const LoadPut02Queue = new Queue('load-put-02');
const LoadPut03Queue = new Queue('load-put-03');
const SummarizeQueue = new Queue('summarize');
const LoadPut02Producer = new Queue('load-put-02-producer');
const LoadPut03Producer = new Queue('load-put-03-producer');
const SummarizeProducer = new Queue('summarize-producer');

module.exports = {
  LoadPut02Queue,
  LoadPut03Queue,
  SummarizeQueue,
  LoadPut02Producer,
  LoadPut03Producer,
  SummarizeProducer,
};
