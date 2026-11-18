\set ON_ERROR_STOP on
BEGIN;
SET LOCAL lock_timeout = '5s';
\ir ../sql/budget_months.sql
\ir ../sql/category_colors.sql
COMMIT;
