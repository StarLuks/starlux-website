import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import LoginDialog from "@/components/auth/LoginDialog";
import Icon from "@/components/ui/icon";
import { isStaff, usePortal } from "@/store/portal";
import { api } from "@/lib/api";
import { downloadBase64 } from "@/lib/nomenclature";
import { toast } from "@/hooks/use-toast";

const HERO_IMG = "https://cdn.poehali.dev/projects/00ffe408-2a47-4771-a509-db88cbfc9021/files/8058a748-2660-47a6-a335-bf01c6a8a557.jpg";

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
  const { user, logout } = usePortal();
  const [priceBusy, setPriceBusy] = useState(false);
  const [menu, setMenu] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if ((location.state as { login?: boolean } | null)?.login) {
      setLoginOpen(true);
      navigate(".", { replace: true, state: null });
    }
  }, [location.state, navigate]);

  const openCabinet = () => {
    if (user) navigate(isStaff(user) ? "/manager" : "/cabinet");
    else setLoginOpen(true);
  };

  const price = async () => {
    if (user) {
      if (priceBusy) return;
      setPriceBusy(true);
      try {
        const d = await api<{ file: string; name: string }>("price_list&main=1");
        downloadBase64(d.file, d.name, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      } catch (e) {
        toast({ title: "Не удалось скачать прайс", description: (e as Error).message });
      } finally {
        setPriceBusy(false);
      }
      return;
    }
    toast({ title: "Прайс-лист доступен клиентам", description: "Войдите в кабинет, чтобы скачать актуальные цены и остатки." });
    setLoginOpen(true);
  };

  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  const links = [
    { label: "О компании", onClick: () => scrollTo("about") },
    { label: "Контакты", onClick: () => scrollTo("contacts") },
    { label: priceBusy ? "Формирую прайс…" : "Скачать прайс-лист", onClick: price, icon: priceBusy ? "Loader2" : "Download" },
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
            {user ? (
              <>
                <button
                  type="button"
                  onClick={openCabinet}
                  className="flex items-center gap-2.5 rounded-full bg-white py-1.5 pl-1.5 pr-5 text-primary shadow-lg transition-transform hover:-translate-y-0.5"
                >
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-primary text-primary-foreground">
                    <Icon name={isStaff(user) ? "LayoutDashboard" : "Building2"} size={15} />
                  </span>
                  <span className="text-left leading-tight">
                    <span className="block font-head text-sm font-semibold">В кабинет</span>
                    <span className="block max-w-[140px] truncate text-[11px] text-primary/70 sm:max-w-[200px]">
                      {isStaff(user) ? user.login : user.company}
                    </span>
                  </span>
                  <Icon name="ArrowRight" size={16} className="hidden sm:block" />
                </button>
                <button
                  type="button"
                  onClick={() => logout()}
                  aria-label="Выйти"
                  title="Выйти"
                  className="hidden h-10 w-10 place-items-center rounded-full bg-white/15 text-white backdrop-blur-md transition-colors hover:bg-white/25 sm:grid"
                >
                  <Icon name="LogOut" size={16} />
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={openCabinet}
                className="flex items-center gap-2 rounded-full bg-white px-5 py-2.5 font-head text-sm font-semibold text-primary shadow-lg transition-transform hover:-translate-y-0.5"
              >
                <Icon name="LogIn" size={16} />
                Войти в кабинет
              </button>
            )}
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
          <h1 className="font-head text-[45px] font-extrabold uppercase leading-[0.95] tracking-[-0.02em] text-white drop-shadow-[0_6px_40px_rgba(0,0,0,0.5)] sm:text-[77px] lg:text-[112px]">
            ООО Стар<span className="bg-gradient-to-r from-ice via-white to-ice bg-clip-text text-transparent">Люкс</span>
          </h1>
          <div className="mx-auto mt-8 h-px w-24 bg-gradient-to-r from-transparent via-ice to-transparent" />
          <p className="mt-8 font-head text-xl font-medium text-white/90 drop-shadow-[0_2px_20px_rgba(0,0,0,0.5)] md:text-3xl">
            Качество без компромиссов.
            <br />
            <span className="text-ice">Выгода в каждой поставке.</span>
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => scrollTo("about")}
        aria-label="Листать вниз"
        className="relative z-10 mx-auto mb-8 grid h-12 w-12 animate-bounce place-items-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-md hover:bg-white/20"
      >
        <Icon name="ChevronDown" size={22} />
      </button>

      <LoginDialog open={loginOpen} onOpenChange={setLoginOpen} />

    </section>
  );
};

export default HomeHero;