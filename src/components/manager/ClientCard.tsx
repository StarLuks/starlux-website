import { useCallback, useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { api } from "@/lib/api";
import { PriceType } from "@/lib/nomenclature";
import { Client } from "@/store/portal";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Address {
  id: number;
  name: string;
  code1c: string;
  active: boolean;
  ordersCount: number;
}

interface Props {
  client: Client | null;
  onClose: () => void;
  onSaved: () => void;
}

type Tab = "main" | "addresses";
type AddrDraft = { id?: number; name: string; code1c: string; active: boolean };

const inputCls =
  "h-10 w-full rounded-xl border border-border bg-pill px-3.5 text-sm outline-none transition focus:border-ring focus:bg-card focus:ring-4 focus:ring-ring/15";

const genPass = () => Math.random().toString(36).slice(2, 10);

const Field = ({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) => (
  <label className={cn("block space-y-1", className)}>
    <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
    {children}
  </label>
);

const ClientCard = ({ client, onClose, onSaved }: Props) => {
  const [tab, setTab] = useState<Tab>("main");
  const [f, setF] = useState({ company: "", inn: "", contact: "", phone: "", login: "", password: "", priceTypeId: "" });
  const [priceTypes, setPriceTypes] = useState<PriceType[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [draft, setDraft] = useState<AddrDraft | null>(null);
  const [saving, setSaving] = useState(false);

  const loadAddresses = useCallback(async (id: number) => {
    try {
      const d = await api<{ addresses: Address[] }>("client_addresses", { clientId: id });
      setAddresses(d.addresses);
    } catch (e) {
      toast({ title: "Ошибка загрузки адресов", description: (e as Error).message });
    }
  }, []);

  useEffect(() => {
    if (!client) return;
    setTab("main");
    setDraft(null);
    setF({
      company: client.company,
      inn: client.inn,
      contact: client.contact,
      phone: client.phone,
      login: client.login,
      password: "",
      priceTypeId: client.priceTypeId ? String(client.priceTypeId) : "",
    });
    setAddresses([]);
    loadAddresses(client.id);
    api<{ priceTypes: PriceType[] }>("price_types", {})
      .then((d) => setPriceTypes(d.priceTypes))
      .catch(() => undefined);
  }, [client, loadAddresses]);

  const set = (k: keyof typeof f, v: string) => setF((p) => ({ ...p, [k]: v }));
  const mainType = priceTypes.find((t) => t.isMain);
  const available = priceTypes.filter((t) => t.active || String(t.id) === f.priceTypeId);

  const save = async () => {
    if (!client) return;
    if (!f.company.trim() || !f.login.trim()) {
      toast({ title: "Заполните организацию и логин" });
      setTab("main");
      return;
    }
    if (f.inn && !/^\d{10}$|^\d{12}$/.test(f.inn)) {
      toast({ title: "ИНН — 10 или 12 цифр" });
      setTab("main");
      return;
    }
    setSaving(true);
    try {
      await api("client_update", { id: client.id, ...f, priceTypeId: f.priceTypeId ? Number(f.priceTypeId) : null });
      toast({
        title: "Клиент сохранён",
        description: f.password ? `${f.company}: новый пароль ${f.password}` : f.company,
      });
      onSaved();
      onClose();
    } catch (e) {
      toast({ title: "Не удалось сохранить", description: (e as Error).message });
    } finally {
      setSaving(false);
    }
  };

  const saveAddress = async (d: AddrDraft) => {
    if (!client) return;
    if (!d.name.trim()) {
      toast({ title: "Укажите наименование адреса" });
      return;
    }
    try {
      await api("address_save", { ...d, clientId: client.id });
      setDraft(null);
      loadAddresses(client.id);
      onSaved();
    } catch (e) {
      toast({ title: "Не удалось сохранить адрес", description: (e as Error).message });
    }
  };

  const toggleAddress = (a: Address) => {
    setAddresses((p) => p.map((x) => (x.id === a.id ? { ...x, active: !x.active } : x)));
    saveAddress({ ...a, active: !a.active });
  };

  const activeCount = addresses.filter((a) => a.active).length;

  return (
    <Dialog open={!!client} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="flex max-h-[88vh] max-w-2xl flex-col gap-0 overflow-hidden rounded-[22px] p-0">
        <div className="flex items-center gap-3 px-5 pb-3 pt-4 pr-12">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-ice to-primary text-white">
            <Icon name="Building2" size={18} />
          </span>
          <div className="min-w-0">
            <DialogTitle className="truncate font-head text-lg leading-tight">{f.company || "Клиент"}</DialogTitle>
            <DialogDescription className="truncate text-xs">
              {client ? `ИНН ${client.inn || "—"} · заказов ${client.ordersCount ?? 0}` : ""}
            </DialogDescription>
          </div>
        </div>

        <div className="flex gap-1 border-b border-border px-5">
          {(
            [
              { key: "main", label: "Основное", icon: "FileText" },
              { key: "addresses", label: "Адреса доставки", icon: "MapPin", badge: String(activeCount) },
            ] as { key: Tab; label: string; icon: string; badge?: string }[]
          ).map((t) => (
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
            <div className="grid animate-fade-in grid-cols-2 gap-3">
              <Field label="Организация" className="col-span-2">
                <input className={inputCls} value={f.company} onChange={(e) => set("company", e.target.value)} />
              </Field>
              <Field label="ИНН">
                <input className={inputCls} value={f.inn} onChange={(e) => set("inn", e.target.value.replace(/\D/g, "").slice(0, 12))} />
              </Field>
              <Field label="Телефон">
                <input className={inputCls} value={f.phone} onChange={(e) => set("phone", e.target.value)} />
              </Field>
              <Field label="Контактное лицо" className="col-span-2">
                <input className={inputCls} value={f.contact} onChange={(e) => set("contact", e.target.value)} />
              </Field>
              <Field label="Тип цен" className="col-span-2">
                <select className={inputCls} value={f.priceTypeId} onChange={(e) => set("priceTypeId", e.target.value)}>
                  <option value="">По умолчанию — {mainType?.name ?? "основной"}</option>
                  {available.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                      {t.isMain ? " (основной)" : ""}
                      {!t.active ? " — отключён" : ""}
                    </option>
                  ))}
                </select>
              </Field>
              <p className="col-span-2 -mt-1 text-[11px] text-muted-foreground">
                Клиент видит в каталоге цены этого типа. Если у товара нет такой цены — показывается основная.
              </p>
              <Field label="Логин">
                <input className={inputCls} value={f.login} onChange={(e) => set("login", e.target.value)} />
              </Field>
              <Field label="Новый пароль">
                <div className="relative">
                  <input
                    className={cn(inputCls, "pr-10")}
                    value={f.password}
                    onChange={(e) => set("password", e.target.value)}
                    placeholder="не менять"
                  />
                  <button
                    type="button"
                    title="Сгенерировать"
                    onClick={() => set("password", genPass())}
                    className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"
                  >
                    <Icon name="Wand2" size={14} />
                  </button>
                </div>
              </Field>
              {f.password && (
                <p className="col-span-2 -mt-1 text-[11px] text-amber-700">
                  После сохранения клиенту нужно будет войти заново с новым паролем.
                </p>
              )}
            </div>
          )}

          {tab === "addresses" && (
            <div className="animate-fade-in space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Клиент выбирает адрес из активных при оформлении заказа.</p>
                <button
                  type="button"
                  onClick={() => setDraft({ name: "", code1c: "", active: true })}
                  className="flex shrink-0 items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground transition hover:opacity-90"
                >
                  <Icon name="Plus" size={14} /> Адрес
                </button>
              </div>

              {draft && !draft.id && (
                <AddressForm draft={draft} setDraft={setDraft} onSave={() => saveAddress(draft)} />
              )}

              {addresses.length === 0 && !draft && (
                <div className="grid place-items-center rounded-xl border-2 border-dashed border-border py-10 text-center text-sm text-muted-foreground">
                  <Icon name="MapPinOff" size={24} className="mb-2" />
                  Адресов пока нет
                </div>
              )}

              <div className="space-y-2">
                {addresses.map((a) =>
                  draft?.id === a.id ? (
                    <AddressForm key={a.id} draft={draft} setDraft={setDraft} onSave={() => saveAddress(draft)} />
                  ) : (
                    <div
                      key={a.id}
                      className={cn(
                        "flex items-center gap-3 rounded-xl border border-border px-3.5 py-2.5 transition-colors",
                        !a.active && "bg-pill/50 text-muted-foreground"
                      )}
                    >
                      <Icon name="MapPin" size={16} className={a.active ? "text-primary" : ""} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">{a.name}</div>
                        <div className="text-[11px] text-muted-foreground">
                          Код 1С: {a.code1c || "—"} · заказов {a.ordersCount}
                          {!a.active && " · отключён"}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setDraft({ id: a.id, name: a.name, code1c: a.code1c, active: a.active })}
                        className="grid h-8 w-8 place-items-center rounded-full transition-colors hover:bg-accent"
                        aria-label="Изменить"
                      >
                        <Icon name="Pencil" size={14} />
                      </button>
                      <Switch checked={a.active} onCheckedChange={() => toggleAddress(a)} />
                    </div>
                  )
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-border px-5 py-3">
          <button type="button" onClick={onClose} className="rounded-full px-4 py-2 text-sm font-medium transition-colors hover:bg-accent">
            Закрыть
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

const AddressForm = ({
  draft,
  setDraft,
  onSave,
}: {
  draft: AddrDraft;
  setDraft: (d: AddrDraft | null) => void;
  onSave: () => void;
}) => (
  <form
    onSubmit={(e) => {
      e.preventDefault();
      onSave();
    }}
    className="animate-fade-in space-y-2.5 rounded-xl border border-primary/40 bg-primary/5 p-3"
  >
    <Field label="Наименование (адрес)">
      <input
        autoFocus
        className={inputCls}
        value={draft.name}
        onChange={(e) => setDraft({ ...draft, name: e.target.value })}
        placeholder="г. Москва, ул. Складская, 12, склад №3"
      />
    </Field>
    <div className="flex items-end gap-2">
      <Field label="Код 1С" className="flex-1">
        <input className={inputCls} value={draft.code1c} onChange={(e) => setDraft({ ...draft, code1c: e.target.value })} placeholder="Необязательно" />
      </Field>
      <button type="button" onClick={() => setDraft(null)} className="h-10 rounded-full px-4 text-sm font-medium hover:bg-accent">
        Отмена
      </button>
      <button type="submit" className="h-10 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90">
        {draft.id ? "Сохранить" : "Добавить"}
      </button>
    </div>
  </form>
);

export default ClientCard;
