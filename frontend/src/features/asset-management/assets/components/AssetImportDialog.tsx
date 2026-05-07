import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Download, Upload } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetClose,
} from "@/shared/components/ui/sheet";
import { Button } from "@/shared/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Field, FieldGroup, FieldLabel } from "@/shared/components/ui/field";
import { assetApi } from "../api/assetApi";
import type { Building } from "../types/assetTypes";

interface AssetImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  buildings: Building[];
  onSuccess: () => void;
}

export function AssetImportDialog({
  open,
  onOpenChange,
  buildings,
  onSuccess,
}: AssetImportDialogProps) {
  const { t } = useTranslation("assets");
  const fileRef = useRef<HTMLInputElement>(null);
  const [buildingId, setBuildingId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownloadTemplate = async () => {
    const res = await assetApi.downloadTemplate();
    const url = URL.createObjectURL(new Blob([res.data as BlobPart]));
    const a = document.createElement("a");
    a.href = url;
    a.download = "asset-import-template.xlsx";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async () => {
    if (!buildingId || !file) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await assetApi.importAssets(buildingId, file);
      onSuccess();
      onOpenChange(false);
      setFile(null);
      setBuildingId("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("messages.importError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full max-w-md">
        <SheetHeader>
          <SheetTitle>{t("import.title")}</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-5 py-4 px-1">
          <FieldGroup>
            <Field>
              <FieldLabel>{t("import.building")} *</FieldLabel>
              <Select value={buildingId} onValueChange={setBuildingId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("form.selectBuilding")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {buildings.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel>{t("import.file")} *</FieldLabel>
              <div
                className="flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-border p-6 cursor-pointer hover:bg-muted/40 transition-colors"
                onClick={() => fileRef.current?.click()}
              >
                <Upload className="size-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground text-center">
                  {file ? file.name : t("import.dropzone")}
                </p>
                {file && (
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </Field>

            {error && <p className="text-sm text-destructive">{error}</p>}
          </FieldGroup>

          <Button
            type="button"
            variant="outline"
            onClick={handleDownloadTemplate}
            className="w-full"
          >
            <Download className="size-4" />
            {t("import.downloadTemplate")}
          </Button>
        </div>

        <SheetFooter className="flex gap-2">
          <SheetClose asChild>
            <Button type="button" variant="outline">
              {t("actions.cancel")}
            </Button>
          </SheetClose>
          <Button
            type="button"
            onClick={handleImport}
            disabled={!buildingId || !file || isSubmitting}
          >
            {isSubmitting && (
              <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            )}
            {t("import.submit")}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
