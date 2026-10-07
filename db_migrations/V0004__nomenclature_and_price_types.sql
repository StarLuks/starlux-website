CREATE TABLE price_types (
  id SERIAL PRIMARY KEY,
  name VARCHAR(128) NOT NULL,
  code_1c VARCHAR(64) NOT NULL DEFAULT '',
  is_main BOOLEAN NOT NULL DEFAULT FALSE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  sort INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE product_groups (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code_1c VARCHAR(64) NOT NULL DEFAULT '',
  sort INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

ALTER TABLE products
  ADD COLUMN group_id INTEGER REFERENCES product_groups(id),
  ADD COLUMN full_name VARCHAR(500) NOT NULL DEFAULT '',
  ADD COLUMN article VARCHAR(64) NOT NULL DEFAULT '',
  ADD COLUMN code_1c VARCHAR(64) NOT NULL DEFAULT '',
  ADD COLUMN barcode VARCHAR(64) NOT NULL DEFAULT '',
  ADD COLUMN manufacturer VARCHAR(255) NOT NULL DEFAULT '',
  ADD COLUMN dimensions VARCHAR(128) NOT NULL DEFAULT '';

CREATE TABLE product_images (
  id SERIAL PRIMARY KEY,
  product_id VARCHAR(64) NOT NULL REFERENCES products(id),
  url TEXT NOT NULL,
  is_main BOOLEAN NOT NULL DEFAULT FALSE,
  sort INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE product_prices (
  product_id VARCHAR(64) NOT NULL REFERENCES products(id),
  price_type_id INTEGER NOT NULL REFERENCES price_types(id),
  price NUMERIC(12,2) NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  PRIMARY KEY (product_id, price_type_id)
);

CREATE INDEX idx_products_group ON products(group_id);
CREATE INDEX idx_images_product ON product_images(product_id);

INSERT INTO price_types (name, is_main, sort) VALUES ('Оптовая', TRUE, 0), ('Розничная', FALSE, 1);

INSERT INTO product_groups (name, sort)
SELECT category, MIN(sort) FROM products GROUP BY category ORDER BY MIN(sort);

UPDATE products p SET group_id = g.id, full_name = p.name FROM product_groups g WHERE g.name = p.category;

INSERT INTO product_prices (product_id, price_type_id, price)
SELECT p.id, t.id, p.price FROM products p, price_types t WHERE t.is_main;