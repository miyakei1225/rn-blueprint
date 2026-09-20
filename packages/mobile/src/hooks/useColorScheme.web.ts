import { useEffect, useState } from "react";
import { useColorScheme as useRNColorScheme } from "react-native";

// Web での静的レンダリング対応のため、クライアント側でハイドレーション後に再計算する
export function useColorScheme(): "light" | "dark" {
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  const colorScheme = useRNColorScheme();

  if (hasHydrated) {
    return colorScheme === "dark" ? "dark" : "light";
  }

  return "light";
}
