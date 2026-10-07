import { useNavigate } from "react-router-dom";
import TopNav from "@/components/layout/TopNav";
import { isStaff, usePortal } from "@/store/portal";

const HERO_IMG = "https://cdn.poehali.dev/projects/00ffe408-2a47-4771-a509-db88cbfc9021/files/1446cb2f-f8fe-4da5-a20a-ca051f900022.jpg";

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

      <section className="relative grid min-h-[520px] place-items-center overflow-hidden rounded-[10px] bg-foreground">
        <img
          src={HERO_IMG}
          alt="Замороженная продукция СтарЛюкс"
          className="absolute inset-0 h-full w-full animate-hero-zoom object-cover"
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.55)_0%,rgba(0,0,0,0.25)_60%,rgba(0,0,0,0.45)_100%)]" />

        <div className="relative z-10 flex max-w-4xl animate-fade-in flex-col items-center px-6 text-center text-white">
          <span className="rounded-full border border-white/40 px-4 py-1.5 font-mono text-[0.75em] uppercase tracking-[0.2em] text-white/85">
            Оптовая торговля замороженной продукцией
          </span>
          <h1 className="mt-6 font-head text-[44px] font-semibold leading-[0.95] tracking-[-0.03em] drop-shadow-[0_4px_30px_rgba(0,0,0,0.45)] sm:text-[72px] md:text-[104px]">
            ООО <span className="bg-gradient-to-r from-[#fbf8a0] via-white to-[#a8d8ff] bg-clip-text text-transparent">СТАРЛЮКС</span>
          </h1>
          <p className="mt-6 max-w-2xl font-head text-lg font-light text-white/90 md:text-2xl">
            Свежесть, сохранённая холодом. <mark className="whitespace-nowrap bg-accent px-1.5 text-accent-foreground">Поставки без перебоев</mark>
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => navigate(cabinetHref)}
              className="rounded-full bg-accent px-7 py-3.5 font-head text-accent-foreground transition-transform hover:-translate-y-0.5"
            >
              Сделать заказ →
            </button>
            <button
              type="button"
              onClick={() => scrollTo("contacts")}
              className="rounded-full border border-white/50 px-7 py-3.5 font-head text-white transition-colors hover:bg-white/10"
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