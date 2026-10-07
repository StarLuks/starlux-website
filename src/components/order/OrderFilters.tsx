import { Category, rub } from "@/data/catalog";
import Icon from "@/components/ui/icon";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
      <div className="tile relative flex min-h-[120px] flex-col justify-between overflow-hidden bg-gradient-to-br from-card via-card to-accent/60 p-5">
        <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-ice/25 blur-2xl" />
        <span className="relative grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-ice to-primary text-white shadow-lg shadow-primary/25">
          <Icon name="ClipboardList" size={20} />
        </span>
        <div className="relative">
          <h1 className="font-head text-2xl font-bold tracking-[-0.01em] text-foreground">Новый заказ</h1>
          <p className="mt-0.5 text-[0.75em] text-muted-foreground">Выберите позиции и количество</p>
        </div>
      </div>

      <div className="tile">
        <div className="tile-label">Категория.</div>
        <div className="flex flex-col gap-3 px-[18px] pb-4 sm:flex-row">
          <Select value={category} onValueChange={onCategory}>
            <SelectTrigger className="h-11 rounded-full border-0 bg-pill px-5 font-head font-semibold text-foreground ring-offset-0 focus:ring-2 focus:ring-ring sm:w-[240px]">
              <span className="flex items-center gap-2">
                <Icon name="LayoutGrid" size={16} className="text-primary" />
                <SelectValue placeholder="Выберите категорию" />
              </span>
            </SelectTrigger>
            <SelectContent className="rounded-2xl">
              {categories.map((c) => (
                <SelectItem key={c} value={c} className="rounded-xl py-2.5 font-head">
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {onSearch && (
            <div className="relative flex-1">
              <Icon name="Search" size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => onSearch(e.target.value)}
                placeholder="Поиск по прайсу…"
                className="h-11 w-full rounded-full bg-pill pl-11 pr-4 text-sm outline-none ring-ring placeholder:text-muted-foreground focus:ring-2"
              />
            </div>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={onSubmit}
        className="group flex min-h-[120px] flex-col justify-between rounded-[18px] bg-ocean px-5 py-4 text-left font-head text-ocean-foreground transition-transform hover:-translate-y-0.5"
      >
        <span>Позиций в заказе: {count}</span>
        <b key={total} className="animate-bump text-[2em] font-light">{rub(total)}</b>
        <span className="text-[0.85em] transition-transform group-hover:translate-x-1">{submitLabel}</span>
      </button>
    </section>
  );
};

export default OrderFilters;