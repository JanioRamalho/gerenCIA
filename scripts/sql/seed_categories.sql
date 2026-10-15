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
