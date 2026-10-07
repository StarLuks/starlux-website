import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import TopNav from "@/components/layout/TopNav";
import OrderFilters from "@/components/order/OrderFilters";
import PriceTable from "@/components/order/PriceTable";
import { Category, PRODUCTS, boxPrice, downloadPriceList } from "@/data/catalog";
import { usePortal } from "@/store/portal";
import { toast } from "@/hooks/use-toast";

const initialQty: Record<string, number> = { f1: 10, f3: 10, f5: 20, f7: 5 };

const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

const HomeHero = () => {
  const navigate = useNavigate();
  const { session, lastSync } = usePortal();
  const [category, setCategory] = useState<Category>("Рыба");
  const [qty, setQty] = useState<Record<string, number>>(initialQty);

  const products = useMemo(() => PRODUCTS.filter((p) => p.category === category), [category]);
  const picked = PRODUCTS.filter((p) => (qty[p.id] ?? 0) > 0);
  const total = picked.reduce((s, p) => s + boxPrice(p) * qty[p.id], 0);

  const cabinetHref = session ? (session.role === "manager" ? "/manager" : "/cabinet") : "/login";

  const submit = () => {
    if (!session) {
      toast({ title: "Войдите в кабинет", description: "Заказы оформляют только авторизованные клиенты СтарЛюкс." });
      navigate("/login");
      return;
    }
    navigate(cabinetHref);
  };

  return (
    <div className="grid min-h-screen grid-rows-[auto_auto_1fr] gap-5 px-4 pb-6 pt-5 md:h-screen md:min-h-[640px] md:max-h-[960px] md:px-6">
      <TopNav
        items={[
          { label: "Каталог", active: true },
          { label: "О компании", onClick: () => scrollTo("about") },
          { label: "Прайс .xlsx ↓", onClick: downloadPriceList },
          { label: "Контакты", onClick: () => scrollTo("contacts") },
        ]}
        right={
          <>
            <span className="pill">1С · обновлено {lastSync}</span>
            <button
              type="button"
              onClick={() => navigate(cabinetHref)}
              className="pill bg-foreground text-card transition-opacity hover:opacity-85"
            >
              {session ? `${session.name} →` : "Войти в кабинет →"}
            </button>
          </>
        }
      />

      <div className="animate-fade-in">
        <OrderFilters
          category={category}
          onCategory={setCategory}
          count={picked.length}
          total={total}
          onSubmit={submit}
          submitLabel={session ? "Перейти к оформлению →" : "Войти и отправить в 1С →"}
        />
      </div>

      <PriceTable
        className="animate-fade-in [animation-delay:120ms] max-md:max-h-[70vh]"
        label={`Прайс-лист · ${category}.`}
        products={products}
        qty={qty}
        onQty={(id, v) => setQty((q) => ({ ...q, [id]: v }))}
      />
    </div>
  );
};

export default HomeHero;
