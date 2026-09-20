import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
import { cssInterop } from "nativewind";
import { View, type ViewProps } from "react-native";

// NativeWind は自前で対応しているコンポーネント以外に className を渡せないため、明示的に登録する
const StyledGlassView = cssInterop(GlassView, { className: "style" });

export function GlassCard({ className, ...otherProps }: ViewProps) {
  // Liquid Glass は iOS 26 以降でのみ利用できる。Android / Web / iOS 25 以下では
  // 半透明の背景で代替する。
  if (!isLiquidGlassAvailable()) {
    return <View className={`bg-black/5 dark:bg-white/10 ${className ?? ""}`} {...otherProps} />;
  }

  return <StyledGlassView className={className} glassEffectStyle="regular" {...otherProps} />;
}
