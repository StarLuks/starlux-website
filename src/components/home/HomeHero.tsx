import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { isStaff, usePortal } from "@/store/portal";
import { downloadPriceList } from "@/data/catalog";
import { toast } from "@/hooks/use-toast";

const HERO_IMG = "https://cdn.poehali.dev/projects/00ffe408-2a47-4771-a509-db88cbfc9021/files/8058a748-2660-47a6-a335-bf01c6a8a557.jpg";

type Modal = "about" | "contacts" | null;

const Logo = () => (
  <Link to="/" className="flex items-center gap-2.5">
    <span className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-ice to-primary text-white shadow-lg shadow-primary/30">
      <Icon name="Snowflake" size={20} />
    </span>
    <span className="font-head text-lg font-extrabold uppercase leading-none tracking-[0.08em] text-white">
      Стар<span className="text-ice">Люкс</span>
    </span>
  </Link>
);

const HomeHero = () => {
  const navigate = useNavigate();
  const { user, products } = usePortal();
  const [modal, setModal] = useState<Modal>(null);
  const [menu, setMenu] = useState(false);
  const cabinetHref = user ? (isStaff(user) ? "/manager" : "/cabinet") : "/login";

  const price = () => {
    if (user && products.length) {
      downloadPriceList(products);
      return;
    }
    toast({ title: "Прайс-лист доступен клиентам", description: "Войдите в кабинет, чтобы скачать актуальные цены и остатки." });
    navigate("/login");
  };

  const links = [
    { label: "О компании", onClick: () => setModal("about") },
    { label: "Контакты", onClick: () => setModal("contacts") },
    { label: "Скачать прайс-лист", onClick: price, icon: "Download" },
  ];

  return (
    <section className="relative flex min-h-screen flex-col overflow-hidden bg-[#0b1b33]">
      <img src={HERO_IMG} alt="Разгрузка продукции СтарЛюкс на складе" className="absolute inset-0 h-full w-full animate-hero-zoom object-cover" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0b1b33]/80 via-[#0b1b33]/45 to-[#0b1b33]/85" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_55%_45%_at_center,rgba(11,27,51,0.55),transparent_75%)]" />

      <header className="relative z-20 px-4 pt-5 md:px-8">
        <nav className="flex items-center justify-between gap-4 rounded-full border border-white/15 bg-white/10 py-2 pl-3 pr-2 backdrop-blur-xl">
          <Logo />
          <div className="hidden items-center gap-1 md:flex">
            {links.map((l) => (
              <button
                key={l.label}
                type="button"
                onClick={l.onClick}
                className="flex items-center gap-2 rounded-full px-5 py-2.5 font-head text-sm font-medium text-white/85 transition-colors hover:bg-white/15 hover:text-white"
              >
                {l.icon && <Icon name={l.icon} size={16} />}
                {l.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate(cabinetHref)}
              className="flex items-center gap-2 rounded-full bg-white px-5 py-2.5 font-head text-sm font-semibold text-primary shadow-lg transition-transform hover:-translate-y-0.5"
            >
              <Icon name="LogIn" size={16} />
              {user ? "Мой кабинет" : "Войти в кабинет"}
            </button>
            <button
              type="button"
              aria-label="Меню"
              onClick={() => setMenu((v) => !v)}
              className="grid h-10 w-10 place-items-center rounded-full bg-white/15 text-white md:hidden"
            >
              <Icon name={menu ? "X" : "Menu"} size={18} />
            </button>
          </div>
        </nav>
        {menu && (
          <div className="mt-2 animate-scale-in space-y-1 rounded-3xl border border-white/15 bg-[#0b1b33]/90 p-2 backdrop-blur-xl md:hidden">
            {links.map((l) => (
              <button
                key={l.label}
                type="button"
                onClick={() => {
                  setMenu(false);
                  l.onClick();
                }}
                className="flex w-full items-center gap-2 rounded-full px-5 py-3 text-left font-head text-white hover:bg-white/10"
              >
                {l.icon && <Icon name={l.icon} size={16} />}
                {l.label}
              </button>
            ))}
          </div>
        )}
      </header>

      <div className="relative z-10 flex flex-1 items-center justify-center px-6 py-16 text-center">
        <div className="max-w-5xl animate-fade-in">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 font-head text-xs font-semibold uppercase tracking-[0.25em] text-white/85 backdrop-blur">
            <Icon name="Snowflake" size={14} className="text-ice" />
            ООО «СтарЛюкс»
          </span>
          <h1 className="mt-8 font-head text-[44px] font-extrabold leading-[1] tracking-[-0.03em] text-white drop-shadow-[0_6px_40px_rgba(0,0,0,0.5)] sm:text-[68px] lg:text-[92px]">
            Качество без компромиссов.
            <br />
            <span className="bg-gradient-to-r from-ice via-white to-ice bg-clip-text text-transparent">Цены без наценок.</span>
          </h1>
        </div>
      </div>

      <Dialog open={modal !== null} onOpenChange={(v) => !v && setModal(null)}>
        <DialogContent className="max-w-lg rounded-[24px] border-0 bg-card">
          {modal === "about" ? (
            <>
              <DialogHeader>
                <DialogTitle className="font-head text-2xl font-bold">О компании</DialogTitle>
                <DialogDescription>ООО «СтарЛюкс» — оптовая торговля замороженной продукцией.</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { i: "Beef", t: "Мясные полуфабрикаты" },
                  { i: "Drumstick", t: "Курица" },
                  { i: "CakeSlice", t: "Торты" },
                  { i: "Milk", t: "Сыры" },
                ].map((c) => (
                  <div key={c.t} className="flex items-center gap-3 rounded-2xl bg-pill p-3 font-head text-sm font-semibold">
                    <Icon name={c.i} fallback="Package" size={18} className="text-primary" /> {c.t}
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                Работаем с магазинами, кафе и ресторанами по договору. Заказы принимаем через личный кабинет — сразу передаём в учётную систему и отгружаем с соблюдением холодовой цепи.
              </p>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="font-head text-2xl font-bold">Контакты</DialogTitle>
                <DialogDescription>Станьте клиентом — менеджер заключит договор и выдаст доступ в кабинет.</DialogDescription>
              </DialogHeader>
              <div className="space-y-2">
                <a href="tel:+74950000000" className="flex items-center gap-3 rounded-2xl bg-pill p-4 font-head font-semibold hover:bg-accent">
                  <Icon name="Phone" size={18} className="text-primary" /> +7 (495) 000-00-00
                </a>
                <a href="mailto:zakaz@starlux.ru" className="flex items-center gap-3 rounded-2xl bg-pill p-4 font-head font-semibold hover:bg-accent">
                  <Icon name="Mail" size={18} className="text-primary" /> zakaz@starlux.ru
                </a>
                <div className="flex items-center gap-3 rounded-2xl bg-pill p-4 text-sm">
                  <Icon name="MapPin" size={18} className="shrink-0 text-primary" /> Москва, склад-холодильник, пн–сб 7:00–20:00
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default HomeHero;
