import { z } from "zod";

export const assetFormSchema = z
  .object({
    buildingId: z.string().min(1, "required"),
    ownershipScope: z.enum(["COMMON", "PRIVATE"]),
    unitId: z.string().optional(),
    assetCode: z.string().min(1, "required"),
    name: z.string().min(1, "required"),
    assetType: z.string().min(1, "required"),
    location: z.string().optional(),
    roomType: z.string().optional(),
    brand: z.string().optional(),
    model: z.string().optional(),
    serialNumber: z.string().optional(),
    description: z.string().optional(),
    active: z.boolean(),
    installedAt: z.string().optional(),
    warrantyUntil: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.ownershipScope === "PRIVATE" && !data.unitId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "required",
        path: ["unitId"],
      });
    }
  });

export type AssetFormValues = z.infer<typeof assetFormSchema>;
