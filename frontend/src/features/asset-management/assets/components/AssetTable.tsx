import { useTranslation } from "react-i18next";
import { MoreHorizontal, Pencil, PowerOff, Trash2 } from "lucide-react";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { cn } from "@/shared/utils/cn";
import type { Asset } from "../types/assetTypes";

interface AssetTableProps {
  assets: Asset[];
  isLoading: boolean;
  onRowClick: (asset: Asset) => void;
  onEdit: (asset: Asset) => void;
  onDelete: (asset: Asset) => void;
  onDeactivate: (asset: Asset) => void;
  canEdit: boolean;
}

function StatusBadge({ active }: { active: boolean }) {
  const { t } = useTranslation("assets");
  return (
    <Badge
      className={cn(
        "rounded-full text-xs font-medium",
        active
          ? "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400"
          : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
      )}
    >
      {active ? t("status.active") : t("status.inactive")}
    </Badge>
  );
}

function OwnershipBadge({ scope }: { scope?: string }) {
  const { t } = useTranslation("assets");
  if (!scope) return null;
  return (
    <Badge
      className={cn(
        "rounded-full text-xs",
        scope === "COMMON"
          ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
          : "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
      )}
    >
      {t(`ownershipScope.${scope}`, { defaultValue: scope })}
    </Badge>
  );
}

export function AssetTable({
  assets,
  isLoading,
  onRowClick,
  onEdit,
  onDelete,
  onDeactivate,
  canEdit,
}: AssetTableProps) {
  const { t } = useTranslation("assets");

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-md" />
        ))}
      </div>
    );
  }

  if (assets.length === 0) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
        {t("list.empty")}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40">
            <TableHead className="font-medium text-xs uppercase tracking-wide text-muted-foreground whitespace-nowrap">
              {t("table.assetCode")}
            </TableHead>
            <TableHead className="font-medium text-xs uppercase tracking-wide text-muted-foreground">
              {t("table.name")}
            </TableHead>
            <TableHead className="font-medium text-xs uppercase tracking-wide text-muted-foreground whitespace-nowrap">
              {t("table.assetType")}
            </TableHead>
            <TableHead className="font-medium text-xs uppercase tracking-wide text-muted-foreground whitespace-nowrap">
              {t("table.ownershipScope")}
            </TableHead>
            <TableHead className="font-medium text-xs uppercase tracking-wide text-muted-foreground">
              {t("table.building")}
            </TableHead>
            <TableHead className="font-medium text-xs uppercase tracking-wide text-muted-foreground whitespace-nowrap">
              {t("table.location")}
            </TableHead>
            <TableHead className="font-medium text-xs uppercase tracking-wide text-muted-foreground">
              {t("table.status")}
            </TableHead>
            <TableHead className="font-medium text-xs uppercase tracking-wide text-muted-foreground whitespace-nowrap">
              {t("table.installedAt")}
            </TableHead>
            <TableHead className="font-medium text-xs uppercase tracking-wide text-muted-foreground whitespace-nowrap">
              {t("table.warrantyUntil")}
            </TableHead>
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {assets.map((asset) => (
            <TableRow
              key={asset.id}
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => onRowClick(asset)}
            >
              <TableCell className="font-mono text-sm font-medium text-primary whitespace-nowrap">
                {asset.assetCode}
              </TableCell>
              <TableCell className="font-medium">{asset.name}</TableCell>
              <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                {t(`assetType.${asset.assetType}`, { defaultValue: asset.assetType })}
              </TableCell>
              <TableCell>
                <OwnershipBadge scope={asset.ownershipScope} />
              </TableCell>
              <TableCell className="text-sm whitespace-nowrap">
                {asset.buildingCode ?? asset.buildingId}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                <div className="flex flex-col gap-0.5">
                  {asset.unitCode && <span>{asset.unitCode}</span>}
                  {asset.floor && (
                    <span className="text-xs text-muted-foreground/70">
                      {t("table.floor")} {asset.floor}
                    </span>
                  )}
                  {asset.location && (
                    <span className="text-xs text-muted-foreground/70">{asset.location}</span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <StatusBadge active={asset.active} />
              </TableCell>
              <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                {asset.installedAt ? format(new Date(asset.installedAt), "dd/MM/yyyy") : "—"}
              </TableCell>
              <TableCell className="text-sm whitespace-nowrap">
                {asset.warrantyUntil ? (
                  <span
                    className={cn(
                      "text-sm",
                      new Date(asset.warrantyUntil) < new Date()
                        ? "text-destructive"
                        : "text-muted-foreground"
                    )}
                  >
                    {format(new Date(asset.warrantyUntil), "dd/MM/yyyy")}
                  </span>
                ) : (
                  "—"
                )}
              </TableCell>
              <TableCell onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="size-8">
                      <MoreHorizontal className="size-4" />
                      <span className="sr-only">Actions</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {canEdit && (
                      <>
                        <DropdownMenuItem onClick={() => onEdit(asset)}>
                          <Pencil className="size-4" />
                          {t("actions.update")}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDeactivate(asset)}>
                          <PowerOff className="size-4" />
                          {asset.active ? t("actions.deactivate") : t("actions.activate")}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => onDelete(asset)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="size-4" />
                          {t("actions.delete")}
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
