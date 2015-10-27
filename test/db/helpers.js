import pg from 'pg';

export function pgRawQuery(query, cb) {
  const config = require('../testConfig/pg');
  const conn = Object.assign({}, config.connection);
  conn.database = 'postgres'; // We need to be connected a another database
  const client = new pg.Client(conn);

  client.connect((connErr) => {
    if(connErr) {
      return cb(connErr);
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
