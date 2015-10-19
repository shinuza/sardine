CREATE TABLE IF NOT EXISTS sardine_migrations
(
  id serial NOT NULL,
  name character varying(255),
  applied boolean,
  migration_time timestamp without time zone,
  checksum text,
  CONSTRAINT sardine_migrations_pkey PRIMARY KEY (id)
);
