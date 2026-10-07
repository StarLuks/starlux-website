import { useCallback, useEffect, useMemo, useState } from "react";
import Icon from "@/components/ui/icon";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export type LeadStatus = "new" | "work" | "done" | "rejected";

export interface Lead {
  id: number;
  company: string;
  contact: string;
  phone: string;
  email: string;
  business: string;
  message: string;
  status: LeadStatus;
  createdAt: string;
}

// eslint-disable-next-line react-refresh/only-export-components
export const LEAD_STATUS: Record<LeadStatus, { label: string; cls: string }> = {
  new: { label: "Новая", cls: "bg-primary/15 text-primary" },
  work: { label: "В работе", cls: "bg-amber-500/15 text-amber-700" },
  done: { label: "Стал клиентом", cls: "bg-emerald-500/15 text-emerald-700" },
  rejected: { label: "Отказ", cls: "bg-muted text-muted-foreground" },
};

interface Props {
  onCount?: (n: number) => void;
}

const LeadsSection = ({ onCount }: Props) => {
  const [items, setItems] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<LeadStatus | "all">("all");

  const load = useCallback(async () => {
    try {
      const d = await api<{ leads: Lead[] }>("leads");
      setItems(d.leads);
    } catch (e) {
      toast({ title: "Ошибка загрузки", description: (e as Error).message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    onCount?.(items.filter((l) => l.status === "new").length);
  }, [items, onCount]);

  const list = useMemo(() => items.filter((l) => filter === "all" || l.status === filter), [items, filter]);

  const setStatus = async (l: Lead, status: LeadStatus) => {
    setItems((p) => p.map((x) => (x.id === l.id ? { ...x, status } : x)));
    try {
      await api("lead_status", { id: l.id, status });
    } catch (e) {
      toast({ title: "Не удалось изменить статус", description: (e as Error).message });
      load();
    }
  };

  return (
    <section className="tile flex min-h-0 animate-fade-in flex-col">
      <div className="flex flex-wrap items-center justify-between gap-3 px-[22px] pb-3 pt-5">
        <div>
          <h2 className="font-head text-2xl font-bold">Заявки с сайта</h2>
          <p className="text-sm text-muted-foreground">Обращения из формы «Стать клиентом» на главной странице.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(["all", "new", "work", "done", "rejected"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setFilter(s)}
              className={cn("pill transition-colors", filter === s ? "bg-primary text-primary-foreground" : "hover:bg-accent")}
            >
              {s === "all" ? "Все" : LEAD_STATUS[s].label} · {s === "all" ? items.length : items.filter((l) => l.status === s).length}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto border-t border-border">
        {loading && <div className="p-10 text-center text-muted-foreground">Загрузка…</div>}
        {!loading && list.length === 0 && (
          <div className="flex flex-col items-center gap-2 p-12 text-center text-muted-foreground">
            <Icon name="Inbox" size={32} />
            Заявок пока нет
          </div>
        )}
        {list.map((l) => (
          <div
            key={l.id}
            className={cn(
              "grid gap-3 border-b border-border px-[22px] py-4 md:grid-cols-[1.4fr_1.2fr_2fr_180px] md:items-start",
              l.status === "new" && "bg-primary/[0.03]",
            )}
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                {l.status === "new" && <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />}
                <span className="truncate font-head font-semibold">{l.company || "Без названия"}</span>
              </div>
              <div className="mt-0.5 text-sm text-muted-foreground">{l.contact}</div>
              <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                <span>{new Date(l.createdAt).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</span>
                {l.business && <span className="rounded-full bg-pill px-2">{l.business}</span>}
              </div>
            </div>
            <div className="flex flex-col gap-1 text-sm">
              <a href={`tel:${l.phone.replace(/[^\d+]/g, "")}`} className="flex items-center gap-1.5 font-medium text-primary hover:underline">
                <Icon name="Phone" size={14} /> {l.phone}
              </a>
              {l.email && (
                <a href={`mailto:${l.email}`} className="flex items-center gap-1.5 text-muted-foreground hover:text-primary">
                  <Icon name="Mail" size={14} /> {l.email}
                </a>
              )}
            </div>
            <p className="whitespace-pre-line text-sm text-muted-foreground">{l.message || "—"}</p>
            <Select value={l.status} onValueChange={(v) => setStatus(l, v as LeadStatus)}>
              <SelectTrigger className={cn("h-9 rounded-full border-0 text-sm font-medium", LEAD_STATUS[l.status].cls)}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                {(Object.keys(LEAD_STATUS) as LeadStatus[]).map((s) => (
                  <SelectItem key={s} value={s} className="rounded-xl">
                    {LEAD_STATUS[s].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>
    </section>
  );
};

export default LeadsSection;
