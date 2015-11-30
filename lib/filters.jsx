import _ from 'lodash';

function update(discovered, recorded) {
  return discovered.filter((m) => {
    const unknown = !_.find(recorded, (rm) => m.name === rm.name);
    const notApplied = _.find(recorded, (rm) => m.name === rm.name && !rm.applied);

    return unknown || notApplied;
  });
}

function rollback(discovered, recorded) {
  return discovered.filter((m) =>
    _.find(recorded, (rm) => m.name === rm.name && rm.applied === true));
}

function current(discovered, recorded) {
  const lastAppliedIndex = _.findLastIndex(recorded, (rm) => rm.applied === true);
  return discovered[lastAppliedIndex === -1 ? 0 : lastAppliedIndex + 1];
}

export default {
  update,
  rollback,
  current,
};
