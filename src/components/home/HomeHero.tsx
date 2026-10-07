import { useNavigate } from "react-router-dom";
import TopNav from "@/components/layout/TopNav";
import { isStaff, usePortal } from "@/store/portal";

const HERO_IMG = "/hero-products.jpg";

const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

const HomeHero = () => {
  const navigate = useNavigate();
  const { user } = usePortal();
  const cabinetHref = user ? (isStaff(user) ? "/manager" : "/cabinet") : "/login";

  return (
    <div className="grid min-h-screen grid-rows-[auto_1fr] gap-5 px-4 pb-6 pt-5 md:px-6">
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

      <section className="relative grid min-h-[560px] place-items-center overflow-hidden">
        <img
          src={HERO_IMG}
          alt="Мясные полуфабрикаты, курица, торты и сыры СтарЛюкс"
          className="absolute inset-0 h-full w-full animate-fade-in object-cover"
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_45%_45%_at_center,hsl(var(--background)/0.85)_0%,hsl(var(--background)/0.4)_60%,transparent_100%)]" />

        <div className="relative z-10 flex max-w-4xl animate-fade-in flex-col items-center px-6 text-center">
          <span className="rounded-full bg-card/80 px-4 py-1.5 font-mono text-[0.75em] uppercase tracking-[0.2em] text-muted-foreground backdrop-blur">
            Полуфабрикаты · Курица · Торты · Сыры — оптом
          </span>
          <h1 className="mt-6 font-head text-[44px] font-semibold leading-[0.95] tracking-[-0.03em] text-foreground sm:text-[72px] md:text-[104px]">
            ООО <span className="bg-gradient-to-r from-foreground via-ocean to-foreground bg-clip-text text-transparent">СТАРЛЮКС</span>
          </h1>
          <p className="mt-6 max-w-2xl font-head text-xl font-light leading-snug text-foreground/85 md:text-[28px]">
            Вкус, которому доверяют.
            <br />
            <span className="italic">Цены, к которым</span>{" "}
            <mark className="whitespace-nowrap rounded-[6px] bg-accent px-2 not-italic text-accent-foreground">возвращаются</mark>
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => navigate(cabinetHref)}
              className="rounded-full bg-foreground px-7 py-3.5 font-head text-card transition-transform hover:-translate-y-0.5"
            >
              Сделать заказ →
            </button>
            <button
              type="button"
              onClick={() => scrollTo("contacts")}
              className="rounded-full bg-card/80 px-7 py-3.5 font-head text-foreground backdrop-blur transition-colors hover:bg-accent"
            >
              Стать клиентом
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomeHero;