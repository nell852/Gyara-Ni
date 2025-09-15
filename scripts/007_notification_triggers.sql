-- Create function to automatically create notifications for low stock
CREATE OR REPLACE FUNCTION check_low_stock_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if quantity is at or below minimum and create notification
  IF NEW.quantity <= COALESCE(NEW.min_stock_level, 5) AND 
     (OLD.quantity IS NULL OR OLD.quantity > COALESCE(NEW.min_stock_level, 5)) THEN
    
    INSERT INTO notifications (title, message, type, category, is_read, created_at)
    SELECT 
      'Stock Faible Détecté',
      'Le produit "' || p.name || '" a un stock faible (' || NEW.quantity || ' restant). Réapprovisionnement nécessaire.',
      'warning',
      'stock_alert',
      false,
      NOW()
    FROM products p
    WHERE p.id = NEW.product_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for low stock notifications
DROP TRIGGER IF EXISTS trigger_low_stock_notification ON inventory;
CREATE TRIGGER trigger_low_stock_notification
  AFTER INSERT OR UPDATE OF quantity
  ON inventory
  FOR EACH ROW
  EXECUTE FUNCTION check_low_stock_notification();

-- Create function to automatically create notifications for new orders
CREATE OR REPLACE FUNCTION create_new_order_notification()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (title, message, type, category, is_read, created_at)
  VALUES (
    'Nouvelle Commande Reçue',
    'Commande #' || NEW.order_number || ' de ' || COALESCE(NEW.customer_name, 'Client') || ' pour ' || NEW.total_amount || ' FCFA.',
    'success',
    'order_update',
    false,
    NOW()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new order notifications
DROP TRIGGER IF EXISTS trigger_new_order_notification ON orders;
CREATE TRIGGER trigger_new_order_notification
  AFTER INSERT
  ON orders
  FOR EACH ROW
  EXECUTE FUNCTION create_new_order_notification();

-- Create function to automatically create notifications for order status changes
CREATE OR REPLACE FUNCTION create_order_status_notification()
RETURNS TRIGGER AS $$
DECLARE
  status_labels JSONB := '{"pending": "En attente", "confirmed": "Confirmée", "preparing": "En préparation", "ready": "Prête", "delivered": "Livrée", "cancelled": "Annulée"}';
  old_label TEXT;
  new_label TEXT;
BEGIN
  -- Only create notification if status actually changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    old_label := COALESCE(status_labels->>OLD.status, OLD.status);
    new_label := COALESCE(status_labels->>NEW.status, NEW.status);
    
    INSERT INTO notifications (title, message, type, category, is_read, created_at)
    VALUES (
      'Statut Commande Modifié',
      'Commande #' || NEW.order_number || ' de ' || COALESCE(NEW.customer_name, 'Client') || ': ' || old_label || ' → ' || new_label,
      'info',
      'order_update',
      false,
      NOW()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for order status change notifications
DROP TRIGGER IF EXISTS trigger_order_status_notification ON orders;
CREATE TRIGGER trigger_order_status_notification
  AFTER UPDATE OF status
  ON orders
  FOR EACH ROW
  EXECUTE FUNCTION create_order_status_notification();
