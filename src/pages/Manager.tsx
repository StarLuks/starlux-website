import { useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import TopNav from "@/components/layout/TopNav";
import OrdersList from "@/components/order/OrdersList";
import NewClientDialog from "@/components/manager/NewClientDialog";
import { STATUSES, OrderStatus, usePortal } from "@/store/portal";
import { downloadPriceList, rub } from "@/data/catalog";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type Tab = "orders" | "clients";

const Manager = () => {
  const { session, orders, clients, setStatus, toggleBlock, logout, lastSync, sync } = usePortal();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("orders");
  const [filter, setFilter] = useState<OrderStatus | "Все">("Все");
  const [q, setQ] = useState("");
  const [newClient, setNewClient] = useState(false);

  const clientName = (id: string) => clients.find((c) => c.id === id)?.company ?? "—";

  const filteredOrders = useMemo(() => {
    const s = q.trim().toLowerCase();
    return orders
      .filter((o) => filter === "Все" || o.status === filter)
      .filter((o) => !s || o.id.toLowerCase().includes(s) || clientName(o.clientId).toLowerCase().includes(s));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders, filter, q, clients]);

  const filteredClients = useMemo(() => {
    const s = q.trim().toLowerCase();
    return clients.filter((c) => !s || c.company.toLowerCase().includes(s) || c.inn.includes(s) || c.login.toLowerCase().includes(s));
  }, [clients, q]);

  if (!session || session.role !== "manager") return <Navigate to="/login" replace />;

  const today = new Date().toISOString().slice(0, 10);
  const todayOrders = orders.filter((o) => o.date.slice(0, 10) === today);
  const newCount = orders.filter((o) => o.status === "Новый" || o.status === "Передан в 1С").length;

  return (
    <main className="grid min-h-screen grid-rows-[auto_auto_1fr] gap-5 px-4 pb-6 pt-5 md:h-screen md:px-6">
      <TopNav
        items={[
          { label: `Заказы · ${orders.length}`, active: tab === "orders", onClick: () => setTab("orders") },
          { label: `Клиенты · ${clients.length}`, active: tab === "clients", onClick: () => setTab("clients") },
          { label: "Прайс .xlsx ↓", onClick: downloadPriceList },
        ]}
        right={
          <>
            <span className="pill">Кабинет менеджера</span>
            <button
              type="button"
              onClick={() => {
                sync();
                toast({ title: "Синхронизация с 1С", description: "Товары, цены, остатки и клиенты обновлены." });
              }}
              className="pill transition-colors hover:bg-accent"
            >
              1С · обновлено {lastSync}
            </button>
            <button
              type="button"
              onClick={() => {
                logout();
                navigate("/");
              }}
              className="pill bg-card transition-colors hover:bg-foreground hover:text-card"
            >
              Выйти
            </button>
          </>
        }
      />

      <section className="grid animate-fade-in grid-cols-1 gap-5 md:grid-cols-[1.2fr_2fr_1fr]">
        <h1 className="font-head text-[34px] font-light leading-[1.1] tracking-[-0.02em] md:text-[46px]">
          {tab === "orders" ? "Заказы" : "Клиенты"}
          <br />
          <mark className="bg-accent px-1.5">СтарЛюкс</mark>
        </h1>

        <div className="tile">
          <div className="tile-label">{tab === "orders" ? "Статус." : "Поиск."}</div>
          <div className="flex flex-wrap gap-2 px-[18px] pb-4">
            {tab === "orders" &&
              (["Все", ...STATUSES] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setFilter(s)}
                  className={cn("pill transition-colors", filter === s ? "bg-foreground text-card" : "hover:bg-accent")}
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
          <div className="flex min-h-[120px] flex-col justify-between rounded-[10px] bg-ocean px-5 py-4 font-head text-ocean-foreground">
            <span>Ждут обработки: {newCount}</span>
            <b className="text-[2em] font-light">{rub(todayOrders.reduce((s, o) => s + o.total, 0))}</b>
            <span className="text-[0.85em]">Заказы сегодня · {todayOrders.length} шт.</span>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setNewClient(true)}
            className="group flex min-h-[120px] flex-col justify-between rounded-[10px] bg-ocean px-5 py-4 text-left font-head text-ocean-foreground transition-transform hover:-translate-y-0.5"
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
              showClient={(o) => clientName(o.clientId)}
              empty="Нет заказов по выбранному фильтру"
              statusCell={(o) => (
                <select
                  value={o.status}
                  onChange={(e) => {
                    setStatus(o.id, e.target.value as OrderStatus);
                    toast({ title: `${o.id}: ${e.target.value}`, description: "Статус обновлён и передан в 1С." });
                  }}
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
              <div className="border-t border-border px-[22px] py-10 text-center text-sm text-muted-foreground">Клиенты не найдены</div>
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
                <span className="max-md:text-right">{orders.filter((o) => o.clientId === c.id).length}</span>
                <button
                  type="button"
                  onClick={() => {
                    toggleBlock(c.id);
                    toast({ title: c.blocked ? "Доступ восстановлен" : "Клиент заблокирован", description: c.company });
                  }}
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

      <NewClientDialog open={newClient} onOpenChange={setNewClient} />
    </main>
  );
};

export default Manager;
