UPDATE public.categories AS category
SET color = palette.color
FROM (VALUES
    (U&'Alimenta\00E7\00E3o', '#B6471B'),
    ('Transporte', '#087C70'),
    ('Lazer', '#7652B3'),
    (U&'Sa\00FAde', '#B5356A'),
    (U&'Educa\00E7\00E3o', '#295DB5'),
    ('Moradia', '#465393'),
    ('Compras', '#926022'),
    ('Assinaturas', '#007A9F'),
    (U&'Servi\00E7os', '#556B2F'),
    ('Viagens', '#A3313E'),
    ('Outros', '#64748B')
) AS palette(name, color)
WHERE category.name = palette.name
  AND category.user_id IS NULL
  AND category.color IS NULL;
