import Icon from "@/components/ui/icon";
import { COMPANY, mapSrc } from "@/data/company";
import LeadForm from "@/components/home/LeadForm";

const ITEMS = [
  { i: "Phone", l: "Телефон", v: COMPANY.phone, href: COMPANY.phoneHref },
  { i: "Mail", l: "Электронная почта", v: COMPANY.email, href: `mailto:${COMPANY.email}` },
  { i: "MapPin", l: "Адрес склада", v: COMPANY.address },
  { i: "Clock", l: "Режим работы", v: COMPANY.hours },
];

const ContactsSection = () => (
  <section id="contacts" className="relative scroll-mt-6 overflow-hidden bg-[#0b1b33] px-6 py-20 text-white md:py-28">
    <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-ice/20 blur-3xl" />

    <div className="relative mx-auto max-w-6xl">
      <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 font-head text-xs font-semibold uppercase tracking-[0.15em] text-ice">
        <Icon name="MessageCircle" size={14} /> Контакты
      </span>
      <h2 className="mt-5 max-w-3xl font-head text-4xl font-extrabold leading-[1.05] tracking-[-0.02em] md:text-6xl">
        Станьте нашим <span className="text-ice">партнёром</span>
      </h2>
      <p className="mt-5 max-w-2xl text-lg text-white/70">
        Позвоните или напишите — менеджер подберёт ассортимент, заключит договор и выдаст доступ в личный кабинет для заказов.
      </p>

      <div className="mt-12 grid gap-6 lg:grid-cols-[1fr_1.3fr]">
        <div className="grid content-start gap-3">
          {ITEMS.map((c) => {
            const body = (
              <>
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-ice to-primary text-white">
                  <Icon name={c.i} size={20} />
                </span>
                <span>
                  <span className="block text-xs uppercase tracking-wider text-white/50">{c.l}</span>
                  <span className="mt-0.5 block font-head text-lg font-semibold">{c.v}</span>
                </span>
              </>
            );
            const cls = "flex items-center gap-4 rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-md transition-colors";
            return c.href ? (
              <a key={c.l} href={c.href} className={`${cls} hover:border-ice/40 hover:bg-white/10`}>
                {body}
              </a>
            ) : (
              <div key={c.l} className={cls}>
                {body}
              </div>
            );
          })}
        </div>

        <LeadForm />
      </div>

      <div className="mt-6 h-[400px] overflow-hidden rounded-3xl border border-white/10 bg-white/5">
        <iframe title="Карта проезда" src={mapSrc(COMPANY.address)} className="h-full w-full" loading="lazy" allowFullScreen />
      </div>
    </div>
  </section>
);

export default ContactsSection;
