const { Model, snakeCaseMappers } = require('objection');
const db = require('../app/db');

class Put02Model extends Model {
  static get columnNameMappers() {
    // If your columns are UPPER_SNAKE_CASE you can
    // use snakeCaseMappers({ upperCase: true })
    return snakeCaseMappers({ upperCase: true });
  }

  static get tableName() {
    return 'LAMP_PUT02';
  }

  static get virtualAttributes() {
    return ['displayNomorFaktur', 'displayNomorFakturDiganti'];
  }

  get displayNomorFaktur() {
    if (this.nomorFaktur)
      return this.kodeJenisTransaksi + (this.idFakturDiganti ? '1' : '0') + this.nomorFaktur;
    return this.nomorDok;
  }

  get displayNomorFakturDiganti() {
    if (this.idFakturDiganti2)
      return (
        this.kodeJenisTransaksiDiganti +
        (this.idFakturDiganti2 ? '1' : '0') +
        this.nomorFakturDiganti
      );

    if (this.nomorDokDiganti) return this.nomorDokDiganti;
    return '';
  }
}

Model.knex(db);

module.exports = Put02Model;
