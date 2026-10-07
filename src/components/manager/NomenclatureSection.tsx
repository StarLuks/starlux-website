import { useCallback, useEffect, useMemo, useState } from "react";
import Icon from "@/components/ui/icon";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import ProductCard from "./ProductCard";
import GroupDialog from "./GroupDialog";
import ImportExcelDialog from "./ImportExcelDialog";
import { api } from "@/lib/api";
import { NomProduct, PriceType, ProductGroup } from "@/lib/nomenclature";
import { rub } from "@/data/catalog";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Props {
  onChanged?: () => void;
}

type Show = "all" | "active" | "inactive";

const NomenclatureSection = ({ onChanged }: Props) => {
  const [products, setProducts] = useState<NomProduct[]>([]);
  const [groups, setGroups] = useState<ProductGroup[]>([]);
  const [priceTypes, setPriceTypes] = useState<PriceType[]>([]);
  const [loading, setLoading] = useState(true);
  const [groupId, setGroupId] = useState<number | null>(null);
  const [q, setQ] = useState("");
  const [show, setShow] = useState<Show>("all");
  const [editing, setEditing] = useState<NomProduct | null>(null);
  const [creating, setCreating] = useState(false);
  const [groupEdit, setGroupEdit] = useState<Partial<ProductGroup> | null>(null);
  const [groupDel, setGroupDel] = useState<ProductGroup | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [priceTypeId, setPriceTypeId] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      const d = await api<{ products: NomProduct[]; groups: ProductGroup[]; priceTypes: PriceType[] }>("nomenclature", {});
      setProducts(d.products);
      setGroups(d.groups);
      setPriceTypes(d.priceTypes);
      setEditing((cur) => (cur ? d.products.find((p) => p.id === cur.id) ?? cur : cur));
    } catch (e) {
      toast({ title: "Ошибка загрузки", description: (e as Error).message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const changed = () => {
    load();
    onChanged?.();
  };

  const activeTypes = priceTypes.filter((t) => t.active);
  const mainType =
    activeTypes.find((t) => t.id === priceTypeId) ?? activeTypes.find((t) => t.isMain) ?? activeTypes[0];
  const groupName = (id: number | null) => groups.find((g) => g.id === id)?.name ?? "—";

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return products
      .filter((p) => groupId === null || p.groupId === groupId)
      .filter((p) => show === "all" || (show === "active" ? p.active : !p.active))
      .filter(
        (p) =>
          !s ||
          p.name.toLowerCase().includes(s) ||
          p.article.toLowerCase().includes(s) ||
          p.code1c.toLowerCase().includes(s) ||
          p.barcode.includes(s)
      );
  }, [products, groupId, show, q]);

  const toggle = async (p: NomProduct) => {
    setProducts((prev) => prev.map((x) => (x.id === p.id ? { ...x, active: !x.active } : x)));
    try {
      const r = await api<{ active: boolean }>("product_toggle", { id: p.id });
      toast({ title: r.active ? "Товар включён" : "Товар отключён", description: p.name });
      onChanged?.();
    } catch (e) {
      toast({ title: "Ошибка", description: (e as Error).message });
      load();
    }
  };

  const removeGroup = async () => {
    const g = groupDel;
    setGroupDel(null);
    if (!g) return;
    try {
      await api("group_delete", { id: g.id });
      toast({ title: "Группа удалена", description: g.name });
      if (groupId === g.id) setGroupId(null);
      load();
    } catch (e) {
      toast({ title: "Не удалось удалить", description: (e as Error).message });
    }
  };

  return (
    <div className="grid min-h-0 animate-fade-in gap-5 md:grid-cols-[280px_1fr]">
      <aside className="tile flex min-h-0 flex-col">
        <div className="flex items-center justify-between px-[22px] pb-2 pt-4">
          <span className="text-[0.72em] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Группы</span>
          <button
            type="button"
            onClick={() => setGroupEdit({})}
            className="grid h-8 w-8 place-items-center rounded-full bg-pill transition-colors hover:bg-primary hover:text-primary-foreground"
            aria-label="Добавить группу"
          >
            <Icon name="Plus" size={16} />
          </button>
        </div>
        <div className="min-h-0 space-y-0.5 overflow-y-auto px-2 pb-3 max-md:flex max-md:gap-1 max-md:space-y-0 max-md:overflow-x-auto">
          <button
            type="button"
            onClick={() => setGroupId(null)}
            className={cn(
              "flex w-full shrink-0 items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition-colors max-md:w-auto",
              groupId === null ? "bg-primary text-primary-foreground" : "hover:bg-accent"
            )}
          >
            <span className="font-medium">Все товары</span>
            <span className="ml-2 text-xs opacity-70">{products.length}</span>
          </button>
          {groups.map((g) => (
            <div
              key={g.id}
              className={cn(
                "group flex shrink-0 items-center rounded-xl text-sm transition-colors",
                groupId === g.id ? "bg-primary text-primary-foreground" : "hover:bg-accent"
              )}
            >
              <button type="button" onClick={() => setGroupId(g.id)} className="min-w-0 flex-1 px-3 py-2.5 text-left">
                <span className="block truncate font-medium">{g.name}</span>
                {g.code1c && <span className="block text-[11px] opacity-60">Код 1С: {g.code1c}</span>}
              </button>
              <span className="pr-1 text-xs opacity-70 group-hover:hidden">{g.productsCount}</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="mr-1 hidden h-7 w-7 place-items-center rounded-full hover:bg-black/10 group-hover:grid data-[state=open]:grid"
                    aria-label="Действия"
                  >
                    <Icon name="MoreVertical" size={15} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setGroupEdit(g)}>
                    <Icon name="Pencil" size={14} className="mr-2" /> Изменить
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setGroupDel(g)} className="text-destructive focus:text-destructive">
                    <Icon name="Trash2" size={14} className="mr-2" /> Удалить
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
      </aside>

      <section className="tile flex min-h-0 flex-col">
        <div className="flex flex-wrap items-center gap-2 px-[22px] pb-3 pt-4">
          <h2 className="mr-auto font-head text-xl font-bold">{groupId === null ? "Номенклатура" : groupName(groupId)}</h2>
          <button
            type="button"
            onClick={() => setImportOpen(true)}
            className="flex items-center gap-1.5 rounded-full bg-pill px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
          >
            <Icon name="FileSpreadsheet" size={16} /> Из Excel
          </button>
          <button
            type="button"
            onClick={() => toast({ title: "Загрузка из 1С", description: "Будет доступна после подключения обмена с 1С." })}
            className="flex items-center gap-1.5 rounded-full bg-pill px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent"
          >
            <Icon name="RefreshCw" size={16} /> Из 1С
          </button>
          <button
            type="button"
            onClick={() => {
              if (!groups.length) {
                toast({ title: "Сначала создайте группу номенклатуры" });
                return;
              }
              setCreating(true);
            }}
            className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 font-head text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition hover:-translate-y-0.5"
          >
            <Icon name="Plus" size={16} /> Товар
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 px-[22px] pb-3">
          <div className="relative min-w-[200px] flex-1">
            <Icon name="Search" size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Наименование, артикул, код 1С, штрихкод…"
              className="h-10 w-full rounded-full bg-pill pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-ring/30"
            />
          </div>
          <label className="relative flex h-10 items-center rounded-full bg-pill pl-3.5 pr-2 text-xs font-medium">
            <Icon name="Tag" size={14} className="mr-1.5 text-muted-foreground" />
            <select
              value={mainType?.id ?? ""}
              onChange={(e) => setPriceTypeId(Number(e.target.value))}
              className="cursor-pointer appearance-none bg-transparent pr-5 outline-none"
              aria-label="Тип цены"
            >
              {activeTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                  {t.isMain ? " (основная)" : ""}
                </option>
              ))}
            </select>
            <Icon name="ChevronDown" size={14} className="pointer-events-none absolute right-3 text-muted-foreground" />
          </label>
          <div className="flex rounded-full bg-pill p-1 text-xs font-medium">
            {(
              [
                ["all", "Все"],
                ["active", "Активные"],
                ["inactive", "Отключённые"],
              ] as const
            ).map(([k, l]) => (
              <button
                key={k}
                type="button"
                onClick={() => setShow(k)}
                className={cn("rounded-full px-3 py-1.5 transition-colors", show === k ? "bg-card shadow" : "text-muted-foreground")}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        <div className="hidden h-[34px] items-center gap-3 border-t border-border px-[22px] text-[0.72em] text-muted-foreground lg:grid lg:grid-cols-[48px_2fr_100px_100px_1fr_100px_110px_70px]">
          <span />
          <span>Наименование</span>
          <span>Артикул</span>
          <span>Код 1С</span>
          <span>Группа</span>
          <span className="text-right">Остаток</span>
          <span className="text-right">{mainType?.name ?? "Цена"}</span>
          <span className="text-right">Активна</span>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {filtered.length === 0 && (
            <div className="border-t border-border px-[22px] py-12 text-center text-sm text-muted-foreground">
              {loading ? "Загрузка…" : "Товары не найдены"}
            </div>
          )}
          {filtered.map((p) => {
            const img = p.images.find((i) => i.isMain) ?? p.images[0];
            const price = mainType ? p.prices[mainType.id] : undefined;
            return (
              <div
                key={p.id}
                onClick={() => setEditing(p)}
                className={cn(
                  "grid cursor-pointer grid-cols-[48px_1fr_auto] items-center gap-3 border-t border-border px-4 py-2.5 text-sm transition-colors hover:bg-accent/40 lg:grid-cols-[48px_2fr_100px_100px_1fr_100px_110px_70px] lg:px-[22px]",
                  !p.active && "opacity-55"
                )}
              >
                <span className="grid h-12 w-12 place-items-center overflow-hidden rounded-xl bg-pill text-muted-foreground">
                  {img ? <img src={img.url} alt="" className="h-full w-full object-cover" /> : <Icon name="Package" size={20} />}
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-medium">{p.name}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {[p.pack, p.unit, p.manufacturer].filter(Boolean).join(" · ")}
                  </span>
                  <span className="text-xs text-muted-foreground lg:hidden">
                    {groupName(p.groupId)} · ост. {p.stock} {p.unit} · {price !== undefined ? rub(price) : "цена не задана"}
                  </span>
                </span>
                <span className="hidden truncate text-muted-foreground lg:block">{p.article || "—"}</span>
                <span className="hidden truncate text-muted-foreground lg:block">{p.code1c || "—"}</span>
                <span className="hidden truncate lg:block">{groupName(p.groupId)}</span>
                <span className="hidden text-right lg:block">
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs font-medium",
                      p.stock <= 0 ? "bg-destructive/10 text-destructive" : p.stock < 30 ? "bg-amber-100 text-amber-800" : "bg-success/10 text-success"
                    )}
                  >
                    {p.stock <= 0 ? "нет" : `${p.stock} ${p.unit}`}
                  </span>
                </span>
                <span className="hidden text-right font-medium lg:block">
                  {price !== undefined ? rub(price) : <span className="font-normal text-muted-foreground">—</span>}
                </span>
                <span className="flex justify-end" onClick={(e) => e.stopPropagation()}>
                  <Switch checked={p.active} onCheckedChange={() => toggle(p)} />
                </span>
              </div>
            );
          })}
        </div>
        <div className="border-t border-border px-[22px] py-2.5 text-xs text-muted-foreground">
          Показано {filtered.length} из {products.length} · активных {products.filter((p) => p.active).length}
        </div>
      </section>

      <ProductCard
        product={editing}
        isNew={creating}
        groups={groups}
        priceTypes={priceTypes}
        defaultGroupId={groupId}
        onClose={() => {
          setEditing(null);
          setCreating(false);
        }}
        onSaved={changed}
      />
      <GroupDialog group={groupEdit} onClose={() => setGroupEdit(null)} onSaved={changed} />
      <ImportExcelDialog open={importOpen} onOpenChange={setImportOpen} onImported={changed} />

      <AlertDialog open={!!groupDel} onOpenChange={(v) => !v && setGroupDel(null)}>
        <AlertDialogContent className="rounded-[24px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-head">Удалить группу «{groupDel?.name}»?</AlertDialogTitle>
            <AlertDialogDescription>
              {groupDel?.productsCount
                ? `В группе ${groupDel.productsCount} товаров — сначала перенесите их в другую группу.`
                : "Группа пустая, её можно удалить."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={removeGroup}
              disabled={!!groupDel?.productsCount}
              className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default NomenclatureSection;
