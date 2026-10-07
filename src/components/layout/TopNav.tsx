import { useState, ReactNode } from "react";
import { Link } from "react-router-dom";
import Icon from "@/components/ui/icon";
import BrandMark from "@/components/brand/BrandMark";
import { cn } from "@/lib/utils";

export interface NavItem {
  label: string;
  onClick?: () => void;
  href?: string;
  active?: boolean;
}

interface Props {
  items: NavItem[];
  right?: ReactNode;
}

const TopNav = ({ items, right }: Props) => {
  const [open, setOpen] = useState(false);

  const renderItem = (it: NavItem, mobile = false) => {
    const cls = cn(
      mobile
        ? "block w-full rounded-full px-4 py-3 text-left"
        : "px-[18px] py-3 border-r border-background last:border-0",
      "transition-colors hover:bg-accent hover:text-accent-foreground",
      it.active && "bg-accent text-accent-foreground"
    );
    const handle = () => {
      setOpen(false);
      it.onClick?.();
    };
    if (it.href)
      return (
        <Link key={it.label} to={it.href} className={cls} onClick={handle}>
          {it.label}
        </Link>
      );
    return (
      <button key={it.label} type="button" className={cls} onClick={handle}>
        {it.label}
      </button>
    );
  };

  return (
    <nav className="relative flex items-center justify-between gap-3">
      <div className="flex items-center overflow-hidden rounded-full bg-card text-[0.8em]">
        <Link to="/" className="mr-1 flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full py-1 pl-1 pr-4 font-head text-[15px] font-extrabold uppercase tracking-[0.04em] text-primary">
          <BrandMark size={32} />
          <span>
            Стар<span className="text-[#1aa3dc]">Люкс</span>
          </span>
        </Link>
        <div className="hidden md:flex">{items.map((it) => renderItem(it))}</div>
      </div>

      <div className="hidden items-center gap-2.5 lg:flex">{right}</div>

      <button
        type="button"
        aria-label="Меню"
        onClick={() => setOpen((v) => !v)}
        className="grid h-11 w-11 place-items-center rounded-full bg-card lg:hidden"
      >
        <Icon name={open ? "X" : "Menu"} size={18} />
      </button>

      {open && (
        <div className="absolute right-0 top-14 z-50 w-72 animate-scale-in space-y-1 rounded-[18px] bg-card p-2 text-sm shadow-xl lg:hidden">
          <div className="md:hidden">{items.map((it) => renderItem(it, true))}</div>
          <div className="flex flex-col gap-2 p-2 [&>*]:text-left">{right}</div>
        </div>
      )}
    </nav>
  );
};

export default TopNav;
