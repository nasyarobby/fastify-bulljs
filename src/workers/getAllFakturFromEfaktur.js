const { default: axios } = require('axios');
const { stringify } = require('query-string');

function getFakturFromEfaktur({
  masa,
  npwpPemungut,
  pageNum,
  pageSize,
  tahun,
  statusFaktur,
  kdJnsTransaksi,
}) {
  const queryBody = {
    masa,
    npwpPemungut,
    pageNum,
    pageSize,
    tahun,
  };

  if (statusFaktur) {
    queryBody.statusFaktur = statusFaktur;
  }

  if (kdJnsTransaksi) {
    queryBody.kdJnsTransaksi = kdJnsTransaksi;
  }

  const queryString = stringify(queryBody);
  return axios
    .get(
      `http://10.254.214.207:8080/faktur-external-service/faktur/${npwpPemungut}?${queryString}`,
      {
        headers: {
          apiKey: 'AAAACVDa+gWR2GWpsNOyxIfDEk0=',
        },
      }
    )
    .then(
      (response) =>
        //   console.log(response.data);
        response
    );
}

async function getAllFakturFromEfaktur(npwpPemungut, masa, tahun) {
  const dataFakturPajak = [];

  function loadPage(page) {
    return getFakturFromEfaktur({
      npwpPemungut,
      masa,
      tahun,
      pageNum: page,
      pageSize: 2,
    }).then((response) => {
      const { data } = response;
      if (data.status === 0) return dataFakturPajak;

      dataFakturPajak.push(...data.data);
      return loadPage(page + 1);
    });
  }

  return loadPage(1);
}

async function filterFP(dataFakturPajak) {
  const fp03 = dataFakturPajak.filter((fp) => fp.kdJenisTransaksi === '03');
  const nomorFakturFp03 = fp03.map((fp) => fp.nomorFaktur);
  const fpToDb = dataFakturPajak.filter((fp) => nomorFakturFp03.includes(fp.nomorFaktur));
  return fpToDb;
}

module.exports.getAllFakturFromEfaktur = getAllFakturFromEfaktur;
module.exports.filterFP = filterFP;
