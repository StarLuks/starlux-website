import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { isStaff, usePortal } from "@/store/portal";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

const LoginDialog = ({ open, onOpenChange }: Props) => {
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
      onOpenChange(false);
      setForm({ login: "", password: "" });
      navigate(isStaff(u) ? "/manager" : "/cabinet");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) setError("");
      }}
    >
      <DialogContent className="max-w-[420px] overflow-hidden rounded-[28px] border-0 bg-card p-0 shadow-2xl [&>button]:z-10 [&>button]:text-white [&>button]:opacity-80 hover:[&>button]:opacity-100">
        <div className="relative overflow-hidden bg-gradient-to-br from-primary via-[#1d4f9c] to-ice px-8 pb-10 pt-9 text-white">
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/15 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-10 h-40 w-40 rounded-full bg-ice/40 blur-3xl" />
          <Icon name="Snowflake" size={120} className="pointer-events-none absolute -right-6 bottom-[-30px] text-white/10" />
          <span className="relative grid h-12 w-12 place-items-center rounded-2xl bg-white/15 backdrop-blur">
            <Icon name="LockKeyhole" size={22} />
          </span>
          <DialogTitle className="relative mt-5 font-head text-2xl font-bold">Вход в кабинет</DialogTitle>
          <DialogDescription className="relative mt-1 text-sm text-white/75">
            Заказы, прайс-лист и статусы — для клиентов СтарЛюкс
          </DialogDescription>
        </div>

        <form onSubmit={submit} className="-mt-5 space-y-4 rounded-t-[24px] bg-card px-8 pb-8 pt-7">
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-muted-foreground">Логин</span>
            <div className="relative">
              <Icon name="User" size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                autoFocus
                value={form.login}
                onChange={(e) => setForm({ ...form, login: e.target.value })}
                className="h-12 w-full rounded-2xl border border-border bg-pill pl-11 pr-4 outline-none transition focus:border-ring focus:bg-card focus:ring-4 focus:ring-ring/15"
                placeholder="Ваш логин"
                autoComplete="username"
              />
            </div>
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-muted-foreground">Пароль</span>
            <div className="relative">
              <Icon name="KeyRound" size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type={show ? "text" : "password"}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="h-12 w-full rounded-2xl border border-border bg-pill pl-11 pr-12 outline-none transition focus:border-ring focus:bg-card focus:ring-4 focus:ring-ring/15"
                placeholder="••••••"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShow((v) => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Показать пароль"
              >
                <Icon name={show ? "EyeOff" : "Eye"} size={18} />
              </button>
            </div>
          </label>

          {error && (
            <p className="flex animate-fade-in items-start gap-2 rounded-2xl bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
              <Icon name="CircleAlert" size={16} className="mt-0.5 shrink-0" />
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary font-head font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition hover:-translate-y-0.5 hover:shadow-xl disabled:translate-y-0 disabled:opacity-60"
          >
            {loading ? (
              <>
                <Icon name="Loader2" size={18} className="animate-spin" /> Входим…
              </>
            ) : (
              <>
                Войти <Icon name="ArrowRight" size={18} />
              </>
            )}
          </button>

          <p className="text-center text-xs text-muted-foreground">
            Нет доступа? Логин и пароль выдаёт ваш менеджер
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default LoginDialog;