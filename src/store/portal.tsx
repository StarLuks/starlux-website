import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { Product } from "@/data/catalog";
import { api, getToken, setToken } from "@/lib/api";

export type Role = "client" | "manager" | "admin";

export interface User {
  id: number;
  role: Role;
  login: string;
  company: string;
  inn: string;
  contact: string;
  phone: string;
  blocked: boolean;
  createdAt: string;
  ordersCount?: number;
}

export type Client = User;

export type OrderStatus = "Новый" | "Передан в 1С" | "Собирается" | "Отгружен" | "Доставлен" | "Отменён";

export const STATUSES: OrderStatus[] = ["Новый", "Передан в 1С", "Собирается", "Отгружен", "Доставлен", "Отменён"];

export interface OrderItem {
  productId: string;
  name: string;
  qty: number;
  boxPrice: number;
  sum: number;
}

export interface Order {
  id: number;
  number: string;
  clientId: number;
  clientName: string;
  date: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  comment?: string;
}

export const isStaff = (u: User | null) => !!u && (u.role === "manager" || u.role === "admin");

interface PortalState {
  ready: boolean;
  user: User | null;
  products: Product[];
  lastSync: string;
  login: (login: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  reloadCatalog: () => Promise<void>;
}

const PortalContext = createContext<PortalState | null>(null);

const fmtSync = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—";

export function PortalProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [lastSync, setLastSync] = useState("—");

  const reloadCatalog = useCallback(async () => {
    const d = await api<{ products: Product[]; lastSync: string }>("catalog");
    setProducts(d.products);
    setLastSync(fmtSync(d.lastSync));
  }, []);

  useEffect(() => {
    if (!getToken()) {
      setReady(true);
      return;
    }
    api<{ user: User }>("me")
      .then((d) => {
        setUser(d.user);
        return reloadCatalog();
      })
      .catch(() => setToken(null))
      .finally(() => setReady(true));
  }, [reloadCatalog]);

  const login = useCallback(async (l: string, p: string) => {
    const d = await api<{ token: string; user: User }>("login", { login: l, password: p });
    setToken(d.token);
    setUser(d.user);
    await reloadCatalog().catch(() => undefined);
    return d.user;
  }, [reloadCatalog]);

  const logout = useCallback(async () => {
    await api("logout", {}).catch(() => undefined);
    setToken(null);
    setUser(null);
    setProducts([]);
  }, []);

  const value = useMemo(
    () => ({ ready, user, products, lastSync, login, logout, reloadCatalog }),
    [ready, user, products, lastSync, login, logout, reloadCatalog]
  );

  return <PortalContext.Provider value={value}>{children}</PortalContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function usePortal() {
  const ctx = useContext(PortalContext);
  if (!ctx) throw new Error("usePortal must be used inside PortalProvider");
  return ctx;
}
