import { TextInput, View, type TextInputProps } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useThemeColor } from "@/hooks/useThemeColor";

type TextFieldProps = TextInputProps & {
  label: string;
  errorMessage?: string;
};

export function TextField({ label, errorMessage, style, ...rest }: TextFieldProps) {
  const color = useThemeColor({}, "text");
  const placeholderTextColor = useThemeColor({}, "icon");

  return (
    <View className="gap-1.5">
      <ThemedText className="text-sm opacity-70">{label}</ThemedText>

      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={placeholderTextColor}
        style={[{ color }, style]}
        className={`h-12 rounded-xl border bg-white px-4 dark:bg-white/5 ${
          errorMessage ? "border-danger" : "border-black/10 dark:border-white/10"
        }`}
        {...rest}
      />

      {errorMessage ? (
        <ThemedText className="text-xs text-danger">{errorMessage}</ThemedText>
      ) : null}
    </View>
  );
}
