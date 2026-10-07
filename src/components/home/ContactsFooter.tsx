import { Link } from "react-router-dom";
import Icon from "@/components/ui/icon";

const ContactsFooter = () => {
  return (
    <section id="contacts" className="scroll-mt-4 px-4 pb-6 md:px-6">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="flex flex-col justify-between rounded-[10px] bg-accent p-6 text-accent-foreground">
          <span className="text-[0.75em]">Стать клиентом.</span>
          <p className="mt-6 font-head text-[26px] font-light leading-tight">
            Оставьте заявку — менеджер заключит договор и выдаст доступ в кабинет.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <a href="tel:+74950000000" className="pill bg-foreground text-card transition-opacity hover:opacity-85">
              Позвонить менеджеру
            </a>
            <Link to="/login" className="pill bg-card transition-opacity hover:opacity-85">
              У меня уже есть доступ →
            </Link>
          </div>
        </div>

        <div className="tile space-y-4 p-6 text-sm">
          <span className="text-[0.75em] text-muted-foreground">Контакты.</span>
          <a href="tel:+74950000000" className="flex items-center gap-3 hover:underline">
            <Icon name="Phone" size={16} /> +7 (495) 000-00-00
          </a>
          <a href="mailto:zakaz@starlux.ru" className="flex items-center gap-3 hover:underline">
            <Icon name="Mail" size={16} /> zakaz@starlux.ru
          </a>
          <p className="flex items-start gap-3">
            <Icon name="MapPin" size={16} className="mt-0.5 shrink-0" /> Москва, склад-холодильник, пн–сб 7:00–20:00
          </p>
        </div>

        <div className="tile flex flex-col justify-between p-6">
          <span className="text-[0.75em] text-muted-foreground">Прайс-лист.</span>
          <Link
            to="/login"
            className="mt-6 flex items-center justify-between rounded-full bg-pill px-5 py-3 text-sm transition-colors hover:bg-accent"
          >
            Скачать актуальный прайс <Icon name="Download" size={16} />
          </Link>
          <span className="mt-4 text-[0.75em] text-muted-foreground">Доступен клиентам после входа в кабинет</span>
        </div>
      </div>

      <footer className="mt-6 flex flex-wrap justify-between gap-2 text-[0.75em] text-muted-foreground">
        <span>© {new Date().getFullYear()} ООО «СтарЛюкс»</span>
        <span>Оптовая торговля замороженной продукцией</span>
      </footer>
    </section>
  );
};

export default ContactsFooter;
