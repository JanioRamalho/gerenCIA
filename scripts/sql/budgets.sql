CREATE TABLE public.category_budgets (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code bigint GENERATED ALWAYS AS IDENTITY UNIQUE,
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    period text NOT NULL DEFAULT 'monthly',
    amount numeric(14, 2) NOT NULL,
    CONSTRAINT category_budgets_user_category_period_key UNIQUE (user_id, category_id, period),
    CONSTRAINT category_budgets_positive_amount CHECK (amount > 0),
    CONSTRAINT category_budgets_period_valid CHECK (period = 'monthly')
);

CREATE TABLE public.notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code bigint GENERATED ALWAYS AS IDENTITY UNIQUE,
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    month date NOT NULL,
    threshold integer NOT NULL,
    spent numeric NOT NULL,
    budget numeric(14, 2) NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    read_at timestamptz,
    CONSTRAINT notifications_budget_threshold_key UNIQUE (user_id, category_id, month, threshold),
    CONSTRAINT notifications_threshold_valid CHECK (threshold IN (80, 100))
);

CREATE INDEX notifications_user_read_idx ON public.notifications (user_id, read_at);

CREATE TRIGGER category_budgets_category_owner_guard
BEFORE INSERT OR UPDATE OF category_id, user_id ON public.category_budgets
FOR EACH ROW EXECUTE FUNCTION public.enforce_category_owner();

CREATE TRIGGER notifications_category_owner_guard
BEFORE INSERT OR UPDATE OF category_id, user_id ON public.notifications
FOR EACH ROW EXECUTE FUNCTION public.enforce_category_owner();
