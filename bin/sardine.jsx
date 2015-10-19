import program from 'commander';

import init from './commands/init';
import create from './commands/create';
import update from './commands/update';

program
  .version(require('../package.json').version)
  .option('-V, --verbose', 'Display verbose information', false);

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

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.help();
}
