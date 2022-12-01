const Pino = require('pino');
/**
 * Logger object khusus untuk Worker
 * @param {*} name nama worker yang akan dicetak di log
 * @returns Pino Logger
 */
const Logger = function Logger(name) {
  return Pino({ name, level: process.env.LOG_LEVEL || 'error' });
};

const ChildLogger = function ChildLogger(name, data) {
  const log = new Logger(name);
  return log.child(data);
};

module.exports.Logger = Logger;
module.exports.ChildLogger = ChildLogger;
