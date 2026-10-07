import { OrderStatus } from "@/store/portal";
import { cn } from "@/lib/utils";

const styles: Record<OrderStatus, string> = {
  "Новый": "bg-accent text-accent-foreground",
  "Передан в 1С": "bg-ocean text-ocean-foreground",
  "Собирается": "bg-foreground text-card",
  "Отгружен": "bg-pill text-foreground",
  "Доставлен": "bg-success/15 text-success",
  "Отменён": "bg-destructive/10 text-destructive",
};

const StatusBadge = ({ status }: { status: OrderStatus }) => (
  <span className={cn("inline-block whitespace-nowrap rounded-full px-3 py-1 text-[0.75em]", styles[status])}>{status}</span>
);

export default StatusBadge;
