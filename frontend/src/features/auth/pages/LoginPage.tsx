import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LoginForm } from "@/features/auth/components/LoginForm";
import { LanguageSwitcher } from "@/shared/components/LanguageSwitcher";

export function LoginPage() {
  const { t } = useTranslation("auth");

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md rounded-lg border p-8 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">{t("login.title")}</h1>
          <LanguageSwitcher />
        </div>
        <LoginForm />
        <p className="mt-4 text-center text-sm text-gray-600">
          {t("login.noAccount")}{" "}
          <Link to="/register" className="text-blue-600 hover:underline">
            {t("login.registerLink")}
          </Link>
        </p>
      </div>
    </div>
  );
}
