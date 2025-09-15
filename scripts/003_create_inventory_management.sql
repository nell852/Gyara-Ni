-- Create inventory table for stock management
CREATE TABLE IF NOT EXISTS public.inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  min_stock_level INTEGER DEFAULT 5 CHECK (min_stock_level >= 0),
  max_stock_level INTEGER CHECK (max_stock_level >= min_stock_level),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES public.profiles(id)
);

-- Create stock movements table for tracking inventory changes
CREATE TABLE IF NOT EXISTS public.stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('in', 'out', 'adjustment')),
  quantity INTEGER NOT NULL,
  reason TEXT,
  reference_id UUID, -- Can reference orders, adjustments, etc.
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for inventory
CREATE POLICY "inventory_select_authenticated" ON public.inventory
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "inventory_insert_authenticated" ON public.inventory
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "inventory_update_authenticated" ON public.inventory
  FOR UPDATE USING (auth.role() = 'authenticated');

-- RLS Policies for stock movements
CREATE POLICY "stock_movements_select_authenticated" ON public.stock_movements
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "stock_movements_insert_authenticated" ON public.stock_movements
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Function to update inventory when stock movement is created
CREATE OR REPLACE FUNCTION public.update_inventory_on_movement()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_qty INTEGER;
BEGIN
  IF NEW.movement_type = 'in' THEN
    -- Increase stock, insert if missing
    INSERT INTO public.inventory (product_id, quantity, updated_by, last_updated)
    VALUES (NEW.product_id, NEW.quantity, NEW.created_by, NOW())
    ON CONFLICT (product_id)
    DO UPDATE SET
      quantity = inventory.quantity + NEW.quantity,
      updated_by = NEW.created_by,
      last_updated = NOW();

  ELSIF NEW.movement_type = 'out' THEN
    -- Decrease stock, must not go negative and inventory row must exist
    SELECT quantity INTO v_current_qty FROM public.inventory WHERE product_id = NEW.product_id FOR UPDATE;
    IF v_current_qty IS NULL THEN
      RAISE EXCEPTION 'Insufficient stock: no inventory row for product %', NEW.product_id;
    END IF;
    IF v_current_qty < NEW.quantity THEN
      RAISE EXCEPTION 'Insufficient stock: available %, requested % for product %', v_current_qty, NEW.quantity, NEW.product_id;
    END IF;
    UPDATE public.inventory
    SET quantity = v_current_qty - NEW.quantity,
        updated_by = NEW.created_by,
        last_updated = NOW()
    WHERE product_id = NEW.product_id;

  ELSE
    -- adjustment: set absolute quantity, must be >= 0
    IF NEW.quantity < 0 THEN
      RAISE EXCEPTION 'Invalid adjustment quantity: %', NEW.quantity;
    END IF;
    INSERT INTO public.inventory (product_id, quantity, updated_by, last_updated)
    VALUES (NEW.product_id, NEW.quantity, NEW.created_by, NOW())
    ON CONFLICT (product_id)
    DO UPDATE SET
      quantity = NEW.quantity,
      updated_by = NEW.created_by,
      last_updated = NOW();
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger to update inventory on stock movement
CREATE TRIGGER update_inventory_trigger
  AFTER INSERT ON public.stock_movements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_inventory_on_movement();

-- Create unique constraint on inventory product_id
ALTER TABLE public.inventory ADD CONSTRAINT inventory_product_unique UNIQUE (product_id);

-- Ensure we do not duplicate movements for the same reference/product/type
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname = 'stock_movements_unique_ref_prod_type'
  ) THEN
    CREATE UNIQUE INDEX stock_movements_unique_ref_prod_type
      ON public.stock_movements(reference_id, product_id, movement_type);
  END IF;
END $$;
