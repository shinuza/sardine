# Sardine

  A simple database agnostic migration tool.

  Supports:
  
  - Postgres
  - Sqlite3

## Installation

```
$ npm install sardine -g
```

## Getting started

Install the driver for your project

```
$ npm install sqlite3
```

Initialize a new sardine project

```
$ sardine init
```

Edit the configuration to match you database connection settings. Then create a new migration

```
$ sardine create v1
```

Create a new step

```
$ sardine step v1 foo
```

This creates `./up/01_foo.sql` and `./down/01_foo.sql`. Edit them with your sql.

```sql
-- 20151015_105530_v1/up/01_foo.sql
CREATE TABLE foo1
(
  id serial NOT NULL,
  CONSTRAINT foo1_pkey PRIMARY KEY (id)
);

-- 20151015_105530_v1/down/01_foo.sql
DROP TABLE foo1;
```

Apply it

```
$ sardine up
```

Then revert it

```
$ sardine rollback
```

# How does it work?

Sardine will:

  - Look in your migration directory
  - Read every files in the `up` and `down` directory
  - Apply each file by alphabetical order in each migration directory for a given direction
  - Prevent you from running a migration if it has changed. Unless it's the latest one.
  - Ensure you have a `up` and a `down` step with matching names

Sardine will **not**:

  - Check the consistency of your sql steps, it's your job to make sure a `down` step is the strict opposite of the `up` one

## Usage

```
Usage: sardine [options] [command]

Commands:

  init                            Initialize a new Sardine project
  create <suffix>                 Create a new migration directory
  step <migration> [suffixes...]  Create (a) new step(s) in <migration>. Fuzzy searchs migrations by name.
  update|up                       Migrate to the database to the latest version
  rollback|down [options]         Revert latest migration. --all to revert all migrations
  current|cur                     Show current migration

Options:

  -h, --help     output usage information
  -V, --version  output the version number
  -v, --verbose  Display verbose information
```

# API

## config

Sardine looks up for a `sardineConfig.js` file in the current directory.

```javascript
{
  directory: 'migrations', // Directory in which the migrations will be located
  tableName: 'sardine_migrations', // Name of Sardine's meta table
  driver: 'pg', // Driver name, can be pg or sqlite3
  connection: {
    host: 'localhost',
    user: 'postgres',
    password: '',
    database: 'postgres',
  },
  path: '/usr/local/mybase.sqlite', // Only use for sqlite3
};
```

## new Sardine(config)

Creates a new `Sardine` instance with `config`.

```javascript
const sardine = new Sardine(config);
```

## .create(date, suffix)

Creates a sardine migration directory using `date` and `suffix`

```javascript
const sardine = new Sardine(config);
const date = new Date(2015, 11, 9, 1, 3, 20);
const suffix = 'foobar';
sardine.create(date, suffix);
// Creates 20151209_010320_foobar/up
// Creates 20151209_010320_foobar/down
```

## .step(migrationName, [suffix1][, suffix2][, ...])

Fuzzy searches for a directory name `migrationName` and `suffix` step file in both up and down

```javascript
const sardine = new Sardine(config);
sardine.step('foobar', ['foo', 'bar']);
// Creates 20151209_010320_foobar/up/01_foo.sql
// Creates 20151209_010320_foobar/up/02_bar.sql
// Creates 20151209_010320_foobar/down/01_foo.sql
// Creates 20151209_010320_foobar/down/02_bar.sql
```

## .up()

Applies all migrations

```javascript
const sardine = new Sardine(config);
sardine.up();
```

## .down(all)

Rollbacks the latest migration, rollbacks everything if `all` is true.

```javascript
const sardine = new Sardine(config);
sardine.down();
```

# Code quality

To run tests:

```
$ npm test
```

To lint the code:

```
$ npm run-script lint

```
# License

  MIT
