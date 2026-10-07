import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { PRODUCTS, boxPrice } from "@/data/catalog";

export type Role = "client" | "manager";

export interface Client {
  id: string;
  company: string;
  inn: string;
  contact: string;
  phone: string;
  login: string;
  password: string;
  blocked: boolean;
  createdAt: string;
}

export type OrderStatus = "Новый" | "Передан в 1С" | "Собирается" | "Отгружен" | "Доставлен";

export const STATUSES: OrderStatus[] = ["Новый", "Передан в 1С", "Собирается", "Отгружен", "Доставлен"];

export interface OrderItem {
  productId: string;
  qty: number; // коробов
  sum: number;
}

export interface Order {
  id: string;
  clientId: string;
  date: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  comment?: string;
}

export interface Session {
  role: Role;
  clientId?: string;
  name: string;
}

const MANAGER = { login: "manager", password: "1234", name: "Менеджер СтарЛюкс" };

const seedClients: Client[] = [
  { id: "c1", company: "ООО «Айсберг-Маркет»", inn: "7708123456", contact: "Ирина Соколова", phone: "+7 (916) 204-11-32", login: "client", password: "1234", blocked: false, createdAt: "2025-03-12" },
  { id: "c2", company: "ИП Захаров А. В.", inn: "502911223344", contact: "Андрей Захаров", phone: "+7 (903) 771-45-08", login: "zaharov", password: "1234", blocked: false, createdAt: "2025-06-02" },
  { id: "c3", company: "ООО «Северный улов»", inn: "7814556677", contact: "Олег Мельников", phone: "+7 (921) 330-19-77", login: "sever", password: "1234", blocked: true, createdAt: "2024-11-20" },
  { id: "c4", company: "ООО «Кафе Пристань»", inn: "7725998811", contact: "Мария Белова", phone: "+7 (985) 112-60-45", login: "pristan", password: "1234", blocked: false, createdAt: "2026-01-15" },
];

const mkItems = (pairs: [string, number][]): OrderItem[] =>
  pairs.map(([productId, qty]) => {
    const p = PRODUCTS.find((x) => x.id === productId)!;
    return { productId, qty, sum: boxPrice(p) * qty };
  });

const mkOrder = (id: string, clientId: string, date: string, status: OrderStatus, pairs: [string, number][]): Order => {
  const items = mkItems(pairs);
  return { id, clientId, date, status, items, total: items.reduce((s, i) => s + i.sum, 0) };
};

const seedOrders: Order[] = [
  mkOrder("СЛ-2041", "c1", "2026-10-06T10:14:00", "Собирается", [["f1", 10], ["f3", 10], ["s1", 4]]),
  mkOrder("СЛ-2033", "c1", "2026-10-01T09:02:00", "Доставлен", [["f5", 20], ["v4", 12]]),
  mkOrder("СЛ-2018", "c1", "2026-09-24T16:40:00", "Доставлен", [["p1", 15], ["p2", 10], ["b1", 3]]),
  mkOrder("СЛ-2044", "c2", "2026-10-07T08:31:00", "Передан в 1С", [["m1", 8], ["m2", 4]]),
  mkOrder("СЛ-2039", "c4", "2026-10-05T12:05:00", "Отгружен", [["s2", 6], ["s4", 5], ["v1", 10]]),
  mkOrder("СЛ-2045", "c4", "2026-10-07T09:20:00", "Новый", [["f7", 3], ["b3", 2]]),
];

interface PortalState {
  session: Session | null;
  clients: Client[];
  orders: Order[];
  lastSync: string;
  login: (login: string, password: string) => { ok: true; role: Role } | { ok: false; error: string };
  logout: () => void;
  placeOrder: (items: OrderItem[], comment?: string) => Order;
  addClient: (c: Omit<Client, "id" | "blocked" | "createdAt">) => Client;
  toggleBlock: (id: string) => void;
  setStatus: (orderId: string, status: OrderStatus) => void;
  sync: () => void;
}

const PortalContext = createContext<PortalState | null>(null);

const KEY = "starlux-portal-v1";

function load<T>(field: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return fallback;
    const data = JSON.parse(raw);
    return data[field] ?? fallback;
  } catch {
    return fallback;
  }
}

const timeNow = () => new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });

export function PortalProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(() => load("session", null));
  const [clients, setClients] = useState<Client[]>(() => load("clients", seedClients));
  const [orders, setOrders] = useState<Order[]>(() => load("orders", seedOrders));
  const [lastSync, setLastSync] = useState<string>(timeNow);

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify({ session, clients, orders }));
  }, [session, clients, orders]);

  const login = useCallback<PortalState["login"]>(
    (l, p) => {
      const lg = l.trim().toLowerCase();
      if (lg === MANAGER.login && p === MANAGER.password) {
        setSession({ role: "manager", name: MANAGER.name });
        return { ok: true, role: "manager" };
      }
      const c = clients.find((x) => x.login.toLowerCase() === lg);
      if (!c || c.password !== p) return { ok: false, error: "Неверный логин или пароль" };
      if (c.blocked) return { ok: false, error: "Учётная запись заблокирована. Свяжитесь с менеджером" };
      setSession({ role: "client", clientId: c.id, name: c.company });
      return { ok: true, role: "client" };
    },
    [clients]
  );

  const logout = useCallback(() => setSession(null), []);

  const placeOrder = useCallback<PortalState["placeOrder"]>(
    (items, comment) => {
      const maxNum = orders.reduce((m, o) => Math.max(m, parseInt(o.id.replace(/\D/g, ""), 10) || 0), 2000);
      const order: Order = {
        id: `СЛ-${maxNum + 1}`,
        clientId: session?.clientId ?? "",
        date: new Date().toISOString(),
        items,
        total: items.reduce((s, i) => s + i.sum, 0),
        status: "Передан в 1С",
        comment,
      };
      setOrders((prev) => [order, ...prev]);
      setLastSync(timeNow());
      return order;
    },
    [orders, session]
  );

  const addClient = useCallback<PortalState["addClient"]>((c) => {
    const client: Client = { ...c, id: `c${Date.now()}`, blocked: false, createdAt: new Date().toISOString().slice(0, 10) };
    setClients((prev) => [client, ...prev]);
    return client;
  }, []);

  const toggleBlock = useCallback((id: string) => {
    setClients((prev) => prev.map((c) => (c.id === id ? { ...c, blocked: !c.blocked } : c)));
  }, []);

  const setStatus = useCallback((orderId: string, status: OrderStatus) => {
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));
  }, []);

  const sync = useCallback(() => setLastSync(timeNow()), []);

  const value = useMemo(
    () => ({ session, clients, orders, lastSync, login, logout, placeOrder, addClient, toggleBlock, setStatus, sync }),
    [session, clients, orders, lastSync, login, logout, placeOrder, addClient, toggleBlock, setStatus, sync]
  );

  return <PortalContext.Provider value={value}>{children}</PortalContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function usePortal() {
  const ctx = useContext(PortalContext);
  if (!ctx) throw new Error("usePortal must be used inside PortalProvider");
  return ctx;
}
