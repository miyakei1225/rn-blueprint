import { TouchableOpacity } from "react-native";

import { ThemedText } from "@/components/themed-text";

type ChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
  /** 複数選べる選択肢。読み上げの役割が radio と checkbox で変わる */
  multiple?: boolean;
};

/** カテゴリ・日付・時刻など、横並びで選ぶ選択肢の共通の見た目 */
export function Chip({ label, selected, onPress, multiple = false }: ChipProps) {
  return (
    <TouchableOpacity
      accessibilityRole={multiple ? "checkbox" : "radio"}
      accessibilityState={{ selected, checked: selected }}
      onPress={onPress}
      activeOpacity={0.7}
      className={`rounded-full border px-3.5 py-1.5 ${
        selected
          ? "border-primary bg-primary"
          : "border-black/10 bg-transparent dark:border-white/20"
      }`}
    >
      <ThemedText
        className="text-sm"
        style={selected ? { color: "#FFFFFF", fontWeight: "600" } : undefined}
      >
        {label}
      </ThemedText>
    </TouchableOpacity>
  );
}
