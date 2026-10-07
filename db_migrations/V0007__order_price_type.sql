ALTER TABLE t_p16770056_starlux_website.orders ADD COLUMN IF NOT EXISTS price_type_id INTEGER NULL;
ALTER TABLE t_p16770056_starlux_website.orders ADD COLUMN IF NOT EXISTS price_type_name TEXT NULL;
UPDATE t_p16770056_starlux_website.orders o SET price_type_id = t.id, price_type_name = t.name
FROM t_p16770056_starlux_website.users u, t_p16770056_starlux_website.price_types t
WHERE u.id = o.client_id AND o.price_type_id IS NULL
  AND t.id = COALESCE((SELECT t2.id FROM t_p16770056_starlux_website.price_types t2 WHERE t2.id = u.price_type_id AND t2.active),
                      (SELECT t3.id FROM t_p16770056_starlux_website.price_types t3 WHERE t3.is_main LIMIT 1));