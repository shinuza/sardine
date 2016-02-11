# Sardine

  A simple database agnostic migration tool.

  Supports:

  - Postgres
  - Sqlite3

### Installation

Install the driver for your project

```
$ npm install sqlite3 --save
```

or

```
$ npm install pg --save
```

If you want to use the cli tool

```
$ npm install sardine -g
```

If you want to use `Sardine`'s [API](#api).

```
$ npm install sardine --save
```

### Getting started

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

### Usage

```
Usage:  [options] [command]


Commands:

  init                            Initialize a new Sardine project.
  compile [options] <migration>   Merge up and down steps to single files. Fuzzy searches for <migration>
  create <suffix>                 Create a new migration directory.
  step <migration> [suffixes...]  Create (a) new step(s) in <migration>. Fuzzy searches for <migration>.
  update|up                       Migrate to the database to the latest version.
  rollback|down [options]         Revert latest migration. --all to revert all migrations.
  current|cur                     Show current migration state.

Options:

  -h, --help           output usage information
  -V, --version        output the version number
  -v, --verbose        Display verbose information
  -c, --config [path]  Specify configuration file path

```

# API

**Note**: Every method in the API returns a bluebird `Promise`.

### config

Sardine looks up for a `sardineConfig.js` file in the current directory.
You can override this behavior by passing a path the `--config` CLI option.

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
  path: '/usr/local/mybase.sqlite', // Only used for sqlite3
  preprocess: (content, path) => content, // Optional SQL preprocessing function.
                                          // Takes content and path of a SQL file.
                                          // Returns the actual SQL code to be executed.
                                          // Default: identity function.
};
```

### migration

A `migration` Object looks something this.

```javascript
{
  name: '20151209_010320_foobar',
  up: {
    files: [
      {
        filename: '01_foo.sql',
        contents: 'CREATE TABLE foo1()',
        checksum: ''
      },
      {
        filename: '02_foo.sql',
        contents: 'CREATE TABLE foo2()',
        checksum: ''
      },
    ],
    checksum: checksum(files)
  },
  down: {
    files: [
      {
        filename: '01_foo.sql',
        contents: 'DROP TABLE foo1',
        checksum: ''
      },
      {
        filename: '02_foo.sql',
        contents: 'DROP TABLE foo2',
        checksum: ''
      },
    ],
    checksum: checksum(files)
  },
  steps: 2,
  checksum: checksum(upSum, downSum),
};
```

### new Sardine(config)

Creates a new `Sardine` instance with `config`.

```javascript
const sardine = new Sardine(config);
```

### .create(date, suffix)

Creates a sardine migration directory using `date` and `suffix`

```javascript
const sardine = new Sardine(config);
const date = new Date(2015, 11, 9, 1, 3, 20);
const suffix = 'foobar';
sardine.create(date, suffix);
// Creates 20151209_010320_foobar/up
// Creates 20151209_010320_foobar/down
```

### .step(migrationName, [suffix1][, suffix2][, ...])

Fuzzy searches for a directory name `migrationName` and `suffix` step file in both up and down

```javascript
const sardine = new Sardine(config);
sardine.step('foobar', ['foo', 'bar']);
// Creates 20151209_010320_foobar/up/01_foo.sql
// Creates 20151209_010320_foobar/up/02_bar.sql
// Creates 20151209_010320_foobar/down/01_foo.sql
// Creates 20151209_010320_foobar/down/02_bar.sql
```

### .current(options)

Returns the list of discovered migrations and applies `options.default` or `options.current` on each
line depending on which migration is currently applied. The initial state output is defined by `options.initial`.

Example:

Given that we have three migrations, `foo`, `bar`, `baz`, but not is applied then:

```javascript
sardine.current({
  initial: (n) => `${_.capitalize(n)} state`,
  default: (n) => `default ${n}`,
  current: (n) => `That's the current one: ${n}`,
});
```

would yield:

```javascript
[
  'That\'s the current one: Initial state',
  'default 20151015_105530_foo',
  'default 20151015_105534_bar',
  'default 20151021_134514_baz'
]
```

After calling `sardine.up()`, the same call would yield:

```javascript
[
  'default Initial state',
  'default 20151015_105530_foo',
  'default 20151015_105534_bar',
  'That\'s the current one: 20151021_134514_baz'
]
```

```javascript
const sardine = new Sardine(config);
sardine.step('foobar', ['foo', 'bar']);
// Creates 20151209_010320_foobar/up/01_foo.sql
// Creates 20151209_010320_foobar/up/02_bar.sql
// Creates 20151209_010320_foobar/down/01_foo.sql
// Creates 20151209_010320_foobar/down/02_bar.sql
```

### .up()

Applies all migrations

```javascript
const sardine = new Sardine(config);
sardine.up();
```

### .down(all)

Rollbacks the latest migration, rollbacks everything if `all` is true.

```javascript
const sardine = new Sardine(config);
sardine.down();
```

### .compile(migrationName)

Tries to find `migrationName`, then gathers every files in `up` and `down` and merge each of them in a single string.

```javascript
const sardine = new Sardine(config);
sardine.compile('foobar');

// { files: { up: 'CREATE TABLE foo();', down: 'DROP TABLE foo;' }, migration: { name: 'foobar', ... } }
```

# events

> The default event handlers (used in the CLI) can be found in `require('sardine/events').handlers`;

### initNoop

Fired when `Sardine#init()` was called but a `sardineConfig.js` file already exist in the current working directory.

### initSuccess

Fired when `Sardine#init()` was called and a `sardineConfig.js` file was created in the current working directory.

### createdMigrationDirectory(dir)

Fired when `Sardine#create()` was called and a new migration directory `dir` was created.

### createdDirectionDirectory(dir)

When `Sardine#create()` is called, this event is fired when `dir`/up and `dir`/down are created.

### stepFileCreated(file)

When `Sardine#step(migrationName, [suffix1][, suffix2][, ...])` was called, for each suffix this event is fired twice. Once for the update, and once for the rollback file.

### applyBatch(batch, direction)

Fired when `Sardine#up()` or `Sardine#down()` is called.

- `batch` is a list of[`migration`](#migration) objects.
- `direction` is either *"up"* or *"down"*.

### applyMigration(migration, direction)

Fired when `Sardine#up` or `Sardine#down()` is called.

- `migration` is [`migration`](#migration) object.
- `direction` is either *"up"* or *"down"*.

### stepApplied(file)

Fired each time a sql `file` is executed.

# Code quality

To run tests:

```
$ npm test
```

To lint the code:

```
$ npm run lint

```
# License

  MIT
