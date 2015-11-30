import program from 'commander';

import create from './create';
import drop from './drop';

program
  .command('create')
  .description('Create test database')
  .action(create);

program
  .command('drop')
  .description('Drop test database')
  .action(drop);

program
  .command('*')
  .action(() => program.help());

if(!process.argv.slice(2).length) {
  program.help();
}

program.parse(process.argv);
