import Icon from "@/components/ui/icon";
import { COMPANY } from "@/data/company";

const SiteFooter = () => (
  <footer className="border-t border-white/10 bg-[#081427] px-6 py-8">
    <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-sm text-white/50 md:flex-row">
      <span>© 2026 {COMPANY.name}. Оптовые поставки замороженной продукции.</span>
      <a
        href="https://ssys.su"
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-center gap-2.5 rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-white/60 transition-all hover:border-ice/40 hover:bg-white/10 hover:text-white"
      >
        <Icon name="Code2" size={15} className="text-ice transition-transform group-hover:rotate-12" />
        <span>
          Разработано{" "}
          <span className="bg-gradient-to-r from-ice via-white to-ice bg-clip-text font-head font-bold tracking-wide text-transparent">
            СпецСистемы
          </span>{" "}
          © 2026
        </span>
        <Icon name="ArrowUpRight" size={14} className="opacity-60 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </a>
    </div>
  </footer>
);

export default SiteFooter;
