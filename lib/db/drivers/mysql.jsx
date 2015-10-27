import Promise from 'bluebird';

import Driver from './driver';

export default class Mysql extends Driver {

  NAME = 'mysql';

  CREATE_STATEMENT =
     'CREATE TABLE IF NOT EXISTS `$$tableName$$` (' +
      '`id` INT NOT NULL AUTO_INCREMENT,' +
      '`name` VARCHAR(255) NOT NULL,' +
      '`applied` TINYINT NOT NULL,' +
      '`migration_time` DATETIME(3) NOT NULL,' +
      '`checksum` VARCHAR(255) NOT NULL,' +
      'PRIMARY KEY (`id`)' +
    ');';

  constructor(configuration) {
    super(configuration);
  }

  connect() {
    const self = this;
    const mysql = this.getModule();
    const client = this.client = mysql.createConnection(this.configuration.connection);

    return new Promise(function connectMysql(resolve, reject) {
      client.connect(function onMysqlConnect(err) {
        client.queryAsync = Promise.promisify(client.query);
        client.closeAsync = Promise.promisify(client.end);

        if(err) {
          return reject(err);
        }
        self.connected(true);
        resolve(client);
      });
    });
  }

  result(res) {
    return res[0];
  }
}
