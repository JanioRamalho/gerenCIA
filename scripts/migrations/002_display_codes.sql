-- Atualiza o esquema já instalado para incluir códigos curtos nas 10 tabelas.
-- Execute uma vez, depois da correção de integridade 001, se ela for necessária.
\set ON_ERROR_STOP on
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';

\ir ../sql/display_codes.sql

COMMIT;
