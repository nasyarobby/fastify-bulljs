const { WAJIB_PAJAK } = require('./DataDummy');
const { randomInteger } = require('./randomize');

function FP({
  id,
  npwpPemungut,
  npwpRekanan,
  namaRekanan,
  nomorFaktur,
  tanggalFaktur,
  fpDiganti,
  dpp,
  ppnbm,
  statusFaktur = 0,
}) {
  this.id = id;
  this.npwpPemungut = npwpPemungut;
  this.npwpRekanan = npwpRekanan;
  this.namaRekanan = namaRekanan;
  this.nomorFaktur = nomorFaktur;
  this.tanggalFaktur = tanggalFaktur;
  this.fpDiganti = fpDiganti;
  this.dpp = dpp;
  this.ppn = dpp * 0.11;
  this.ppnbm = ppnbm ? dpp * 2 : 0;
  this.kdJenisTransaksi = randomInteger(100, 1) > 90 ? '01' : '03';
  this.statusFaktur = statusFaktur;
}

function generateFp(npwpPemungut, numbers = 10, startId = 10000, nomorStartsFrom = 100) {
  const data = [];
  let prevNomor = nomorStartsFrom;
  let prevId = startId;
  // eslint-disable-next-line no-plusplus
  for (let i = 0; i < numbers; i++) {
    prevNomor += 1;
    prevId += 1;
    const rekanan = WAJIB_PAJAK[randomInteger(WAJIB_PAJAK.length - 1, 0)];
    data.push(
      new FP({
        id: prevId,
        npwpPemungut,
        npwpRekanan: rekanan.npwp,
        namaRekanan: rekanan.nama,
        nomorFaktur: String(prevNomor).padStart(13, '0'),
        tanggalFaktur: null,
        fpDiganti: null,
        dpp: randomInteger(100, 1) * 100000,
        ppnbm: randomInteger(100, 1) > 50,
      })
    );
  }

  return data;
}

function generatePembetulanFp(data) {
  let lastId = Math.max(...data.map((row) => row.id));
  let prevNomor = Number(data[data.length - 1].nomorFaktur);
  const dibetulkan = [];
  const pembetulan = data.map((fp) => {
    const random = randomInteger(10, 1);

    if (random > 6) {
      // batal
      dibetulkan.push({ ...fp, status: 2 });
    } else if (random > 3) {
      lastId += 1;
      dibetulkan.push({ ...fp, status: 1 });
      return new FP({
        ...fp,
        id: lastId,
        tanggalFaktur: null,
        fpDiganti: fp.id,
        dpp: randomInteger(100, 1) * 100000,
        ppnbm: randomInteger(100, 1) > 50,
        statusFaktur: 0,
      });
    }
    return undefined;
  });
  return [...dibetulkan, ...pembetulan];
}

function setMasa(data, tahunPajak, masaPajak) {
  return data.map((fp) => {
    const tanggalFaktur = `${tahunPajak}-${String(masaPajak).padStart(2, '0')}-13`;
    return { ...fp, tahunPajak, masaPajak, tanggalFaktur };
  });
}

function generateFakturPajak(npwp, numbers, tahun, masa) {
  let data = generateFp(npwp, numbers);
  data = generatePembetulanFp(data);
  return setMasa(data, tahun, masa);
}

module.exports = { generateFakturPajak };
