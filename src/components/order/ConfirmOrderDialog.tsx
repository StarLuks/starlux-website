import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Product, boxPrice, rub } from "@/data/catalog";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  qty: Record<string, number>;
  products: Product[];
  sending?: boolean;
  onConfirm: (comment: string) => void;
  onRemove: (id: string) => void;
}

const ConfirmOrderDialog = ({ open, onOpenChange, qty, products, sending, onConfirm, onRemove }: Props) => {
  const [comment, setComment] = useState("");
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
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Комментарий к заказу: время доставки, адрес разгрузки…"
          className="min-h-[70px] rounded-[18px] bg-pill p-3 text-sm outline-none ring-ocean focus:ring-2"
        />
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-[0.75em] text-muted-foreground">Итого, {items.length} поз.</div>
            <div className="font-head text-2xl font-light">{rub(total)}</div>
          </div>
          <button
            type="button"
            disabled={items.length === 0 || sending}
            onClick={() => {
              onConfirm(comment.trim());
              setComment("");
            }}
            className="rounded-full bg-ocean px-6 py-3 font-head text-ocean-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {sending ? "Отправляем…" : "Отправить заказ →"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ConfirmOrderDialog;
