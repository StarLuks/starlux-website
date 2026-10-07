import Icon from "@/components/ui/icon";

const facts = [
  { n: "1 200+", t: "позиций в прайсе" },
  { n: "24 ч", t: "от заказа до отгрузки" },
  { n: "−18 °C", t: "цепочка холода без разрывов" },
  { n: "от 30 000 ₽", t: "минимальный заказ" },
];

const steps = [
  { icon: "KeyRound", t: "Менеджер выдаёт логин", d: "Доступ к кабинету — только для клиентов по договору." },
  { icon: "ListChecks", t: "Набираете позиции", d: "Прайс строками: фасовка, цена и количество в одной строке." },
  { icon: "RefreshCw", t: "Заказ уходит в 1С", d: "Сразу после отправки — без звонков и пересылки файлов." },
  { icon: "Truck", t: "Следите за статусом", d: "Принят, собирается, отгружен — всё видно в кабинете." },
];

const AboutBento = () => {
  return (
    <section id="about" className="scroll-mt-4 px-4 pb-5 md:px-6">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-4">
        <div className="tile flex flex-col justify-between p-6 md:col-span-2 md:row-span-2">
          <span className="text-[0.75em] text-muted-foreground">О компании.</span>
          <h2 className="mt-6 font-head text-[30px] font-light leading-[1.1] tracking-[-0.02em] md:text-[40px]">
            ООО «СтарЛюкс» — оптовые поставки <mark className="bg-accent px-1.5">замороженной продукции</mark>
          </h2>
          <p className="mt-6 max-w-md text-sm text-muted-foreground">
            Рыба, морепродукты, мясо, овощи, ягоды и полуфабрикаты для магазинов, ресторанов и производств.
          </p>
        </div>
        {facts.map((f, i) => (
          <div
            key={f.t}
            className={`tile flex flex-col justify-between p-5 ${i === 0 ? "bg-ocean text-ocean-foreground" : ""}`}
          >
            <b className="font-head text-[30px] font-light">{f.n}</b>
            <span className={`mt-4 text-[0.8em] ${i === 0 ? "" : "text-muted-foreground"}`}>{f.t}</span>
          </div>
        ))}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-4">
        {steps.map((s, i) => (
          <div key={s.t} className="tile group p-5 transition-transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-pill transition-colors group-hover:bg-accent">
                <Icon name={s.icon} size={18} />
              </span>
              <span className="text-[0.75em] text-muted-foreground">0{i + 1}</span>
            </div>
            <h3 className="mt-6 font-head text-lg font-medium">{s.t}</h3>
            <p className="mt-2 text-[0.8em] text-muted-foreground">{s.d}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default AboutBento;
