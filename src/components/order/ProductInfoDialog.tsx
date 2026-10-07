import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import Icon from "@/components/ui/icon";
import { Product, boxPrice, rub } from "@/data/catalog";
import QtyControl from "./QtyControl";
import ImageLightbox from "./ImageLightbox";
import { cn } from "@/lib/utils";

interface Props {
  product: Product | null;
  onOpenChange: (v: boolean) => void;
  qty: number;
  onQty: (v: number) => void;
}

const ProductInfoDialog = ({ product: p, onOpenChange, qty, onQty }: Props) => {
  const [zoom, setZoom] = useState<number | null>(null);
  if (!p) return null;

  const unit = p.unit || "кор.";
  const images = p.images ?? [];
  const out = p.stock <= 0;
  const fields: [string, string | undefined][] = [
    ["Артикул", p.article],
    ["Производитель", p.manufacturer],
    ["Группа", p.category],
    ["Фасовка", p.pack],
    ["Ед. изм.", unit],
    ["Масса", p.packKg ? `${Number(p.packKg).toLocaleString("ru-RU")} кг` : undefined],
    ["Габариты", p.dimensions],
    ["Штрихкод", p.barcode],
  ];

  return (
    <>
      <Dialog open={!!p} onOpenChange={onOpenChange}>
        <DialogContent className="flex max-h-[90vh] w-[calc(100%-1.5rem)] max-w-2xl flex-col gap-0 overflow-hidden rounded-[24px] p-0">
          <div className="overflow-y-auto">
            <div className="grid gap-5 p-5 pb-4 sm:grid-cols-[200px_1fr]">
              <div className="space-y-2">
                {images.length ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setZoom(0)}
                      className="group relative block aspect-square w-full overflow-hidden rounded-2xl bg-pill"
                    >
                      <img src={images[0]} alt={p.name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                      <span className="absolute bottom-2 right-2 grid h-8 w-8 place-items-center rounded-full bg-black/45 text-white opacity-0 transition-opacity group-hover:opacity-100">
                        <Icon name="ZoomIn" size={16} />
                      </span>
                    </button>
                    {images.length > 1 && (
                      <div className="grid grid-cols-4 gap-1.5">
                        {images.slice(1, 9).map((src, i) => (
                          <button
                            key={src}
                            type="button"
                            onClick={() => setZoom(i + 1)}
                            className="aspect-square overflow-hidden rounded-lg bg-pill ring-primary/40 transition hover:ring-2"
                          >
                            <img src={src} alt="" loading="lazy" className="h-full w-full object-cover" />
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="grid aspect-square w-full place-items-center rounded-2xl bg-pill text-muted-foreground/50 max-sm:hidden">
                    <Icon name="ImageOff" size={32} />
                  </div>
                )}
              </div>

              <div className="min-w-0 space-y-3">
                <div className="pr-8">
                  <DialogTitle className="font-head text-xl font-bold leading-tight">{p.name}</DialogTitle>
                  <DialogDescription className="mt-1 text-xs">
                    {p.fullName && p.fullName !== p.name ? p.fullName : p.category}
                  </DialogDescription>
                </div>

                <div className="flex flex-wrap items-end gap-x-5 gap-y-2 rounded-2xl bg-accent/60 px-4 py-3">
                  <div>
                    <span className="block text-[11px] text-muted-foreground">Ваша цена за {unit}</span>
                    <b className="font-head text-2xl leading-none text-primary">{rub(boxPrice(p))}</b>
                  </div>
                  <div>
                    <span className="block text-[11px] text-muted-foreground">за кг</span>
                    <b className="font-head text-base leading-none">{rub(p.price)}</b>
                  </div>
                  <span
                    className={cn(
                      "ml-auto inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                      out ? "bg-destructive/10 text-destructive" : p.stock < 30 ? "bg-amber-100 text-amber-800" : "bg-success/10 text-success"
                    )}
                  >
                    <span className={cn("h-1.5 w-1.5 rounded-full", out ? "bg-destructive" : p.stock < 30 ? "bg-amber-500" : "bg-success")} />
                    {out ? "нет в наличии" : `доступно ${p.stock} ${unit}`}
                  </span>
                </div>

                <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[13px]">
                  {fields
                    .filter(([, v]) => v && String(v).trim())
                    .map(([k, v]) => (
                      <div key={k} className="min-w-0">
                        <dt className="text-[11px] text-muted-foreground">{k}</dt>
                        <dd className="truncate font-medium" title={v}>
                          {v}
                        </dd>
                      </div>
                    ))}
                </dl>
              </div>
            </div>

            <div className="border-t border-border px-5 py-4">
              <h3 className="mb-1.5 flex items-center gap-1.5 font-head text-sm font-semibold">
                <Icon name="AlignLeft" size={15} className="text-primary" /> Описание
              </h3>
              {p.description?.trim() ? (
                <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/85">{p.description}</p>
              ) : (
                <p className="text-sm text-muted-foreground">Описание пока не добавлено.</p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-border bg-card px-5 py-3">
            <div className="text-sm">
              <span className="text-muted-foreground">В заказе: </span>
              <b>{qty > 0 ? `${qty} ${unit} · ${rub(qty * boxPrice(p))}` : "—"}</b>
            </div>
            <div className="w-[150px]">
              <QtyControl value={qty} onChange={onQty} max={p.stock} disabled={out} />
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <ImageLightbox
        open={zoom !== null}
        onOpenChange={(v) => !v && setZoom(null)}
        images={images}
        startIndex={zoom ?? 0}
        title={p.name}
        subtitle={[p.pack, `${rub(p.price)} за кг`].filter(Boolean).join(" · ")}
      />
    </>
  );
};

export default ProductInfoDialog;
