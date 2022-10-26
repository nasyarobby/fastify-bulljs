function randomInteger(to, from = 0) {
  return Math.floor(Math.random() * to) + from;
}

module.exports = { randomInteger };
