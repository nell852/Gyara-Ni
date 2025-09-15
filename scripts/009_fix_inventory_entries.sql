-- Script pour s'assurer que tous les produits ont une entrée d'inventaire
-- Ce script crée des entrées d'inventaire pour les produits qui n'en ont pas

-- Insérer des entrées d'inventaire pour les produits qui n'en ont pas
INSERT INTO public.inventory (product_id, quantity, min_stock_level, max_stock_level, last_updated)
SELECT 
    p.id as product_id,
    0 as quantity,
    5 as min_stock_level,
    100 as max_stock_level,
    NOW() as last_updated
FROM public.products p
LEFT JOIN public.inventory i ON p.id = i.product_id
WHERE i.product_id IS NULL;

-- Mettre à jour les entrées d'inventaire qui ont des valeurs NULL
UPDATE public.inventory 
SET 
    quantity = COALESCE(quantity, 0),
    min_stock_level = COALESCE(min_stock_level, 5),
    max_stock_level = COALESCE(max_stock_level, 100),
    last_updated = NOW()
WHERE 
    quantity IS NULL 
    OR min_stock_level IS NULL 
    OR last_updated IS NULL;