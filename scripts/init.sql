--
-- PostgreSQL database dump
--

\restrict 7BZbAvuYGGigRWhEYFxsSeq7CRm7bDHGhpIDQkB1q14HhIt6gbS7l8rIPoPuT1G

-- Dumped from database version 18.6
-- Dumped by pg_dump version 18.6

-- Started on 2026-10-05 11:20:42

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 223 (class 1259 OID 24674)
-- Name: bronze_rows; Type: TABLE; Schema: public; Owner: postgres
--

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


ALTER TABLE public.bronze_rows OWNER TO postgres;

--
-- TOC entry 224 (class 1259 OID 24701)
-- Name: categories; Type: TABLE; Schema: public; Owner: postgres
--

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


ALTER TABLE public.categories OWNER TO postgres;

--
-- TOC entry 226 (class 1259 OID 24778)
-- Name: category_rules; Type: TABLE; Schema: public; Owner: postgres
--

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


ALTER TABLE public.category_rules OWNER TO postgres;

--
-- TOC entry 227 (class 1259 OID 24811)
-- Name: quality_checks; Type: TABLE; Schema: public; Owner: postgres
--

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


ALTER TABLE public.quality_checks OWNER TO postgres;

--
-- TOC entry 228 (class 1259 OID 24851)
-- Name: rejected_rows; Type: TABLE; Schema: public; Owner: postgres
--

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


ALTER TABLE public.rejected_rows OWNER TO postgres;

--
-- TOC entry 220 (class 1259 OID 24596)
-- Name: sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    token_hash character(64) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    revoked_at timestamp with time zone,
    CONSTRAINT sessions_expiry_after_creation CHECK ((expires_at > created_at))
);


ALTER TABLE public.sessions OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 24725)
-- Name: transactions; Type: TABLE; Schema: public; Owner: postgres
--

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
    CONSTRAINT transactions_installments_valid CHECK ((((installment_current IS NULL) AND (installment_total IS NULL)) OR ((installment_current > 0) AND (installment_total > 0) AND (installment_current <= installment_total)))),
    CONSTRAINT transactions_source_row_positive CHECK ((source_row > 0)),
    CONSTRAINT transactions_type_valid CHECK ((transaction_type = ANY (ARRAY['purchase'::text, 'fee'::text, 'refund'::text, 'payment'::text, 'other'::text])))
);


ALTER TABLE public.transactions OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 24652)
-- Name: upload_mappings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.upload_mappings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    upload_id uuid NOT NULL,
    user_id uuid NOT NULL,
    mapping jsonb NOT NULL,
    confirmed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT upload_mappings_is_object CHECK ((jsonb_typeof(mapping) = 'object'::text))
);


ALTER TABLE public.upload_mappings OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 24618)
-- Name: uploads; Type: TABLE; Schema: public; Owner: postgres
--

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


ALTER TABLE public.uploads OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 24577)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

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


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 4976 (class 2606 OID 24694)
-- Name: bronze_rows bronze_rows_id_upload_user_uq; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bronze_rows
    ADD CONSTRAINT bronze_rows_id_upload_user_uq UNIQUE (id, upload_id, user_id);


--
-- TOC entry 4978 (class 2606 OID 24690)
-- Name: bronze_rows bronze_rows_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bronze_rows
    ADD CONSTRAINT bronze_rows_pkey PRIMARY KEY (id);


--
-- TOC entry 4980 (class 2606 OID 24692)
-- Name: bronze_rows bronze_rows_upload_row_uq; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bronze_rows
    ADD CONSTRAINT bronze_rows_upload_row_uq UNIQUE (upload_id, row_number);


--
-- TOC entry 4983 (class 2606 OID 24716)
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- TOC entry 4995 (class 2606 OID 24798)
-- Name: category_rules category_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.category_rules
    ADD CONSTRAINT category_rules_pkey PRIMARY KEY (id);


--
-- TOC entry 4999 (class 2606 OID 24842)
-- Name: quality_checks quality_checks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quality_checks
    ADD CONSTRAINT quality_checks_pkey PRIMARY KEY (id);


--
-- TOC entry 5001 (class 2606 OID 24844)
-- Name: quality_checks quality_checks_upload_attempt_uq; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quality_checks
    ADD CONSTRAINT quality_checks_upload_attempt_uq UNIQUE (upload_id, attempt_number);


--
-- TOC entry 5004 (class 2606 OID 24873)
-- Name: rejected_rows rejected_rows_one_error_per_code_uq; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rejected_rows
    ADD CONSTRAINT rejected_rows_one_error_per_code_uq UNIQUE (upload_id, source_row, error_code);


--
-- TOC entry 5006 (class 2606 OID 24871)
-- Name: rejected_rows rejected_rows_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rejected_rows
    ADD CONSTRAINT rejected_rows_pkey PRIMARY KEY (id);


--
-- TOC entry 4960 (class 2606 OID 24608)
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- TOC entry 4962 (class 2606 OID 24610)
-- Name: sessions sessions_token_hash_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_token_hash_key UNIQUE (token_hash);


--
-- TOC entry 4989 (class 2606 OID 24752)
-- Name: transactions transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_pkey PRIMARY KEY (id);


--
-- TOC entry 4972 (class 2606 OID 24668)
-- Name: upload_mappings upload_mappings_one_per_upload; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.upload_mappings
    ADD CONSTRAINT upload_mappings_one_per_upload UNIQUE (upload_id);


--
-- TOC entry 4974 (class 2606 OID 24666)
-- Name: upload_mappings upload_mappings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.upload_mappings
    ADD CONSTRAINT upload_mappings_pkey PRIMARY KEY (id);


--
-- TOC entry 4965 (class 2606 OID 24643)
-- Name: uploads uploads_id_user_id_uq; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.uploads
    ADD CONSTRAINT uploads_id_user_id_uq UNIQUE (id, user_id);


--
-- TOC entry 4967 (class 2606 OID 24641)
-- Name: uploads uploads_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.uploads
    ADD CONSTRAINT uploads_pkey PRIMARY KEY (id);


--
-- TOC entry 4957 (class 2606 OID 24594)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 4981 (class 1259 OID 24700)
-- Name: bronze_rows_user_upload_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX bronze_rows_user_upload_idx ON public.bronze_rows USING btree (user_id, upload_id);


--
-- TOC entry 4984 (class 1259 OID 24722)
-- Name: categories_system_name_uq; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX categories_system_name_uq ON public.categories USING btree (lower(name)) WHERE (user_id IS NULL);


--
-- TOC entry 4985 (class 1259 OID 24724)
-- Name: categories_user_active_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX categories_user_active_idx ON public.categories USING btree (user_id, is_active);


--
-- TOC entry 4986 (class 1259 OID 24723)
-- Name: categories_user_name_uq; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX categories_user_name_uq ON public.categories USING btree (user_id, lower(name)) WHERE (user_id IS NOT NULL);


--
-- TOC entry 4996 (class 1259 OID 24809)
-- Name: category_rules_user_active_priority_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX category_rules_user_active_priority_idx ON public.category_rules USING btree (user_id, is_active, priority);


--
-- TOC entry 4997 (class 1259 OID 24810)
-- Name: category_rules_user_match_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX category_rules_user_match_idx ON public.category_rules USING btree (user_id, match_type, lower(match_value));


--
-- TOC entry 5002 (class 1259 OID 24850)
-- Name: quality_checks_user_upload_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX quality_checks_user_upload_idx ON public.quality_checks USING btree (user_id, upload_id);


--
-- TOC entry 5007 (class 1259 OID 24879)
-- Name: rejected_rows_user_upload_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX rejected_rows_user_upload_idx ON public.rejected_rows USING btree (user_id, upload_id);


--
-- TOC entry 4958 (class 1259 OID 24617)
-- Name: sessions_expires_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX sessions_expires_at_idx ON public.sessions USING btree (expires_at);


--
-- TOC entry 4963 (class 1259 OID 24616)
-- Name: sessions_user_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX sessions_user_id_idx ON public.sessions USING btree (user_id);


--
-- TOC entry 4987 (class 1259 OID 24777)
-- Name: transactions_bronze_row_uq; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX transactions_bronze_row_uq ON public.transactions USING btree (bronze_row_id) WHERE (bronze_row_id IS NOT NULL);


--
-- TOC entry 4990 (class 1259 OID 24776)
-- Name: transactions_upload_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX transactions_upload_idx ON public.transactions USING btree (upload_id);


--
-- TOC entry 4991 (class 1259 OID 24774)
-- Name: transactions_user_category_date_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX transactions_user_category_date_idx ON public.transactions USING btree (user_id, category_id, transaction_date DESC);


--
-- TOC entry 4992 (class 1259 OID 24773)
-- Name: transactions_user_date_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX transactions_user_date_idx ON public.transactions USING btree (user_id, transaction_date DESC);


--
-- TOC entry 4993 (class 1259 OID 24775)
-- Name: transactions_user_merchant_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX transactions_user_merchant_idx ON public.transactions USING btree (user_id, merchant);


--
-- TOC entry 4968 (class 1259 OID 24650)
-- Name: uploads_user_created_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX uploads_user_created_at_idx ON public.uploads USING btree (user_id, created_at DESC);


--
-- TOC entry 4969 (class 1259 OID 24649)
-- Name: uploads_user_sha256_uq; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX uploads_user_sha256_uq ON public.uploads USING btree (user_id, sha256);


--
-- TOC entry 4970 (class 1259 OID 24651)
-- Name: uploads_user_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX uploads_user_status_idx ON public.uploads USING btree (user_id, status);


--
-- TOC entry 4955 (class 1259 OID 24595)
-- Name: users_email_lower_uq; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX users_email_lower_uq ON public.users USING btree (lower(email));


--
-- TOC entry 5011 (class 2606 OID 24695)
-- Name: bronze_rows bronze_rows_upload_user_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bronze_rows
    ADD CONSTRAINT bronze_rows_upload_user_fk FOREIGN KEY (upload_id, user_id) REFERENCES public.uploads(id, user_id) ON DELETE CASCADE;


--
-- TOC entry 5012 (class 2606 OID 24717)
-- Name: categories categories_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5017 (class 2606 OID 24804)
-- Name: category_rules category_rules_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.category_rules
    ADD CONSTRAINT category_rules_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE CASCADE;


--
-- TOC entry 5018 (class 2606 OID 24799)
-- Name: category_rules category_rules_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.category_rules
    ADD CONSTRAINT category_rules_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5019 (class 2606 OID 24845)
-- Name: quality_checks quality_checks_upload_user_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quality_checks
    ADD CONSTRAINT quality_checks_upload_user_fk FOREIGN KEY (upload_id, user_id) REFERENCES public.uploads(id, user_id) ON DELETE CASCADE;


--
-- TOC entry 5020 (class 2606 OID 24874)
-- Name: rejected_rows rejected_rows_upload_user_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rejected_rows
    ADD CONSTRAINT rejected_rows_upload_user_fk FOREIGN KEY (upload_id, user_id) REFERENCES public.uploads(id, user_id) ON DELETE CASCADE;


--
-- TOC entry 5008 (class 2606 OID 24611)
-- Name: sessions sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5013 (class 2606 OID 24768)
-- Name: transactions transactions_bronze_row_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_bronze_row_fk FOREIGN KEY (bronze_row_id, upload_id, user_id) REFERENCES public.bronze_rows(id, upload_id, user_id) ON DELETE SET NULL;


--
-- TOC entry 5014 (class 2606 OID 24758)
-- Name: transactions transactions_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL;


--
-- TOC entry 5015 (class 2606 OID 24763)
-- Name: transactions transactions_upload_user_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_upload_user_fk FOREIGN KEY (upload_id, user_id) REFERENCES public.uploads(id, user_id) ON DELETE CASCADE;


--
-- TOC entry 5016 (class 2606 OID 24753)
-- Name: transactions transactions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5010 (class 2606 OID 24669)
-- Name: upload_mappings upload_mappings_upload_user_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.upload_mappings
    ADD CONSTRAINT upload_mappings_upload_user_fk FOREIGN KEY (upload_id, user_id) REFERENCES public.uploads(id, user_id) ON DELETE CASCADE;


--
-- TOC entry 5009 (class 2606 OID 24644)
-- Name: uploads uploads_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.uploads
    ADD CONSTRAINT uploads_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


-- Completed on 2026-10-05 11:20:43

--
-- PostgreSQL database dump complete
--

\unrestrict 7BZbAvuYGGigRWhEYFxsSeq7CRm7bDHGhpIDQkB1q14HhIt6gbS7l8rIPoPuT1G

