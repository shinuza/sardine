const handlers = {

};

const events = {};

[
  'APPLY_BATCH',
  'APPLY_MIGRATION',
  'CREATED_MIGRATION_DIRECTORY',
  'CREATED_DIRECTION_DIRECTORY',
  'INIT_NOOP',
  'INIT_SUCCESS',
  'STEP_APPLIED',
  'STEP_FILE_CREATED',
].forEach((e) => events[e] = e);

export {
  handlers,
  events,
}
