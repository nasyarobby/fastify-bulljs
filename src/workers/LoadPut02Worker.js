const { LoadPut02Queue } = require('../app/controllers/lamp02/Queue');

/**
 *
 * @param {import("bull/lib/job")} job
 */
function processJobLoadPut02(job) {
  return new Promise((res, rej) => {
    let x = 10;
    const fn = setInterval(() => {
      x += 10;
      job.progress(x);
      if (x === 100) {
        clearInterval(fn);
        res('OK');
      }
      if (Math.random() * 2 > 1) rej(new Error('Ups, error.'));
    }, 5000);
  });
}

LoadPut02Queue.process(processJobLoadPut02);
