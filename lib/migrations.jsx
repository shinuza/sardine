import fs from 'fs';
import { basename, resolve } from 'path';

import Promise from 'bluebird';
import co from 'co';
import _ from 'lodash';

import { TransactionError } from './errors';
import { checksum } from './util';
import { getDb, recordMigration, updateMigration } from './db';

Promise.promisifyAll(fs);

function checkIntegrity(up, down, name) {
  _.zip(up, down).forEach((pairs) => {
    const [upFile, downFile] = pairs;
    const upFilename = upFile.filename;
    const downFilename = downFile.filename;
    if(!downFile) {
      throw new IntegrityError(
        `${name}/up/${upFilename} has no "down" counterpart, this migration cannot be applied.`);
    }
    if(!upFile) {
      throw new IntegrityError(
        `${name}/down/${downFilename} has no "up" counterpart, this migration cannot be applied.`);
    }
    if(downFilename !== upFilename) {
      throw new IntegrityError(
         `${downFilename} and ${upFilename} should have the same filename`);
    }
  });
}

function directionCheckSum(files) {
  let sum = '';
  files.forEach((file) => {
    sum = sum + checksum(file.filename, file.contents.toString());
  });

  if(sum === '') {
    return sum;
  }

  return checksum(sum);
}

function fetchContent(path, filename) {
  return fs.readFileAsync(resolve(path, filename))
    .then((contents) => ({ filename, contents, checksum: checksum(filename, contents) }));
}

function readMigration(path) {
  const name = basename(path);
  return Promise
    .all([
      fs.readdirAsync(resolve(path, 'up')).then((up) =>
        Promise.all(
          up.map((filename) => fetchContent(resolve(path, 'up'), filename)))
      ),
      fs.readdirAsync(resolve(path, 'down')).then((down) =>
        Promise.all(
          down.map((filename) => fetchContent(resolve(path, 'down'), filename)))
      ),
    ])
    .then((migrations) =>
      Promise.all(migrations).then(([up, down]) => {
        checkIntegrity(up, down, name);
        const upSum = directionCheckSum(up);
        const downSum = directionCheckSum(down);
        return {
          name,
          up: { files: up, checksum: upSum },
          down: { files: down, checksum: downSum },
          steps: up.length,
          checksum: checksum(upSum, downSum),
        };
      })
    );
}

function discoverMigrations(root) {
  return fs.readdirAsync(root).then((dirs) =>
    Promise.all(
      dirs.map((dir) => readMigration(resolve(root, dir)))
    )
  );
}

function applyMigrations({ migrations, recordedMigrations, direction }) {
  return co(function* apply() {
    for (const migration of migrations) {
      yield applyMigration({ migration, recordedMigrations, direction });
    }
  });
}

function applyMigration({ migration, recordedMigrations, direction }) {
  const known = _.find(recordedMigrations, (rm) => rm.name === migration.name);

  if(known) {
    if(migration.checksum !== known.checksum) {
      throw new IntegrityError(
        `Migration "${migration.name}" has been tampered with, revert it to its previous state before migrating`);
    }
  }

  return getDb()
    .then(({ db }) => {
      return db.tx(function transaction() {
        const batch = migration[direction].files.map((file) => {
          const path = `${migration.name}/${direction}/${file.filename}`;

          return this.query(file.contents.toString());
        });
        return this.batch(batch);
    })
    .then(() => {
      if(known) {
        return updateMigration(known, direction)
      }
      return recordMigration(migration);
    })
    .catch((e) => {
      if(Array.isArray(e)) {
        const errorIndex = _.findIndex(e, (res) => !res.success);
        const file = migration[direction].files[errorIndex];
        e = new TransactionError(`In "${migration.name}/${direction}/${file.filename}": ${e[errorIndex].result.message}`);
      }
      throw e;
    });
  });
}

export default { applyMigrations, discoverMigrations };
