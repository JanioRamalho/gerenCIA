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
