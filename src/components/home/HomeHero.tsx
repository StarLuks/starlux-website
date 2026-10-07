import { useNavigate } from "react-router-dom";
import TopNav from "@/components/layout/TopNav";
import Icon from "@/components/ui/icon";
import { isStaff, usePortal } from "@/store/portal";
import { cn } from "@/lib/utils";

const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

const categories = [
  { icon: "Beef", title: "Мясные полуфабрикаты", note: "пельмени, котлеты, фарш", cls: "bg-card" },
  { icon: "Drumstick", title: "Курица", note: "тушки, филе, окорочка", cls: "bg-accent text-accent-foreground" },
  { icon: "CakeSlice", title: "Торты", note: "классика и десерты", cls: "bg-card" },
  { icon: "Milk", title: "Сыры", note: "твёрдые и полутвёрдые", cls: "bg-foreground text-card" },
];

const perks = [
  { icon: "ShieldCheck", t: "Сертифицированная продукция", d: "Документы на каждую партию" },
  { icon: "Snowflake", t: "Холод без разрывов", d: "−18 °C от склада до вашей двери" },
  { icon: "BadgePercent", t: "Цены от производителя", d: "Скидки на объём для постоянных клиентов" },
];

const HomeHero = () => {
  const navigate = useNavigate();
  const { user } = usePortal();
  const cabinetHref = user ? (isStaff(user) ? "/manager" : "/cabinet") : "/login";

  return (
    <div className="flex min-h-screen flex-col gap-5 px-4 pb-6 pt-5 md:px-6">
      <TopNav
        items={[
          { label: "О компании", onClick: () => scrollTo("about") },
          { label: "Контакты", onClick: () => scrollTo("contacts") },
        ]}
        right={
          <button
            type="button"
            onClick={() => navigate(cabinetHref)}
            className="pill bg-foreground text-card transition-opacity hover:opacity-85"
          >
            {user ? `${user.company} →` : "Войти в кабинет →"}
          </button>
        }
      />

      <section className="grid flex-1 grid-cols-1 gap-5 lg:grid-cols-[1.6fr_1fr]">
        <div className="tile relative flex animate-fade-in flex-col justify-between overflow-hidden p-7 md:p-10">
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-accent/70 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 right-1/4 h-72 w-72 rounded-full bg-ocean/20 blur-3xl" />

          <div className="relative flex flex-wrap items-center gap-2">
            <span className="pill">Оптовые поставки замороженной продукции</span>
            <span className="pill flex items-center gap-1.5">
              <span className="h-2 w-2 animate-pulse rounded-full bg-success" /> Принимаем заказы
            </span>
          </div>

          <div className="relative mt-10">
            <span className="font-mono text-[0.8em] uppercase tracking-[0.25em] text-muted-foreground">ООО</span>
            <h1 className="font-head text-[56px] font-semibold leading-[0.9] tracking-[-0.04em] sm:text-[88px] xl:text-[120px]">
              СТАР<span className="text-ocean">ЛЮКС</span>
            </h1>
            <p className="mt-6 max-w-xl font-head text-2xl font-light leading-snug md:text-[32px]">
              Качество, которое видно.
              <br />
              Цены, которые <mark className="rounded-[6px] bg-accent px-2 text-accent-foreground">радуют</mark>.
            </p>
          </div>

          <div className="relative mt-10 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => navigate(cabinetHref)}
              className="group flex items-center gap-2 rounded-full bg-foreground px-7 py-4 font-head text-card transition-transform hover:-translate-y-0.5"
            >
              Сделать заказ
              <Icon name="ArrowRight" size={18} className="transition-transform group-hover:translate-x-1" />
            </button>
            <button
              type="button"
              onClick={() => scrollTo("contacts")}
              className="rounded-full bg-pill px-7 py-4 font-head transition-colors hover:bg-accent"
            >
              Стать клиентом
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-5">
          {categories.map((c, i) => (
            <div
              key={c.title}
              style={{ animationDelay: `${120 + i * 80}ms` }}
              className={cn(
                "group flex min-h-[150px] animate-fade-in flex-col justify-between rounded-[10px] p-5 transition-transform hover:-translate-y-1",
                c.cls
              )}
            >
              <span className="grid h-11 w-11 place-items-center rounded-full bg-background/40 transition-transform group-hover:rotate-12">
                <Icon name={c.icon} fallback="Package" size={20} />
              </span>
              <div>
                <h3 className="font-head text-lg font-medium leading-tight md:text-xl">{c.title}</h3>
                <p className="mt-1 text-[0.75em] opacity-70">{c.note}</p>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() => navigate(cabinetHref)}
            style={{ animationDelay: "440ms" }}
            className="group col-span-2 flex animate-fade-in items-center justify-between rounded-[10px] bg-ocean px-6 py-5 text-left font-head text-ocean-foreground transition-transform hover:-translate-y-0.5"
          >
            <span>
              <span className="block text-[0.8em] opacity-80">Актуальный прайс-лист</span>
              <span className="text-xl">Цены и остатки онлайн</span>
            </span>
            <Icon name="ArrowUpRight" size={24} className="transition-transform group-hover:rotate-45" />
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {perks.map((p, i) => (
          <div
            key={p.t}
            style={{ animationDelay: `${500 + i * 80}ms` }}
            className="tile flex animate-fade-in items-center gap-4 p-5"
          >
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-accent text-accent-foreground">
              <Icon name={p.icon} size={20} />
            </span>
            <div>
              <h3 className="font-head font-medium">{p.t}</h3>
              <p className="text-[0.78em] text-muted-foreground">{p.d}</p>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
};

export default HomeHero;
