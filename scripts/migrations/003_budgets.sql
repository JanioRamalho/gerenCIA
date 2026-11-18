\set ON_ERROR_STOP on
BEGIN;
SET LOCAL lock_timeout = '5s';
\ir ../sql/budgets.sql
COMMIT;
