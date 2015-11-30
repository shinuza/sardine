import _ from 'lodash';

import { SARDINE_CONFIG } from './config';
import { showInfo, showVerbose, showWarning } from '../bin/util';

const events = {};

const handlers = {
  onCreatedMigrationDirectory: (dir) => showInfo(`Created "${dir}"`),
  onCratedDirectionDirectory: (dir) => showVerbose(`Created "${dir}"`),
  onInitSuccess: () => showInfo(`Initialized current directory with ${SARDINE_CONFIG}`),
  onInitNoop: () => showWarning('Already initialized'),
  onApplyMigrationUp: (migration) => showInfo(`Applying "${migration.name}"`),
  onApplyMigrationDown: (migration) => showInfo(`Rolling back "${migration.name}"`),
  onStepApplied: (step) => showVerbose(`Running "${step}"`),
  onStepFileCreated: (path) => showInfo(`Created "${path}"`),
};

[
  'APPLY_BATCH',
  'APPLY_MIGRATION',
  'CREATED_MIGRATION_DIRECTORY',
  'CREATED_DIRECTION_DIRECTORY',
  'INIT_NOOP',
  'INIT_SUCCESS',
  'STEP_APPLIED',
  'STEP_FILE_CREATED',
].forEach((e) => events[e] = _.camelCase(e));

export default {
  handlers,
  events,
};
