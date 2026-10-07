import { useCallback, useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import TopNav from "@/components/layout/TopNav";
import OrdersList from "@/components/order/OrdersList";
import NewClientDialog from "@/components/manager/NewClientDialog";
import { Client, Order, OrderStatus, STATUSES, isStaff, usePortal } from "@/store/portal";
import { downloadPriceList, rub } from "@/data/catalog";
import { api } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import Icon from "@/components/ui/icon";

type Tab = "orders" | "clients";

const Manager = () => {
  const { ready, user, products, logout, lastSync, reloadCatalog } = usePortal();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("orders");
  const [filter, setFilter] = useState<OrderStatus | "Все">("Все");
  const [q, setQ] = useState("");
  const [newClient, setNewClient] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [o, c] = await Promise.all([api<{ orders: Order[] }>("orders"), api<{ clients: Client[] }>("clients")]);
      setOrders(o.orders);
      setClients(c.clients);
    } catch (e) {
      toast({ title: "Ошибка загрузки", description: (e as Error).message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isStaff(user)) load();
  }, [user, load]);

  const filteredOrders = useMemo(() => {
    const s = q.trim().toLowerCase();
    return orders
      .filter((o) => filter === "Все" || o.status === filter)
      .filter((o) => !s || o.number.toLowerCase().includes(s) || o.clientName.toLowerCase().includes(s));
  }, [orders, filter, q]);

  const filteredClients = useMemo(() => {
    const s = q.trim().toLowerCase();
    return clients.filter((c) => !s || c.company.toLowerCase().includes(s) || c.inn.includes(s) || c.login.toLowerCase().includes(s));
  }, [clients, q]);

  if (!ready) return <div className="grid min-h-screen place-items-center text-muted-foreground">Загрузка…</div>;
  if (!isStaff(user)) return <Navigate to="/login" replace />;

  const today = new Date().toDateString();
  const todayOrders = orders.filter((o) => new Date(o.date).toDateString() === today);
  const newCount = orders.filter((o) => o.status === "Новый" || o.status === "Передан в 1С").length;

  const changeStatus = async (o: Order, status: OrderStatus) => {
    setOrders((prev) => prev.map((x) => (x.id === o.id ? { ...x, status } : x)));
    try {
      await api("set_status", { orderId: o.id, status });
      toast({
        title: `${o.number}: ${status}`,
        description:
          status === "Отменён"
            ? "Товар возвращён на остаток."
            : o.status === "Отменён"
              ? "Заказ восстановлен, товар снова списан с остатка."
              : "Статус обновлён.",
      });
      reloadCatalog();
    } catch (e) {
      toast({ title: "Не удалось сменить статус", description: (e as Error).message });
      load();
    }
  };

  const toggleBlock = async (c: Client) => {
    try {
      const r = await api<{ blocked: boolean }>("toggle_block", { id: c.id });
      setClients((prev) => prev.map((x) => (x.id === c.id ? { ...x, blocked: r.blocked } : x)));
      toast({ title: r.blocked ? "Клиент заблокирован" : "Доступ восстановлен", description: c.company });
    } catch (e) {
      toast({ title: "Ошибка", description: (e as Error).message });
    }
  };

  return (
    <main className="grid min-h-screen grid-rows-[auto_auto_1fr] gap-5 px-4 pb-6 pt-5 md:h-screen md:px-6">
      <TopNav
        items={[
          { label: `Заказы · ${orders.length}`, active: tab === "orders", onClick: () => setTab("orders") },
          { label: `Клиенты · ${clients.length}`, active: tab === "clients", onClick: () => setTab("clients") },
          { label: "Прайс ↓", onClick: () => downloadPriceList(products) },
        ]}
        right={
          <>
            <span className="pill">{user?.role === "admin" ? "Администратор" : "Менеджер"} · {user?.login}</span>
            <button
              type="button"
              onClick={() => {
                load();
                reloadCatalog();
              }}
              className="pill transition-colors hover:bg-accent"
            >
              1С · {lastSync} ↻
            </button>
            <button
              type="button"
              onClick={async () => {
                await logout();
                navigate("/");
              }}
              className="pill bg-card transition-colors hover:bg-primary hover:text-primary-foreground"
            >
              Выйти
            </button>
          </>
        }
      />

      <section className="grid animate-fade-in grid-cols-1 gap-5 md:grid-cols-[1.2fr_2fr_1fr]">
        <div className="tile relative flex min-h-[120px] flex-col justify-between overflow-hidden bg-gradient-to-br from-card via-card to-accent/60 p-5">
          <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-ice/25 blur-2xl" />
          <span className="relative grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-ice to-primary text-white shadow-lg shadow-primary/25">
            <Icon name={tab === "orders" ? "ClipboardList" : "Users"} size={20} />
          </span>
          <div className="relative">
            <h1 className="font-head text-2xl font-bold tracking-[-0.01em] text-foreground">
              {tab === "orders" ? "Заказы" : "Клиенты"}
            </h1>
            <p className="mt-0.5 text-[0.75em] text-muted-foreground">
              {tab === "orders" ? `Всего заказов: ${orders.length}` : `Всего клиентов: ${clients.length}`}
            </p>
          </div>
        </div>

        <div className="tile">
          <div className="tile-label">{tab === "orders" ? "Статус." : "Поиск."}</div>
          <div className="flex flex-wrap gap-2 px-[18px] pb-4">
            {tab === "orders" &&
              (["Все", ...STATUSES] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setFilter(s)}
                  className={cn("pill transition-colors", filter === s ? "bg-primary text-primary-foreground" : "hover:bg-accent")}
                >
                  {s}
                </button>
              ))}
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={tab === "orders" ? "№ заказа или клиент…" : "Название, ИНН или логин…"}
              className="pill min-w-[180px] flex-1 bg-background/50 outline-none placeholder:text-muted-foreground"
            />
          </div>
        </div>

        {tab === "orders" ? (
          <div className="flex min-h-[120px] flex-col justify-between rounded-[18px] bg-ocean px-5 py-4 font-head text-ocean-foreground">
            <span>Ждут обработки: {newCount}</span>
            <b className="text-[2em] font-light">{rub(todayOrders.reduce((s, o) => s + Number(o.total), 0))}</b>
            <span className="text-[0.85em]">Заказы сегодня · {todayOrders.length} шт.</span>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setNewClient(true)}
            className="group flex min-h-[120px] flex-col justify-between rounded-[18px] bg-ocean px-5 py-4 text-left font-head text-ocean-foreground transition-transform hover:-translate-y-0.5"
          >
            <span>Активных: {clients.filter((c) => !c.blocked).length} · заблок.: {clients.filter((c) => c.blocked).length}</span>
            <b className="text-[2em] font-light">+ Клиент</b>
            <span className="text-[0.85em] transition-transform group-hover:translate-x-1">Создать учётную запись →</span>
          </button>
        )}
      </section>

      <section className="tile min-h-0 overflow-y-auto">
        {tab === "orders" ? (
          <>
            <div className="tile-label">Все заказы клиентов.</div>
            <OrdersList
              orders={filteredOrders}
              showClient={(o) => o.clientName}
              empty={loading ? "Загрузка…" : "Нет заказов по выбранному фильтру"}
              statusCell={(o) => (
                <select
                  value={o.status}
                  onChange={(e) => changeStatus(o, e.target.value as OrderStatus)}
                  className="w-full cursor-pointer rounded-full bg-pill px-3 py-1 text-[0.85em] outline-none hover:bg-accent"
                >
                  {STATUSES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              )}
            />
          </>
        ) : (
          <>
            <div className="tile-label">Учётные записи клиентов.</div>
            <div className="hidden h-[34px] items-center gap-3 px-[22px] text-[0.72em] text-muted-foreground md:grid md:grid-cols-[2fr_130px_1.4fr_110px_100px_140px]">
              <span>Организация</span>
              <span>ИНН</span>
              <span>Контакт</span>
              <span>Логин</span>
              <span>Заказов</span>
              <span>Доступ</span>
            </div>
            {filteredClients.length === 0 && (
              <div className="border-t border-border px-[22px] py-10 text-center text-sm text-muted-foreground">
                {loading ? "Загрузка…" : "Клиенты не найдены"}
              </div>
            )}
            {filteredClients.map((c) => (
              <div
                key={c.id}
                className={cn(
                  "grid grid-cols-2 items-center gap-x-3 gap-y-1 border-t border-border px-4 py-3 text-[0.85em] md:min-h-12 md:grid-cols-[2fr_130px_1.4fr_110px_100px_140px] md:px-[22px] md:py-2",
                  c.blocked && "text-muted-foreground"
                )}
              >
                <span className="col-span-2 font-head md:col-span-1">
                  {c.company}
                  {c.blocked && <span className="ml-2 rounded-full bg-destructive/10 px-2 py-0.5 text-[0.8em] text-destructive">заблокирован</span>}
                </span>
                <span>{c.inn}</span>
                <span className="text-muted-foreground max-md:text-right">
                  {c.contact}
                  <span className="block text-[0.85em]">{c.phone}</span>
                </span>
                <span>{c.login}</span>
                <span className="max-md:text-right">{c.ordersCount ?? 0}</span>
                <button
                  type="button"
                  onClick={() => toggleBlock(c)}
                  className={cn(
                    "pill col-span-2 transition-colors md:col-span-1",
                    c.blocked ? "bg-accent text-accent-foreground hover:opacity-85" : "hover:bg-destructive hover:text-destructive-foreground"
                  )}
                >
                  {c.blocked ? "Разблокировать" : "Заблокировать"}
                </button>
              </div>
            ))}
          </>
        )}
      </section>

      <NewClientDialog open={newClient} onOpenChange={setNewClient} onCreated={load} />
    </main>
  );
};

export default Manager;