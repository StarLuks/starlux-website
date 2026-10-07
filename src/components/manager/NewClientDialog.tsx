import { FormEvent, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { api } from "@/lib/api";
import { toast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: () => void;
}

const empty = { company: "", inn: "", contact: "", phone: "", login: "", password: "" };

const genPass = () => Math.random().toString(36).slice(2, 10);

const NewClientDialog = ({ open, onOpenChange, onCreated }: Props) => {
  const [saving, setSaving] = useState(false);
  const [f, setF] = useState(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const er: Record<string, string> = {};
    if (!f.company.trim()) er.company = "Укажите название";
    if (!/^\d{10}$|^\d{12}$/.test(f.inn)) er.inn = "ИНН — 10 или 12 цифр";
    if (!f.login.trim()) er.login = "Укажите логин";
    if (f.password.length < 4) er.password = "Минимум 4 символа";
    setErrors(er);
    if (Object.keys(er).length) return;
    setSaving(true);
    try {
      await api("create_client", { ...f, login: f.login.trim() });
      toast({ title: "Клиент создан", description: `${f.company}: логин ${f.login.trim()}, пароль ${f.password}` });
      setF(empty);
      onOpenChange(false);
      onCreated();
    } catch (err) {
      setErrors({ login: (err as Error).message });
    } finally {
      setSaving(false);
    }
  };

  const field = (key: keyof typeof empty, label: string, placeholder = "") => (
    <label className="space-y-1">
      <span className="text-[0.72em] text-muted-foreground">{label}</span>
      <input
        value={f[key]}
        onChange={(e) => setF({ ...f, [key]: key === "inn" ? e.target.value.replace(/\D/g, "").slice(0, 12) : e.target.value })}
        placeholder={placeholder}
        className="w-full rounded-full bg-pill px-4 py-2.5 text-sm outline-none ring-ocean focus:ring-2"
      />
      {errors[key] && <span className="block text-[0.72em] text-destructive">{errors[key]}</span>}
    </label>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-[10px] border-0 bg-card font-mono">
        <DialogHeader>
          <DialogTitle className="font-head text-2xl font-light">Новый клиент</DialogTitle>
          <DialogDescription>Клиент сможет войти по этому логину и паролю.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">{field("company", "Организация", "ООО «Ромашка»")}</div>
          {field("inn", "ИНН", "7700000000")}
          {field("phone", "Телефон", "+7 (___) ___-__-__")}
          <div className="sm:col-span-2">{field("contact", "Контактное лицо", "Имя Фамилия")}</div>
          {field("login", "Логин", "romashka")}
          <div>
            {field("password", "Пароль")}
            <button type="button" onClick={() => setF({ ...f, password: genPass() })} className="mt-1 text-[0.72em] text-ocean hover:underline">
              Сгенерировать
            </button>
          </div>
          <button type="submit" disabled={saving} className="disabled:opacity-60 rounded-full bg-ocean px-5 py-3 font-head text-ocean-foreground transition-opacity hover:opacity-90 sm:col-span-2">
            Создать клиента
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NewClientDialog;
