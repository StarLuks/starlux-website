export type Category = "Рыба" | "Морепродукты" | "Полуфабрикаты" | "Овощи" | "Мясо" | "Ягоды";

export const CATEGORIES: Category[] = ["Рыба", "Морепродукты", "Полуфабрикаты", "Овощи", "Мясо", "Ягоды"];

export interface Product {
  id: string;
  name: string;
  category: Category;
  pack: string;
  packKg: number;
  price: number; // за кг
  stock: number; // коробов на складе
}

export const PRODUCTS: Product[] = [
  { id: "f1", name: "Минтай б/г, 25+", category: "Рыба", pack: "короб 22 кг", packKg: 22, price: 189, stock: 340 },
  { id: "f2", name: "Скумбрия атлант., 300–500", category: "Рыба", pack: "короб 25 кг", packKg: 25, price: 264, stock: 120 },
  { id: "f3", name: "Хек тушка, Аргентина", category: "Рыба", pack: "короб 20 кг", packKg: 20, price: 312, stock: 85 },
  { id: "f4", name: "Сельдь т/о, 350+", category: "Рыба", pack: "короб 30 кг", packKg: 30, price: 148, stock: 210 },
  { id: "f5", name: "Филе пангасиуса, глазурь 20%", category: "Рыба", pack: "короб 10 кг", packKg: 10, price: 226, stock: 400 },
  { id: "f6", name: "Горбуша п/т, 1–1,5 кг", category: "Рыба", pack: "короб 24 кг", packKg: 24, price: 398, stock: 64 },
  { id: "f7", name: "Треска б/г, Мурманск", category: "Рыба", pack: "короб 18 кг", packKg: 18, price: 412, stock: 48 },
  { id: "f8", name: "Камбала н/р, 300+", category: "Рыба", pack: "короб 15 кг", packKg: 15, price: 176, stock: 150 },
  { id: "f9", name: "Филе трески без кожи", category: "Рыба", pack: "короб 6,8 кг", packKg: 6.8, price: 689, stock: 30 },

  { id: "s1", name: "Креветка в/м 90/120", category: "Морепродукты", pack: "короб 10 кг", packKg: 10, price: 620, stock: 75 },
  { id: "s2", name: "Кальмар тушка, командорский", category: "Морепродукты", pack: "короб 12 кг", packKg: 12, price: 345, stock: 96 },
  { id: "s3", name: "Мидии в/м в раковине", category: "Морепродукты", pack: "короб 10 кг", packKg: 10, price: 298, stock: 60 },
  { id: "s4", name: "Коктейль из морепродуктов", category: "Морепродукты", pack: "короб 5 кг", packKg: 5, price: 410, stock: 140 },
  { id: "s5", name: "Осьминог мини, 20/40", category: "Морепродукты", pack: "короб 6 кг", packKg: 6, price: 890, stock: 22 },

  { id: "p1", name: "Пельмени «Домашние», говядина", category: "Полуфабрикаты", pack: "короб 5 кг", packKg: 5, price: 312, stock: 260 },
  { id: "p2", name: "Вареники с картофелем", category: "Полуфабрикаты", pack: "короб 5 кг", packKg: 5, price: 168, stock: 300 },
  { id: "p3", name: "Блинчики с мясом", category: "Полуфабрикаты", pack: "короб 6 кг", packKg: 6, price: 284, stock: 110 },
  { id: "p4", name: "Котлеты рыбные, минтай", category: "Полуфабрикаты", pack: "короб 6 кг", packKg: 6, price: 236, stock: 90 },
  { id: "p5", name: "Наггетсы куриные", category: "Полуфабрикаты", pack: "короб 6 кг", packKg: 6, price: 298, stock: 180 },

  { id: "v1", name: "Смесь овощная «Мексиканская»", category: "Овощи", pack: "короб 10 кг", packKg: 10, price: 142, stock: 220 },
  { id: "v2", name: "Брокколи соцветия", category: "Овощи", pack: "короб 10 кг", packKg: 10, price: 168, stock: 130 },
  { id: "v3", name: "Фасоль стручковая резаная", category: "Овощи", pack: "короб 10 кг", packKg: 10, price: 124, stock: 170 },
  { id: "v4", name: "Картофель фри 10 мм", category: "Овощи", pack: "короб 10 кг", packKg: 10, price: 136, stock: 500 },

  { id: "m1", name: "Окорочка куриные", category: "Мясо", pack: "короб 15 кг", packKg: 15, price: 214, stock: 280 },
  { id: "m2", name: "Филе грудки куриной", category: "Мясо", pack: "короб 12 кг", packKg: 12, price: 398, stock: 150 },
  { id: "m3", name: "Говядина лопатка б/к", category: "Мясо", pack: "короб 20 кг", packKg: 20, price: 612, stock: 40 },
  { id: "m4", name: "Свинина окорок б/к", category: "Мясо", pack: "короб 20 кг", packKg: 20, price: 418, stock: 65 },

  { id: "b1", name: "Клюква", category: "Ягоды", pack: "короб 10 кг", packKg: 10, price: 286, stock: 80 },
  { id: "b2", name: "Брусника", category: "Ягоды", pack: "короб 10 кг", packKg: 10, price: 342, stock: 55 },
  { id: "b3", name: "Вишня без косточки", category: "Ягоды", pack: "короб 10 кг", packKg: 10, price: 264, stock: 120 },
  { id: "b4", name: "Смородина чёрная", category: "Ягоды", pack: "короб 10 кг", packKg: 10, price: 248, stock: 90 },
];

export const boxPrice = (p: Product) => Math.round(p.price * p.packKg);

export const rub = (n: number) => `${n.toLocaleString("ru-RU")} ₽`;

export function downloadPriceList() {
  const header = ["Категория", "Наименование", "Фасовка", "Цена за кг, руб", "Цена за короб, руб", "Остаток, кор."];
  const rows = PRODUCTS.map((p) => [p.category, p.name, p.pack, p.price, boxPrice(p), p.stock]);
  const csv = [header, ...rows]
    .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";"))
    .join("\r\n");
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Прайс_СтарЛюкс_${new Date().toLocaleDateString("ru-RU")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
