import { useRef, useState } from "react";
import Icon from "@/components/ui/icon";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { api } from "@/lib/api";
import { downloadBase64, fileToBase64 } from "@/lib/nomenclature";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onImported: () => void;
}

type Result = { created: number; updated: number; errors: string[] };

const XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

const ImportExcelDialog = ({ open, onOpenChange, onImported }: Props) => {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const ref = useRef<HTMLInputElement>(null);

  const reset = () => {
    setFile(null);
    setResult(null);
  };

  const template = async () => {
    try {
      const d = await api<{ file: string; name: string }>("import_template", {});
      downloadBase64(d.file, d.name, XLSX);
    } catch (e) {
      toast({ title: "Не удалось скачать шаблон", description: (e as Error).message });
    }
  };

  const pick = (f?: File | null) => {
    if (!f) return;
    if (!f.name.toLowerCase().endsWith(".xlsx")) {
      toast({ title: "Нужен файл Excel в формате .xlsx" });
      return;
    }
    setResult(null);
    setFile(f);
  };

  const run = async () => {
    if (!file) return;
    setBusy(true);
    try {
      const r = await api<Result>("import_excel", { file: await fileToBase64(file) });
      setResult(r);
      onImported();
      toast({ title: "Загрузка завершена", description: `Создано: ${r.created}, обновлено: ${r.updated}` });
    } catch (e) {
      toast({ title: "Ошибка загрузки", description: (e as Error).message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) reset();
      }}
    >
      <DialogContent className="max-w-lg rounded-[24px]">
        <DialogHeader>
          <DialogTitle className="font-head">Загрузка номенклатуры из Excel</DialogTitle>
          <DialogDescription>
            Товары ищутся по коду 1С, затем по артикулу и наименованию. Найденные обновятся, новые будут созданы. Новые
            группы создадутся автоматически.
          </DialogDescription>
        </DialogHeader>

        <button
          type="button"
          onClick={template}
          className="flex items-center gap-3 rounded-2xl bg-pill px-4 py-3 text-left text-sm transition-colors hover:bg-accent"
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-card text-primary">
            <Icon name="FileSpreadsheet" size={18} />
          </span>
          <span>
            <b className="block font-medium">Скачать шаблон</b>
            <span className="text-xs text-muted-foreground">В нём уже есть текущие товары и колонки для всех активных типов цен</span>
          </span>
        </button>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            pick(e.dataTransfer.files[0]);
          }}
          onClick={() => ref.current?.click()}
          className={cn(
            "grid cursor-pointer place-items-center rounded-2xl border-2 border-dashed px-4 py-8 text-center transition-colors",
            drag ? "border-primary bg-primary/5" : "border-border hover:border-ring"
          )}
        >
          <Icon name={file ? "FileCheck2" : "Upload"} size={28} className={file ? "text-primary" : "text-muted-foreground"} />
          <p className="mt-2 text-sm font-medium">{file ? file.name : "Перетащите файл .xlsx или нажмите для выбора"}</p>
          {file && <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(0)} КБ</p>}
          <input ref={ref} type="file" accept=".xlsx" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
        </div>

        {result && (
          <div className="space-y-2 rounded-2xl bg-pill p-4 text-sm">
            <div className="flex gap-4">
              <span>
                Создано: <b>{result.created}</b>
              </span>
              <span>
                Обновлено: <b>{result.updated}</b>
              </span>
              {result.errors.length > 0 && (
                <span className="text-destructive">
                  Ошибок: <b>{result.errors.length}</b>
                </span>
              )}
            </div>
            {result.errors.length > 0 && (
              <ul className="max-h-32 space-y-1 overflow-y-auto text-xs text-destructive">
                {result.errors.map((e) => (
                  <li key={e}>• {e}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={run}
          disabled={!file || busy}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-primary font-head font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
        >
          {busy ? <Icon name="Loader2" size={18} className="animate-spin" /> : <Icon name="Upload" size={18} />}
          {busy ? "Загружаем…" : "Загрузить"}
        </button>
      </DialogContent>
    </Dialog>
  );
};

export default ImportExcelDialog;
