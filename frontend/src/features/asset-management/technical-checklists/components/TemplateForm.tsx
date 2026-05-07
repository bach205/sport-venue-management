import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetClose,
} from "@/shared/components/ui/sheet";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Field, FieldLabel, FieldError } from "@/shared/components/ui/field";
import { Separator } from "@/shared/components/ui/separator";
import type {
  ChecklistTemplate,
  ChecklistTemplateItem,
  CreateTemplateRequest,
  FrequencyUnit,
} from "../types/checklistTypes";

const FREQUENCY_UNITS: FrequencyUnit[] = ["DAILY", "WEEKLY", "MONTHLY", "QUARTERLY", "YEARLY"];

const templateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  checklistType: z.string().min(1),
  frequencyValue: z.coerce.number().min(1).optional(),
  frequencyUnit: z.string().optional(),
});

type FormValues = z.infer<typeof templateSchema>;

interface ItemFormState {
  itemName: string;
}

const defaultItemForm: ItemFormState = { itemName: "" };

interface TemplateFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template?: ChecklistTemplate | null;
  onSubmit: (values: CreateTemplateRequest) => Promise<void>;
}

export function TemplateForm({ open, onOpenChange, template, onSubmit }: TemplateFormProps) {
  const { t } = useTranslation("technicalChecklists");
  const isEdit = !!template;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      name: "",
      description: "",
      checklistType: "",
      frequencyValue: 1,
      frequencyUnit: "",
    },
  });

  const [items, setItems] = useState<ChecklistTemplateItem[]>([]);
  const [showItemForm, setShowItemForm] = useState(false);
  const [editingItem, setEditingItem] = useState<ChecklistTemplateItem | null>(null);
  const [itemForm, setItemForm] = useState<ItemFormState>(defaultItemForm);
  const [itemFormError, setItemFormError] = useState(false);

  useEffect(() => {
    if (open) {
      reset(
        template
          ? {
              name: template.name,
              description: template.description ?? "",
              checklistType: template.checklistType,
              frequencyValue: template.frequencyValue ?? 1,
              frequencyUnit: template.frequencyUnit ?? "",
            }
          : { name: "", description: "", checklistType: "", frequencyValue: 1, frequencyUnit: "" }
      );
      setItems(template?.items ?? []);
      setShowItemForm(false);
      setEditingItem(null);
      setItemForm(defaultItemForm);
      setItemFormError(false);
    }
  }, [open, template, reset]);

  function handleOpenItemForm(item?: ChecklistTemplateItem) {
    if (item) {
      setEditingItem(item);
      setItemForm({ itemName: item.itemName });
    } else {
      setEditingItem(null);
      setItemForm(defaultItemForm);
    }
    setItemFormError(false);
    setShowItemForm(true);
  }

  function handleCancelItemForm() {
    setShowItemForm(false);
    setEditingItem(null);
    setItemForm(defaultItemForm);
    setItemFormError(false);
  }

  function handleSaveItem() {
    if (!itemForm.itemName.trim()) {
      setItemFormError(true);
      return;
    }
    if (editingItem) {
      setItems((prev) =>
        prev.map((i) =>
          i.id === editingItem.id ? { ...i, itemName: itemForm.itemName.trim() } : i
        )
      );
    } else {
      const newItem: ChecklistTemplateItem = {
        id: `new-${Date.now()}`,
        templateId: template?.id ?? "",
        itemName: itemForm.itemName.trim(),
        orderIndex: items.length + 1,
      };
      setItems((prev) => [...prev, newItem]);
    }
    handleCancelItemForm();
  }

  function handleDeleteItem(itemId: string) {
    setItems((prev) => prev.filter((i) => i.id !== itemId));
  }

  async function onValid(values: FormValues) {
    await onSubmit({
      name: values.name,
      description: values.description,
      checklistType: values.checklistType,
      frequencyValue: values.frequencyValue,
      frequencyUnit: values.frequencyUnit as FrequencyUnit | undefined,
      items: items.map((item, idx) => ({
        id: item.id,
        itemName: item.itemName,
        orderIndex: idx + 1,
      })),
    });
    onOpenChange(false);
  }

  const freqUnit = watch("frequencyUnit");

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg flex flex-col p-0 overflow-hidden">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border">
          <SheetTitle>{isEdit ? t("form.editTemplate") : t("form.createTemplate")}</SheetTitle>
        </SheetHeader>

        <form
          onSubmit={handleSubmit(onValid)}
          className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5"
        >
          {/* Template metadata */}
          <Field>
            <FieldLabel>{t("form.name")}</FieldLabel>
            <Input {...register("name")} placeholder={t("form.namePlaceholder")} />
            {errors.name && <FieldError>{t("form.required")}</FieldError>}
          </Field>

          <Field>
            <FieldLabel>{t("form.checklistType")}</FieldLabel>
            <Input
              {...register("checklistType")}
              placeholder={t("form.checklistTypePlaceholder")}
            />
            {errors.checklistType && <FieldError>{t("form.required")}</FieldError>}
          </Field>

          <Field>
            <FieldLabel>{t("form.description")}</FieldLabel>
            <textarea
              {...register("description")}
              rows={3}
              placeholder={t("form.descriptionPlaceholder")}
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
            />
          </Field>

          <div className="flex gap-3">
            <Field className="flex-1">
              <FieldLabel>{t("form.frequencyValue")}</FieldLabel>
              <Input type="number" min={1} {...register("frequencyValue")} />
            </Field>
            <Field className="flex-1">
              <FieldLabel>{t("form.frequencyUnit")}</FieldLabel>
              <Select value={freqUnit ?? ""} onValueChange={(v) => setValue("frequencyUnit", v)}>
                <SelectTrigger>
                  <SelectValue placeholder={t("form.selectUnit")} />
                </SelectTrigger>
                <SelectContent>
                  {FREQUENCY_UNITS.map((u) => (
                    <SelectItem key={u} value={u}>
                      {t(`frequencyUnit.${u}`, { defaultValue: u })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <Separator />

          {/* Items section */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">{t("form.items")}</span>
              {!showItemForm && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="gap-1.5 h-7 text-xs"
                  onClick={() => handleOpenItemForm()}
                >
                  <Plus className="size-3" />
                  {t("form.addItem")}
                </Button>
              )}
            </div>

            {/* Existing items list */}
            {items.length > 0 && (
              <div className="flex flex-col gap-1.5">
                {items.map((item, idx) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-2 rounded-md border border-border px-3 py-2 bg-muted/30 text-sm"
                  >
                    <span className="text-xs text-muted-foreground w-4 shrink-0 text-right">
                      {idx + 1}.
                    </span>
                    <span className="flex-1 min-w-0 truncate">{item.itemName}</span>
                    <div className="flex items-center gap-0.5 shrink-0">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="size-6"
                        onClick={() => handleOpenItemForm(item)}
                      >
                        <Pencil className="size-3" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="size-6 text-destructive hover:text-destructive"
                        onClick={() => handleDeleteItem(item.id)}
                      >
                        <Trash2 className="size-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {items.length === 0 && !showItemForm && (
              <p className="text-xs text-muted-foreground py-3 text-center border border-dashed rounded-md">
                {t("form.noItems")}
              </p>
            )}

            {/* Inline item add/edit form */}
            {showItemForm && (
              <div className="flex items-center gap-2 rounded-md border border-border px-3 py-2 bg-muted/20">
                <span className="text-xs text-muted-foreground w-4 shrink-0 text-right">
                  {editingItem
                    ? items.findIndex((i) => i.id === editingItem.id) + 1
                    : items.length + 1}
                  .
                </span>
                <div className="flex-1">
                  <Input
                    autoFocus
                    value={itemForm.itemName}
                    onChange={(e) => {
                      setItemForm({ itemName: e.target.value });
                      setItemFormError(false);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleSaveItem();
                      }
                      if (e.key === "Escape") handleCancelItemForm();
                    }}
                    placeholder={t("form.itemNamePlaceholder")}
                    className={`h-7 text-sm ${itemFormError ? "border-destructive" : ""}`}
                  />
                  {itemFormError && <FieldError>{t("form.required")}</FieldError>}
                </div>
                <Button
                  type="button"
                  size="sm"
                  className="h-7 text-xs shrink-0"
                  onClick={handleSaveItem}
                >
                  {t("form.saveItem")}
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="size-7 shrink-0"
                  onClick={handleCancelItemForm}
                >
                  <X className="size-3.5" />
                </Button>
              </div>
            )}
          </div>
        </form>

        <SheetFooter className="px-6 py-4 border-t border-border flex gap-2 shrink-0">
          <SheetClose asChild>
            <Button type="button" variant="outline" className="flex-1">
              {t("actions.cancel")}
            </Button>
          </SheetClose>
          <Button
            type="submit"
            className="flex-1"
            disabled={isSubmitting}
            onClick={handleSubmit(onValid)}
          >
            {isEdit ? t("actions.update") : t("actions.create")}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
