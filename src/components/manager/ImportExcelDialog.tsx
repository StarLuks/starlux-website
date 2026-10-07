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
type Preview = Result & {
  total: number;
  prices: number;
  newGroups: string[];
  priceTypes: string[];
  unknownPrices: string[];
  ignoredCols: string[];
  preview: { row: number; name: string; group: string; code1c: string; action: "create" | "update" }[];
};

const XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

const ImportExcelDialog = ({ open, onOpenChange, onImported }: Props) => {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [creatingTypes, setCreatingTypes] = useState(false);
  const [view, setView] = useState<"all" | "create" | "update">("all");
  const ref = useRef<HTMLInputElement>(null);

  const reset = () => {
    setFile(null);
    setResult(null);
    setPreview(null);
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
    setPreview(null);
    setFile(f);
    check(f);
  };

  const createPriceTypes = async () => {
    if (!preview || !file) return;
    setCreatingTypes(true);
    try {
      for (const col of preview.unknownPrices) {
        const name = col.replace(/^цена:\s*/i, "").trim();
        if (name) await api("price_type_save", { name, code1c: "", active: true });
      }
      toast({
        title: preview.unknownPrices.length > 1 ? "Типы цен созданы" : "Тип цен создан",
        description: preview.unknownPrices.map((c) => c.replace(/^цена:\s*/i, "")).join(", "),
      });
      await check(file);
    } catch (e) {
      toast({ title: "Не удалось создать тип цен", description: (e as Error).message });
    } finally {
      setCreatingTypes(false);
    }
  };

  const check = async (f: File) => {
    setBusy(true);
    try {
      const p = await api<Preview>("import_excel", { file: await fileToBase64(f), dryRun: true });
      setPreview(p);
      setView("all");
    } catch (e) {
      toast({ title: "Не удалось проверить файл", description: (e as Error).message });
      setFile(null);
    } finally {
      setBusy(false);
    }
  };

  const run = async () => {
    if (!file) return;
    setBusy(true);
    try {
      const r = await api<Result>("import_excel", { file: await fileToBase64(file) });
      setResult(r);
      setPreview(null);
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
      <DialogContent className="max-h-[94vh] max-w-lg gap-3 overflow-y-auto rounded-[24px] p-5">
        <DialogHeader>
          <DialogTitle className="font-head">Загрузка номенклатуры из Excel</DialogTitle>
          <DialogDescription className="text-xs">
            Поиск по коду 1С, артикулу, наименованию. Найденные обновятся, новые — создадутся.
          </DialogDescription>
        </DialogHeader>

        <button
          type="button"
          onClick={template}
          className="flex items-center gap-2 self-start text-sm font-medium text-primary hover:underline"
        >
          <Icon name="FileSpreadsheet" size={16} />
          Скачать шаблон с текущими товарами
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
            "flex cursor-pointer items-center gap-3 rounded-2xl border-2 border-dashed px-4 py-3 transition-colors",
            drag ? "border-primary bg-primary/5" : "border-border hover:border-ring"
          )}
        >
          <Icon name={file ? "FileCheck2" : "Upload"} size={22} className={cn("shrink-0", file ? "text-primary" : "text-muted-foreground")} />
          <span className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{file ? file.name : "Перетащите .xlsx или нажмите для выбора"}</p>
            {file && <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(0)} КБ · нажмите, чтобы заменить</p>}
          </span>
          <input ref={ref} type="file" accept=".xlsx" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
        </div>

        {preview && !result && (
          <div className="space-y-2 rounded-2xl bg-pill p-3 text-sm">
            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                { k: "create", l: "Новых", v: preview.created, c: "text-emerald-600" },
                { k: "update", l: "Обновится", v: preview.updated, c: "text-primary" },
                { k: "err", l: "Ошибок", v: preview.errors.length, c: preview.errors.length ? "text-destructive" : "text-muted-foreground" },
              ].map((x) => (
                <button
                  key={x.k}
                  type="button"
                  disabled={x.k === "err"}
                  onClick={() => setView(view === x.k ? "all" : (x.k as "create" | "update"))}
                  className={cn("flex items-baseline justify-center gap-1.5 rounded-xl bg-card px-2 py-1.5 transition", view === x.k && "ring-2 ring-ring")}
                >
                  <b className={cn("font-head text-lg", x.c)}>{x.v}</b>
                  <span className="text-xs text-muted-foreground">{x.l}</span>
                </button>
              ))}
            </div>

            <div className="space-y-1 text-xs text-muted-foreground">
              <p>
                Строк в файле: <b className="text-foreground">{preview.total}</b> · цен к записи: <b className="text-foreground">{preview.prices}</b>
                {preview.priceTypes.length > 0 && <> ({preview.priceTypes.join(", ")})</>}
              </p>
              {preview.newGroups.length > 0 && (
                <p className="flex items-start gap-1.5">
                  <Icon name="FolderPlus" size={14} className="mt-px shrink-0 text-primary" />
                  Будут созданы группы: <b className="text-foreground">{preview.newGroups.join(", ")}</b>
                </p>
              )}
              {preview.unknownPrices.length > 0 && (
                <div className="flex flex-col gap-2 rounded-xl bg-amber-500/10 p-2.5 text-amber-800 sm:flex-row sm:items-center">
                  <p className="flex flex-1 items-start gap-1.5">
                    <Icon name="TriangleAlert" size={14} className="mt-px shrink-0" />
                    <span>
                      Нет типа цен:{" "}
                      <b>{preview.unknownPrices.map((c) => c.replace(/^цена:\s*/i, "")).join(", ")}</b> — эти цены не загрузятся.
                    </span>
                  </p>
                  <button
                    type="button"
                    onClick={createPriceTypes}
                    disabled={creatingTypes || busy}
                    className="flex shrink-0 items-center justify-center gap-1.5 rounded-full bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-amber-700 disabled:opacity-60"
                  >
                    <Icon name={creatingTypes ? "Loader2" : "Plus"} size={13} className={creatingTypes ? "animate-spin" : ""} />
                    {preview.unknownPrices.length > 1 ? "Создать типы цен" : "Создать тип цен"}
                  </button>
                </div>
              )}
              {preview.ignoredCols.length > 0 && (
                <p className="flex items-start gap-1.5">
                  <Icon name="EyeOff" size={14} className="mt-px shrink-0" />
                  Колонки пропущены: {preview.ignoredCols.join(", ")}
                </p>
              )}
            </div>

            {preview.errors.length > 0 && (
              <ul className="max-h-20 space-y-1 overflow-y-auto rounded-xl bg-destructive/5 p-2 text-xs text-destructive">
                {preview.errors.map((e) => (
                  <li key={e}>• {e}</li>
                ))}
              </ul>
            )}

            <div className="max-h-[22vh] overflow-y-auto rounded-xl bg-card">
              {preview.preview
                .filter((p) => view === "all" || p.action === view)
                .map((p) => (
                  <div key={p.row} className="flex items-center gap-2 border-b border-border px-3 py-1.5 text-xs last:border-0">
                    <span className="w-7 shrink-0 text-muted-foreground">{p.row}</span>
                    <span className="min-w-0 flex-1 truncate">{p.name}</span>
                    <span className="hidden max-w-[110px] truncate text-muted-foreground sm:block">{p.group}</span>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium",
                        p.action === "create" ? "bg-emerald-500/15 text-emerald-700" : "bg-primary/15 text-primary"
                      )}
                    >
                      {p.action === "create" ? "новый" : "обновить"}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}

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
          disabled={!file || busy || !preview || preview.created + preview.updated === 0}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-primary font-head font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
        >
          {busy ? <Icon name="Loader2" size={18} className="animate-spin" /> : <Icon name="Upload" size={18} />}
          {busy
            ? preview
              ? "Загружаем…"
              : "Проверяем файл…"
            : preview
              ? `Загрузить ${preview.created + preview.updated} товаров`
              : result
                ? "Готово"
                : "Загрузить"}
        </button>
      </DialogContent>
    </Dialog>
  );
};

export default ImportExcelDialog;
