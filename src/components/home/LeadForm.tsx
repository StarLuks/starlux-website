import { FormEvent, useState } from "react";
import Icon from "@/components/ui/icon";
import { api } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// eslint-disable-next-line react-refresh/only-export-components
export const BUSINESS = ["Магазин", "Кафе / ресторан", "Производство", "Другое"];

const EMPTY = { company: "", contact: "", phone: "", email: "", business: "", message: "", website: "" };

const input =
  "h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-white outline-none transition-colors placeholder:text-white/40 focus:border-ice/60 focus:bg-white/10";

const LeadForm = () => {
  const [f, setF] = useState(EMPTY);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const set = (k: keyof typeof EMPTY, v: string) => setF((p) => ({ ...p, [k]: v }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!f.contact.trim() || f.phone.replace(/\D/g, "").length < 10) {
      toast({ title: "Укажите имя и телефон", description: "Телефон — не меньше 10 цифр." });
      return;
    }
    setSending(true);
    try {
      await api("lead", f);
      setDone(true);
      setF(EMPTY);
    } catch (err) {
      toast({ title: "Не удалось отправить", description: (err as Error).message });
    } finally {
      setSending(false);
    }
  };

  if (done)
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-white/10 bg-white/5 p-10 text-center backdrop-blur-md">
        <span className="grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-ice to-primary text-white">
          <Icon name="Check" size={30} />
        </span>
        <h3 className="font-head text-2xl font-bold">Заявка отправлена!</h3>
        <p className="max-w-sm text-white/70">Менеджер свяжется с вами в течение рабочего дня, чтобы обсудить условия сотрудничества.</p>
        <button type="button" onClick={() => setDone(false)} className="mt-2 text-sm text-ice hover:underline">
          Отправить ещё одну
        </button>
      </div>
    );

  return (
    <form onSubmit={submit} className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-md md:p-8">
      <h3 className="font-head text-2xl font-bold">Стать клиентом</h3>
      <p className="mt-1 text-sm text-white/60">Оставьте контакты — пришлём прайс и условия работы.</p>

      <div className="mt-6 flex flex-wrap gap-2">
        {BUSINESS.map((b) => (
          <button
            key={b}
            type="button"
            onClick={() => set("business", f.business === b ? "" : b)}
            className={cn(
              "rounded-full border px-4 py-2 text-sm transition-colors",
              f.business === b ? "border-ice bg-ice/20 text-white" : "border-white/15 text-white/70 hover:border-white/40",
            )}
          >
            {b}
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <input className={input} placeholder="Компания" value={f.company} onChange={(e) => set("company", e.target.value)} maxLength={255} />
        <input className={input} placeholder="Ваше имя *" value={f.contact} onChange={(e) => set("contact", e.target.value)} maxLength={255} />
        <input className={input} placeholder="Телефон *" type="tel" value={f.phone} onChange={(e) => set("phone", e.target.value)} maxLength={64} />
        <input className={input} placeholder="Эл. почта" type="email" value={f.email} onChange={(e) => set("email", e.target.value)} maxLength={255} />
        <textarea
          className={cn(input, "h-24 resize-none py-3 sm:col-span-2")}
          placeholder="Что вас интересует? Объёмы, ассортимент…"
          value={f.message}
          onChange={(e) => set("message", e.target.value)}
          maxLength={2000}
        />
        <input className="hidden" tabIndex={-1} autoComplete="off" value={f.website} onChange={(e) => set("website", e.target.value)} />
      </div>

      <button
        type="submit"
        disabled={sending}
        className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-ice to-primary font-head font-semibold text-white shadow-lg shadow-primary/30 transition-transform hover:-translate-y-0.5 disabled:opacity-60"
      >
        {sending ? <Icon name="Loader2" size={18} className="animate-spin" /> : <Icon name="Send" size={18} />}
        Отправить заявку
      </button>
      <p className="mt-3 text-center text-xs text-white/40">Нажимая кнопку, вы соглашаетесь на обработку персональных данных.</p>
    </form>
  );
};

export default LeadForm;
