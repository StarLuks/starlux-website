import { Fragment, useEffect, useMemo, useState } from "react";
import { Product, boxPrice, rub } from "@/data/catalog";
import QtyControl from "./QtyControl";
import ImageLightbox from "./ImageLightbox";
import ProductInfoDialog from "./ProductInfoDialog";
import Icon from "@/components/ui/icon";
import { cn } from "@/lib/utils";

interface Props {
  label: string;
  products: Product[];
  qty: Record<string, number>;
  onQty: (id: string, v: number) => void;
  className?: string;
  grouped?: boolean;
}

const COLS = "md:grid-cols-[2.4fr_1.1fr_70px_0.9fr_110px_1fr_150px]";

type SortDir = "none" | "asc" | "desc";
const SORT_KEY = "starlux_price_sort";
const NEXT: Record<SortDir, SortDir> = { none: "asc", asc: "desc", desc: "none" };

const PriceTable = ({ label, products: source, qty, onQty, className, grouped }: Props) => {
  const [viewing, setViewing] = useState<Product | null>(null);
  const [info, setInfo] = useState<Product | null>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [sort, setSort] = useState<SortDir>(() => {
    const v = localStorage.getItem(SORT_KEY);
    return v === "asc" || v === "desc" ? v : "none";
  });
  useEffect(() => {
    if (sort === "none") localStorage.removeItem(SORT_KEY);
    else localStorage.setItem(SORT_KEY, sort);
  }, [sort]);

  const products = useMemo(() => {
    if (sort === "none") return source;
    const dir = sort === "asc" ? 1 : -1;
    const groupIdx = new Map<string, number>();
    source.forEach((p) => !groupIdx.has(p.category) && groupIdx.set(p.category, groupIdx.size));
    return [...source].sort(
      (a, b) =>
        (grouped ? (groupIdx.get(a.category) ?? 0) - (groupIdx.get(b.category) ?? 0) : 0) ||
        dir * a.name.localeCompare(b.name, "ru", { numeric: true })
    );
  }, [source, sort, grouped]);

  const toggleGroup = (c: string) =>
    setCollapsed((prev) => {
      const n = new Set(prev);
      if (n.has(c)) n.delete(c);
      else n.add(c);
      return n;
    });
  return (
    <section className={cn("tile flex min-h-0 flex-col", className)}>
      <div className="tile-label">{label}</div>
      <div className={cn("hidden h-[38px] items-center px-[22px] text-[0.82em] font-medium text-muted-foreground md:grid", COLS)}>
        <button
          type="button"
          onClick={() => setSort(NEXT[sort])}
          title={sort === "asc" ? "Сортировка А→Я" : sort === "desc" ? "Сортировка Я→А" : "Сортировать по наименованию"}
          className={cn("flex items-center gap-1 justify-self-start transition-colors hover:text-foreground", sort !== "none" && "text-primary")}
        >
          Наименование
          <Icon name={sort === "asc" ? "ArrowDown" : sort === "desc" ? "ArrowUp" : "ArrowUpDown"} size={14} className={sort === "none" ? "opacity-50" : ""} />
        </button>
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
        {products.map((p, i) => {
          const groupHead = grouped && (i === 0 || products[i - 1].category !== p.category);
          const inGroup = groupHead ? products.filter((x) => x.category === p.category) : [];
          const groupPicked = inGroup.filter((x) => (qty[x.id] ?? 0) > 0).length;
          const isCollapsed = grouped && collapsed.has(p.category);
          const q = qty[p.id] ?? 0;
          const sum = q * boxPrice(p);
          const unit = p.unit || "кор.";
          const out = p.stock <= 0;
          const atMax = q > 0 && q >= p.stock;
          return (
            <Fragment key={p.id}>
            {groupHead && (
              <button
                type="button"
                onClick={() => toggleGroup(p.category)}
                className="sticky top-0 z-10 flex w-full items-center gap-2 border-t border-border bg-accent/90 px-4 py-2 text-left font-head text-[0.85em] font-semibold text-accent-foreground backdrop-blur transition-colors hover:bg-accent md:px-[22px]"
              >
                <Icon name="ChevronDown" size={15} className={cn("text-primary transition-transform", collapsed.has(p.category) && "-rotate-90")} />
                <Icon name={collapsed.has(p.category) ? "Folder" : "FolderOpen"} size={15} className="text-primary" />
                <span>{p.category || "Прочее"}</span>
                <span className="font-normal text-muted-foreground">· {inGroup.length}</span>
                {groupPicked > 0 && (
                  <span className="ml-auto rounded-full bg-primary px-2 py-0.5 text-[0.8em] font-medium text-primary-foreground">
                    в заказе {groupPicked}
                  </span>
                )}
              </button>
            )}
            {!isCollapsed && (
            <div
              className={cn(
                "grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 border-t border-border px-4 py-3 text-[0.85em] transition-colors md:min-h-12 md:gap-y-0 md:px-[22px] md:py-1.5",
                COLS,
                q > 0 ? "bg-card" : "hover:bg-background/30"
              )}
            >
              <span className="flex min-w-0 items-center gap-3 font-head text-[1.1em] md:col-auto">
                {p.images?.length ? (
                  <button
                    type="button"
                    onClick={() => setViewing(p)}
                    aria-label={`Фото: ${p.name}`}
                    className="group relative h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-pill ring-primary/40 transition hover:ring-2"
                  >
                    <img src={p.images[0]} alt={p.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110" />
                    <span className="absolute inset-0 grid place-items-center bg-foreground/30 text-white opacity-0 transition-opacity group-hover:opacity-100">
                      <Icon name="ZoomIn" size={16} />
                    </span>
                  </button>
                ) : (
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-pill text-muted-foreground/60">
                    <Icon name="Package" size={18} />
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setInfo(p)}
                  className="min-w-0 text-left underline-offset-4 transition-colors hover:text-primary hover:underline"
                  title="Подробнее о товаре"
                >
                  {p.name}
                </button>
              </span>
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
            )}
            </Fragment>
          );
        })}
      </div>
      <ProductInfoDialog
        product={info}
        onOpenChange={(v) => !v && setInfo(null)}
        qty={info ? qty[info.id] ?? 0 : 0}
        onQty={(v) => info && onQty(info.id, v)}
      />
      <ImageLightbox
        open={!!viewing}
        onOpenChange={(v) => !v && setViewing(null)}
        images={viewing?.images ?? []}
        title={viewing?.name ?? ""}
        subtitle={viewing ? [viewing.pack, `${rub(viewing.price)} за кг`].filter(Boolean).join(" · ") : undefined}
      />
    </section>
  );
};

export default PriceTable;
