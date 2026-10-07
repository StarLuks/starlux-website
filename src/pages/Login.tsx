import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { isStaff, usePortal } from "@/store/portal";

const Login = () => {
  const { login } = usePortal();
  const navigate = useNavigate();
  const [form, setForm] = useState({ login: "", password: "" });
  const [error, setError] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.login.trim() || !form.password) {
      setError("Введите логин и пароль");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const u = await login(form.login, form.password);
      navigate(isStaff(u) ? "/manager" : "/cabinet");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="grid min-h-screen grid-rows-[auto_1fr] gap-5 px-4 pb-6 pt-5 md:px-6">
      <nav className="flex items-center justify-between">
        <Link to="/" className="rounded-full bg-card px-[18px] py-3 font-head text-[0.9em] font-medium">
          ★ СтарЛюкс
        </Link>
        <Link to="/" className="pill bg-card">← На главную</Link>
      </nav>

      <div className="grid gap-5 md:grid-cols-[1.2fr_1fr]">
        <div className="tile hidden flex-col justify-between p-8 md:flex">
          <span className="text-[0.75em] text-muted-foreground">Кабинет клиента.</span>
          <h1 className="font-head text-[46px] font-light leading-[1.1] tracking-[-0.02em]">
            Заказы, прайс
            <br />и статусы — <mark className="bg-accent px-1.5">в одном окне</mark>
          </h1>
          <div className="grid grid-cols-3 gap-3 text-[0.8em]">
            <span className="pill text-center">Прайс из 1С</span>
            <span className="pill text-center">История заказов</span>
            <span className="pill text-center">Статусы онлайн</span>
          </div>
        </div>

        <form onSubmit={submit} className="tile flex animate-fade-in flex-col justify-center gap-4 p-6 md:p-10">
          <div>
            <span className="text-[0.75em] text-muted-foreground">Вход.</span>
            <h2 className="mt-2 font-head text-3xl font-light">Войдите в кабинет</h2>
          </div>

          <label className="space-y-1.5">
            <span className="text-[0.75em] text-muted-foreground">Логин</span>
            <input
              value={form.login}
              onChange={(e) => setForm({ ...form, login: e.target.value })}
              className="w-full rounded-full bg-pill px-5 py-3 outline-none ring-ocean focus:ring-2"
              placeholder="Ваш логин"
              autoComplete="username"
            />
          </label>
          <label className="space-y-1.5">
            <span className="text-[0.75em] text-muted-foreground">Пароль</span>
            <div className="relative">
              <input
                type={show ? "text" : "password"}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full rounded-full bg-pill px-5 py-3 pr-12 outline-none ring-ocean focus:ring-2"
                placeholder="••••"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShow((v) => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                aria-label="Показать пароль"
              >
                <Icon name={show ? "EyeOff" : "Eye"} size={18} />
              </button>
            </div>
          </label>

          {error && <p className="animate-fade-in rounded-[10px] bg-destructive/10 px-4 py-2 text-sm text-destructive">{error}</p>}

          <button type="submit" disabled={loading} className="disabled:opacity-60 rounded-full bg-ocean px-5 py-3 font-head text-ocean-foreground transition-opacity hover:opacity-90">
            {loading ? "Входим…" : "Войти →"}
          </button>

        </form>
      </div>
    </main>
  );
};

export default Login;
