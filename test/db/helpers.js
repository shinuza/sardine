import pg from 'pg';
import mysql from 'mysql';

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

export function mysqlRawQuery(query, cb) {
  const config = require('../testConfig/mysql');
  const conn = Object.assign({}, config.connection);
  conn.database = 'test'; // We need to be connected a another database

  const client = mysql.createConnection(conn);

  client.query(query, (err) => {
    client.destroy();
    if(err) {
      return cb(err);
    }
    cb();
  });
}
