# RULES.md

## 1. Stack & Versions

| Layer | Package | Version |
|---|---|---|
| Build | Vite | ^8.0.0 |
| UI | React | ^19.1.0 |
| Language | TypeScript | ^5.8.3 |
| Styling | Tailwind CSS v4 | ^4.1.6 |
| Routing | react-router-dom | ^7.5.3 |
| State | @reduxjs/toolkit + react-redux | ^2.8.2 / ^9.2.0 |
| Forms | react-hook-form + zod + @hookform/resolvers | ^7.55.0 / ^3.24.4 / ^5.2.2 |
| HTTP | axios | ^1.8.4 |
| i18n | i18next + react-i18next | ^26.0.8 / ^17.0.6 |
| Date | date-fns | ^4.1.0 |
| Icons | lucide-react | ^0.511.0 |
| Excel | xlsx | ^0.18.5 |
| OCR | tesseract.js | ^5.1.0 |

---

## 2. Folder Structure

```
src/
├── app/                     # Global setup only
│   ├── App.tsx
│   ├── router.tsx
│   └── providers/
│
├── features/                # One folder per domain
│   └── {feature}/
│       ├── pages/           # Route-level components
│       ├── components/      # UI dùng riêng cho feature này
│       ├── hooks/           # Custom hooks của feature
│       ├── api/             # API calls của feature
│       ├── types/           # TypeScript types/interfaces
│       ├── constants/       # Feature-specific constants
│       ├── context/         # Feature-specific context/providers
│       └── utils/           # Helpers, schemas, validators
│
├── shared/                  # Dùng lại ở nhiều features
│   ├── components/          # Button, Input, Modal, ...
│   ├── hooks/               # useAppDispatch, useAppSelector, useLanguage, ...
│   ├── api/                 # axiosClient.ts
│   ├── constants/           # env.ts, ...
│   ├── types/               # commonTypes.ts
│   ├── utils/               # cn.ts, formatDate.ts, fileUtils.ts, ...
│   ├── i18n/                # i18n.ts, i18n.d.ts
│   ├── context/             # AuthContext.tsx, ThemeContext.tsx, ...
│   └── store.ts
│
├── assets/                  # Static: images, fonts, svgs
├── main.tsx
└── index.css

public/
└── locales/
    ├── vi/
    │   ├── common.json
    │   └── features/        # auth.json | product.json | {domain}/{feature}.json
    └── en/
        ├── common.json
        └── features/        # auth.json | product.json | {domain}/{feature}.json
```

**Rule quyết định vị trí file:**
- Code chỉ dùng trong 1 feature → `features/{feature}/`
- Code dùng ở ≥ 2 features → `shared/`
- Setup global (router, providers) → `app/`

---

## 3. Import Rules

### ✅ Luôn dùng alias `@/` — KHÔNG dùng relative path lên thư mục cha

```ts
// ✅ Đúng
import { LoginForm } from "@/features/auth/components/LoginForm";
import { useLogin } from "@/features/auth/hooks/useLogin";
import { authApi } from "@/features/auth/api/authApi";
import { apiRouteClient } from "@/shared/api/axiosClient"; // import service client cần dùng
import { cn } from "@/shared/utils/cn";

// ❌ Sai
import { LoginForm } from "../components/LoginForm";
import { apiRouteClient } from "../../shared/api/axiosClient";
```

### ❌ KHÔNG dùng barrel exports (index.ts re-export)

```ts
// ❌ Không tạo file này
// features/auth/index.ts
export * from "./components/LoginForm";
export * from "./hooks/useLogin";

// ✅ Import trực tiếp đến file
import { LoginForm } from "@/features/auth/components/LoginForm";
```

---

## 4. TypeScript

- Luôn dùng `interface` cho object shapes, `type` cho unions/intersections
- Không dùng `any` — dùng `unknown` nếu chưa biết type
- Không dùng `as` ép kiểu trừ khi thực sự cần (ghi comment lý do)
- Props của component phải có interface riêng, đặt ngay trên component

```ts
// ✅ Đúng
interface ProductCardProps {
  product: Product;
  onSelect?: (product: Product) => void;
}

export function ProductCard({ product, onSelect }: ProductCardProps) { ... }

// ❌ Sai
export function ProductCard({ product, onSelect }: { product: any; onSelect: any }) { ... }
```

- Export kiểu tường minh: dùng `export type` cho types/interfaces

```ts
export type { LoginFormValues };   // ✅
export { loginSchema };            // ✅
```

---

## 5. Component Conventions

- Luôn dùng **named export**, không dùng default export cho components

```ts
// ✅
export function LoginForm() { ... }

// ❌
export default function LoginForm() { ... }
```

- Tên file = tên component (PascalCase): `LoginForm.tsx`
- Hooks: camelCase bắt đầu bằng `use`: `useLogin.ts`
- Không để logic trong JSX — tách ra hooks hoặc utils
- Không dùng `<div>` cho interactive elements — dùng `<button>`, `<a>`, v.v.

---

## 6. Styling — Tailwind CSS v4

- **Không** dùng `tailwind.config.js` hay `postcss.config.js` — Tailwind v4 dùng Vite plugin
- Import trong `index.css`:

```css
@import "tailwindcss";
@import "tw-animate-css";
```

- Dùng `cn()` từ `@/shared/utils/cn` để merge classes có điều kiện:

```ts
import { cn } from "@/shared/utils/cn";

className={cn("base-class", isActive && "active-class", className)}
```

- Không inline style (`style={{}}`) trừ khi là dynamic value không thể dùng class

---

## 7. Forms

Stack cố định: `react-hook-form` + `zod` + `@hookform/resolvers`

```ts
// utils/validateXxx.ts — định nghĩa schema + infer type tại đây
export const loginSchema = z.object({ ... });
export type LoginFormValues = z.infer<typeof loginSchema>;

// component — chỉ dùng schema, không validate thủ công
const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
  resolver: zodResolver(loginSchema),
});
```

- Schema đặt trong `features/{feature}/utils/validate{Name}.ts`
- Không dùng `useState` để manage form state — để react-hook-form lo

---

## 8. API Layer

```ts
// shared/api/axiosClient.ts — export các service clients đã có interceptors
import {
  apiRouteClient,
} from "@/shared/api/axiosClient";

// features/{feature}/api/{feature}Api.ts — gọi service client tương ứng
export const authApi = {
  login: (data: LoginRequest) => apiRouteClient.post<AuthResponse>("/auth/login", data),
};

export const assetApi = {
  getList: () => apiRouteClient.get<Asset[]>("/assets"),
};

export const customerApi = {
  submitComplaint: (data: ComplaintRequest) =>
    apiRouteClient.post<ComplaintResponse>("/complaints", data),
};
```

- Không gọi `axios` trực tiếp — luôn dùng service client từ `@/shared/api/axiosClient`
- Response type luôn được generic: `serviceClient.get<MyType>("/path")`
- Chọn đúng service client cho mỗi feature (xem danh sách ở `.env.example`)
- Xử lý error trong hook, không trong api file

---

## 9. State Management (Redux Toolkit)

- Slice đặt trong `features/{feature}/` nếu state của riêng feature đó
- Slice đặt trong `shared/` nếu state dùng chung (ví dụ: auth session, theme)
- Luôn dùng typed hooks:

```ts
import { useAppDispatch } from "@/shared/hooks/useAppDispatch";
import { useAppSelector } from "@/shared/hooks/useAppSelector";
```

- Không import `useDispatch`, `useSelector` trực tiếp từ `react-redux`

---

## 10. i18n

- **Không hardcode text** trong UI — luôn dùng `t()`
- Namespace dùng camelCase: `"auth"`, `"product"`, `"financialReports"`, `"buildingSettings"`
- Không dùng kebab-case cho namespace trong code: dùng `"financialReports"`, không dùng `"financial-reports"`
- `common.json` đặt tại `public/locales/{lang}/common.json`
- File JSON của feature đặt theo domain tại `public/locales/{lang}/features/{domain}/{feature}.json`
- Feature root hiện có thể đặt tại `public/locales/{lang}/features/{feature}.json` (ví dụ: `auth`, `product`)
- Khi thêm key mới: thêm vào **cả `vi` lẫn `en`**

```ts
// Lấy đúng namespace
const { t } = useTranslation("auth");
t("login.title");

const { t: tFinancialReports } = useTranslation("financialReports");
tFinancialReports("list.title");

// Namespace mặc định là "common"
const { t: tCommon } = useTranslation();
tCommon("loading");

// Switch ngôn ngữ
const { toggleLanguage, currentLanguage } = useLanguage();
```

- TypeScript autocomplete cho keys hoạt động nhờ `src/shared/i18n/i18n.d.ts`
- Khi thêm namespace mới: khai báo thêm trong `i18n.ts` và `i18n.d.ts`

---

## 11. File Utilities

- **Excel** — dùng helpers từ `@/shared/utils/fileUtils`:

```ts
import { readExcelFile, exportToExcel } from "@/shared/utils/fileUtils";
```

- **OCR** — `extractTextFromImage()` trong cùng file, lazy import tesseract để tránh bundle lớn
- **Không** import `xlsx` hay `tesseract.js` trực tiếp trong components — luôn qua utils

---

## 12. Naming Conventions

| Loại | Convention | Ví dụ |
|---|---|---|
| Component file | PascalCase | `LoginForm.tsx` |
| Hook file | camelCase | `useLogin.ts` |
| Util / helper | camelCase | `formatDate.ts` |
| Type / interface | PascalCase | `AuthResponse`, `LoginRequest` |
| Const (enum-like) | SCREAMING_SNAKE | `API_BASE_URL` |
| API object | camelCase + `Api` suffix | `authApi`, `productApi` |
| Redux slice | camelCase + `Slice` suffix | `authSlice` |
| i18n namespace | lowercase = feature name | `"auth"`, `"product"` |

---

## 13. Checklist khi tạo Feature mới

```
features/{newFeature}/
├── pages/         ← route components
├── components/    ← UI của feature
├── hooks/         ← custom hooks
├── api/           ← {newFeature}Api.ts  (import service client từ @/shared/api/axiosClient)
├── types/         ← {newFeature}Types.ts
└── utils/         ← validate{Name}.ts (zod schemas)

public/locales/vi/features/{domain}/{newFeature}.json
public/locales/en/features/{domain}/{newFeature}.json

Namespace i18n dùng camelCase:
useTranslation("newFeature")
useTranslation("financialReports")    ← không dùng "financial-reports"

src/shared/i18n/i18n.ts              ← map namespace camelCase tới file JSON
src/shared/i18n/i18n.d.ts            ← khai báo namespace mới
src/app/router.tsx                    ← thêm route mới
```
