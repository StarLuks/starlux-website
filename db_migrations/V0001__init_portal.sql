CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  role VARCHAR(16) NOT NULL DEFAULT 'client',
  login VARCHAR(64) NOT NULL UNIQUE,
  password_hash VARCHAR(200) NOT NULL,
  company VARCHAR(255) NOT NULL DEFAULT '',
  inn VARCHAR(12) NOT NULL DEFAULT '',
  contact VARCHAR(255) NOT NULL DEFAULT '',
  phone VARCHAR(64) NOT NULL DEFAULT '',
  ext_id VARCHAR(64),
  blocked BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE sessions (
  token VARCHAR(64) PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  expires_at TIMESTAMP NOT NULL
);

CREATE TABLE products (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(64) NOT NULL,
  pack VARCHAR(64) NOT NULL DEFAULT '',
  pack_kg NUMERIC(10,3) NOT NULL DEFAULT 1,
  price NUMERIC(12,2) NOT NULL DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 0,
  sort INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  number VARCHAR(32) NOT NULL UNIQUE,
  client_id INTEGER NOT NULL REFERENCES users(id),
  status VARCHAR(32) NOT NULL DEFAULT 'Новый',
  total NUMERIC(14,2) NOT NULL DEFAULT 0,
  comment TEXT,
  exported_1c BOOLEAN NOT NULL DEFAULT FALSE,
  exported_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id),
  product_id VARCHAR(64) NOT NULL,
  name VARCHAR(255) NOT NULL,
  qty INTEGER NOT NULL,
  box_price NUMERIC(12,2) NOT NULL,
  sum NUMERIC(14,2) NOT NULL
);

CREATE TABLE settings (
  key VARCHAR(64) PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE INDEX idx_orders_client ON orders(client_id);
CREATE INDEX idx_items_order ON order_items(order_id);

INSERT INTO settings (key, value) VALUES ('last_sync', to_char(NOW(), 'YYYY-MM-DD"T"HH24:MI:SS'));

INSERT INTO users (role, login, password_hash, company, contact) VALUES
('admin', 'Pi0neer78', '322e0b40bdab0cad$7c98046ed223baedd0910f600c64133d2c38e2a9a3db190b6ab44c41660372ad', 'ООО СтарЛюкс', 'Администратор'),
('manager', 'manager', '54b4d62ed330e96a$eeaab8c45a39393d2becff5d654270852228e97a386ddb44b5b6e7153fe813b7', 'ООО СтарЛюкс', 'Менеджер СтарЛюкс');

INSERT INTO users (role, login, password_hash, company, inn, contact, phone, blocked, created_at) VALUES
('client', 'client', 'd82bc382ff2c9607$f275e74cda6057869802a3612903d770ad0fedf2bcf063ec3f0a77c9d997fa88', 'ООО «Айсберг-Маркет»', '7708123456', 'Ирина Соколова', '+7 (916) 204-11-32', FALSE, '2025-03-12'),
('client', 'zaharov', '340206a30717923c$76d381c8f07f930e2249bb67ba45abee58f4814a16446051cadab224072f0238', 'ИП Захаров А. В.', '502911223344', 'Андрей Захаров', '+7 (903) 771-45-08', FALSE, '2025-06-02'),
('client', 'sever', '8b162fa4fea43188$fa32adf1293491f58076ca557c7d85af64de79b3254be94782fd3adad9c458e7', 'ООО «Северный улов»', '7814556677', 'Олег Мельников', '+7 (921) 330-19-77', TRUE, '2024-11-20');

INSERT INTO products (id, name, category, pack, pack_kg, price, stock, sort) VALUES
('f1','Минтай б/г, 25+','Рыба','короб 22 кг',22,189,340,0),
('f2','Скумбрия атлант., 300–500','Рыба','короб 25 кг',25,264,120,1),
('f3','Хек тушка, Аргентина','Рыба','короб 20 кг',20,312,85,2),
('f4','Сельдь т/о, 350+','Рыба','короб 30 кг',30,148,210,3),
('f5','Филе пангасиуса, глазурь 20%','Рыба','короб 10 кг',10,226,400,4),
('f6','Горбуша п/т, 1–1,5 кг','Рыба','короб 24 кг',24,398,64,5),
('f7','Треска б/г, Мурманск','Рыба','короб 18 кг',18,412,48,6),
('f8','Камбала н/р, 300+','Рыба','короб 15 кг',15,176,150,7),
('f9','Филе трески без кожи','Рыба','короб 6,8 кг',6.8,689,30,8),
('s1','Креветка в/м 90/120','Морепродукты','короб 10 кг',10,620,75,9),
('s2','Кальмар тушка, командорский','Морепродукты','короб 12 кг',12,345,96,10),
('s3','Мидии в/м в раковине','Морепродукты','короб 10 кг',10,298,60,11),
('s4','Коктейль из морепродуктов','Морепродукты','короб 5 кг',5,410,140,12),
('s5','Осьминог мини, 20/40','Морепродукты','короб 6 кг',6,890,22,13),
('p1','Пельмени «Домашние», говядина','Полуфабрикаты','короб 5 кг',5,312,260,14),
('p2','Вареники с картофелем','Полуфабрикаты','короб 5 кг',5,168,300,15),
('p3','Блинчики с мясом','Полуфабрикаты','короб 6 кг',6,284,110,16),
('p4','Котлеты рыбные, минтай','Полуфабрикаты','короб 6 кг',6,236,90,17),
('p5','Наггетсы куриные','Полуфабрикаты','короб 6 кг',6,298,180,18),
('v1','Смесь овощная «Мексиканская»','Овощи','короб 10 кг',10,142,220,19),
('v2','Брокколи соцветия','Овощи','короб 10 кг',10,168,130,20),
('v3','Фасоль стручковая резаная','Овощи','короб 10 кг',10,124,170,21),
('v4','Картофель фри 10 мм','Овощи','короб 10 кг',10,136,500,22),
('m1','Окорочка куриные','Мясо','короб 15 кг',15,214,280,23),
('m2','Филе грудки куриной','Мясо','короб 12 кг',12,398,150,24),
('m3','Говядина лопатка б/к','Мясо','короб 20 кг',20,612,40,25),
('m4','Свинина окорок б/к','Мясо','короб 20 кг',20,418,65,26),
('b1','Клюква','Ягоды','короб 10 кг',10,286,80,27),
('b2','Брусника','Ягоды','короб 10 кг',10,342,55,28),
('b3','Вишня без косточки','Ягоды','короб 10 кг',10,264,120,29),
('b4','Смородина чёрная','Ягоды','короб 10 кг',10,248,90,30);