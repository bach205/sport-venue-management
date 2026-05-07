import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import HttpBackend from "i18next-http-backend";
import LanguageDetector from "i18next-browser-languagedetector";

const i18nNamespaces = [
  "common",
  "auth",
  "notifications",
  "feedback",
  "complaints",
  "greetings",

] as const;

type I18nNamespace = (typeof i18nNamespaces)[number];

const namespacePaths: Record<I18nNamespace, string> = {
  common: "common",
  auth: "features/auth",
  notifications: "features/customer-care/notifications",
  feedback: "features/customer-care/feedback",
  complaints: "features/customer-care/complaints",
  greetings: "features/customer-care/greetings",
};

i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    // Supported languages
    supportedLngs: ["vi", "en"],
    fallbackLng: "vi",

    // Namespaces
    ns: i18nNamespaces,
    defaultNS: "common",

    // Load translations from public/locales
    backend: {
      loadPath: (languages: string[], namespaces: string[]) => {
        const language = languages[0] ?? "vi";
        const namespace = namespaces[0] ?? "common";
        const namespacePath = namespacePaths[namespace as I18nNamespace] ?? namespace;

        return `/locales/${language}/${namespacePath}.json`;
      },
    },

    // Language detection order
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: "i18n_language",
    },

    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
