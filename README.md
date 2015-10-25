# Sardine

  A simple database agnostic migration tool.

  *Only postgres is supported right now, support for [mysql, and sqlite3 in the works](https://github.com/shinuza/sardine/tree/feature-database-agnostic)*

## Installation

```
$ npm install sardine -g
```

## Getting started

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
