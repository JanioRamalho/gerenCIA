\set ON_ERROR_STOP on
BEGIN;
SET LOCAL lock_timeout = '5s';
\ir ../sql/monthly_income.sql
COMMIT;
