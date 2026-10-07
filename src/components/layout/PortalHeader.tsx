import { Link } from "react-router-dom";
import Icon from "@/components/ui/icon";
import BrandMark from "@/components/brand/BrandMark";
import { cn } from "@/lib/utils";

export interface HeaderTab {
  key: string;
  label: string;
  icon: string;
  count?: number;
  highlight?: boolean;
  active?: boolean;
  onClick: () => void;
}

interface Props {
  roleLabel: string;
  userIcon?: string;
  login: string;
  lastSync: string;
  onSync: () => void;
  onLogout: () => void;
  tabs: HeaderTab[];
}

const PortalHeader = ({ roleLabel, userIcon = "UserRound", login, lastSync, onSync, onLogout, tabs }: Props) => (
  <header className="space-y-3">
    <div className="flex flex-wrap items-center gap-2 text-[13px]">
      <span className="inline-flex items-center gap-2 whitespace-nowrap rounded-full bg-card py-1.5 pl-1.5 pr-3.5">
        <span className="grid h-6 w-6 place-items-center rounded-full bg-primary text-primary-foreground">
          <Icon name={userIcon} size={13} />
        </span>
        <span className="text-muted-foreground">{roleLabel} ·</span>
        <b className="max-w-[60vw] truncate font-semibold">{login}</b>
      </span>
      <button
        type="button"
        onClick={onSync}
        title="Обновить данные"
        className="group inline-flex items-center gap-2 whitespace-nowrap rounded-full bg-card px-3.5 py-1.5 transition-colors hover:bg-accent"
      >
        <span className="h-2 w-2 rounded-full bg-success shadow-[0_0_0_3px] shadow-success/20" />
        <span className="text-muted-foreground">1С ·</span>
        <b className="font-semibold">{lastSync}</b>
        <Icon name="RefreshCw" size={13} className="text-muted-foreground transition-transform duration-500 group-hover:rotate-180" />
      </button>
    </div>

    <div className="flex items-center gap-3">
      <nav className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto rounded-full bg-card p-1.5 [scrollbar-width:none]">
        <Link to="/" className="mr-1 flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full py-1 pl-1 pr-4 font-head text-[15px] font-extrabold uppercase tracking-[0.04em] text-primary">
          <BrandMark size={32} />
          <span>
            Стар<span className="text-[#1aa3dc]">Люкс</span>
          </span>
        </Link>
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={t.onClick}
            className={cn(
              "flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-all",
              t.active
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
          >
            <Icon name={t.icon} size={16} />
            {t.label}
            {t.count !== undefined && (
              <span
                className={cn(
                  "min-w-[22px] rounded-full px-1.5 py-0.5 text-center text-[11px] font-semibold leading-none",
                  t.active
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : t.highlight
                      ? "bg-destructive text-destructive-foreground"
                      : "bg-pill text-foreground"
                )}
              >
                {t.count}
              </span>
            )}
          </button>
        ))}
      </nav>
      <button
        type="button"
        onClick={onLogout}
        className="flex h-[52px] shrink-0 items-center gap-2 rounded-full bg-card px-5 text-sm font-medium transition-colors hover:bg-destructive hover:text-destructive-foreground"
      >
        <Icon name="LogOut" size={16} />
        <span className="hidden sm:inline">Выйти</span>
      </button>
    </div>
  </header>
);

export default PortalHeader;
