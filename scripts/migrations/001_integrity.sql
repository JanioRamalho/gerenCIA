-- Atualiza bancos que já receberam a versão original de scripts/init.sql.
-- Não cria banco e não remove nem corrige silenciosamente dados existentes.
\set ON_ERROR_STOP on
BEGIN;

-- Bloqueia gravações durante a validação e a alteração das regras.
LOCK TABLE public.categories, public.category_rules, public.transactions,
           public.bronze_rows IN ACCESS EXCLUSIVE MODE;

ALTER TABLE public.transactions DROP CONSTRAINT transactions_bronze_row_fk;
ALTER TABLE public.transactions ADD CONSTRAINT transactions_bronze_row_fk
    FOREIGN KEY (bronze_row_id, upload_id, user_id)
    REFERENCES public.bronze_rows(id, upload_id, user_id)
    ON DELETE SET NULL (bronze_row_id);

ALTER TABLE public.transactions DROP CONSTRAINT transactions_installments_valid;
ALTER TABLE public.transactions ADD CONSTRAINT transactions_installments_valid CHECK (
    (installment_current IS NULL AND installment_total IS NULL)
    OR (installment_current IS NOT NULL AND installment_total IS NOT NULL
        AND installment_current > 0 AND installment_total > 0
        AND installment_current <= installment_total));

ALTER TABLE public.bronze_rows DROP CONSTRAINT bronze_rows_upload_row_uq;
ALTER TABLE public.bronze_rows ADD CONSTRAINT bronze_rows_upload_row_uq
    UNIQUE NULLS NOT DISTINCT (upload_id, sheet_name, row_number);

-- Triggers só verificam novas gravações. Confira também os vínculos antigos.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM public.transactions t
        JOIN public.categories c ON c.id = t.category_id
        WHERE c.user_id IS NOT NULL AND c.user_id <> t.user_id
    ) OR EXISTS (
        SELECT 1 FROM public.category_rules r
        JOIN public.categories c ON c.id = r.category_id
        WHERE c.user_id IS NOT NULL AND c.user_id <> r.user_id
    ) THEN
        RAISE EXCEPTION 'Existem vínculos com categorias de outro usuário. Revise-os antes de atualizar.'
            USING ERRCODE = '23514';
    END IF;
END;
$$;

\ir ../sql/category_integrity.sql
\ir ../sql/seed_categories.sql

COMMIT;
