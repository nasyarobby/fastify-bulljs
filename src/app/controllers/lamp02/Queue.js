const Queue = require('bull');

const LoadPut02Queue = new Queue('load-put-02');

module.exports = {
  LoadPut02Queue,
};
