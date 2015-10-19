import _ from 'lodash';

function update(recorded) {
  return function(m) {
    const unknown = !_.find(recorded, (rm) => m.name === rm.name);
    const notApplied = _.find(recorded, (rm) => m.name === rm.name && !rm.applied);

    return unknown || notApplied;
  }
}

function rollback(last) {
  return function(m) {
    return m.name === last.name;
  }
}

export default { update, rollback };
