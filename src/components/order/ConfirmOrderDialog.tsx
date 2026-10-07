import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Product, boxPrice, rub } from "@/data/catalog";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  qty: Record<string, number>;
  products: Product[];
  sending?: boolean;
  onConfirm: (comment: string, addressId: number | null) => void;
  onRemove: (id: string) => void;
}

const ConfirmOrderDialog = ({ open, onOpenChange, qty, products, sending, onConfirm, onRemove }: Props) => {
  const [comment, setComment] = useState("");
  const [addresses, setAddresses] = useState<{ id: number; name: string }[] | null>(null);
  const [addressId, setAddressId] = useState<number | null>(null);

  useEffect(() => {
    if (!open) return;
    api<{ addresses: { id: number; name: string }[] }>("my_addresses")
      .then((d) => {
        setAddresses(d.addresses);
        setAddressId((cur) => (d.addresses.some((a) => a.id === cur) ? cur : d.addresses.length === 1 ? d.addresses[0].id : null));
      })
      .catch(() => setAddresses([]));
  }, [open]);

  const needAddress = !!addresses?.length && !addressId;
  const items = products.filter((p) => (qty[p.id] ?? 0) > 0);
  const total = items.reduce((s, p) => s + boxPrice(p) * qty[p.id], 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl rounded-[18px] border-0 bg-card font-sans">
        <DialogHeader>
          <DialogTitle className="font-head text-2xl font-light">Проверьте заказ</DialogTitle>
          <DialogDescription>После отправки заказ сразу уйдёт в 1С и появится у менеджера.</DialogDescription>
        </DialogHeader>
        <div className="max-h-[45vh] space-y-1 overflow-y-auto">
          {items.map((p) => (
            <div key={p.id} className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-3 border-t border-border py-2 text-[0.8em]">
              <span className="font-head">{p.name}</span>
              <span className="text-muted-foreground">{qty[p.id]} кор.</span>
              <span className="w-24 text-right">{rub(boxPrice(p) * qty[p.id])}</span>
              <button type="button" onClick={() => onRemove(p.id)} className="text-muted-foreground hover:text-destructive" aria-label="Убрать">
                ×
              </button>
            </div>
          ))}
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-[0.75em] font-medium text-muted-foreground">
            <Icon name="MapPin" size={14} /> Адрес доставки
          </div>
          {addresses === null ? (
            <div className="h-12 animate-pulse rounded-[14px] bg-pill" />
          ) : addresses.length === 0 ? (
            <p className="rounded-[14px] bg-pill px-4 py-3 text-[0.8em] text-muted-foreground">
              Адреса доставки не заданы — укажите адрес в комментарии или уточните у менеджера.
            </p>
          ) : (
            <div className="max-h-44 space-y-1.5 overflow-y-auto">
              {addresses.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setAddressId(a.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-[14px] border px-3.5 py-2.5 text-left text-[0.85em] transition-colors",
                    addressId === a.id ? "border-primary bg-primary/5" : "border-border hover:bg-pill"
                  )}
                >
                  <span
                    className={cn(
                      "grid h-4 w-4 shrink-0 place-items-center rounded-full border-2",
                      addressId === a.id ? "border-primary" : "border-muted-foreground/40"
                    )}
                  >
                    {addressId === a.id && <span className="h-2 w-2 rounded-full bg-primary" />}
                  </span>
                  {a.name}
                </button>
              ))}
            </div>
          )}
        </div>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Комментарий к заказу: время доставки, пожелания…"
          className="min-h-[70px] rounded-[18px] bg-pill p-3 text-sm outline-none ring-ocean focus:ring-2"
        />
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-[0.75em] text-muted-foreground">Итого, {items.length} поз.</div>
            <div className="font-head text-2xl font-light">{rub(total)}</div>
          </div>
          <button
            type="button"
            disabled={items.length === 0 || sending || needAddress || addresses === null}
            title={needAddress ? "Выберите адрес доставки" : undefined}
            onClick={() => {
              onConfirm(comment.trim(), addressId);
              setComment("");
            }}
            className="rounded-full bg-ocean px-6 py-3 font-head text-ocean-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {sending ? "Отправляем…" : needAddress ? "Выберите адрес" : "Отправить заказ →"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ConfirmOrderDialog;
