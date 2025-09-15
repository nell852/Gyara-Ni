-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('info', 'warning', 'error', 'success')),
  category TEXT CHECK (category IN ('stock_alert', 'order_update', 'system', 'general')),
  is_read BOOLEAN DEFAULT false,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notifications
CREATE POLICY "notifications_select_own_or_admin" ON public.notifications
  FOR SELECT USING (
    user_id = auth.uid() OR 
    user_id IS NULL OR -- Global notifications
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "notifications_insert_authenticated" ON public.notifications
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "notifications_update_own" ON public.notifications
  FOR UPDATE USING (user_id = auth.uid());

-- Function to create low stock alerts
CREATE OR REPLACE FUNCTION public.check_low_stock_alerts()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  low_stock_record RECORD;
BEGIN
  -- Find products with low stock
  FOR low_stock_record IN
    SELECT p.name, i.quantity, i.min_stock_level, p.id as product_id
    FROM public.inventory i
    JOIN public.products p ON i.product_id = p.id
    WHERE i.quantity <= i.min_stock_level AND p.is_active = true
  LOOP
    -- Create notification for admins
    INSERT INTO public.notifications (title, message, type, category)
    VALUES (
      'Stock faible détecté',
      'Le produit "' || low_stock_record.name || '" a un stock faible (' || 
      low_stock_record.quantity || ' restant, minimum: ' || 
      low_stock_record.min_stock_level || ')',
      'warning',
      'stock_alert'
    );
  END LOOP;
END;
$$;
