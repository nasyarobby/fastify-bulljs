function WP(nama, npwp) {
  this.nama = nama;
  this.npwp = npwp;
}
const WAJIB_PAJAK = [
  new WP('PT. ABC', '012223334123000'),
  new WP('PT. DEF', '022223334123000'),
  new WP('PT. GHJ', '032223334123000'),
  new WP('PT. KLM', '112223334123000'),
  new WP('PT. NOP', '122223334123000'),
  new WP('PT. QRS', '132223334123000'),
];

module.exports = { WAJIB_PAJAK };
