-- Development-only credentials. Never use these roles/passwords in production.
CREATE ROLE spc_migrator LOGIN PASSWORD 'local_migration_password'
  NOSUPERUSER NOCREATEDB NOCREATEROLE;
CREATE ROLE spc_app LOGIN PASSWORD 'local_app_password'
  NOSUPERUSER NOCREATEDB NOCREATEROLE;

CREATE DATABASE supplier_price_control OWNER spc_migrator;
CREATE DATABASE supplier_price_control_shadow OWNER spc_migrator;
CREATE DATABASE supplier_price_control_test OWNER spc_migrator;

REVOKE ALL ON DATABASE supplier_price_control FROM PUBLIC;
REVOKE ALL ON DATABASE supplier_price_control_shadow FROM PUBLIC;
REVOKE ALL ON DATABASE supplier_price_control_test FROM PUBLIC;
GRANT CONNECT ON DATABASE supplier_price_control TO spc_app;
GRANT CONNECT ON DATABASE supplier_price_control_test TO spc_app;

\connect supplier_price_control
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
CREATE SCHEMA app AUTHORIZATION spc_migrator;
GRANT USAGE ON SCHEMA app TO spc_app;
ALTER DEFAULT PRIVILEGES FOR ROLE spc_migrator IN SCHEMA app
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO spc_app;

\connect supplier_price_control_test
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
CREATE SCHEMA app AUTHORIZATION spc_migrator;
GRANT USAGE ON SCHEMA app TO spc_app;
ALTER DEFAULT PRIVILEGES FOR ROLE spc_migrator IN SCHEMA app
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO spc_app;

\connect supplier_price_control_shadow
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
