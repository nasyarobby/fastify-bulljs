/* eslint-disable no-console */
const { LoadPut02Queue } = require('../app/controllers/Queue');
const db = require('../app/db');
const { generateFakturPajak } = require('./dev/createFakturPajak');
const { default: status } = require('./status');

/**
 *
 * @param {import("bull/lib/job")} job
 */
async function processJobLoadPut02(job) {
  const { npwp, sptId } = job.data;
  console.log({ npwp, sptId });
  const draft = await db('SPT_1107PUT')
    .where('ID', sptId)
    .whereNull('DELETED_AT')
    .whereNull('SUBMITTED_AT')
    .first();
  if (!draft) throw new Error('Draft tidak ditemukan');
  await db('LAMP_PUT02').where('ID_SPT', sptId).delete();
  const data = generateFakturPajak(npwp, 100, draft.TH_PAJAK, draft.MS_PAJAK);
  return data.reduce(async (prev, fp, index, array) => {
    await prev;
    if (fp.id)
      return db('LAMP_PUT02').insert({
        ID_SPT: sptId,
        ID_FAKTUR: fp.id,
        NPWP_PEMUNGUT: fp.npwpPemungut,
        NPWP_REKANAN: fp.npwpRekanan,
        NAMA_REKANAN: fp.namaRekanan,
        NOMOR_FAKTUR: fp.nomorFaktur,
        TANGGAL_FAKTUR: new Date(fp.tanggalFaktur),
        ID_FAKTUR_DIGANTI: fp.fpDiganti,
        DPP: fp.dpp,
        PPN: fp.ppn,
        PPNBM: fp.ppnbm,
        MASA_PAJAK: fp.masaPajak,
        TAHUN_PAJAK: fp.tahunPajak,
        KODE_JENIS_TRANSAKSI: fp.kdJenisTransaksi,
        STATUS_FAKTUR: fp.statusFaktur,
        CREATED_AT: new Date(),
      });
    console.log({ fp });
    return null;
  }, Promise.resolve());
}

LoadPut02Queue.process(processJobLoadPut02);

async function updateDbStatusError(job, err) {
  console.log(`ERROR: Job LoadPUT02:${job.id}`, { err });
  return db('SPT_1107PUT').where('ID', job.data.sptId).update({
    WPUT02_STATUS: status.ERROR,
    WPUT02_TIMESTAMP: new Date(),
  });
}

// when a new job is active, print to console
LoadPut02Queue.on('active', async (job) => {
  console.log(`STARTED: Job LoadPUT02:${job.id}`);
  return db('SPT_1107PUT').where('ID', job.data.sptId).update({
    WPUT02_STATUS: status.PROCESSING,
    WPUT02_TIMESTAMP: new Date(),
  });
});

// On job completed, print to console job is completed
LoadPut02Queue.on('completed', async (job) => {
  console.log(`DONE: Job LoadPUT02:${job.id}`);
  return db('SPT_1107PUT').where('ID', job.data.sptId).update({
    WPUT02_STATUS: status.DONE,
    WPUT02_TIMESTAMP: new Date(),
  });
});

LoadPut02Queue.on('failed', updateDbStatusError);
