import { useCallback, useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import TopNav from "@/components/layout/TopNav";
import OrderFilters from "@/components/order/OrderFilters";
import PriceTable from "@/components/order/PriceTable";
import OrdersList from "@/components/order/OrdersList";
import ConfirmOrderDialog from "@/components/order/ConfirmOrderDialog";
import { boxPrice, categoriesOf, downloadPriceList, rub } from "@/data/catalog";
import { Order, OrderStatus, usePortal } from "@/store/portal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { api } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import Icon from "@/components/ui/icon";

type Tab = "catalog" | "orders";

const CANCELABLE: OrderStatus[] = ["Новый", "Передан в 1С"];

const Cabinet = () => {
  const { ready, user, products, logout, lastSync, reloadCatalog } = usePortal();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("orders");
  const categories = useMemo(() => categoriesOf(products), [products]);
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");
  const [qty, setQty] = useState<Record<string, number>>({});
  const [confirm, setConfirm] = useState(false);
  const [sending, setSending] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<Order | null>(null);

  const activeCat = category || categories[0] || "";

  const loadOrders = useCallback(() => {
    api<{ orders: Order[] }>("orders")
      .then((d) => setOrders(d.orders))
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (user?.role === "client") loadOrders();
  }, [user, loadOrders]);

  const shown = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (s) return products.filter((p) => p.name.toLowerCase().includes(s));
    return products.filter((p) => p.category === activeCat);
  }, [products, activeCat, search]);

  if (!ready) return <div className="grid min-h-screen place-items-center text-muted-foreground">Загрузка…</div>;
  if (!user || user.role !== "client") return <Navigate to="/" replace state={{ login: true }} />;

  const picked = products.filter((p) => (qty[p.id] ?? 0) > 0);
  const total = picked.reduce((s, p) => s + boxPrice(p) * qty[p.id], 0);

  const submit = () => {
    if (picked.length === 0) {
      toast({ title: "Заказ пуст", description: "Укажите количество коробов хотя бы для одной позиции." });
      return;
    }
    setConfirm(true);
  };

  const confirmOrder = async (comment: string, addressId: number | null) => {
    setSending(true);
    try {
      const o = await api<{ number: string; total: number }>("create_order", {
        items: picked.map((p) => ({ productId: p.id, qty: qty[p.id] })),
        comment,
        addressId,
      });
      setConfirm(false);
      setQty({});
      setTab("orders");
      loadOrders();
      reloadCatalog();
      toast({ title: `Заказ ${o.number} принят`, description: `Сумма ${rub(o.total)}. Заказ передаётся в 1С.` });
    } catch (e) {
      toast({ title: "Не удалось отправить заказ", description: (e as Error).message });
      reloadCatalog();
    } finally {
      setSending(false);
    }
  };

  const cancelOrder = async () => {
    const o = cancelling;
    setCancelling(null);
    if (!o) return;
    try {
      await api("cancel_order", { orderId: o.id });
      toast({ title: `Заказ ${o.number} отменён`, description: "Товар возвращён на склад." });
    } catch (e) {
      toast({ title: "Не удалось отменить заказ", description: (e as Error).message });
    }
    loadOrders();
    reloadCatalog();
  };

  return (
    <main className="grid min-h-screen grid-rows-[auto_auto_1fr] gap-5 px-4 pb-6 pt-5 md:h-screen md:px-6">
      <TopNav
        items={[
          { label: "Новый заказ", active: tab === "catalog", onClick: () => setTab("catalog") },
          { label: `Мои заказы · ${orders.length}`, active: tab === "orders", onClick: () => setTab("orders") },
          { label: "Прайс ↓", onClick: () => downloadPriceList(products) },
        ]}
        right={
          <>
            <span className="pill">{user.company}</span>
            <button type="button" onClick={() => reloadCatalog()} className="pill transition-colors hover:bg-accent" title="Обновить прайс">
              1С · {lastSync}
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

      {tab === "catalog" ? (
        <>
          <div className="animate-fade-in">
            <OrderFilters
              categories={categories}
              category={activeCat}
              onCategory={(c) => {
                setCategory(c);
                setSearch("");
              }}
              count={picked.length}
              total={total}
              onSubmit={submit}
              submitLabel="Оформить заказ →"
              search={search}
              onSearch={setSearch}
            />
          </div>
          <PriceTable
            className="max-md:max-h-[70vh]"
            label={search ? `Поиск · «${search}».` : `Прайс-лист · ${activeCat}.`}
            products={shown}
            qty={qty}
            onQty={(id, v) => setQty((q) => ({ ...q, [id]: v }))}
          />
        </>
      ) : (
        <>
          <section className="grid animate-fade-in grid-cols-1 gap-5 md:grid-cols-[1.2fr_1fr_1fr]">
            <div className="tile relative flex min-h-[120px] flex-col justify-between overflow-hidden bg-gradient-to-br from-card via-card to-accent/60 p-5">
              <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-ice/25 blur-2xl" />
              <span className="relative grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-ice to-primary text-white shadow-lg shadow-primary/25">
                <Icon name="Package" size={20} />
              </span>
              <div className="relative">
                <h1 className="font-head text-2xl font-bold tracking-[-0.01em] text-foreground">Мои заказы</h1>
                <p className="mt-0.5 text-[0.75em] text-muted-foreground">Всего заказов: {orders.length}</p>
              </div>
            </div>
            <div className="tile flex flex-col justify-between p-5">
              <span className="text-[0.75em] text-muted-foreground">В работе.</span>
              <b className="font-head text-[2em] font-light">
                {orders.filter((o) => o.status !== "Доставлен" && o.status !== "Отменён").length}
              </b>
            </div>
            <button
              type="button"
              onClick={() => setTab("catalog")}
              className="flex min-h-[120px] flex-col justify-between rounded-[18px] bg-ocean px-5 py-4 text-left font-head text-ocean-foreground transition-transform hover:-translate-y-0.5"
            >
              <span>Сумма за всё время</span>
              <b className="text-[2em] font-light">{rub(orders.reduce((s, o) => s + Number(o.total), 0))}</b>
              <span className="text-[0.85em]">Сформировать новый заказ →</span>
            </button>
          </section>
          <section className="tile min-h-0 overflow-y-auto">
            <div className="tile-label">История заказов.</div>
            <OrdersList
              orders={orders}
              empty={loading ? "Загрузка…" : "Заказов пока нет — сформируйте первый"}
              actions={(o) => (
                <>
                <button
                  type="button"
                  className="pill bg-card hover:bg-accent"
                  onClick={() => {
                    setQty(
                      Object.fromEntries(
                        o.items
                          .map((i) => [i.productId, Math.min(i.qty, products.find((p) => p.id === i.productId)?.stock ?? 0)] as const)
                          .filter(([, v]) => v > 0)
                      )
                    );
                    setTab("catalog");
                    toast({ title: "Позиции добавлены", description: `Состав заказа ${o.number} перенесён в новый заказ.` });
                  }}
                >
                  Повторить заказ
                </button>
                {CANCELABLE.includes(o.status) && (
                  <button
                    type="button"
                    onClick={() => setCancelling(o)}
                    className="pill flex items-center gap-1.5 bg-card text-destructive transition-colors hover:bg-destructive hover:text-destructive-foreground"
                  >
                    <Icon name="X" size={14} />
                    Отменить заказ
                  </button>
                )}
                </>
              )}
            />
          </section>
        </>
      )}

      <AlertDialog open={!!cancelling} onOpenChange={(v) => !v && setCancelling(null)}>
        <AlertDialogContent className="rounded-[24px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-head">Отменить заказ {cancelling?.number}?</AlertDialogTitle>
            <AlertDialogDescription>
              Заказ на сумму {cancelling ? rub(cancelling.total) : ""} будет отменён, а товар вернётся на склад. Это действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Не отменять</AlertDialogCancel>
            <AlertDialogAction onClick={cancelOrder} className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Да, отменить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ConfirmOrderDialog
        open={confirm}
        onOpenChange={setConfirm}
        qty={qty}
        products={products}
        sending={sending}
        onConfirm={confirmOrder}
        onRemove={(id) => setQty((q) => ({ ...q, [id]: 0 }))}
      />
    </main>
  );
};

export default Cabinet;