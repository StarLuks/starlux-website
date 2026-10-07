import { useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import TopNav from "@/components/layout/TopNav";
import OrderFilters from "@/components/order/OrderFilters";
import PriceTable from "@/components/order/PriceTable";
import OrdersList from "@/components/order/OrdersList";
import ConfirmOrderDialog from "@/components/order/ConfirmOrderDialog";
import { Category, PRODUCTS, boxPrice, downloadPriceList, rub } from "@/data/catalog";
import { usePortal } from "@/store/portal";
import { toast } from "@/hooks/use-toast";

type Tab = "catalog" | "orders";

const Cabinet = () => {
  const { session, clients, orders, placeOrder, logout, lastSync, sync } = usePortal();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("catalog");
  const [category, setCategory] = useState<Category>("Рыба");
  const [search, setSearch] = useState("");
  const [qty, setQty] = useState<Record<string, number>>({});
  const [confirm, setConfirm] = useState(false);

  const products = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (s) return PRODUCTS.filter((p) => p.name.toLowerCase().includes(s));
    return PRODUCTS.filter((p) => p.category === category);
  }, [category, search]);

  if (!session || session.role !== "client") return <Navigate to="/login" replace />;

  const client = clients.find((c) => c.id === session.clientId);
  const myOrders = orders.filter((o) => o.clientId === session.clientId);
  const picked = PRODUCTS.filter((p) => (qty[p.id] ?? 0) > 0);
  const total = picked.reduce((s, p) => s + boxPrice(p) * qty[p.id], 0);

  const submit = () => {
    if (picked.length === 0) {
      toast({ title: "Заказ пуст", description: "Укажите количество коробов хотя бы для одной позиции." });
      return;
    }
    setConfirm(true);
  };

  const confirmOrder = (comment: string) => {
    const items = picked.map((p) => ({ productId: p.id, qty: qty[p.id], sum: boxPrice(p) * qty[p.id] }));
    const o = placeOrder(items, comment || undefined);
    setConfirm(false);
    setQty({});
    setTab("orders");
    toast({ title: `Заказ ${o.id} отправлен в 1С`, description: `Сумма ${rub(o.total)}. Статус обновится автоматически.` });
  };

  return (
    <main className="grid min-h-screen grid-rows-[auto_auto_1fr] gap-5 px-4 pb-6 pt-5 md:h-screen md:px-6">
      <TopNav
        items={[
          { label: "Каталог", active: tab === "catalog", onClick: () => setTab("catalog") },
          { label: `Мои заказы · ${myOrders.length}`, active: tab === "orders", onClick: () => setTab("orders") },
          { label: "Прайс .xlsx ↓", onClick: downloadPriceList },
        ]}
        right={
          <>
            <span className="pill">
              {client?.company} · ИНН {client?.inn.slice(0, 4)}…
            </span>
            <button type="button" onClick={sync} className="pill transition-colors hover:bg-accent" title="Обновить данные из 1С">
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

      {tab === "catalog" ? (
        <>
          <div className="animate-fade-in">
            <OrderFilters
              category={category}
              onCategory={(c) => {
                setCategory(c);
                setSearch("");
              }}
              count={picked.length}
              total={total}
              onSubmit={submit}
              search={search}
              onSearch={setSearch}
            />
          </div>
          <PriceTable
            className="max-md:max-h-[70vh]"
            label={search ? `Поиск · «${search}».` : `Прайс-лист · ${category}.`}
            products={products}
            qty={qty}
            onQty={(id, v) => setQty((q) => ({ ...q, [id]: v }))}
          />
        </>
      ) : (
        <>
          <section className="grid animate-fade-in grid-cols-1 gap-5 md:grid-cols-[1.2fr_1fr_1fr]">
            <h1 className="font-head text-[34px] font-light leading-[1.1] tracking-[-0.02em] md:text-[46px]">
              Мои заказы
              <br />
              <mark className="bg-accent px-1.5">{myOrders.length} шт.</mark>
            </h1>
            <div className="tile flex flex-col justify-between p-5">
              <span className="text-[0.75em] text-muted-foreground">В работе.</span>
              <b className="font-head text-[2em] font-light">
                {myOrders.filter((o) => o.status !== "Доставлен").length}
              </b>
            </div>
            <button
              type="button"
              onClick={() => setTab("catalog")}
              className="flex min-h-[120px] flex-col justify-between rounded-[10px] bg-ocean px-5 py-4 text-left font-head text-ocean-foreground transition-transform hover:-translate-y-0.5"
            >
              <span>Сумма за всё время</span>
              <b className="text-[2em] font-light">{rub(myOrders.reduce((s, o) => s + o.total, 0))}</b>
              <span className="text-[0.85em]">Сформировать новый заказ →</span>
            </button>
          </section>
          <section className="tile min-h-0 overflow-y-auto">
            <div className="tile-label">История заказов.</div>
            <OrdersList
              orders={myOrders}
              actions={(o) => (
                <button
                  type="button"
                  className="pill bg-card hover:bg-accent"
                  onClick={() => {
                    setQty(Object.fromEntries(o.items.map((i) => [i.productId, i.qty])));
                    setTab("catalog");
                    toast({ title: "Позиции добавлены", description: `Состав заказа ${o.id} перенесён в новый заказ.` });
                  }}
                >
                  Повторить заказ
                </button>
              )}
            />
          </section>
        </>
      )}

      <ConfirmOrderDialog
        open={confirm}
        onOpenChange={setConfirm}
        qty={qty}
        onConfirm={confirmOrder}
        onRemove={(id) => setQty((q) => ({ ...q, [id]: 0 }))}
      />
    </main>
  );
};

export default Cabinet;
