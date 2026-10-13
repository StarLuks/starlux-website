import { useState } from "react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

interface Props {
  value: number;
  onChange: (v: number) => void;
  max?: number;
  disabled?: boolean;
  weighted?: boolean;
}

const QtyControl = ({ value, onChange, max = 9999, disabled, weighted }: Props) => {
  const active = value > 0;
  const [text, setText] = useState<string | null>(null);
  const set = (v: number) => {
    setText(null);
    if (v > max) {
      toast({ title: "Больше нет в наличии", description: `Доступно для заказа: ${max}` });
    }
    onChange(Math.max(0, Math.min(max, weighted ? Math.round(v * 1000) / 1000 : v)));
  };
  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-full px-2 py-1.5 transition-colors",
        active ? "bg-accent text-accent-foreground" : "bg-pill",
        disabled && "pointer-events-none opacity-40"
      )}
    >
      <button
        type="button"
        aria-label="Уменьшить"
        onClick={() => set(Math.max(0, value - 1))}
        className="grid h-[22px] w-[22px] place-items-center rounded-full bg-card text-foreground transition-transform hover:scale-110 active:scale-95"
      >
        −
      </button>
      <input
        inputMode={weighted ? "decimal" : "numeric"}
        value={text ?? value}
        onChange={(e) => {
          if (!weighted) return set(parseInt(e.target.value.replace(/\D/g, "") || "0", 10));
          const t = e.target.value.replace(",", ".").replace(/[^\d.]/g, "");
          if (!/^\d*\.?\d{0,3}$/.test(t)) return;
          if (t.endsWith(".")) return setText(t);
          set(parseFloat(t || "0"));
        }}
        onBlur={() => setText(null)}
        onFocus={(e) => e.target.select()}
        className={cn("bg-transparent text-center outline-none", weighted ? "w-16" : "w-12")}
        aria-label="Количество коробов"
      />
      <button
        type="button"
        aria-label="Увеличить"
        onClick={() => set(value + 1)}
        disabled={value >= max}
        className="disabled:opacity-40 grid h-[22px] w-[22px] place-items-center rounded-full bg-card text-foreground transition-transform hover:scale-110 active:scale-95"
      >
        +
      </button>
    </div>
  );
};

export default QtyControl;
