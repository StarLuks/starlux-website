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
  onClear?: () => void;
  categoryLabel?: (c: Category) => string;
}

const OrderFilters = ({ categories, category, onCategory, count, total, onSubmit, submitLabel = "Отправить в 1С →", search, onSearch, onClear, categoryLabel = (c) => c }: Props) => {
  return (
    <section className="grid grid-cols-1 items-stretch gap-2 md:gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_auto]">
      <div className="tile relative flex items-center gap-3 overflow-hidden bg-gradient-to-br from-card via-card to-accent/60 px-5 py-3 max-md:hidden">
        <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-ice/25 blur-2xl" />
        <span className="relative grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-ice to-primary text-white shadow-lg shadow-primary/25">
          <Icon name="ClipboardList" size={20} />
        </span>
        <div className="relative">
          <h1 className="font-head text-xl font-bold tracking-[-0.01em] text-foreground">Новый заказ</h1>
          <p className="mt-0.5 text-[0.75em] text-muted-foreground">Выберите позиции и количество</p>
        </div>
      </div>

      <div className="tile flex items-center">
        <div className="flex w-full flex-col gap-2 px-[14px] py-3 sm:flex-row">
          <Select value={category} onValueChange={onCategory}>
            <SelectTrigger className="h-10 rounded-full border-0 bg-pill px-5 font-head font-semibold text-foreground ring-offset-0 focus:ring-2 focus:ring-ring sm:w-[240px]">
              <Icon name="LayoutGrid" size={16} className="mr-2 shrink-0 text-primary" />
              <span className="min-w-0 flex-1 truncate text-left">
                <SelectValue placeholder="Выберите категорию" />
              </span>
            </SelectTrigger>
            <SelectContent className="rounded-2xl">
              {categories.map((c) => (
                <SelectItem key={c} value={c} className="rounded-xl py-2.5 font-head">
                  {categoryLabel(c)}
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
                className="h-10 w-full rounded-full bg-pill pl-11 pr-4 text-sm outline-none ring-ring placeholder:text-muted-foreground focus:ring-2"
              />
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-[18px] bg-ocean py-2.5 pl-5 pr-2.5 font-head text-ocean-foreground shadow-lg shadow-black/10 md:min-w-[380px]">
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="text-[0.75em] opacity-85">Позиций: {count}</span>
          <b key={total} className="animate-bump whitespace-nowrap text-[1.3em] font-normal leading-tight">{rub(total)}</b>
        </span>
        {onClear && (
          <button
            type="button"
            onClick={onClear}
            disabled={count === 0}
            title="Очистить заказ"
            className="flex shrink-0 items-center gap-1.5 rounded-full bg-white/15 px-3 py-2 text-sm font-semibold transition-colors hover:bg-white/25 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Icon name="Eraser" size={15} />
            <span className="max-sm:hidden">Очистить</span>
          </button>
        )}
        <button
          type="button"
          onClick={onSubmit}
          disabled={count === 0}
          className="group flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-white px-4 py-2 text-sm font-bold text-ocean shadow-md shadow-black/15 transition-all hover:gap-2.5 disabled:cursor-not-allowed disabled:bg-white/70"
        >
          {submitLabel.replace(/\s*[→>-]+\s*$/, "")}
          <Icon name="ArrowRight" size={16} />
        </button>
      </div>
    </section>
  );
};

export default OrderFilters;