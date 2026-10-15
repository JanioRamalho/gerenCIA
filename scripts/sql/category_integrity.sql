-- Categorias globais têm user_id NULL; categorias pessoais têm um dono fixo.
-- Estas regras fazem parte do esquema, além dos modelos SQLAlchemy.

CREATE OR REPLACE FUNCTION public.enforce_category_owner()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
DECLARE
    category_owner uuid;
BEGIN
    IF NEW.category_id IS NULL THEN
        RETURN NEW;
    END IF;

    SELECT user_id INTO category_owner
    FROM public.categories
    WHERE id = NEW.category_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Categoria inexistente.' USING ERRCODE = '23503';
    END IF;

    IF category_owner IS NOT NULL AND category_owner <> NEW.user_id THEN
        RAISE EXCEPTION 'A categoria pessoal deve pertencer ao mesmo usuário.'
            USING ERRCODE = '23514';
    END IF;

    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.prevent_category_owner_change()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
BEGIN
    IF NEW.user_id IS DISTINCT FROM OLD.user_id THEN
        RAISE EXCEPTION 'O dono da categoria não pode ser alterado; crie outra categoria.'
            USING ERRCODE = '23514';
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS transactions_category_owner_guard ON public.transactions;
CREATE TRIGGER transactions_category_owner_guard
BEFORE INSERT OR UPDATE OF category_id, user_id ON public.transactions
FOR EACH ROW EXECUTE FUNCTION public.enforce_category_owner();

DROP TRIGGER IF EXISTS category_rules_category_owner_guard ON public.category_rules;
CREATE TRIGGER category_rules_category_owner_guard
BEFORE INSERT OR UPDATE OF category_id, user_id ON public.category_rules
FOR EACH ROW EXECUTE FUNCTION public.enforce_category_owner();

-- Impede que uma alteração posterior de dono invalide os vínculos já existentes.
DROP TRIGGER IF EXISTS categories_owner_immutable ON public.categories;
CREATE TRIGGER categories_owner_immutable
BEFORE UPDATE OF user_id ON public.categories
FOR EACH ROW EXECUTE FUNCTION public.prevent_category_owner_change();
