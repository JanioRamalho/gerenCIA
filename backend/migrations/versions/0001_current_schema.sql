-- Revisão Alembic 0001: cópia fixa de init.sql e scripts/sql em 16/11/2026.
-- A transação é controlada pelo Alembic. Não editar após a adoção.
-- Sem proprietário fixo: compatível com a conta criadora no PostgreSQL hospedado.

CREATE TABLE public.bronze_rows (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    upload_id uuid NOT NULL,
    user_id uuid NOT NULL,
    row_number integer NOT NULL,
    sheet_name text,
    raw_data jsonb NOT NULL,
    row_hash character(64),
    ingested_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT bronze_rows_raw_is_object CHECK ((jsonb_typeof(raw_data) = 'object'::text)),
    CONSTRAINT bronze_rows_row_number_positive CHECK ((row_number > 0))
);
CREATE TABLE public.categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    name text NOT NULL,
    color character(7),
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT categories_color_valid CHECK (((color IS NULL) OR (color ~ '^#[0-9A-Fa-f]{6}$'::text))),
    CONSTRAINT categories_name_not_empty CHECK ((length(TRIM(BOTH FROM name)) > 0))
);
CREATE TABLE public.category_rules (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    category_id uuid NOT NULL,
    match_type text NOT NULL,
    match_value text NOT NULL,
    priority integer DEFAULT 100 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT category_rules_match_type_valid CHECK ((match_type = ANY (ARRAY['merchant'::text, 'description_contains'::text]))),
    CONSTRAINT category_rules_match_value_not_empty CHECK ((length(TRIM(BOTH FROM match_value)) > 0))
);
CREATE TABLE public.quality_checks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    upload_id uuid NOT NULL,
    user_id uuid NOT NULL,
    attempt_number integer DEFAULT 1 NOT NULL,
    total_rows integer DEFAULT 0 NOT NULL,
    valid_rows integer DEFAULT 0 NOT NULL,
    rejected_rows integer DEFAULT 0 NOT NULL,
    duplicate_rows integer DEFAULT 0 NOT NULL,
    quality_percentage numeric(5,2),
    monetary_totals jsonb DEFAULT '{}'::jsonb NOT NULL,
    details jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT quality_checks_attempt_positive CHECK ((attempt_number > 0)),
    CONSTRAINT quality_checks_counts_nonnegative CHECK (((total_rows >= 0) AND (valid_rows >= 0) AND (rejected_rows >= 0) AND (duplicate_rows >= 0))),
    CONSTRAINT quality_checks_json_objects CHECK (((jsonb_typeof(monetary_totals) = 'object'::text) AND (jsonb_typeof(details) = 'object'::text))),
    CONSTRAINT quality_checks_percentage_valid CHECK (((quality_percentage IS NULL) OR ((quality_percentage >= (0)::numeric) AND (quality_percentage <= (100)::numeric)))),
    CONSTRAINT quality_checks_rows_reconcile CHECK ((total_rows = (valid_rows + rejected_rows)))
);
CREATE TABLE public.rejected_rows (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    upload_id uuid NOT NULL,
    user_id uuid NOT NULL,
    source_row integer NOT NULL,
    raw_data jsonb NOT NULL,
    error_code text NOT NULL,
    error_message text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT rejected_rows_error_code_not_empty CHECK ((length(TRIM(BOTH FROM error_code)) > 0)),
    CONSTRAINT rejected_rows_error_message_not_empty CHECK ((length(TRIM(BOTH FROM error_message)) > 0)),
    CONSTRAINT rejected_rows_raw_is_object CHECK ((jsonb_typeof(raw_data) = 'object'::text)),
    CONSTRAINT rejected_rows_source_row_positive CHECK ((source_row > 0))
);
CREATE TABLE public.sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    token_hash character(64) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    revoked_at timestamp with time zone,
    CONSTRAINT sessions_expiry_after_creation CHECK ((expires_at > created_at))
);
CREATE TABLE public.transactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    upload_id uuid NOT NULL,
    bronze_row_id uuid,
    transaction_date date NOT NULL,
    description_raw text NOT NULL,
    description_normalized text,
    merchant text,
    amount numeric(14,2) NOT NULL,
    transaction_type text DEFAULT 'purchase'::text NOT NULL,
    category_id uuid,
    category_source text DEFAULT 'uncategorized'::text NOT NULL,
    installment_current integer,
    installment_total integer,
    source_row integer NOT NULL,
    is_duplicate boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT transactions_category_source_valid CHECK ((category_source = ANY (ARRAY['personal_rule'::text, 'bank'::text, 'merchant_rule'::text, 'keyword'::text, 'manual'::text, 'uncategorized'::text]))),
    CONSTRAINT transactions_description_not_empty CHECK ((length(TRIM(BOTH FROM description_raw)) > 0)),
    CONSTRAINT transactions_installments_valid CHECK (
        (installment_current IS NULL AND installment_total IS NULL)
        OR (installment_current IS NOT NULL AND installment_total IS NOT NULL
            AND installment_current > 0 AND installment_total > 0
            AND installment_current <= installment_total)),
    CONSTRAINT transactions_source_row_positive CHECK ((source_row > 0)),
    CONSTRAINT transactions_type_valid CHECK ((transaction_type = ANY (ARRAY['purchase'::text, 'fee'::text, 'refund'::text, 'payment'::text, 'other'::text])))
);
CREATE TABLE public.upload_mappings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    upload_id uuid NOT NULL,
    user_id uuid NOT NULL,
    mapping jsonb NOT NULL,
    confirmed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT upload_mappings_is_object CHECK ((jsonb_typeof(mapping) = 'object'::text))
);
CREATE TABLE public.uploads (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    original_filename text NOT NULL,
    file_extension text NOT NULL,
    content_type text,
    file_size_bytes bigint NOT NULL,
    sha256 character(64) NOT NULL,
    storage_path text NOT NULL,
    status text DEFAULT 'uploaded'::text NOT NULL,
    error_message text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    processing_started_at timestamp with time zone,
    processing_finished_at timestamp with time zone,
    CONSTRAINT uploads_extension_valid CHECK ((file_extension = ANY (ARRAY['csv'::text, 'xlsx'::text]))),
    CONSTRAINT uploads_file_size_valid CHECK (((file_size_bytes > 0) AND (file_size_bytes <= 26214400))),
    CONSTRAINT uploads_filename_not_empty CHECK ((length(TRIM(BOTH FROM original_filename)) > 0)),
    CONSTRAINT uploads_sha256_valid CHECK ((sha256 ~ '^[0-9a-fA-F]{64}$'::text)),
    CONSTRAINT uploads_status_valid CHECK ((status = ANY (ARRAY['uploaded'::text, 'profiling'::text, 'awaiting_mapping'::text, 'processing'::text, 'completed'::text, 'failed'::text])))
);
CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    password_hash text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT users_email_not_empty CHECK ((length(TRIM(BOTH FROM email)) > 0)),
    CONSTRAINT users_name_not_empty CHECK ((length(TRIM(BOTH FROM name)) > 0))
);
ALTER TABLE ONLY public.bronze_rows
    ADD CONSTRAINT bronze_rows_id_upload_user_uq UNIQUE (id, upload_id, user_id);
ALTER TABLE ONLY public.bronze_rows
    ADD CONSTRAINT bronze_rows_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.bronze_rows
    ADD CONSTRAINT bronze_rows_upload_row_uq UNIQUE NULLS NOT DISTINCT (upload_id, sheet_name, row_number);
ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.category_rules
    ADD CONSTRAINT category_rules_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.quality_checks
    ADD CONSTRAINT quality_checks_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.quality_checks
    ADD CONSTRAINT quality_checks_upload_attempt_uq UNIQUE (upload_id, attempt_number);
ALTER TABLE ONLY public.rejected_rows
    ADD CONSTRAINT rejected_rows_one_error_per_code_uq UNIQUE (upload_id, source_row, error_code);
ALTER TABLE ONLY public.rejected_rows
    ADD CONSTRAINT rejected_rows_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_token_hash_key UNIQUE (token_hash);
ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.upload_mappings
    ADD CONSTRAINT upload_mappings_one_per_upload UNIQUE (upload_id);
ALTER TABLE ONLY public.upload_mappings
    ADD CONSTRAINT upload_mappings_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.uploads
    ADD CONSTRAINT uploads_id_user_id_uq UNIQUE (id, user_id);
ALTER TABLE ONLY public.uploads
    ADD CONSTRAINT uploads_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);
CREATE INDEX bronze_rows_user_upload_idx ON public.bronze_rows USING btree (user_id, upload_id);
CREATE UNIQUE INDEX categories_system_name_uq ON public.categories USING btree (lower(name)) WHERE (user_id IS NULL);
CREATE INDEX categories_user_active_idx ON public.categories USING btree (user_id, is_active);
CREATE UNIQUE INDEX categories_user_name_uq ON public.categories USING btree (user_id, lower(name)) WHERE (user_id IS NOT NULL);
CREATE INDEX category_rules_user_active_priority_idx ON public.category_rules USING btree (user_id, is_active, priority);
CREATE INDEX category_rules_user_match_idx ON public.category_rules USING btree (user_id, match_type, lower(match_value));
CREATE INDEX quality_checks_user_upload_idx ON public.quality_checks USING btree (user_id, upload_id);
CREATE INDEX rejected_rows_user_upload_idx ON public.rejected_rows USING btree (user_id, upload_id);
CREATE INDEX sessions_expires_at_idx ON public.sessions USING btree (expires_at);
CREATE INDEX sessions_user_id_idx ON public.sessions USING btree (user_id);
CREATE UNIQUE INDEX transactions_bronze_row_uq ON public.transactions USING btree (bronze_row_id) WHERE (bronze_row_id IS NOT NULL);
CREATE INDEX transactions_upload_idx ON public.transactions USING btree (upload_id);
CREATE INDEX transactions_user_category_date_idx ON public.transactions USING btree (user_id, category_id, transaction_date DESC);
CREATE INDEX transactions_user_date_idx ON public.transactions USING btree (user_id, transaction_date DESC);
CREATE INDEX transactions_user_merchant_idx ON public.transactions USING btree (user_id, merchant);
CREATE INDEX uploads_user_created_at_idx ON public.uploads USING btree (user_id, created_at DESC);
CREATE UNIQUE INDEX uploads_user_sha256_uq ON public.uploads USING btree (user_id, sha256);
CREATE INDEX uploads_user_status_idx ON public.uploads USING btree (user_id, status);
CREATE UNIQUE INDEX users_email_lower_uq ON public.users USING btree (lower(email));
ALTER TABLE ONLY public.bronze_rows
    ADD CONSTRAINT bronze_rows_upload_user_fk FOREIGN KEY (upload_id, user_id) REFERENCES public.uploads(id, user_id) ON DELETE CASCADE;
ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.category_rules
    ADD CONSTRAINT category_rules_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.category_rules
    ADD CONSTRAINT category_rules_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.quality_checks
    ADD CONSTRAINT quality_checks_upload_user_fk FOREIGN KEY (upload_id, user_id) REFERENCES public.uploads(id, user_id) ON DELETE CASCADE;
ALTER TABLE ONLY public.rejected_rows
    ADD CONSTRAINT rejected_rows_upload_user_fk FOREIGN KEY (upload_id, user_id) REFERENCES public.uploads(id, user_id) ON DELETE CASCADE;
ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_bronze_row_fk FOREIGN KEY (bronze_row_id, upload_id, user_id) REFERENCES public.bronze_rows(id, upload_id, user_id) ON DELETE SET NULL (bronze_row_id);
ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_upload_user_fk FOREIGN KEY (upload_id, user_id) REFERENCES public.uploads(id, user_id) ON DELETE CASCADE;
ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.upload_mappings
    ADD CONSTRAINT upload_mappings_upload_user_fk FOREIGN KEY (upload_id, user_id) REFERENCES public.uploads(id, user_id) ON DELETE CASCADE;
ALTER TABLE ONLY public.uploads
    ADD CONSTRAINT uploads_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
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

-- Código curto para consulta. Cada tabela tem sua própria sequência.
-- Os UUIDs e todas as referências entre tabelas são preservados.
DO $$
DECLARE
    target_table text;
BEGIN
    FOREACH target_table IN ARRAY ARRAY[
        'users', 'sessions', 'uploads', 'upload_mappings', 'bronze_rows',
        'categories', 'transactions', 'category_rules', 'quality_checks', 'rejected_rows'
    ] LOOP
        EXECUTE format(
            'ALTER TABLE public.%I ADD COLUMN code bigint GENERATED ALWAYS AS IDENTITY',
            target_table
        );
        EXECUTE format(
            'ALTER TABLE public.%I ADD CONSTRAINT %I UNIQUE (code)',
            target_table, target_table || '_code_key'
        );
        EXECUTE format(
            'COMMENT ON COLUMN public.%I.code IS %L',
            target_table, 'Código numérico de consulta, único nesta tabela. Os relacionamentos usam o UUID id.'
        );
    END LOOP;
END;
$$;

-- Categorias globais previstas no planejamento. Pode ser executado novamente.
INSERT INTO public.categories (name) VALUES
    ('Alimentação'),
    ('Transporte'),
    ('Lazer'),
    ('Saúde'),
    ('Educação'),
    ('Moradia'),
    ('Compras'),
    ('Assinaturas'),
    ('Serviços'),
    ('Viagens'),
    ('Outros')
ON CONFLICT (lower(name)) WHERE user_id IS NULL DO NOTHING;

