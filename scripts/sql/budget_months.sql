ALTER TABLE public.category_budgets ADD COLUMN month date;

-- O limite da versão anterior passa a valer no mês corrente no Brasil.
UPDATE public.category_budgets
SET month = date_trunc('month', now() AT TIME ZONE 'America/Sao_Paulo')::date;

ALTER TABLE public.category_budgets
    ALTER COLUMN month SET NOT NULL,
    DROP CONSTRAINT category_budgets_user_category_period_key,
    ADD CONSTRAINT category_budgets_user_category_month_key UNIQUE (user_id, category_id, period, month),
    ADD CONSTRAINT category_budgets_month_starts_on_first CHECK (extract(day FROM month) = 1);
