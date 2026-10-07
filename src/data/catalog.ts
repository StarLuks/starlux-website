export type Category = string;

export interface Product {
  id: string;
  name: string;
  category: Category;
  pack: string;
  packKg: number;
  price: number;
  stock: number;
  unit?: string;
  images?: string[];
}

export const categoriesOf = (products: Product[]): Category[] => Array.from(new Set(products.map((p) => p.category)));

export const boxPrice = (p: Product) => Math.round(p.price * p.packKg);

export const rub = (n: number) => `${Number(n).toLocaleString("ru-RU")} ₽`;

export function downloadPriceList(products: Product[]) {
  const header = ["Категория", "Наименование", "Фасовка", "Цена за кг, руб", "Цена за короб, руб", "Остаток, кор."];
  const rows = products.map((p) => [p.category, p.name, p.pack, p.price, boxPrice(p), p.stock]);
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
