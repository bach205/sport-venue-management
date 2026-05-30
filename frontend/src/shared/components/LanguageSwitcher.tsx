import { useLanguage, type SupportedLanguage } from "@/shared/hooks/useLanguage";
import { cn } from "@/shared/utils/cn";
import { useTranslation } from "react-i18next";

const LANGUAGES: { value: SupportedLanguage; labelKey: string; flag: string }[] = [
  { value: "vi", labelKey: "languages.vi", flag: "🇻🇳" },
  { value: "en", labelKey: "languages.en", flag: "🇺🇸" },
];

interface LanguageSwitcherProps {
  className?: string;
}

export function LanguageSwitcher({ className }: LanguageSwitcherProps) {
  const { t } = useTranslation("matching");
  const { currentLanguage, changeLanguage } = useLanguage();

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {LANGUAGES.map((lang) => (
        <button
          key={lang.value}
          onClick={() => changeLanguage(lang.value)}
          title={t(lang.labelKey)}
          className={cn(
            "rounded px-2 py-1 text-sm transition",
            currentLanguage === lang.value
              ? "bg-blue-100 font-semibold text-blue-700"
              : "text-gray-500 hover:bg-gray-100"
          )}
        >
          {lang.flag} {lang.value.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
