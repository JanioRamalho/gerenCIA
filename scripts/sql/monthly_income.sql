-- Renda mensal informada pela pessoa (opcional). Serve de contexto para o
-- perfil de gastos da IA: quanto do que ela ganha costuma ser gasto.
ALTER TABLE public.users
    ADD COLUMN monthly_income numeric(14,2),
    ADD CONSTRAINT users_monthly_income_positive CHECK (monthly_income IS NULL OR monthly_income > 0);
