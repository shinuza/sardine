import pg from 'pg';
import config from '../test/testConfig/pg';

function pgRawQuery(query, cb) {
  const conn = Object.assign({}, config.connection);
  conn.database = 'postgres'; // We need to be connected a another database
  const client = new pg.Client(conn);

  client.connect((connErr) => {
    if(connErr) {
      return cb(connErr);
    }
    client.query(query, (err) => {
      if(err) {
        return cb(err);
      }
      cb();
      client.end();
    });
  });
}

export default { config, pgRawQuery };
