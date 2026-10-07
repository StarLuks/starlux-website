import { Category, rub } from "@/data/catalog";
import { cn } from "@/lib/utils";

interface Props {
  categories: Category[];
  category: Category;
  onCategory: (c: Category) => void;
  count: number;
  total: number;
  onSubmit: () => void;
  submitLabel?: string;
  search?: string;
  onSearch?: (s: string) => void;
}

const OrderFilters = ({ categories, category, onCategory, count, total, onSubmit, submitLabel = "Отправить в 1С →", search, onSearch }: Props) => {
  return (
    <section className="grid grid-cols-1 items-stretch gap-5 md:grid-cols-[1.2fr_2fr_1fr]">
      <h1 className="font-head text-[34px] font-light leading-[1.1] tracking-[-0.02em] md:text-[46px]">
        Новый заказ
        <br />
        <mark className="bg-accent px-1.5 text-accent-foreground">СтарЛюкс</mark>
      </h1>

      <div className="tile">
        <div className="tile-label">Категория.</div>
        <div className="flex flex-wrap gap-2 px-[18px] pb-4">
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => onCategory(c)}
              className={cn(
                "pill transition-colors",
                c === category ? "bg-foreground text-card" : "hover:bg-accent hover:text-accent-foreground"
              )}
            >
              {c}
            </button>
          ))}
          {onSearch && (
            <input
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Поиск по прайсу…"
              className="pill min-w-[160px] flex-1 bg-background/50 outline-none placeholder:text-muted-foreground focus:bg-accent/60"
            />
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={onSubmit}
        className="group flex min-h-[120px] flex-col justify-between rounded-[10px] bg-ocean px-5 py-4 text-left font-head text-ocean-foreground transition-transform hover:-translate-y-0.5"
      >
        <span>Позиций в заказе: {count}</span>
        <b key={total} className="animate-bump text-[2em] font-light">{rub(total)}</b>
        <span className="text-[0.85em] transition-transform group-hover:translate-x-1">{submitLabel}</span>
      </button>
    </section>
  );
};

export default OrderFilters;
