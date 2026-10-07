UPDATE order_items SET qty = qty WHERE order_id = 1;
UPDATE orders SET status = 'Отменён', comment = 'Тестовый заказ (проверка системы)' WHERE id = 1;