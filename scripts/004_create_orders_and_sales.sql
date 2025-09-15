-- Create orders table
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE,
  customer_name TEXT,
  customer_phone TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled')) DEFAULT 'pending',
  total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount >= 0),
  payment_method TEXT CHECK (payment_method IN ('cash', 'card', 'mobile_money')),
  payment_status TEXT NOT NULL CHECK (payment_status IN ('pending', 'paid', 'refunded')) DEFAULT 'pending',
  notes TEXT,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create order items table
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
  total_price DECIMAL(10,2) NOT NULL CHECK (total_price >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for orders
CREATE POLICY "orders_select_authenticated" ON public.orders
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "orders_insert_authenticated" ON public.orders
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "orders_update_authenticated" ON public.orders
  FOR UPDATE USING (auth.role() = 'authenticated');

-- RLS Policies for order items
CREATE POLICY "order_items_select_authenticated" ON public.order_items
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "order_items_insert_authenticated" ON public.order_items
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "order_items_update_authenticated" ON public.order_items
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Function to generate order number
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  order_num TEXT;
  counter INTEGER;
BEGIN
  -- Get today's date in YYYYMMDD format
  SELECT TO_CHAR(NOW(), 'YYYYMMDD') INTO order_num;
  
  -- Get count of orders today
  SELECT COUNT(*) + 1 INTO counter
  FROM public.orders
  WHERE DATE(created_at) = CURRENT_DATE;
  
  -- Format: YYYYMMDD-XXX (e.g., 20241210-001)
  order_num := order_num || '-' || LPAD(counter::TEXT, 3, '0');
  
  RETURN order_num;
END;
$$;

-- Function to create stock movement when order is confirmed
CREATE OR REPLACE FUNCTION public.create_stock_movement_on_order_confirm()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only create stock movements when order status changes to 'confirmed'
  IF NEW.status = 'confirmed' AND OLD.status != 'confirmed' THEN
    -- Idempotency: skip if movements for this order already exist
    IF EXISTS (
      SELECT 1 FROM public.stock_movements sm WHERE sm.reference_id = NEW.id
    ) THEN
      RETURN NEW;
    END IF;
    -- Insert stock movements for each order item
    INSERT INTO public.stock_movements (product_id, movement_type, quantity, reason, reference_id, created_by)
    SELECT 
      oi.product_id,
      'out',
      oi.quantity,
      'Vente - Commande #' || NEW.order_number,
      NEW.id,
      NEW.created_by
    FROM public.order_items oi
    WHERE oi.order_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger to create stock movements when order is confirmed
CREATE TRIGGER create_stock_movement_on_confirm_trigger
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.create_stock_movement_on_order_confirm();

-- Helper function to confirm an order and decrement stock transactionally
CREATE OR REPLACE FUNCTION public.confirm_order(p_order_id UUID, p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order public.orders%ROWTYPE;
  v_missing INTEGER;
BEGIN
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  -- Validate stock availability before creating movements
  SELECT COUNT(*) INTO v_missing
  FROM (
    SELECT i.quantity AS available, oi.quantity AS requested
    FROM public.order_items oi
    LEFT JOIN public.inventory i ON i.product_id = oi.product_id
    WHERE oi.order_id = p_order_id
  ) t
  WHERE t.available IS NULL OR t.available < t.requested;

  IF v_missing > 0 THEN
    RAISE EXCEPTION 'Insufficient stock for one or more items';
  END IF;

  -- Create stock movements for each order item
  INSERT INTO public.stock_movements (product_id, movement_type, quantity, reason, reference_id, created_by)
  SELECT 
    oi.product_id,
    'out',
    oi.quantity,
    'Vente - Commande #' || v_order.order_number,
    v_order.id,
    p_user_id
  FROM public.order_items oi
  WHERE oi.order_id = p_order_id;
  -- Avoid duplicates if already created
  -- Requires unique index on (reference_id, product_id, movement_type)
  ON CONFLICT (reference_id, product_id, movement_type) DO NOTHING;

  -- Update order status to confirmed
  UPDATE public.orders SET status = 'confirmed' WHERE id = p_order_id;
END;
$$;
