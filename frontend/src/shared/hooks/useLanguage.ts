import { useTranslation } from "react-i18next";

export type SupportedLanguage = "vi" | "en";

export function useLanguage() {
  const { i18n } = useTranslation();

  const currentLanguage = i18n.language as SupportedLanguage;

  const changeLanguage = (lang: SupportedLanguage) => {
    i18n.changeLanguage(lang);
  };

  const toggleLanguage = () => {
    changeLanguage(currentLanguage === "vi" ? "en" : "vi");
  };

  return {
    currentLanguage,
    changeLanguage,
    toggleLanguage,
    isVietnamese: currentLanguage === "vi",
    isEnglish: currentLanguage === "en",
  };
}
