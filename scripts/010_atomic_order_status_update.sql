-- Function to atomically update both order status and payment status
-- This ensures consistency and prevents race conditions
CREATE OR REPLACE FUNCTION public.update_order_status_atomic(
  p_order_id UUID,
  p_order_status TEXT,
  p_payment_status TEXT,
  p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order public.orders%ROWTYPE;
  v_old_status TEXT;
  v_old_payment_status TEXT;
  v_result JSONB;
BEGIN
  -- Get current order data
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found with ID: %', p_order_id;
  END IF;
  
  -- Store old values for comparison
  v_old_status := v_order.status;
  v_old_payment_status := v_order.payment_status;
  
  -- Validate new status values
  IF p_order_status NOT IN ('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled') THEN
    RAISE EXCEPTION 'Invalid order status: %', p_order_status;
  END IF;
  
  IF p_payment_status NOT IN ('pending', 'paid', 'refunded') THEN
    RAISE EXCEPTION 'Invalid payment status: %', p_payment_status;
  END IF;
  
  -- Handle special case for confirming orders (with stock management)
  IF v_old_status != 'confirmed' AND p_order_status = 'confirmed' THEN
    -- Use existing confirm_order function for stock validation and movements
    -- But don't update the status yet as we want to do it atomically
    DECLARE
      v_missing INTEGER;
    BEGIN
      -- Validate stock availability before proceeding
      SELECT COUNT(*) INTO v_missing
      FROM (
        SELECT i.quantity AS available, oi.quantity AS requested
        FROM public.order_items oi
        LEFT JOIN public.inventory i ON i.product_id = oi.product_id
        WHERE oi.order_id = p_order_id
      ) t
      WHERE t.available IS NULL OR t.available < t.requested;

      IF v_missing > 0 THEN
        RAISE EXCEPTION 'Stock insuffisant pour un ou plusieurs articles';
      END IF;

      -- Create stock movements for each order item (with conflict handling)
      INSERT INTO public.stock_movements (product_id, movement_type, quantity, reason, reference_id, created_by)
      SELECT 
        oi.product_id,
        'out',
        oi.quantity,
        'Vente - Commande #' || v_order.order_number,
        v_order.id,
        p_user_id
      FROM public.order_items oi
      WHERE oi.order_id = p_order_id
      ON CONFLICT (reference_id, product_id, movement_type) DO NOTHING;
    END;
  END IF;
  
  -- Atomically update both statuses
  UPDATE public.orders 
  SET 
    status = p_order_status,
    payment_status = p_payment_status,
    updated_at = NOW()
  WHERE id = p_order_id;
  
  -- Prepare result with old and new values
  v_result := jsonb_build_object(
    'success', true,
    'order_id', p_order_id,
    'order_number', v_order.order_number,
    'changes', jsonb_build_object(
      'order_status', jsonb_build_object(
        'old', v_old_status,
        'new', p_order_status,
        'changed', v_old_status != p_order_status
      ),
      'payment_status', jsonb_build_object(
        'old', v_old_payment_status,
        'new', p_payment_status,
        'changed', v_old_payment_status != p_payment_status
      )
    )
  );
  
  RETURN v_result;
EXCEPTION
  WHEN OTHERS THEN
    -- Return error information
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'order_id', p_order_id
    );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.update_order_status_atomic(UUID, TEXT, TEXT, UUID) TO authenticated;