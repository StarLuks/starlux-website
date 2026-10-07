import Icon from "@/components/ui/icon";

const STATS = [
  { v: "−18°C", t: "температура хранения на складе" },
  { v: "500+", t: "позиций в ассортименте" },
  { v: "24 ч", t: "от заказа до отгрузки" },
  { v: "100%", t: "продукции с ветеринарными документами" },
];

const CATEGORIES = [
  { i: "Beef", t: "Мясные полуфабрикаты", d: "Пельмени, котлеты, фарш, стейки" },
  { i: "Drumstick", t: "Курица", d: "Тушки, филе, крылья, окорочка" },
  { i: "CakeSlice", t: "Торты и десерты", d: "Шоковая заморозка, бережная логистика" },
  { i: "Milk", t: "Сыры", d: "Твёрдые, полутвёрдые, для HoReCa" },
];

const FEATURES = [
  { i: "Snowflake", t: "Непрерывная холодовая цепь", d: "Рефрижераторы с контролем температуры от склада до вашей двери." },
  { i: "MonitorSmartphone", t: "Заказ в личном кабинете", d: "Актуальные цены и остатки онлайн — заказ сразу уходит в учёт." },
  { i: "BadgePercent", t: "Индивидуальные цены", d: "Персональный прайс под объём и формат вашего бизнеса." },
  { i: "ShieldCheck", t: "Прозрачные документы", d: "Меркурий, сертификаты и ЭДО без задержек." },
];

const AboutSection = () => (
  <section id="about" className="relative scroll-mt-6 overflow-hidden bg-background px-6 py-20 md:py-28">
    <div className="pointer-events-none absolute -left-40 top-10 h-96 w-96 rounded-full bg-ice/20 blur-3xl" />
    <div className="pointer-events-none absolute -right-40 bottom-0 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />

    <div className="relative mx-auto max-w-6xl">
      <div className="grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:items-end">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 font-head text-xs font-semibold uppercase tracking-[0.15em] text-primary">
            <Icon name="Snowflake" size={14} /> О компании
          </span>
          <h2 className="mt-5 font-head text-4xl font-extrabold leading-[1.05] tracking-[-0.02em] text-foreground md:text-6xl">
            Холод, которому <span className="text-primary">доверяют</span>
          </h2>
        </div>
        <div className="space-y-4 text-base leading-relaxed text-muted-foreground md:text-lg">
          <p>
            «СтарЛюкс» — оптовый поставщик замороженной продукции для магазинов, кафе, ресторанов и производств. Мы знаем: в нашем деле
            качество решают градусы, поэтому каждая партия хранится и едет к вам при стабильных −18°C.
          </p>
          <p>
            Отбираем производителей лично, работаем по договору и держим цены честными. Вы сосредоточены на своём бизнесе — мы
            заботимся о том, чтобы витрина и кухня никогда не пустели.
          </p>
        </div>
      </div>

      <div className="mt-14 grid grid-cols-2 gap-4 md:grid-cols-4">
        {STATS.map((s) => (
          <div key={s.t} className="rounded-3xl bg-gradient-to-br from-ocean to-primary p-6 text-white shadow-xl shadow-primary/20">
            <div className="font-head text-3xl font-extrabold md:text-4xl">{s.v}</div>
            <div className="mt-2 text-sm text-white/75">{s.t}</div>
          </div>
        ))}
      </div>

      <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {CATEGORIES.map((c) => (
          <div key={c.t} className="group rounded-3xl border border-border bg-card p-6 transition-all hover:-translate-y-1 hover:shadow-xl">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-ice to-primary text-white transition-transform group-hover:scale-110">
              <Icon name={c.i} fallback="Package" size={22} />
            </span>
            <h3 className="mt-5 font-head text-lg font-bold text-foreground">{c.t}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{c.d}</p>
          </div>
        ))}
      </div>

      <div className="mt-14 grid gap-x-10 gap-y-8 md:grid-cols-2">
        {FEATURES.map((f) => (
          <div key={f.t} className="flex gap-4">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
              <Icon name={f.i} fallback="Check" size={20} />
            </span>
            <div>
              <h3 className="font-head text-lg font-bold text-foreground">{f.t}</h3>
              <p className="mt-1 text-muted-foreground">{f.d}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default AboutSection;
