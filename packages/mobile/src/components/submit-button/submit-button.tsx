import { ActivityIndicator, TouchableOpacity } from "react-native";

import { ThemedText } from "@/components/themed-text";

type SubmitButtonProps = {
  label: string;
  onPress: () => void;
  loading?: boolean;
  /** 入力が揃っていないなど、押しても意味がない状態 */
  disabled?: boolean;
  /** 通報・削除のように、進めてよいか一度考えさせたい操作は "danger" */
  tone?: "primary" | "danger";
};

export function SubmitButton({
  label,
  onPress,
  loading = false,
  disabled = false,
  tone = "primary",
}: SubmitButtonProps) {
  const inactive = loading || disabled;

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy: loading }}
      onPress={onPress}
      disabled={inactive}
      activeOpacity={0.7}
      style={{ opacity: inactive ? 0.6 : 1 }}
      className={`h-14 flex-row items-center justify-center rounded-2xl px-6 ${
        tone === "danger" ? "bg-danger" : "bg-primary"
      }`}
    >
      {loading ? (
        <ActivityIndicator color="#FFFFFF" />
      ) : (
        // 塗りつぶしのボタンなので、ダークモードでも文字色は白で固定する
        <ThemedText style={{ color: "#FFFFFF", fontWeight: "700" }}>{label}</ThemedText>
      )}
    </TouchableOpacity>
  );
}
