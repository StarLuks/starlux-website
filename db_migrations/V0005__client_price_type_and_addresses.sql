ALTER TABLE users ADD COLUMN price_type_id INTEGER REFERENCES price_types(id);

CREATE TABLE delivery_addresses (
  id SERIAL PRIMARY KEY,
  client_id INTEGER NOT NULL REFERENCES users(id),
  name VARCHAR(500) NOT NULL,
  code_1c VARCHAR(64) NOT NULL DEFAULT '',
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_addresses_client ON delivery_addresses(client_id);

ALTER TABLE orders
  ADD COLUMN address_id INTEGER REFERENCES delivery_addresses(id),
  ADD COLUMN address_name VARCHAR(500);