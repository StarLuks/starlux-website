import { useCallback, useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import TopNav from "@/components/layout/TopNav";
import OrderFilters from "@/components/order/OrderFilters";
import PriceTable from "@/components/order/PriceTable";
import OrdersList from "@/components/order/OrdersList";
import ClearOrderDialog from "@/components/order/ClearOrderDialog";
import OrdersFilterBar, { EMPTY_FILTER, OrdersFilter } from "@/components/manager/OrdersFilterBar";
import ConfirmOrderDialog from "@/components/order/ConfirmOrderDialog";
import { boxPrice, categoriesOf, rub } from "@/data/catalog";
import { downloadBase64 } from "@/lib/nomenclature";
import { Order, OrderStatus, usePortal } from "@/store/portal";
import { api } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import Icon from "@/components/ui/icon";

type Tab = "catalog" | "orders";

const CANCELABLE: OrderStatus[] = ["Новый", "Передан в 1С"];

const ALL = "__all__";
const draftKey = (uid?: number) => `starlux_draft_${uid ?? "anon"}`;

const Cabinet = () => {
  const { ready, user, products, logout, lastSync, reloadCatalog } = usePortal();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("orders");
  const categories = useMemo(() => categoriesOf(products), [products]);
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");
  const [qty, setQty] = useState<Record<string, number>>({});
  const [draftLoaded, setDraftLoaded] = useState(false);

  useEffect(() => {
    if (!user) return;
    try {
      const raw = localStorage.getItem(draftKey(user.id));
      if (raw) {
        const d = JSON.parse(raw) as { qty?: Record<string, number>; tab?: Tab };
        if (d.qty && Object.values(d.qty).some((v) => v > 0)) {
          setQty(d.qty);
          setTab("catalog");
        }
      }
    } catch {
      localStorage.removeItem(draftKey(user.id));
    }
    setDraftLoaded(true);
  }, [user]);

  useEffect(() => {
    if (!user || !draftLoaded) return;
    const clean = Object.fromEntries(Object.entries(qty).filter(([, v]) => v > 0));
    if (Object.keys(clean).length) localStorage.setItem(draftKey(user.id), JSON.stringify({ qty: clean }));
    else localStorage.removeItem(draftKey(user.id));
  }, [qty, user, draftLoaded]);
  const [confirm, setConfirm] = useState(false);
  const [clearOpen, setClearOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<Order | null>(null);
  const [cancelReason, setCancelReason] = useState("");

  const activeCat = category || ALL;

  const [priceBusy, setPriceBusy] = useState(false);
  const [of, setOf] = useState<OrdersFilter>(EMPTY_FILTER);
  const filteredOrders = useMemo(() => {
    const s = of.q.trim().toLowerCase();
    const from = of.range?.from ? new Date(of.range.from).setHours(0, 0, 0, 0) : null;
    const to = of.range?.from ? new Date(of.range.to ?? of.range.from).setHours(23, 59, 59, 999) : null;
    return orders.filter((o) => {
      if (of.statuses.length && !of.statuses.includes(o.status)) return false;
      const t = new Date(o.date).getTime();
      if (from !== null && to !== null && (t < from || t > to)) return false;
      if (s && !o.number.toLowerCase().includes(s) && !o.items.some((it) => it.name.toLowerCase().includes(s))) return false;
      return true;
    });
  }, [orders, of]);
  const statusCounts = useMemo(() => {
    const m: Record<string, number> = {};
    orders.forEach((o) => (m[o.status] = (m[o.status] ?? 0) + 1));
    return m;
  }, [orders]);
  const downloadPrice = async () => {
    if (priceBusy) return;
    setPriceBusy(true);
    try {
      const d = await api<{ file: string; name: string }>("price_list");
      downloadBase64(d.file, d.name, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    } catch (e) {
      toast({ title: "Не удалось скачать прайс", description: (e as Error).message });
    } finally {
      setPriceBusy(false);
    }
  };

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
    if (activeCat === ALL) {
      const order = new Map(categories.map((c, i) => [c, i]));
      return [...products].sort((a, b) => (order.get(a.category) ?? 0) - (order.get(b.category) ?? 0));
    }
    return products.filter((p) => p.category === activeCat);
  }, [products, activeCat, search, categories]);

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
      await api("cancel_order", { orderId: o.id, reason: cancelReason.trim() });
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
          { label: priceBusy ? "Формирую прайс…" : "Прайс ↓", onClick: downloadPrice },
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
          <div className="sticky top-0 z-30 -mx-4 -mt-2 animate-fade-in bg-background/85 px-4 py-2 backdrop-blur-md md:-mx-6 md:px-6">
            <OrderFilters
              categories={[ALL, ...categories]}
              categoryLabel={(c) => (c === ALL ? "Все группы" : c)}
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
              onClear={() => {
                if (picked.length) setClearOpen(true);
              }}
            />
          </div>
          <PriceTable
            className="max-md:max-h-[70vh]"
            label={search ? `Поиск · «${search}».` : `Прайс-лист · ${activeCat === ALL ? "все группы" : activeCat}.`}
            products={shown}
            grouped={!search.trim() && activeCat === ALL}
            qty={qty}
            onQty={(id, v) => setQty((q) => ({ ...q, [id]: v }))}
          />
        </>
      ) : (
        <>
          <section className="grid animate-fade-in grid-cols-1 gap-5 md:grid-cols-[1.2fr_1fr_1fr]">
            <div className="tile relative flex items-center gap-3 overflow-hidden bg-gradient-to-br from-card via-card to-accent/60 px-5 py-3">
              <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-ice/25 blur-2xl" />
              <span className="relative grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-ice to-primary text-white shadow-lg shadow-primary/25">
                <Icon name="Package" size={20} />
              </span>
              <div className="relative">
                <h1 className="font-head text-xl font-bold tracking-[-0.01em] text-foreground">Мои заказы</h1>
                <p className="mt-0.5 text-[0.75em] text-muted-foreground">Всего заказов: {orders.length}</p>
              </div>
            </div>
            <div className="tile flex items-center justify-between gap-3 px-5 py-3">
              <span className="text-[0.75em] text-muted-foreground">В работе.</span>
              <b className="font-head text-[1.6em] font-light leading-none">
                {orders.filter((o) => o.status !== "Доставлен" && o.status !== "Отменён").length}
              </b>
            </div>
            <button
              type="button"
              onClick={() => setTab("catalog")}
              className="flex items-center justify-between gap-3 rounded-[18px] bg-ocean px-5 py-3 text-left font-head text-ocean-foreground transition-transform hover:-translate-y-0.5"
            >
              <span className="flex flex-col">
                <span className="text-[0.8em] opacity-90">Сумма за всё время</span>
                <span className="text-[0.75em] opacity-75">Новый заказ →</span>
              </span>
              <b className="whitespace-nowrap text-[1.5em] font-light leading-none">{rub(orders.reduce((s, o) => s + Number(o.total), 0))}</b>
            </button>
          </section>
          <section className="tile min-h-0 overflow-y-auto">
            <div className="tile-label">История заказов.</div>
            <OrdersFilterBar
              value={of}
              onChange={setOf}
              counts={statusCounts}
              placeholder="№ заказа или название товара…"
            />
            <OrdersList
              orders={filteredOrders}
              detailed
              highlight={of.q}
              empty={
                loading
                  ? "Загрузка…"
                  : orders.length
                    ? "По выбранным условиям заказов нет"
                    : "Заказов пока нет — сформируйте первый"
              }
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
                    onClick={() => {
                      setCancelReason("");
                      setCancelling(o);
                    }}
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

      <ClearOrderDialog
        open={!!cancelling}
        onOpenChange={(v) => !v && setCancelling(null)}
        onConfirm={cancelOrder}
        title={`Отменить заказ ${cancelling?.number ?? ""}?`}
        text={
          <>
            Менеджер уже взял заказ в работу. Заказ на сумму{" "}
            <b className="text-foreground">{cancelling ? rub(cancelling.total) : ""}</b> будет отменён, а товар вернётся на склад.
            Отменить это действие нельзя.
          </>
        }
        noLabel="Не отменять"
        yesLabel="Да, отменить"
        canConfirm={cancelReason.trim().length > 0}
      >
        <label className="block text-left">
          <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
            Причина отмены <span className="text-destructive">*</span>
          </span>
          <textarea
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            rows={3}
            maxLength={1000}
            placeholder="Например: ошиблись с количеством, изменились планы…"
            className="w-full resize-none rounded-xl border border-border bg-pill px-3.5 py-2.5 text-sm outline-none transition focus:border-ring focus:bg-card focus:ring-4 focus:ring-ring/15"
          />
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {["Ошиблись в заказе", "Изменились планы", "Нашли дешевле", "Долгая доставка"].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setCancelReason(r)}
                className="rounded-full bg-pill px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition hover:bg-accent hover:text-foreground"
              >
                {r}
              </button>
            ))}
          </div>
        </label>
      </ClearOrderDialog>

      <ClearOrderDialog
        open={clearOpen}
        onOpenChange={setClearOpen}
        onConfirm={() => setQty({})}
        count={picked.length}
        total={total}
      />
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