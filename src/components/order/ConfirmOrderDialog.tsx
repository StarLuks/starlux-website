import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import { api } from "@/lib/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Product, boxPrice, qtyFmt, rub } from "@/data/catalog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  qty: Record<string, number>;
  products: Product[];
  sending?: boolean;
  onConfirm: (comment: string, addressId: number | null, deliveryAt: string, forEndBuyer: boolean) => void;
  onRemove: (id: string) => void;
}

const ConfirmOrderDialog = ({ open, onOpenChange, qty, products, sending, onConfirm, onRemove }: Props) => {
  const [comment, setComment] = useState("");
  const [deliveryAt, setDeliveryAt] = useState("");
  const [forEndBuyer, setForEndBuyer] = useState(false);
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
  const needDate = !deliveryAt;
  const minDate = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  const items = products.filter((p) => (qty[p.id] ?? 0) > 0);
  const total = items.reduce((s, p) => s + boxPrice(p) * qty[p.id], 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[692px] rounded-[18px] border-0 bg-card font-sans">
        <DialogHeader>
          <DialogTitle className="font-head text-2xl font-light">Проверьте заказ</DialogTitle>
          <DialogDescription>После отправки заказ сразу уйдёт в 1С и появится у менеджера.</DialogDescription>
        </DialogHeader>
        <div className="max-h-[40vh] overflow-y-auto">
          <div className="grid grid-cols-[1fr_64px_80px_88px_16px] items-center gap-3 pb-1.5 text-[0.7em] text-muted-foreground">
            <span>Товар</span>
            <span className="text-right">Кол-во</span>
            <span className="text-right">Цена</span>
            <span className="text-right">Сумма</span>
            <span />
          </div>
          {items.map((p) => (
            <div key={p.id} className="grid grid-cols-[1fr_64px_80px_88px_16px] items-center gap-3 border-t border-border py-2 text-[0.8em]">
              <span className="font-head">{p.name}</span>
              <span className="text-right text-muted-foreground">{qtyFmt(qty[p.id])} {p.unit || "кор."}</span>
              <span className="text-right text-muted-foreground">{rub(boxPrice(p))}</span>
              <span className="text-right">{rub(boxPrice(p) * qty[p.id])}</span>
              <button type="button" onClick={() => onRemove(p.id)} className="text-muted-foreground hover:text-destructive" aria-label="Убрать">
                ×
              </button>
            </div>
          ))}
        </div>
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1 space-y-2">
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
              <Select value={addressId ? String(addressId) : undefined} onValueChange={(v) => setAddressId(Number(v))}>
                <SelectTrigger className="h-12 rounded-[14px] bg-card text-left text-[0.85em]">
                  <SelectValue placeholder="Выберите адрес доставки" />
                </SelectTrigger>
                <SelectContent>
                  {addresses.map((a) => (
                    <SelectItem key={a.id} value={String(a.id)}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <div className="w-[190px] shrink-0 space-y-2">
            <label htmlFor="delivery-at" className="flex items-center gap-1.5 text-[0.75em] font-medium text-muted-foreground">
              <Icon name="CalendarClock" size={14} /> Дата доставки
            </label>
            <input
              id="delivery-at"
              type="date"
              value={deliveryAt}
              min={minDate}
              onChange={(e) => setDeliveryAt(e.target.value)}
              className="h-12 w-full rounded-[14px] border border-border bg-card px-3.5 text-[0.85em] outline-none ring-ocean focus:ring-2"
            />
          </div>
        </div>
        <label className="flex cursor-pointer items-center gap-2.5 text-[0.85em]">
          <Checkbox checked={forEndBuyer} onCheckedChange={(v) => setForEndBuyer(v === true)} />
          Оформить на конечного покупателя
        </label>
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
            disabled={items.length === 0 || sending || needAddress || needDate || addresses === null}
            title={needAddress ? "Выберите адрес доставки" : needDate ? "Укажите дату доставки" : undefined}
            onClick={() => {
              onConfirm(comment.trim(), addressId, deliveryAt, forEndBuyer);
              setComment("");
              setDeliveryAt("");
              setForEndBuyer(false);
            }}
            className="rounded-full bg-ocean px-6 py-3 font-head text-ocean-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {sending ? "Отправляем…" : needAddress ? "Выберите адрес" : needDate ? "Укажите дату" : "Отправить заказ →"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ConfirmOrderDialog;