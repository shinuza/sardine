import EventEmitter from 'events';

import _ from 'lodash';
import Promise from 'bluebird';

import filters from './filters';
import { events } from './events';
import { IntegrityError, EmptyBatchError } from './errors';
import Finder from './finder';
import Model from './db/model';

class Migrations extends EventEmitter {
  constructor(config) {
    super();

    this.config = config;
    this.model = new Model(config);
    this.finder = new Finder(config.directory);

    _.bindAll(this, ['up', 'down', 'destroy']);
  }

  verifyLock(discovered, recorded) {
    const latest = _.last(discovered);

    discovered.forEach(({ name, checksum }) => {
      const known = _.find(recorded, ({ n }) => n === name);
      if(!known) {
        return;
      }
      if(latest.name === name && checksum !== known.checksum) {
        throw new IntegrityError(
          `Migration "${name}" has been tampered with, revert it before migrating`);
      }
    });
  }

  getUpdateBatch() {
    return Promise.all([this.finder.discover(), this.model.findAllByName()])
        .then(([discovered, recorded]) => {
          this.verifyLock(discovered, recorded);
          const batch = filters.update(discovered, recorded);
          return { recorded, batch };
        });
  }

  getRollbackBatch(limitToLast) {
    return Promise.all([this.finder.discover(), this.model.findLastAppliedMigrations(limitToLast)])
      .then(([discovered, recorded]) => {
        this.verifyLock(discovered, recorded);
        const batch = filters.rollback(discovered, recorded);
        batch.reverse();
        return { recorded, batch };
      });
  }

  up({ batch, recorded }) {
    return this.applyBatch({ batch, recorded, direction: 'up' });
  }

  down({ batch, recorded }) {
    return this.applyBatch({ batch, recorded, direction: 'down' });
  }

  applyBatch({ batch, recorded, direction }) {
    this.emit(events.APPLY_BATCH, batch, direction);

    const self = this;

    if(batch.length === 0) {
      throw new EmptyBatchError('Cannot apply empty batch');
    }

    return this.model.connect()
      .then(() => Promise.coroutine(function* apply() {
        for (const migration of batch) {
          yield self.applyMigration({ migration, recorded, direction });
        }
      })());
  }

  applyMigration({ migration, recorded, direction }) {
    this.emit(events.APPLY_MIGRATION, migration, direction);

    const steps = migration[direction];
    const known = _.find(recorded, (rm) => rm.name === migration.name);

    if(direction === 'down') {
      steps.files.reverse();
    }

    const batch = steps.files.map((file) => {
      const path = `${migration.name}/${direction}/${file.filename}`;
      this.emit(events.APPLY_STEP, path);
      return {
        path,
        func: () => this.model.query(file.contents.toString()),
      };
    });

    return this.model.transaction(batch)
      .then(() => {
        if(known) {
          return this.model.update({ name: known.name, applied: direction === 'up' });
        }
        return this.model.insert({
          name: migration.name,
          applied: true,
          migration_time: new Date(), // eslint-disable-line camelcase
          checksum: migration.checksum,
        });
      });
  }

  destroy() {
    return this.model && this.model.disconnect();
  }
}

export default Migrations;
