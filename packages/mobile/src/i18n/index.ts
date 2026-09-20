import { getLocales } from "expo-localization";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "@/i18n/locales/en";
import ja from "@/i18n/locales/ja";

const SUPPORTED_LANGUAGES = ["ja", "en"] as const;

const detectLanguage = () => {
  const locale = getLocales()[0];
  const languageCode = locale?.languageCode?.toLowerCase();
  if (languageCode && SUPPORTED_LANGUAGES.includes(languageCode as "ja" | "en")) {
    return languageCode;
  }
  return "en";
};

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources: {
      ja: { translation: ja },
      en: { translation: en },
    },
    lng: detectLanguage(),
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
    },
  });
}

export default i18n;
