import { Product, boxPrice, rub } from "@/data/catalog";
import QtyControl from "./QtyControl";
import { cn } from "@/lib/utils";

interface Props {
  label: string;
  products: Product[];
  qty: Record<string, number>;
  onQty: (id: string, v: number) => void;
  className?: string;
}

const COLS = "md:grid-cols-[2.4fr_1.1fr_70px_0.9fr_110px_1fr_150px]";

const PriceTable = ({ label, products, qty, onQty, className }: Props) => {
  return (
    <section className={cn("tile flex min-h-0 flex-col", className)}>
      <div className="tile-label">{label}</div>
      <div className={cn("hidden h-[34px] items-center px-[22px] text-[0.72em] text-muted-foreground md:grid", COLS)}>
        <span>Наименование</span>
        <span>Фасовка</span>
        <span>Ед. изм.</span>
        <span>Цена, кг</span>
        <span>Доступно</span>
        <span>Сумма</span>
        <span>Кол-во</span>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {products.length === 0 && (
          <div className="border-t border-border px-[22px] py-10 text-center text-sm text-muted-foreground">
            Ничего не найдено
          </div>
        )}
        {products.map((p) => {
          const q = qty[p.id] ?? 0;
          const sum = q * boxPrice(p);
          const unit = p.unit || "кор.";
          const out = p.stock <= 0;
          const atMax = q > 0 && q >= p.stock;
          return (
            <div
              key={p.id}
              className={cn(
                "grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 border-t border-border px-4 py-3 text-[0.85em] transition-colors md:min-h-12 md:gap-y-0 md:px-[22px] md:py-1.5",
                COLS,
                q > 0 ? "bg-card" : "hover:bg-background/30"
              )}
            >
              <span className="font-head text-[1.1em] md:col-auto">{p.name}</span>
              <span className="text-muted-foreground max-md:order-3">{p.pack}</span>
              <span className="text-muted-foreground max-md:hidden">{unit}</span>
              <span className="max-md:order-2 max-md:text-right">{rub(p.price)}</span>
              <span className="max-md:order-3">
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[0.85em] font-medium",
                    out ? "bg-destructive/10 text-destructive" : p.stock < 30 ? "bg-amber-100 text-amber-800" : "bg-success/10 text-success"
                  )}
                >
                  <span className={cn("h-1.5 w-1.5 rounded-full", out ? "bg-destructive" : p.stock < 30 ? "bg-amber-500" : "bg-success")} />
                  {out ? "нет" : `${p.stock} ${unit}`}
                </span>
              </span>
              <span className={cn("max-md:order-4 max-md:text-right", q === 0 && "text-muted-foreground")}>
                {q > 0 ? rub(sum) : "—"}
              </span>
              <div className="col-span-2 max-md:order-5 max-md:mt-1 md:col-span-1">
                <QtyControl value={q} onChange={(v) => onQty(p.id, v)} max={p.stock} disabled={out} />
                {atMax && <span className="mt-0.5 block text-center text-[0.7em] text-amber-700">весь остаток</span>}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default PriceTable;
