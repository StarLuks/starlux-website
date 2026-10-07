import { useCallback, useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { api } from "@/lib/api";
import { User } from "@/store/portal";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type Staff = User & { isMe: boolean };
type Draft = { id?: number; contact: string; login: string; phone: string; role: "manager" | "admin"; password: string };
const EMPTY: Draft = { contact: "", login: "", phone: "", role: "manager", password: "" };

const inputCls =
  "h-11 w-full rounded-2xl border border-border bg-pill px-4 outline-none transition focus:border-ring focus:bg-card focus:ring-4 focus:ring-ring/15";

const genPassword = () => {
  const abc = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from(crypto.getRandomValues(new Uint32Array(10)), (n) => abc[n % abc.length]).join("");
};

const initials = (s: string) =>
  s
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("") || "?";

const StaffSection = () => {
  const [items, setItems] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const load = useCallback(async () => {
    try {
      const d = await api<{ staff: Staff[] }>("staff_list", {});
      setItems(d.staff);
    } catch (e) {
      toast({ title: "Ошибка загрузки", description: (e as Error).message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const open = (d: Draft) => {
    setShowPw(!d.id);
    setDraft(d);
  };

  const save = async (d: Draft) => {
    if (!d.contact.trim() || !d.login.trim()) {
      toast({ title: "Заполните ФИО и логин" });
      return;
    }
    if (!d.id && d.password.length < 6) {
      toast({ title: "Задайте пароль — минимум 6 символов" });
      return;
    }
    setSaving(true);
    try {
      await api("staff_save", d);
      toast({
        title: d.id ? "Данные сотрудника сохранены" : "Сотрудник добавлен",
        description: d.password ? `Логин: ${d.login} · пароль: ${d.password}` : d.contact,
      });
      setDraft(null);
      load();
    } catch (e) {
      toast({ title: "Не удалось сохранить", description: (e as Error).message });
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (s: Staff) => {
    try {
      const r = await api<{ blocked: boolean }>("staff_toggle", { id: s.id });
      setItems((p) => p.map((x) => (x.id === s.id ? { ...x, blocked: r.blocked } : x)));
      toast({ title: r.blocked ? "Доступ закрыт" : "Доступ восстановлен", description: s.contact || s.login });
    } catch (e) {
      toast({ title: "Не удалось изменить доступ", description: (e as Error).message });
    }
  };

  return (
    <section className="tile flex min-h-0 animate-fade-in flex-col">
      <div className="flex flex-wrap items-center justify-between gap-3 px-[22px] pb-3 pt-5">
        <div>
          <h2 className="font-head text-2xl font-bold">Сотрудники</h2>
          <p className="text-sm text-muted-foreground">Менеджеры работают с заказами и клиентами. Администратор ещё и управляет сотрудниками.</p>
        </div>
        <button
          type="button"
          onClick={() => open({ ...EMPTY, password: genPassword() })}
          className="flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 font-head text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition hover:-translate-y-0.5"
        >
          <Icon name="UserPlus" size={16} /> Добавить сотрудника
        </button>
      </div>

      <div className="hidden h-[34px] items-center gap-3 border-t border-border px-[22px] text-[0.72em] text-muted-foreground md:grid md:grid-cols-[2fr_1fr_1fr_130px_110px_60px]">
        <span>Сотрудник</span>
        <span>Логин</span>
        <span>Телефон</span>
        <span>Роль</span>
        <span>Доступ</span>
        <span />
      </div>

      <div className="min-h-0 overflow-y-auto">
        {items.length === 0 && (
          <div className="border-t border-border px-[22px] py-10 text-center text-sm text-muted-foreground">
            {loading ? "Загрузка…" : "Сотрудников пока нет"}
          </div>
        )}
        {items.map((s) => (
          <div
            key={s.id}
            className={cn(
              "grid grid-cols-2 items-center gap-x-3 gap-y-2 border-t border-border px-4 py-3 text-sm md:grid-cols-[2fr_1fr_1fr_130px_110px_60px] md:px-[22px]",
              s.blocked && "text-muted-foreground"
            )}
          >
            <span className="col-span-2 flex min-w-0 items-center gap-3 md:col-span-1">
              <span
                className={cn(
                  "grid h-9 w-9 shrink-0 place-items-center rounded-full font-head text-xs font-bold",
                  s.blocked ? "bg-muted" : s.role === "admin" ? "bg-primary text-primary-foreground" : "bg-accent text-accent-foreground"
                )}
              >
                {initials(s.contact || s.login)}
              </span>
              <span className="min-w-0">
                <span className="block truncate font-head font-medium">
                  {s.contact || "Без имени"}
                  {s.isMe && <span className="ml-1.5 text-xs font-normal text-muted-foreground">(это вы)</span>}
                </span>
                {s.blocked && <span className="text-xs text-destructive">доступ закрыт</span>}
              </span>
            </span>
            <span className="truncate font-mono text-[13px]">{s.login}</span>
            <span className="truncate text-muted-foreground max-md:text-right">{s.phone || "—"}</span>
            <span>
              <span
                className={cn(
                  "rounded-full px-2.5 py-1 text-xs font-semibold",
                  s.role === "admin" ? "bg-primary/10 text-primary" : "bg-pill text-foreground"
                )}
              >
                {s.role === "admin" ? "Администратор" : "Менеджер"}
              </span>
            </span>
            <span className="max-md:text-right">
              <Switch checked={!s.blocked} disabled={s.isMe} onCheckedChange={() => toggle(s)} aria-label="Доступ" />
            </span>
            <span className="col-span-2 flex justify-end md:col-span-1">
              <button
                type="button"
                onClick={() => open({ id: s.id, contact: s.contact, login: s.login, phone: s.phone, role: s.role === "admin" ? "admin" : "manager", password: "" })}
                className="grid h-9 w-9 place-items-center rounded-full transition-colors hover:bg-accent"
                aria-label="Изменить"
              >
                <Icon name="Pencil" size={16} />
              </button>
            </span>
          </div>
        ))}
      </div>

      <Dialog open={!!draft} onOpenChange={(v) => !v && setDraft(null)}>
        <DialogContent className="max-w-md rounded-[24px]">
          <DialogHeader>
            <DialogTitle className="font-head">{draft?.id ? "Изменить сотрудника" : "Новый сотрудник"}</DialogTitle>
            <DialogDescription>
              {draft?.id ? "Чтобы сменить пароль, задайте новый — иначе оставьте поле пустым." : "Передайте сотруднику логин и пароль для входа."}
            </DialogDescription>
          </DialogHeader>
          {draft && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                save(draft);
              }}
              className="space-y-3.5"
            >
              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-muted-foreground">ФИО</span>
                <input autoFocus className={inputCls} value={draft.contact} onChange={(e) => setDraft({ ...draft, contact: e.target.value })} placeholder="Иванова Мария" />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block space-y-1.5">
                  <span className="text-xs font-medium text-muted-foreground">Логин</span>
                  <input className={inputCls} value={draft.login} onChange={(e) => setDraft({ ...draft, login: e.target.value.replace(/\s/g, "") })} placeholder="ivanova" autoComplete="off" />
                </label>
                <label className="block space-y-1.5">
                  <span className="text-xs font-medium text-muted-foreground">Телефон</span>
                  <input className={inputCls} value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} placeholder="+7 …" inputMode="tel" />
                </label>
              </div>
              <div className="block space-y-1.5">
                <span className="text-xs font-medium text-muted-foreground">{draft.id ? "Новый пароль" : "Пароль"}</span>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      className={cn(inputCls, "pr-11 font-mono")}
                      type={showPw ? "text" : "password"}
                      value={draft.password}
                      onChange={(e) => setDraft({ ...draft, password: e.target.value })}
                      placeholder={draft.id ? "Не менять" : "Минимум 6 символов"}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((v) => !v)}
                      className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-muted-foreground hover:bg-accent"
                      aria-label="Показать пароль"
                    >
                      <Icon name={showPw ? "EyeOff" : "Eye"} size={16} />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setDraft({ ...draft, password: genPassword() });
                      setShowPw(true);
                    }}
                    className="flex h-11 shrink-0 items-center gap-1.5 rounded-2xl bg-pill px-3 text-sm transition hover:bg-accent"
                    title="Сгенерировать пароль"
                  >
                    <Icon name="RefreshCw" size={15} />
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <span className="text-xs font-medium text-muted-foreground">Роль</span>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      ["manager", "Менеджер", "Заказы, клиенты, товары"],
                      ["admin", "Администратор", "Всё + сотрудники"],
                    ] as const
                  ).map(([k, t, d]) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setDraft({ ...draft, role: k })}
                      className={cn(
                        "rounded-2xl border-2 px-3 py-2.5 text-left transition",
                        draft.role === k ? "border-primary bg-primary/5" : "border-transparent bg-pill hover:bg-accent"
                      )}
                    >
                      <span className="block text-sm font-semibold">{t}</span>
                      <span className="text-[11px] text-muted-foreground">{d}</span>
                    </button>
                  ))}
                </div>
              </div>
              <button
                type="submit"
                disabled={saving}
                className="h-11 w-full rounded-2xl bg-primary font-head font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
              >
                {saving ? "Сохраняем…" : draft.id ? "Сохранить" : "Добавить сотрудника"}
              </button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default StaffSection;
