import { Fragment, ReactNode, useState } from "react";
import { Order } from "@/store/portal";
import { rub } from "@/data/catalog";
import StatusBadge from "./StatusBadge";
import Icon from "@/components/ui/icon";
import { cn } from "@/lib/utils";

interface Props {
  orders: Order[];
  showClient?: (o: Order) => ReactNode;
  actions?: (o: Order) => ReactNode;
  statusCell?: (o: Order) => ReactNode;
  empty?: string;
  detailed?: boolean;
  onProductClick?: (productId: string) => void;
  highlight?: string;
}

const Mark = ({ text, q }: { text: string; q: string }) => {
  const i = q ? text.toLowerCase().indexOf(q) : -1;
  if (i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <mark className="rounded bg-amber-300/70 px-0.5 text-foreground">{text.slice(i, i + q.length)}</mark>
      {text.slice(i + q.length)}
    </>
  );
};

export const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

const OrdersList = ({ orders, showClient, actions, statusCell, empty = "Заказов пока нет", detailed, onProductClick, highlight }: Props) => {
  const [open, setOpen] = useState<number | null>(null);
  const hq = (highlight ?? "").trim().toLowerCase();
  const hit = (name: string) => !!hq && name.toLowerCase().includes(hq);
  const cols = showClient
    ? "md:grid-cols-[110px_150px_1.6fr_110px_1fr_150px_32px]"
    : "md:grid-cols-[110px_160px_110px_1fr_150px_32px]";

  return (
    <div>
      <div className={cn("hidden h-[34px] items-center gap-3 px-[22px] text-[0.72em] text-muted-foreground md:grid", cols)}>
        <span>№</span>
        <span>Дата</span>
        {showClient && <span>Клиент</span>}
        <span>Позиций</span>
        <span>Сумма</span>
        <span>Статус</span>
        <span />
      </div>
      {orders.length === 0 && <div className="border-t border-border px-[22px] py-10 text-center text-sm text-muted-foreground">{empty}</div>}
      {orders.map((o) => {
        const isOpen = open === o.id;
        return (
          <Fragment key={o.id}>
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : o.id)}
              className={cn(
                "grid w-full grid-cols-2 items-center gap-x-3 gap-y-1 border-t border-border px-4 py-3 text-left text-[0.85em] transition-colors hover:bg-background/30 md:h-12 md:px-[22px] md:py-0",
                cols,
                isOpen && "bg-background/30"
              )}
            >
              <span className="font-head font-medium">{o.number}</span>
              <span className="text-muted-foreground max-md:text-right">{fmtDate(o.date)}</span>
              {showClient && <span className="col-span-2 truncate font-head md:col-span-1">{showClient(o)}</span>}
              <span className="text-muted-foreground">
                {o.items.length} поз.
                {hq && o.items.some((it) => hit(it.name)) && (
                  <span className="ml-1.5 rounded-full bg-amber-300/60 px-1.5 py-0.5 text-[0.85em] text-foreground">
                    найдено {o.items.filter((it) => hit(it.name)).length}
                  </span>
                )}
              </span>
              <span className="max-md:text-right">{rub(o.total)}</span>
              <span onClick={(e) => statusCell && e.stopPropagation()}>{statusCell ? statusCell(o) : <StatusBadge status={o.status} />}</span>
              <Icon name="ChevronDown" size={16} className={cn("justify-self-end transition-transform", isOpen && "rotate-180")} />
            </button>
            {isOpen && (
              <div className="animate-fade-in border-t border-border bg-background/30 px-4 py-4 md:px-[22px]">
                {(o.address || o.priceTypeName) && (
                  <div className="mb-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[0.8em]">
                    {o.priceTypeName && (
                      <span className="flex items-center gap-1.5">
                        <Icon name="BadgePercent" size={14} className="text-primary" />
                        <span className="text-muted-foreground">Тип цен:</span> <b className="font-medium">{o.priceTypeName}</b>
                      </span>
                    )}
                    {o.address && (
                      <span className="flex items-center gap-1.5">
                        <Icon name="MapPin" size={14} className="text-primary" /> {o.address}
                      </span>
                    )}
                  </div>
                )}
                {detailed ? (
                  <div className="overflow-x-auto rounded-2xl border border-border bg-card">
                    <table className="w-full min-w-[860px] text-[0.8em]">
                      <thead>
                        <tr className="border-b border-border text-left text-muted-foreground">
                          <th className="w-10 px-3 py-2 text-center font-normal">№</th>
                          <th className="px-3 py-2 font-normal">Наименование</th>
                          <th className="px-3 py-2 font-normal">Артикул</th>
                          <th className="px-3 py-2 font-normal">Производитель</th>
                          <th className="px-3 py-2 font-normal">Код 1С</th>
                          <th className="px-3 py-2 text-right font-normal">Кол-во</th>
                          <th className="px-3 py-2 font-normal">Ед. изм.</th>
                          <th className="px-3 py-2 text-right font-normal">Цена</th>
                          <th className="px-3 py-2 text-right font-normal">Сумма</th>
                        </tr>
                      </thead>
                      <tbody>
                        {o.items.map((it, i) => (
                          <tr key={it.productId} className={cn("border-b border-border last:border-0", hit(it.name) && "bg-amber-200/40")}>
                            <td className="px-3 py-2 text-center text-muted-foreground">{i + 1}</td>
                            <td className="px-3 py-2 font-head">
                              {onProductClick ? (
                                <button
                                  type="button"
                                  onClick={() => onProductClick(it.productId)}
                                  className="text-left text-primary underline-offset-2 hover:underline"
                                >
                                  <Mark text={it.name} q={hq} />
                                </button>
                              ) : (
                                <Mark text={it.name} q={hq} />
                              )}
                            </td>
                            <td className="px-3 py-2 text-muted-foreground">{it.article || "—"}</td>
                            <td className="px-3 py-2 text-muted-foreground">{it.manufacturer || "—"}</td>
                            <td className="px-3 py-2 font-mono text-muted-foreground">{it.code1c || "—"}</td>
                            <td className="px-3 py-2 text-right">{it.qty}</td>
                            <td className="px-3 py-2 text-muted-foreground">{it.unit || "кор."}</td>
                            <td className="whitespace-nowrap px-3 py-2 text-right">{rub(it.boxPrice)}</td>
                            <td className="whitespace-nowrap px-3 py-2 text-right font-semibold">{rub(it.sum)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t border-border">
                          <td colSpan={8} className="px-3 py-2">
                            <div className="flex flex-wrap items-center justify-end gap-x-6 gap-y-1 text-muted-foreground">
                              <span>
                                Всего позиций: <b className="text-foreground">{o.items.length}</b>
                              </span>
                              <span>
                                Общая масса:{" "}
                                <b className="text-foreground">
                                  {o.items
                                    .reduce((m, it) => m + Number(it.weight ?? 0) * Number(it.qty), 0)
                                    .toLocaleString("ru-RU", { maximumFractionDigits: 3 })}{" "}
                                  кг
                                </b>
                              </span>
                              <span>Итого:</span>
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-3 py-2 text-right font-head font-bold">{rub(o.total)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                ) : (
                <div className="space-y-1.5 text-[0.8em]">
                  {o.items.map((it) => {
                    return (
                      <div key={it.productId} className={cn("grid grid-cols-[1fr_auto_auto] gap-4 rounded", hit(it.name) && "bg-amber-200/40")}>
                        <span className="font-head">
                          <Mark text={it.name} q={hq} />
                        </span>
                        <span className="text-muted-foreground">{it.qty} кор.</span>
                        <span className="w-28 text-right">{rub(it.sum)}</span>
                      </div>
                    );
                  })}
                </div>
                )}
                {o.comment && <p className="mt-3 text-[0.8em] text-muted-foreground">Комментарий: {o.comment}</p>}
                {o.cancelReason && (
                  <div className="mt-3 flex items-start gap-2 rounded-xl border border-destructive/20 bg-destructive/5 px-3 py-2 text-[0.8em]">
                    <Icon name="CircleX" size={15} className="mt-0.5 shrink-0 text-destructive" />
                    <p className="whitespace-pre-line">
                      <b className="text-destructive">Причина отмены:</b> {o.cancelReason}
                    </p>
                  </div>
                )}
                {actions && <div className="mt-4 flex flex-wrap gap-2">{actions(o)}</div>}
              </div>
            )}
          </Fragment>
        );
      })}
    </div>
  );
};

export default OrdersList;
