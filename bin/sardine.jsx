import program from 'commander';

import create from './commands/create';

program
  .version(require('../package.json').version)
  .option('-V, --verbose', 'Display verbose information', false);

program
  .command('create <suffix>')
  .description('Create a new migration directory')
  .action(create);

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.help();
}
