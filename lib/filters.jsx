import _ from 'lodash';

function update(recorded) {
  return function(m) {
    const unknown = !_.find(recorded, (rm) => m.name === rm.name);
    const notApplied = _.find(recorded, (rm) => m.name === rm.name && !rm.applied);

    return unknown || notApplied;
  }
}

function rollback(recorded) {
  return function(m) {
    return _.find(recorded, (rm) => m.name === rm.name && rm.applied === true);
  }
}

export default { update, rollback };
