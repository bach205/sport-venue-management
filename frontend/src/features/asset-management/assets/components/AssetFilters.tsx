import { useTranslation } from "react-i18next";
import { Search } from "lucide-react";
import { Input } from "@/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import type { AssetFilterState, Building } from "../types/assetTypes";
import { ASSET_TYPES } from "../types/assetTypes";

interface AssetFiltersProps {
  filters: AssetFilterState;
  buildings: Building[];
  onFilterChange: (key: keyof AssetFilterState, value: string) => void;
}

export function AssetFilters({ filters, buildings, onFilterChange }: AssetFiltersProps) {
  const { t } = useTranslation("assets");

  return (
    <div className="flex flex-wrap gap-3">
      <div className="relative flex-1 min-w-48">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
        <Input
          placeholder={t("filter.searchPlaceholder")}
          value={filters.search}
          onChange={(e) => onFilterChange("search", e.target.value)}
          className="pl-9"
        />
      </div>

      <Select
        value={filters.buildingId || "all"}
        onValueChange={(v) => onFilterChange("buildingId", v === "all" ? "" : v)}
      >
        <SelectTrigger className="min-w-44">
          <SelectValue placeholder={t("filter.building")} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="all">{t("filter.allBuildings")}</SelectItem>
            {buildings.map((b) => (
              <SelectItem key={b.id} value={b.id}>
                {b.name}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>

      <Select
        value={filters.assetType || "all"}
        onValueChange={(v) => onFilterChange("assetType", v === "all" ? "" : v)}
      >
        <SelectTrigger className="min-w-44">
          <SelectValue placeholder={t("filter.assetType")} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="all">{t("filter.allTypes")}</SelectItem>
            {ASSET_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {t(`assetType.${type}`, { defaultValue: type })}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>

      <Select value={filters.status || "all"} onValueChange={(v) => onFilterChange("status", v)}>
        <SelectTrigger className="min-w-36">
          <SelectValue placeholder={t("filter.status")} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="all">{t("filter.allStatuses")}</SelectItem>
            <SelectItem value="active">{t("status.active")}</SelectItem>
            <SelectItem value="inactive">{t("status.inactive")}</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>

      <Select
        value={filters.ownershipScope || "all"}
        onValueChange={(v) => onFilterChange("ownershipScope", v)}
      >
        <SelectTrigger className="min-w-36">
          <SelectValue placeholder={t("filter.ownershipScope")} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="all">{t("filter.allOwnership")}</SelectItem>
            <SelectItem value="COMMON">{t("ownershipScope.COMMON")}</SelectItem>
            <SelectItem value="PRIVATE">{t("ownershipScope.PRIVATE")}</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}
