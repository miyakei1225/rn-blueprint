import { useColorScheme as useRNColorScheme } from "react-native";

// react-native の ColorSchemeName は "unspecified" や null を含むため、"light" / "dark" に正規化する
export function useColorScheme(): "light" | "dark" {
  return useRNColorScheme() === "dark" ? "dark" : "light";
}
