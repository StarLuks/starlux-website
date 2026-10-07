import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface Props {
  images: string[];
  title: string;
  subtitle?: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  startIndex?: number;
}

const ImageLightbox = ({ images, title, subtitle, open, onOpenChange, startIndex = 0 }: Props) => {
  const [i, setI] = useState(0);
  const many = images.length > 1;

  useEffect(() => {
    if (open) setI(startIndex);
  }, [open, startIndex]);

  useEffect(() => {
    if (!open || !many) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") setI((x) => (x + 1) % images.length);
      if (e.key === "ArrowLeft") setI((x) => (x - 1 + images.length) % images.length);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, many, images.length]);

  const go = (d: number) => setI((x) => (x + d + images.length) % images.length);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl gap-0 overflow-hidden rounded-[24px] border-0 bg-card p-0 [&>button]:z-20 [&>button]:grid [&>button]:h-9 [&>button]:w-9 [&>button]:place-items-center [&>button]:rounded-full [&>button]:bg-card/90 [&>button]:opacity-100 [&>button]:shadow">
        <div className="relative grid aspect-[4/3] w-full place-items-center bg-pill">
          {images[i] && (
            <img key={images[i]} src={images[i]} alt={title} className="h-full w-full animate-fade-in object-contain" />
          )}
          {many && (
            <>
              <button
                type="button"
                onClick={() => go(-1)}
                aria-label="Предыдущее фото"
                className="absolute left-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-card/90 shadow-lg transition hover:scale-105 hover:bg-card"
              >
                <Icon name="ChevronLeft" size={22} />
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                aria-label="Следующее фото"
                className="absolute right-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-card/90 shadow-lg transition hover:scale-105 hover:bg-card"
              >
                <Icon name="ChevronRight" size={22} />
              </button>
              <span className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-foreground/70 px-3 py-1 text-xs font-medium text-background">
                {i + 1} / {images.length}
              </span>
            </>
          )}
        </div>
        <div className="flex items-center gap-4 px-6 py-4">
          <div className="min-w-0 flex-1">
            <DialogTitle className="truncate font-head text-lg">{title}</DialogTitle>
            {subtitle && <DialogDescription className="text-sm">{subtitle}</DialogDescription>}
          </div>
          {many && (
            <div className="flex max-w-[50%] gap-2 overflow-x-auto">
              {images.map((src, n) => (
                <button
                  key={src}
                  type="button"
                  onClick={() => setI(n)}
                  className={cn(
                    "h-12 w-12 shrink-0 overflow-hidden rounded-lg border-2 transition",
                    n === i ? "border-primary" : "border-transparent opacity-60 hover:opacity-100"
                  )}
                >
                  <img src={src} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImageLightbox;
