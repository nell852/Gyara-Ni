-- Insert default categories
INSERT INTO public.categories (name, description) VALUES
  ('Boissons', 'Boissons chaudes et froides'),
  ('Plats principaux', 'Plats de résistance'),
  ('Accompagnements', 'Accompagnements et sides'),
  ('Desserts', 'Desserts et sucreries'),
  ('Snacks', 'Collations et en-cas')
ON CONFLICT (name) DO NOTHING;

-- Added ON CONFLICT handling for products to prevent barcode duplicates
-- Insert sample products with conflict resolution
WITH category_ids AS (
  SELECT id, name FROM public.categories
)
INSERT INTO public.products (name, description, category_id, price, cost_price, barcode) 
SELECT 
  product_data.name,
  product_data.description,
  c.id,
  product_data.price,
  product_data.cost_price,
  product_data.barcode
FROM (VALUES
  ('Café Expresso', 'Café expresso traditionnel', 'Boissons', 500.00, 200.00, '1234567890001'),
  ('Thé à la menthe', 'Thé vert à la menthe fraîche', 'Boissons', 300.00, 150.00, '1234567890002'),
  ('Jus d''orange', 'Jus d''orange frais pressé', 'Boissons', 800.00, 400.00, '1234567890003'),
  ('Riz au poulet', 'Riz parfumé avec morceaux de poulet', 'Plats principaux', 2500.00, 1200.00, '1234567890004'),
  ('Poisson braisé', 'Poisson frais braisé aux épices', 'Plats principaux', 3000.00, 1500.00, '1234567890005'),
  ('Salade verte', 'Salade fraîche de saison', 'Accompagnements', 1000.00, 500.00, '1234567890006'),
  ('Frites', 'Pommes de terre frites croustillantes', 'Accompagnements', 800.00, 300.00, '1234567890007'),
  ('Gâteau au chocolat', 'Part de gâteau au chocolat maison', 'Desserts', 1200.00, 600.00, '1234567890008'),
  ('Beignets', 'Beignets sucrés traditionnels', 'Snacks', 200.00, 100.00, '1234567890009'),
  ('Eau minérale', 'Bouteille d''eau minérale 50cl', 'Boissons', 300.00, 150.00, '1234567890010')
) AS product_data(name, description, category_name, price, cost_price, barcode)
JOIN category_ids c ON c.name = product_data.category_name
ON CONFLICT (barcode) DO NOTHING;

-- Added conflict resolution for inventory to prevent duplicate entries
-- Initialize inventory for products with conflict handling
INSERT INTO public.inventory (product_id, quantity, min_stock_level, max_stock_level)
SELECT 
  p.id,
  CASE 
    WHEN c.name = 'Boissons' THEN 50
    WHEN c.name = 'Plats principaux' THEN 20
    WHEN c.name = 'Accompagnements' THEN 30
    WHEN c.name = 'Desserts' THEN 15
    ELSE 25
  END as initial_quantity,
  CASE 
    WHEN c.name = 'Boissons' THEN 10
    WHEN c.name = 'Plats principaux' THEN 5
    WHEN c.name = 'Accompagnements' THEN 8
    WHEN c.name = 'Desserts' THEN 3
    ELSE 5
  END as min_level,
  CASE 
    WHEN c.name = 'Boissons' THEN 100
    WHEN c.name = 'Plats principaux' THEN 50
    WHEN c.name = 'Accompagnements' THEN 60
    WHEN c.name = 'Desserts' THEN 30
    ELSE 50
  END as max_level
FROM public.products p
JOIN public.categories c ON p.category_id = c.id
ON CONFLICT (product_id) DO NOTHING;
