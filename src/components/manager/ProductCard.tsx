import { useEffect, useRef, useState } from "react";
import Icon from "@/components/ui/icon";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { api } from "@/lib/api";
import { NomProduct, PriceType, ProductGroup, ProductImage, fileToBase64 } from "@/lib/nomenclature";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Props {
  product: NomProduct | null;
  isNew: boolean;
  groups: ProductGroup[];
  priceTypes: PriceType[];
  defaultGroupId?: number | null;
  onClose: () => void;
  onSaved: () => void;
}

type Form = {
  id?: string;
  groupId: string;
  active: boolean;
  name: string;
  fullName: string;
  article: string;
  code1c: string;
  barcode: string;
  unit: string;
  manufacturer: string;
  dimensions: string;
  weight: string;
  pack: string;
  prices: Record<string, string>;
};

const toForm = (p: NomProduct | null, groupId?: number | null): Form => ({
  id: p?.id,
  groupId: String(p?.groupId ?? groupId ?? ""),
  active: p?.active ?? true,
  name: p?.name ?? "",
  fullName: p?.fullName ?? "",
  article: p?.article ?? "",
  code1c: p?.code1c ?? "",
  barcode: p?.barcode ?? "",
  unit: p?.unit ?? "кор.",
  manufacturer: p?.manufacturer ?? "",
  dimensions: p?.dimensions ?? "",
  weight: p ? String(p.weight) : "",
  pack: p?.pack ?? "",
  prices: Object.fromEntries(Object.entries(p?.prices ?? {}).map(([k, v]) => [k, String(v)])),
});

type Tab = "main" | "images" | "prices";

const inputCls =
  "h-10 w-full rounded-xl border border-border bg-pill px-3.5 text-sm outline-none transition focus:border-ring focus:bg-card focus:ring-4 focus:ring-ring/15";

const Field = ({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) => (
  <label className={cn("block space-y-1", className)}>
    <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
    {children}
  </label>
);

const ProductCard = ({ product, isNew, groups, priceTypes, defaultGroupId, onClose, onSaved }: Props) => {
  const open = isNew || !!product;
  const [form, setForm] = useState<Form>(toForm(product, defaultGroupId));
  const [images, setImages] = useState<ProductImage[]>(product?.images ?? []);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(0);
  const [tab, setTab] = useState<Tab>("main");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setForm(toForm(product, defaultGroupId));
      setImages(product?.images ?? []);
      setTab("main");
    }
  }, [open, product, defaultGroupId]);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));
  const activeTypes = priceTypes.filter((t) => t.active);

  const persist = async (): Promise<string | null> => {
    if (!form.name.trim()) {
      toast({ title: "Укажите наименование товара" });
      setTab("main");
      return null;
    }
    if (!form.groupId) {
      toast({ title: "Выберите группу номенклатуры" });
      setTab("main");
      return null;
    }
    const prices: Record<string, string | null> = {};
    activeTypes.forEach((t) => {
      const v = (form.prices[t.id] ?? "").trim();
      prices[t.id] = v === "" ? null : v;
    });
    const r = await api<{ id: string }>("product_save", { ...form, groupId: Number(form.groupId), prices });
    setForm((f) => ({ ...f, id: r.id }));
    return r.id;
  };

  const save = async () => {
    setSaving(true);
    try {
      const id = await persist();
      if (!id) return;
      toast({ title: isNew && !product ? "Товар создан" : "Карточка сохранена", description: form.name });
      onSaved();
      onClose();
    } catch (e) {
      toast({ title: "Не удалось сохранить", description: (e as Error).message });
    } finally {
      setSaving(false);
    }
  };

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    let pid = form.id;
    if (!pid) {
      try {
        pid = (await persist()) ?? undefined;
        if (!pid) return;
        onSaved();
      } catch (e) {
        toast({ title: "Не удалось сохранить товар", description: (e as Error).message });
        return;
      }
    }
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    setUploading(list.length);
    for (const f of list) {
      if (f.size > 8 * 1024 * 1024) {
        toast({ title: "Файл слишком большой", description: `${f.name} — максимум 8 МБ` });
        setUploading((n) => n - 1);
        continue;
      }
      try {
        const data = await fileToBase64(f);
        const r = await api<{ image: ProductImage }>("image_upload", { productId: pid, data, contentType: f.type });
        setImages((p) => [...p, r.image]);
      } catch (e) {
        toast({ title: "Ошибка загрузки фото", description: (e as Error).message });
      } finally {
        setUploading((n) => n - 1);
      }
    }
    onSaved();
  };

  const makeMain = async (img: ProductImage) => {
    setImages((p) => p.map((x) => ({ ...x, isMain: x.id === img.id })).sort((a, b) => Number(b.isMain) - Number(a.isMain)));
    await api("image_main", { id: img.id }).catch((e) => toast({ title: "Ошибка", description: (e as Error).message }));
    onSaved();
  };

  const removeImage = async (img: ProductImage) => {
    setImages((p) => {
      const rest = p.filter((x) => x.id !== img.id);
      if (img.isMain && rest.length) rest[0] = { ...rest[0], isMain: true };
      return rest;
    });
    await api("image_delete", { id: img.id }).catch((e) => toast({ title: "Ошибка", description: (e as Error).message }));
    onSaved();
  };

  const filledPrices = activeTypes.filter((t) => (form.prices[t.id] ?? "").trim() !== "").length;
  const tabs: { key: Tab; label: string; icon: string; badge?: string }[] = [
    { key: "main", label: "Основная", icon: "FileText" },
    { key: "images", label: "Изображения", icon: "Images", badge: String(images.length) },
    { key: "prices", label: "Цены", icon: "Tag", badge: `${filledPrices}/${activeTypes.length}` },
  ];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="flex max-h-[88vh] max-w-2xl flex-col gap-0 overflow-hidden rounded-[22px] p-0">
        <div className="flex items-center justify-between gap-3 px-5 pb-3 pt-4 pr-12">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl bg-pill text-muted-foreground">
              {images[0] ? <img src={(images.find((i) => i.isMain) ?? images[0]).url} alt="" className="h-full w-full object-cover" /> : <Icon name="Package" size={18} />}
            </span>
            <div className="min-w-0">
              <DialogTitle className="truncate font-head text-lg leading-tight">{form.name || "Новый товар"}</DialogTitle>
              <DialogDescription className="truncate text-xs">
                {product ? (product.code1c ? `Код 1С ${product.code1c}` : `ID ${product.id}`) + ` · остаток ${product.stock} ${product.unit}` : "Заполните реквизиты товара"}
              </DialogDescription>
            </div>
          </div>
          <label className="flex shrink-0 items-center gap-2 rounded-full bg-pill px-3 py-1.5 text-xs font-medium">
            Активна
            <Switch checked={form.active} onCheckedChange={(v) => set("active", v)} />
          </label>
        </div>

        <div className="flex gap-1 border-b border-border px-5">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={cn(
                "-mb-px flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
                tab === t.key ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon name={t.icon} size={15} />
              {t.label}
              {t.badge && <span className="rounded-full bg-pill px-1.5 text-[10px] font-semibold">{t.badge}</span>}
            </button>
          ))}
        </div>

        <div className="min-h-[340px] flex-1 overflow-y-auto px-5 py-4">
          {tab === "main" && (
            <div className="grid animate-fade-in grid-cols-2 gap-x-3 gap-y-3">
              <Field label="Группа номенклатуры" className="col-span-2">
                <select className={inputCls} value={form.groupId} onChange={(e) => set("groupId", e.target.value)}>
                  <option value="">— выберите группу —</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Наименование" className="col-span-2">
                <input className={inputCls} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Как видит клиент в каталоге" />
              </Field>
              <Field label="Полное наименование" className="col-span-2">
                <input className={inputCls} value={form.fullName} onChange={(e) => set("fullName", e.target.value)} placeholder="Для документов" />
              </Field>
              <Field label="Артикул">
                <input className={inputCls} value={form.article} onChange={(e) => set("article", e.target.value)} />
              </Field>
              <Field label="Код 1С">
                <input className={inputCls} value={form.code1c} onChange={(e) => set("code1c", e.target.value)} />
              </Field>
              <Field label="Штрихкод">
                <input className={inputCls} value={form.barcode} onChange={(e) => set("barcode", e.target.value)} inputMode="numeric" />
              </Field>
              <Field label="Единица измерения">
                <input className={inputCls} value={form.unit} onChange={(e) => set("unit", e.target.value)} placeholder="кор., кг, шт." />
              </Field>
              <Field label="Производитель" className="col-span-2">
                <input className={inputCls} value={form.manufacturer} onChange={(e) => set("manufacturer", e.target.value)} />
              </Field>
              <Field label="Вид упаковки">
                <input className={inputCls} value={form.pack} onChange={(e) => set("pack", e.target.value)} placeholder="короб 10 кг" />
              </Field>
              <Field label="Масса, кг">
                <input className={inputCls} value={form.weight} onChange={(e) => set("weight", e.target.value)} inputMode="decimal" placeholder="0" />
              </Field>
              <Field label="Габариты" className="col-span-2">
                <input className={inputCls} value={form.dimensions} onChange={(e) => set("dimensions", e.target.value)} placeholder="Д × Ш × В, см" />
              </Field>
            </div>
          )}

          {tab === "images" && (
            <div className="animate-fade-in space-y-3">
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                multiple
                className="hidden"
                onChange={(e) => {
                  upload(e.target.files);
                  e.target.value = "";
                }}
              />
              <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
                {images.map((img) => (
                  <div
                    key={img.id}
                    className={cn("group relative aspect-square overflow-hidden rounded-xl border-2 bg-pill", img.isMain ? "border-primary" : "border-transparent")}
                  >
                    <img src={img.url} alt="" className="h-full w-full object-cover" />
                    {img.isMain && (
                      <span className="absolute left-1.5 top-1.5 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">главное</span>
                    )}
                    <div className="absolute inset-x-1.5 bottom-1.5 flex justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100 max-md:opacity-100">
                      {!img.isMain && (
                        <button
                          type="button"
                          title="Сделать главным"
                          onClick={() => makeMain(img)}
                          className="grid h-7 w-7 place-items-center rounded-full bg-card/90 shadow transition-colors hover:bg-primary hover:text-primary-foreground"
                        >
                          <Icon name="Star" size={13} />
                        </button>
                      )}
                      <button
                        type="button"
                        title="Удалить"
                        onClick={() => removeImage(img)}
                        className="grid h-7 w-7 place-items-center rounded-full bg-card/90 text-destructive shadow transition-colors hover:bg-destructive hover:text-destructive-foreground"
                      >
                        <Icon name="Trash2" size={13} />
                      </button>
                    </div>
                  </div>
                ))}
                {Array.from({ length: uploading }).map((_, i) => (
                  <div key={`u${i}`} className="grid aspect-square place-items-center rounded-xl bg-pill">
                    <Icon name="Loader2" size={20} className="animate-spin text-muted-foreground" />
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="grid aspect-square place-items-center rounded-xl border-2 border-dashed border-border text-xs text-muted-foreground transition-colors hover:border-ring hover:text-foreground"
                >
                  <span className="flex flex-col items-center gap-1.5">
                    <Icon name="ImagePlus" size={22} />
                    Добавить
                  </span>
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                JPG, PNG или WEBP до 8 МБ, можно выбрать сразу несколько. Главное фото клиенты видят в каталоге первым — нажмите ★, чтобы назначить.
              </p>
            </div>
          )}

          {tab === "prices" && (
            <div className="animate-fade-in space-y-2">
              <div className="overflow-hidden rounded-xl border border-border">
                <div className="grid grid-cols-[1fr_140px] bg-pill px-4 py-2 text-[11px] font-medium text-muted-foreground">
                  <span>Тип цены</span>
                  <span className="text-right">Цена за кг, ₽</span>
                </div>
                {activeTypes.length === 0 && (
                  <div className="px-4 py-4 text-center text-sm text-muted-foreground">Нет активных типов цен</div>
                )}
                {activeTypes.map((t) => (
                  <div key={t.id} className="grid grid-cols-[1fr_140px] items-center gap-2 border-t border-border px-4 py-2">
                    <span className="text-sm">
                      {t.name}
                      {t.isMain && <span className="ml-1.5 text-[10px] font-semibold uppercase text-primary">основная</span>}
                    </span>
                    <input
                      value={form.prices[t.id] ?? ""}
                      onChange={(e) => set("prices", { ...form.prices, [t.id]: e.target.value })}
                      inputMode="decimal"
                      placeholder="не задана"
                      className="h-9 w-full rounded-lg border border-border bg-card px-3 text-right text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
                    />
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">Показаны все активные типы цен. Пустое поле — цена не задана.</p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-border px-5 py-3">
          <button type="button" onClick={onClose} className="rounded-full px-4 py-2 text-sm font-medium transition-colors hover:bg-accent">
            Отмена
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="flex items-center gap-2 rounded-full bg-primary px-5 py-2 font-head text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition hover:opacity-90 disabled:opacity-60"
          >
            {saving && <Icon name="Loader2" size={16} className="animate-spin" />}
            Сохранить
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductCard;
