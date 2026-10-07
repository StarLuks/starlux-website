import { cn } from "@/lib/utils";

interface Props {
  value: number;
  onChange: (v: number) => void;
  max?: number;
}

const QtyControl = ({ value, onChange, max = 9999 }: Props) => {
  const active = value > 0;
  const set = (v: number) => onChange(Math.max(0, Math.min(max, v)));
  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-full px-2 py-1.5 transition-colors",
        active ? "bg-accent text-accent-foreground" : "bg-pill"
      )}
    >
      <button
        type="button"
        aria-label="Уменьшить"
        onClick={() => set(value - 1)}
        className="grid h-[22px] w-[22px] place-items-center rounded-full bg-card text-foreground transition-transform hover:scale-110 active:scale-95"
      >
        −
      </button>
      <input
        inputMode="numeric"
        value={value}
        onChange={(e) => set(parseInt(e.target.value.replace(/\D/g, "") || "0", 10))}
        onFocus={(e) => e.target.select()}
        className="w-12 bg-transparent text-center outline-none"
        aria-label="Количество коробов"
      />
      <button
        type="button"
        aria-label="Увеличить"
        onClick={() => set(value + 1)}
        className="grid h-[22px] w-[22px] place-items-center rounded-full bg-card text-foreground transition-transform hover:scale-110 active:scale-95"
      >
        +
      </button>
    </div>
  );
};

export default QtyControl;
