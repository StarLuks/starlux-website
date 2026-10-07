import { Fragment, ReactNode, useState } from "react";
import { Order } from "@/store/portal";
import { PRODUCTS, rub } from "@/data/catalog";
import StatusBadge from "./StatusBadge";
import Icon from "@/components/ui/icon";
import { cn } from "@/lib/utils";

interface Props {
  orders: Order[];
  showClient?: (o: Order) => ReactNode;
  actions?: (o: Order) => ReactNode;
  statusCell?: (o: Order) => ReactNode;
  empty?: string;
}

export const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

const OrdersList = ({ orders, showClient, actions, statusCell, empty = "Заказов пока нет" }: Props) => {
  const [open, setOpen] = useState<string | null>(null);
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
              <span className="font-head font-medium">{o.id}</span>
              <span className="text-muted-foreground max-md:text-right">{fmtDate(o.date)}</span>
              {showClient && <span className="col-span-2 truncate font-head md:col-span-1">{showClient(o)}</span>}
              <span className="text-muted-foreground">{o.items.length} поз.</span>
              <span className="max-md:text-right">{rub(o.total)}</span>
              <span onClick={(e) => statusCell && e.stopPropagation()}>{statusCell ? statusCell(o) : <StatusBadge status={o.status} />}</span>
              <Icon name="ChevronDown" size={16} className={cn("justify-self-end transition-transform", isOpen && "rotate-180")} />
            </button>
            {isOpen && (
              <div className="animate-fade-in border-t border-border bg-background/30 px-4 py-4 md:px-[22px]">
                <div className="space-y-1.5 text-[0.8em]">
                  {o.items.map((it) => {
                    const p = PRODUCTS.find((x) => x.id === it.productId);
                    return (
                      <div key={it.productId} className="grid grid-cols-[1fr_auto_auto] gap-4">
                        <span className="font-head">{p?.name ?? it.productId}</span>
                        <span className="text-muted-foreground">{it.qty} кор.</span>
                        <span className="w-28 text-right">{rub(it.sum)}</span>
                      </div>
                    );
                  })}
                </div>
                {o.comment && <p className="mt-3 text-[0.8em] text-muted-foreground">Комментарий: {o.comment}</p>}
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
