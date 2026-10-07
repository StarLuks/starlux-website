import { useCallback, useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import { api } from "@/lib/api";
import { PriceType } from "@/lib/nomenclature";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type Draft = { id?: number; name: string; code1c: string; active: boolean; isMain: boolean };
const EMPTY: Draft = { name: "", code1c: "", active: true, isMain: false };

const inputCls =
  "h-11 w-full rounded-2xl border border-border bg-pill px-4 outline-none transition focus:border-ring focus:bg-card focus:ring-4 focus:ring-ring/15";

const PriceTypesSection = () => {
  const [items, setItems] = useState<PriceType[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [removing, setRemoving] = useState<PriceType | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const d = await api<{ priceTypes: PriceType[] }>("price_types", {});
      setItems(d.priceTypes);
    } catch (e) {
      toast({ title: "Ошибка загрузки", description: (e as Error).message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = async (d: Draft) => {
    if (!d.name.trim()) {
      toast({ title: "Укажите наименование" });
      return;
    }
    setSaving(true);
    try {
      const r = await api<{ warning?: string }>("price_type_save", d);
      toast({ title: d.id ? "Тип цены сохранён" : "Тип цены добавлен", description: r.warning ?? d.name });
      setDraft(null);
      load();
    } catch (e) {
      toast({ title: "Не удалось сохранить", description: (e as Error).message });
    } finally {
      setSaving(false);
    }
  };

  const toggle = (t: PriceType) => {
    if (t.isMain && t.active) {
      toast({ title: "Основной тип цены нельзя отключить", description: "Сначала назначьте основным другой тип." });
      return;
    }
    setItems((p) => p.map((x) => (x.id === t.id ? { ...x, active: !x.active } : x)));
    save({ ...t, active: !t.active }).catch(() => undefined);
  };

  const remove = async () => {
    const t = removing;
    setRemoving(null);
    if (!t) return;
    try {
      await api("price_type_delete", { id: t.id });
      toast({ title: "Тип цены удалён", description: t.name });
      load();
    } catch (e) {
      toast({ title: "Не удалось удалить", description: (e as Error).message });
    }
  };

  return (
    <section className="tile flex min-h-0 animate-fade-in flex-col">
      <div className="flex flex-wrap items-center justify-between gap-3 px-[22px] pb-3 pt-5">
        <div>
          <h2 className="font-head text-2xl font-bold">Типы цен</h2>
          <p className="text-sm text-muted-foreground">
            Основной тип цены видят клиенты в каталоге. Остальные хранятся в карточке товара.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setDraft({ ...EMPTY })}
          className="flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 font-head text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition hover:-translate-y-0.5"
        >
          <Icon name="Plus" size={16} /> Добавить тип цены
        </button>
      </div>

      <div className="hidden h-[34px] items-center gap-3 border-t border-border px-[22px] text-[0.72em] text-muted-foreground md:grid md:grid-cols-[2fr_1fr_120px_110px_110px]">
        <span>Наименование</span>
        <span>Код 1С</span>
        <span>Заполнено цен</span>
        <span>Активен</span>
        <span />
      </div>

      <div className="min-h-0 overflow-y-auto">
        {items.length === 0 && (
          <div className="border-t border-border px-[22px] py-10 text-center text-sm text-muted-foreground">
            {loading ? "Загрузка…" : "Типов цен пока нет"}
          </div>
        )}
        {items.map((t) => (
          <div
            key={t.id}
            className={cn(
              "grid grid-cols-2 items-center gap-x-3 gap-y-2 border-t border-border px-4 py-3 text-sm md:grid-cols-[2fr_1fr_120px_110px_110px] md:px-[22px]",
              !t.active && "text-muted-foreground"
            )}
          >
            <span className="col-span-2 flex items-center gap-2 font-head font-medium md:col-span-1">
              {t.name}
              {t.isMain && (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[0.75em] font-semibold text-primary">основной</span>
              )}
              {!t.active && <span className="rounded-full bg-muted px-2 py-0.5 text-[0.75em]">отключён</span>}
            </span>
            <span className="text-muted-foreground">{t.code1c || "—"}</span>
            <span className="max-md:text-right">{t.pricesCount}</span>
            <Switch checked={t.active} onCheckedChange={() => toggle(t)} />
            <span className="flex justify-end gap-1">
              <button
                type="button"
                onClick={() => setDraft({ id: t.id, name: t.name, code1c: t.code1c, active: t.active, isMain: t.isMain })}
                className="grid h-9 w-9 place-items-center rounded-full transition-colors hover:bg-accent"
                aria-label="Изменить"
              >
                <Icon name="Pencil" size={16} />
              </button>
              <button
                type="button"
                onClick={() => setRemoving(t)}
                className="grid h-9 w-9 place-items-center rounded-full text-destructive transition-colors hover:bg-destructive/10"
                aria-label="Удалить"
              >
                <Icon name="Trash2" size={16} />
              </button>
            </span>
          </div>
        ))}
      </div>

      <Dialog open={!!draft} onOpenChange={(v) => !v && setDraft(null)}>
        <DialogContent className="max-w-md rounded-[24px]">
          <DialogHeader>
            <DialogTitle className="font-head">{draft?.id ? "Изменить тип цены" : "Новый тип цены"}</DialogTitle>
          </DialogHeader>
          {draft && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                save(draft);
              }}
              className="space-y-4"
            >
              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-muted-foreground">Наименование</span>
                <input autoFocus className={inputCls} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Например, Оптовая" />
              </label>
              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-muted-foreground">Код 1С</span>
                <input className={inputCls} value={draft.code1c} onChange={(e) => setDraft({ ...draft, code1c: e.target.value })} placeholder="Необязательно" />
              </label>
              <label className="flex items-center justify-between rounded-2xl bg-pill px-4 py-3">
                <span className="text-sm">Активен</span>
                <Switch checked={draft.active} onCheckedChange={(v) => setDraft({ ...draft, active: v })} />
              </label>
              <label className="flex items-center justify-between rounded-2xl bg-pill px-4 py-3">
                <span>
                  <span className="block text-sm">Основной тип цены</span>
                  <span className="text-xs text-muted-foreground">По нему клиенты видят цены и оформляют заказы</span>
                </span>
                <Switch checked={draft.isMain} onCheckedChange={(v) => setDraft({ ...draft, isMain: v })} />
              </label>
              <button
                type="submit"
                disabled={saving}
                className="h-11 w-full rounded-2xl bg-primary font-head font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
              >
                {saving ? "Сохраняем…" : "Сохранить"}
              </button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!removing} onOpenChange={(v) => !v && setRemoving(null)}>
        <AlertDialogContent className="rounded-[24px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-head">Удалить тип цены «{removing?.name}»?</AlertDialogTitle>
            <AlertDialogDescription>
              Вместе с ним удалятся все цены этого типа в карточках товаров ({removing?.pricesCount ?? 0} шт.). Если тип нужен
              позже — лучше просто отключите его.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={remove} className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
};

export default PriceTypesSection;
