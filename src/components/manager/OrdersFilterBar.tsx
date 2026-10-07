import { useMemo, useState } from "react";
import { ru } from "date-fns/locale";
import { DateRange } from "react-day-picker";
import Icon from "@/components/ui/icon";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Client, OrderStatus, STATUSES } from "@/store/portal";
import { cn } from "@/lib/utils";

export interface OrdersFilter {
  statuses: OrderStatus[];
  range?: DateRange;
  clientId: number | null;
  q: string;
}

// eslint-disable-next-line react-refresh/only-export-components
export const EMPTY_FILTER: OrdersFilter = { statuses: [], range: undefined, clientId: null, q: "" };

interface Props {
  value: OrdersFilter;
  onChange: (v: OrdersFilter) => void;
  clients: Client[];
  counts: Record<string, number>;
}

const trigger =
  "flex h-10 items-center gap-2 rounded-full bg-pill px-4 text-sm font-medium transition-colors hover:bg-accent data-[state=open]:bg-accent";

const fmt = (d?: Date) => (d ? d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "2-digit" }) : "");

const startOf = (offsetDays: number) => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - offsetDays);
  return d;
};

const PRESETS: { label: string; range: () => DateRange }[] = [
  { label: "Сегодня", range: () => ({ from: startOf(0), to: startOf(0) }) },
  { label: "Вчера", range: () => ({ from: startOf(1), to: startOf(1) }) },
  { label: "7 дней", range: () => ({ from: startOf(6), to: startOf(0) }) },
  { label: "30 дней", range: () => ({ from: startOf(29), to: startOf(0) }) },
  {
    label: "Этот месяц",
    range: () => {
      const d = startOf(0);
      return { from: new Date(d.getFullYear(), d.getMonth(), 1), to: d };
    },
  },
];

const OrdersFilterBar = ({ value, onChange, clients, counts }: Props) => {
  const [clientQ, setClientQ] = useState("");
  const [clientOpen, setClientOpen] = useState(false);
  const set = (p: Partial<OrdersFilter>) => onChange({ ...value, ...p });

  const toggleStatus = (s: OrderStatus) =>
    set({ statuses: value.statuses.includes(s) ? value.statuses.filter((x) => x !== s) : [...value.statuses, s] });

  const client = clients.find((c) => c.id === value.clientId);
  const clientList = useMemo(() => {
    const s = clientQ.trim().toLowerCase();
    return clients.filter((c) => !s || c.company.toLowerCase().includes(s) || c.inn.includes(s));
  }, [clients, clientQ]);

  const statusLabel =
    value.statuses.length === 0
      ? "Все статусы"
      : value.statuses.length === 1
        ? value.statuses[0]
        : `Статусы · ${value.statuses.length}`;

  const periodLabel = value.range?.from
    ? value.range.to && value.range.to.getTime() !== value.range.from.getTime()
      ? `${fmt(value.range.from)} — ${fmt(value.range.to)}`
      : fmt(value.range.from)
    : "За всё время";

  const active = value.statuses.length > 0 || !!value.range?.from || value.clientId !== null || value.q.trim() !== "";

  return (
    <div className="flex flex-wrap items-center gap-2 px-[18px] pb-4">
      <Popover>
        <PopoverTrigger className={cn(trigger, value.statuses.length && "bg-primary/10 text-primary")}>
          <Icon name="ListFilter" size={15} />
          {statusLabel}
          <Icon name="ChevronDown" size={14} className="opacity-60" />
        </PopoverTrigger>
        <PopoverContent align="start" className="w-64 rounded-2xl p-2">
          {STATUSES.map((s) => (
            <label key={s} className="flex cursor-pointer items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm hover:bg-accent">
              <Checkbox checked={value.statuses.includes(s)} onCheckedChange={() => toggleStatus(s)} />
              <span className="flex-1">{s}</span>
              <span className="text-xs text-muted-foreground">{counts[s] ?? 0}</span>
            </label>
          ))}
          <div className="mt-1 flex gap-1 border-t border-border pt-2">
            <button type="button" onClick={() => set({ statuses: [...STATUSES] })} className="flex-1 rounded-lg px-2 py-1.5 text-xs font-medium hover:bg-accent">
              Выбрать все
            </button>
            <button type="button" onClick={() => set({ statuses: [] })} className="flex-1 rounded-lg px-2 py-1.5 text-xs font-medium hover:bg-accent">
              Сбросить
            </button>
          </div>
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger className={cn(trigger, value.range?.from && "bg-primary/10 text-primary")}>
          <Icon name="CalendarDays" size={15} />
          {periodLabel}
          <Icon name="ChevronDown" size={14} className="opacity-60" />
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto rounded-2xl p-0">
          <div className="flex flex-col sm:flex-row">
            <div className="flex flex-wrap gap-1 border-b border-border p-2 sm:w-36 sm:flex-col sm:border-b-0 sm:border-r">
              {PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => set({ range: p.range() })}
                  className="rounded-lg px-2.5 py-1.5 text-left text-sm hover:bg-accent"
                >
                  {p.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => set({ range: undefined })}
                className="rounded-lg px-2.5 py-1.5 text-left text-sm text-muted-foreground hover:bg-accent"
              >
                За всё время
              </button>
            </div>
            <Calendar
              mode="range"
              locale={ru}
              selected={value.range}
              onSelect={(r) => set({ range: r })}
              numberOfMonths={1}
              defaultMonth={value.range?.from}
              initialFocus
            />
          </div>
        </PopoverContent>
      </Popover>

      <Popover open={clientOpen} onOpenChange={setClientOpen}>
        <PopoverTrigger className={cn(trigger, "max-w-[260px]", client && "bg-primary/10 text-primary")}>
          <Icon name="Building2" size={15} className="shrink-0" />
          <span className="truncate">{client ? client.company : "Все клиенты"}</span>
          <Icon name="ChevronDown" size={14} className="shrink-0 opacity-60" />
        </PopoverTrigger>
        <PopoverContent align="start" className="w-72 rounded-2xl p-2">
          <div className="relative mb-1">
            <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              autoFocus
              value={clientQ}
              onChange={(e) => setClientQ(e.target.value)}
              placeholder="Название или ИНН…"
              className="h-9 w-full rounded-xl bg-pill pl-8 pr-3 text-sm outline-none"
            />
          </div>
          <div className="max-h-64 overflow-y-auto">
            <button
              type="button"
              onClick={() => {
                set({ clientId: null });
                setClientOpen(false);
              }}
              className={cn("flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left text-sm hover:bg-accent", value.clientId === null && "font-semibold")}
            >
              <Icon name="Check" size={14} className={value.clientId === null ? "opacity-100" : "opacity-0"} />
              Все клиенты
            </button>
            {clientList.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  set({ clientId: c.id });
                  setClientOpen(false);
                }}
                className={cn("flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left text-sm hover:bg-accent", value.clientId === c.id && "font-semibold")}
              >
                <Icon name="Check" size={14} className={cn("shrink-0", value.clientId === c.id ? "opacity-100" : "opacity-0")} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate">{c.company}</span>
                  {c.inn && <span className="block text-xs font-normal text-muted-foreground">ИНН {c.inn}</span>}
                </span>
              </button>
            ))}
            {clientList.length === 0 && <div className="px-2.5 py-3 text-center text-sm text-muted-foreground">Не найдено</div>}
          </div>
        </PopoverContent>
      </Popover>

      <div className="relative min-w-[160px] flex-1">
        <Icon name="Search" size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={value.q}
          onChange={(e) => set({ q: e.target.value })}
          placeholder="№ заказа…"
          className="h-10 w-full rounded-full bg-pill pl-9 pr-4 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring/30"
        />
      </div>

      {active && (
        <button
          type="button"
          onClick={() => onChange(EMPTY_FILTER)}
          className="flex h-10 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
        >
          <Icon name="X" size={15} /> Сбросить
        </button>
      )}
    </div>
  );
};

export default OrdersFilterBar;
