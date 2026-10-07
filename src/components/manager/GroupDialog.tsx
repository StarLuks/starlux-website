import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { api } from "@/lib/api";
import { ProductGroup } from "@/lib/nomenclature";
import { toast } from "@/hooks/use-toast";

interface Props {
  group: Partial<ProductGroup> | null;
  onClose: () => void;
  onSaved: () => void;
}

const inputCls =
  "h-11 w-full rounded-2xl border border-border bg-pill px-4 outline-none transition focus:border-ring focus:bg-card focus:ring-4 focus:ring-ring/15";

const GroupDialog = ({ group, onClose, onSaved }: Props) => {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (group) {
      setName(group.name ?? "");
      setCode(group.code1c ?? "");
    }
  }, [group]);

  const save = async () => {
    if (!name.trim()) {
      toast({ title: "Укажите наименование группы" });
      return;
    }
    setSaving(true);
    try {
      await api("group_save", { id: group?.id, name, code1c: code });
      toast({ title: group?.id ? "Группа сохранена" : "Группа добавлена", description: name });
      onSaved();
      onClose();
    } catch (e) {
      toast({ title: "Не удалось сохранить", description: (e as Error).message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={!!group} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md rounded-[24px]">
        <DialogHeader>
          <DialogTitle className="font-head">{group?.id ? "Изменить группу" : "Новая группа номенклатуры"}</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
          className="space-y-4"
        >
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-muted-foreground">Наименование</span>
            <input autoFocus className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="Например, Рыба" />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-muted-foreground">Код 1С</span>
            <input className={inputCls} value={code} onChange={(e) => setCode(e.target.value)} placeholder="Необязательно" />
          </label>
          <button
            type="submit"
            disabled={saving}
            className="h-11 w-full rounded-2xl bg-primary font-head font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
          >
            {saving ? "Сохраняем…" : "Сохранить"}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default GroupDialog;
