import { useTranslation } from "react-i18next";

import { GlassCard } from "@/components/glass-card";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useHealthCheck } from "@/hooks/useHealthCheck";

export default function HomeScreen() {
  const { t } = useTranslation();
  const { data, isLoading, isError } = useHealthCheck();

  return (
    <ThemedView className="flex-1 items-center justify-center gap-4 p-6">
      <ThemedText type="title">{t("home.title")}</ThemedText>
      <ThemedText className="text-center">{t("home.description")}</ThemedText>

      <GlassCard className="w-full items-center rounded-3xl p-5">
        {isLoading && <ThemedText>Loading API health...</ThemedText>}
        {isError && (
          <ThemedText className="text-center">
            API に接続できません（./openapi.yaml とバックエンド URL を設定してください）
          </ThemedText>
        )}
        {data && <ThemedText>API status: {data.status}</ThemedText>}
      </GlassCard>
    </ThemedView>
  );
}
