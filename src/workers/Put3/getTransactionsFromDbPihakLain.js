const db = require('./dbPihakLain');
const _ = require("lodash");
const { ChildLogger } = require('../libs/Logger');
const WorkerNameList = require('../libs/WorkerNameList');
const PARTITION = 200;

function getKeteranganByPlatform(platform) {
  switch (platform) {
    case 'pl_lkpp':
      return 'PMK-58/2022';
    case 'pl_siplah':
      return 'PMK-58/2022';
    case 'pl_crypto':
      return 'PMK-58/2022';
    default:
      return '';
  }
}

async function getTransactionsFromDbPihakLain(npwp, tahun, masa) {
  const log = ChildLogger(WorkerNameList.LOAD_PUT3_WORKER, {npwp, tahun, masa, fn: "getTransactionsFromDbPihakLain"})
  log.trace("Started");
  const accumulator = [];
  const month = masa.toString().padStart(2, '0');
  const nextMonth = masa + 1 >12 ? '01' : (masa+1).toString().padStart(2, '0');
  const year = masa+1 > 12 ? tahun + 1 : tahun;
  const start = `${year}-${month}-01`;
  const end = `${year}-${nextMonth}-01`;
  async function loadPage(fromExc, toInc) {
    log.debug('Load transactions Pihak Lain from %d - %d', fromExc, toInc);
    
    const returnedRows = await db.raw(
      `SELECT * FROM (SELECT ROWNUM AS NO, INNERTB.* FROM (SELECT
        *
    FROM
        (
        select * from OBJEK_TRANSAKSI
    WHERE TGL_PEMOTONGAN BETWEEN TO_DATE(?, 'YYYY-MM-DD')
    AND TO_DATE(?, 'YYYY-MM-DD')
    AND EXTRACT(YEAR FROM OBJEK_TRANSAKSI.TGL_PEMOTONGAN) = ?
        AND EXTRACT(MONTH FROM OBJEK_TRANSAKSI.TGL_PEMOTONGAN) = ?
        ) OT
    LEFT JOIN "TRANSAKSI" ON
        "TRANSAKSI"."ID" = "OT"."ID_TRANSAKSI"
    WHERE
        "OT"."NPWP" = ?
    ) INNERTB
    WHERE ROWNUM <= ?
    ) WHERE NO > ?`,
      [start, end, tahun, masa, npwp, toInc, fromExc]
    );

    if (returnedRows && returnedRows.length) {
      log.debug('Got %d', returnedRows.length);
      accumulator.push(...returnedRows);
      if(returnedRows.length >= PARTITION)
      return loadPage(fromExc + PARTITION, toInc + PARTITION);
    }
    log.info("Finish loading all transactions form db pihak lain.")
    return accumulator;
  }
  const data = await loadPage(0, PARTITION);

  const formedData = data
    .filter((item) => ['ppn', 'ppnbm'].includes(item.KODE_OBJEK_PAJAK))
    .reduce((prev, trx) => {
      const newAcc = { ...prev };
      if (newAcc[trx.ID_DARI_CLIENT]) {
        const trxExists =
          newAcc[trx.ID_DARI_CLIENT].findIndex((t) => t.ID_TRANSAKSI === trx.ID_TRANSAKSI) > -1;
        if (!trxExists) newAcc[trx.ID_DARI_CLIENT].push(trx);
        else {
          log.trace('Skipping %s', trx.ID_TRANSAKSI);
        }
      } else {
        newAcc[trx.ID_DARI_CLIENT] = [trx];
      }
      return newAcc;
    }, {});

  const formedData2 = Object.keys(formedData).map((key) => {
    const trxArray = [...formedData[key]];
    trxArray.sort((a, b) => {
      if (a.status === 'new') return -1;
      if (b.status === 'new') return 1;
      if (a.status === 'del') return 1;
      if (b.status === 'del') return -1;
      return a.CREATED_AT - b.CREATED_AT;
    });

    return trxArray.map((t, index, arr) => {
      const json = JSON.parse(t.RAW_JSON);
      const penyerah = json.pihak.find((p) => p.sebagai === 'penjual' || p.sebagai === 'dipungut');
      const penerima = json.pihak.find((p) => p.sebagai === 'pembeli');
      const ppn = json.objekPajak.find((o) => o.kode === 'ppn');
      const ppnbm = json.objekPajak.find((o) => o.kode === 'ppnbm');

      return {
        ...t,
        JSON: json,
        REV_NO: index,
        FG_HISTORY: index === arr.length - 1 ? 0 : 1 ,
        ID_PENYERAH: penyerah.nomorId,
        JENIS_ID_PENYERAH: penyerah.jenisId,
        NAMA_PENYERAH: penyerah.nama,
        ID_PENERIMA: penerima?.nomorId || '',
        JENIS_ID_PENERIMA: penerima?.jenisId || '',
        NAMA_PENERIMA: penerima?.nama || '',
        PPN: ppn?.pajak && Number.isNaN(Number(ppn?.pajak)) === false ? Number(ppn?.pajak) : 0,
        PPNBM: ppn?.pajak && Number.isNaN(Number(ppnbm?.pajak)) === false ? Number(ppnbm?.pajak) : 0,
        KETERANGAN: getKeteranganByPlatform(t.PLATFORM),
      };
    });
  });
  return formedData2;
}

function prepareDbPayload(data, idSpt) {
  return _.flatten(data.map((groups) => {
    return groups.map(row => ({
      ID_SPT: idSpt,
      NAMA_PENYERAH: row.NAMA_PENYERAH,
      JENIS_ID_PENYERAH: row.JENIS_ID_PENYERAH,
      ID_PENYERAH: row.ID_PENYERAH,
      NAMA_PENERIMA: row.NAMA_PENERIMA,
      JENIS_ID_PENERIMA: row.JENIS_ID_PENERIMA,
      ID_PENERIMA: row.ID_PENERIMA,
      NO_DOK: row.NO_DOK,
      TGL_DOK: row.TGL_DOK,
      FG_HISTORY: row.FG_HISTORY,
      DPP: row.DPP,
      PPN: row.PPN,
      PPNBM: row.PPNBM,
      KETERANGAN: row.KETERANGAN,
      // JSON: JSON.stringify(row.JSON),
      TGL_PEMOTONGAN: row.TGL_PEMOTONGAN,
      PLATFORM: row.PLATFORM,
      STATUS: row.STATUS,
      DATA_SENT_AT: row.CREATED_AT,
      LOADED_AT: new Date(),
      REV_NO: row.REV_NO,
      ID_DARI_CLIENT: row.ID_DARI_CLIENT,
    }))
  }))
}

module.exports = {
  getTransactionsFromDbPihakLain,
  prepareDbPayload
}
