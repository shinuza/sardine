import program from 'commander';

import init from './commands/init';
import create from './commands/create';
import update from './commands/update';
import rollback from './commands/rollback';

program
  .version(require('../package.json').version)
  .option('-v, --verbose', 'Display verbose information', false);

program
  .command('init')
  .description('Initialize a new Sardine project')
  .action(init);

program
  .command('create <suffix>')
  .description('Create a new migration directory')
  .action(create);

program
  .command('update')
  .alias('up')
  .description('Migrate to the database to the latest version')
  .action(update);

program
  .command('rollback')
  .alias('down')
  .description('Revert last migration')
  .action(rollback);

program
  .command('*')
  .action(() => program.help());

if(!process.argv.slice(2).length) {
  program.help();
}

program.parse(process.argv);
