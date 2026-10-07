import { ReactNode } from "react";
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogTitle } from "@/components/ui/alert-dialog";
import Icon from "@/components/ui/icon";
import { rub } from "@/data/catalog";

const ANGRY_MANAGER = "https://cdn.poehali.dev/projects/00ffe408-2a47-4771-a509-db88cbfc9021/files/67db80a0-55e0-47ad-8a3c-faabc7cea9aa.jpg";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onConfirm: () => void;
  count?: number;
  total?: number;
  title?: string;
  text?: ReactNode;
  yesLabel?: string;
  noLabel?: string;
  children?: ReactNode;
  canConfirm?: boolean;
}

const ClearOrderDialog = ({
  open,
  onOpenChange,
  onConfirm,
  count = 0,
  total = 0,
  title = "Точно очистить заказ?",
  text,
  yesLabel = "Да, очистить",
  noLabel = "Нет",
  children,
  canConfirm = true,
}: Props) => (
  <AlertDialog open={open} onOpenChange={onOpenChange}>
    <AlertDialogContent className="max-h-[92vh] w-[calc(100%-2rem)] max-w-sm gap-0 overflow-y-auto rounded-[28px] border-0 p-0 shadow-2xl">
      <div className="relative">
        <img src={ANGRY_MANAGER} alt="Недовольный менеджер по продажам" className="h-48 w-full object-cover object-[center_20%]" />
        <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-background to-transparent" />
        <span className="absolute right-4 top-4 flex items-center gap-1.5 rounded-full bg-destructive px-3 py-1 text-xs font-bold text-destructive-foreground shadow-lg">
          <Icon name="TriangleAlert" size={14} /> Внимание
        </span>
      </div>
      <div className="space-y-2 px-6 pt-3 text-center">
        <AlertDialogTitle className="font-head text-xl font-bold leading-tight">{title}</AlertDialogTitle>
        <AlertDialogDescription className="text-sm leading-relaxed text-muted-foreground">
          {text ?? (
            <>
              Ваш менеджер уже приготовил товар. Будут удалены все позиции:{" "}
              <b className="text-foreground">
                {count} поз. на {rub(total)}
              </b>
              . Отменить это действие нельзя.
            </>
          )}
        </AlertDialogDescription>
      </div>
      {children && <div className="px-6 pt-4">{children}</div>}
      <div className="grid grid-cols-2 gap-3 p-6 pt-4">
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="h-11 rounded-full bg-primary font-head text-sm font-bold text-primary-foreground shadow-md shadow-primary/25 transition hover:opacity-90"
          autoFocus
        >
          {noLabel}
        </button>
        <button
          type="button"
          disabled={!canConfirm}
          onClick={() => {
            onConfirm();
            onOpenChange(false);
          }}
          className="h-11 rounded-full bg-pill disabled:pointer-events-none disabled:opacity-50 font-head text-sm font-semibold text-foreground transition hover:bg-destructive hover:text-destructive-foreground"
        >
          {yesLabel}
        </button>
      </div>
    </AlertDialogContent>
  </AlertDialog>
);

export default ClearOrderDialog;
