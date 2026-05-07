import { useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertTriangle } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetClose,
} from "@/shared/components/ui/sheet";
import { Button } from "@/shared/components/ui/button";
import type { Asset } from "../types/assetTypes";

interface AssetDeleteConfirmProps {
  asset: Asset | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
}

export function AssetDeleteConfirm({
  asset,
  open,
  onOpenChange,
  onConfirm,
}: AssetDeleteConfirmProps) {
  const { t } = useTranslation("assets");
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="mx-auto max-w-md rounded-t-xl">
        <SheetHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="size-5 text-destructive" />
            </div>
            <SheetTitle>{t("delete.title")}</SheetTitle>
          </div>
        </SheetHeader>
        <p className="text-sm text-muted-foreground px-1 py-2">
          {t("delete.message", { name: asset?.name ?? "" })}
        </p>
        <SheetFooter className="flex gap-2 pt-2">
          <SheetClose asChild>
            <Button variant="outline">{t("actions.cancel")}</Button>
          </SheetClose>
          <Button variant="destructive" onClick={handleConfirm} disabled={isDeleting}>
            {isDeleting && (
              <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            )}
            {t("actions.delete")}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
