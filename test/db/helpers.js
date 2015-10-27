var pg = require('pg');

export function pgRawQuery(query, cb) {
  const config = require('../testConfig/pg');
  const conn = Object.assign({}, config.connection);
  conn.database = 'postgres'; // We need to be connected a another database
  var client = new pg.Client(conn);

  client.connect((err) => {
    if(err) {
      return cb(err);
    }
    client.query(query, (err) => {
      client.end();
      if(err) {
        return cb(err);
      }
      cb();
    });
  });
}
