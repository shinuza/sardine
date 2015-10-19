# Sardine

  A simple database agnostic migration tool.
  
  *Only postgres is supported right now (Why would you use anything else anyway?)*

## Installation

```
$ npm install sardine -g
```

## Getting started

Initialize a new sardine project

```
$ sardine init
```

Create a new migration

```
$ sardine create v1
```

Edit your first migration

```sql
-- 20151015_105530_v1/up/00_foo.sql
CREATE TABLE foo1
(
  id serial NOT NULL,
  CONSTRAINT foo1_pkey PRIMARY KEY (id)
);

-- 20151015_105530_v1/down/00_foo.sql
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

## Usage

```
Usage: sardine [options] [command]


Commands:

  init             Initialize a new Sardine project
  create <suffix>  Create a new migration directory
  update|up        Migrate to the database to the latest version
  rollback|rb      Revert last migration

Options:

  -h, --help     output usage information
  -V, --version  output the version number
  -V, --verbose  Display verbose information
```
# License

  MIT
