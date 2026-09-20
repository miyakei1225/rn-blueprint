import { Image, View } from "react-native";

import { ThemedText } from "@/components/themed-text";

type AvatarProps = {
  /** 頭文字の表示とアクセシビリティラベルに使う表示名 */
  displayName: string;
  /** プロフィール画像の URL。無ければ表示名の頭文字を出す */
  photoUrl?: string | null;
  size?: "sm" | "md" | "lg";
};

const SIZE_CLASS = {
  sm: "h-10 w-10 rounded-full",
  md: "h-14 w-14 rounded-full",
  lg: "h-20 w-20 rounded-full",
} as const;

const FONT_SIZE = {
  sm: 15,
  md: 20,
  lg: 28,
} as const;

/**
 * プロフィール写真。`photoUrl` が無い場合は頭文字のプレースホルダになる。
 */
export function Avatar({ displayName, photoUrl, size = "md" }: AvatarProps) {
  return (
    <View
      className={`${SIZE_CLASS[size]} items-center justify-center overflow-hidden bg-primary-100 dark:bg-primary-900`}
    >
      {photoUrl ? (
        <Image
          source={{ uri: photoUrl }}
          className="h-full w-full"
          accessibilityLabel={displayName}
          accessibilityIgnoresInvertColors
        />
      ) : (
        <ThemedText
          style={{ fontSize: FONT_SIZE[size], fontWeight: "700" }}
          lightColor="#4A6CF7"
          darkColor="#8CA8F6"
        >
          {displayName.slice(0, 1)}
        </ThemedText>
      )}
    </View>
  );
}
