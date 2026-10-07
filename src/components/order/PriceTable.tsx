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

const COLS = "md:grid-cols-[2.6fr_1.2fr_1fr_1fr_150px]";

const PriceTable = ({ label, products, qty, onQty, className }: Props) => {
  return (
    <section className={cn("tile flex min-h-0 flex-col", className)}>
      <div className="tile-label">{label}</div>
      <div className={cn("hidden h-[34px] items-center px-[22px] text-[0.72em] text-muted-foreground md:grid", COLS)}>
        <span>Наименование</span>
        <span>Фасовка</span>
        <span>Цена, кг</span>
        <span>Сумма</span>
        <span>Кол-во, кор.</span>
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
          return (
            <div
              key={p.id}
              className={cn(
                "grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 border-t border-border px-4 py-3 text-[0.85em] transition-colors md:h-12 md:gap-y-0 md:px-[22px] md:py-0",
                COLS,
                q > 0 ? "bg-card" : "hover:bg-background/30"
              )}
            >
              <span className="font-head text-[1.1em] md:col-auto">{p.name}</span>
              <span className="text-muted-foreground max-md:order-3">{p.pack}</span>
              <span className="max-md:order-2 max-md:text-right">{rub(p.price)}</span>
              <span className={cn("max-md:order-4 max-md:text-right", q === 0 && "text-muted-foreground")}>
                {q > 0 ? rub(sum) : "—"}
              </span>
              <div className="col-span-2 max-md:order-5 max-md:mt-1 md:col-span-1">
                <QtyControl value={q} onChange={(v) => onQty(p.id, v)} max={p.stock} />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default PriceTable;
