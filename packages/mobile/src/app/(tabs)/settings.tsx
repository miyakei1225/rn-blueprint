import { useTranslation } from "react-i18next";
import { TouchableOpacity } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

const LANGUAGES = ["ja", "en"] as const;

export default function SettingsScreen() {
  const { t, i18n } = useTranslation();

  return (
    <ThemedView className="flex-1 items-center justify-center gap-4 p-6">
      <ThemedText type="title">{t("settings.title")}</ThemedText>
      <ThemedView className="flex-row gap-3">
        {LANGUAGES.map((lng) => (
          <TouchableOpacity
            key={lng}
            className={`rounded-lg px-4 py-2 ${i18n.language === lng ? "bg-primary" : "bg-gray-200"}`}
            onPress={() => i18n.changeLanguage(lng)}
          >
            <ThemedText style={i18n.language === lng ? { color: "#fff" } : undefined}>
              {lng.toUpperCase()}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </ThemedView>
    </ThemedView>
  );
}
