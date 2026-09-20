import { Text, View } from "react-native";

import { formatBadgeCount } from "@/utils/format-badge-count";

const HEIGHT = 20;

type BadgeProps = {
  count: number;
};

/**
 * 未読・未対応の件数を表す丸いバッジ。0 件なら何も描かない。
 *
 * ThemedText ではなく Text を使う。ThemedText は既定で lineHeight: 24 を当てるので、
 * fontSize だけ下げると行の高さが丸の高さを超え、数字が上下に潰れて見える。
 */
export function Badge({ count }: BadgeProps) {
  if (count <= 0) {
    return null;
  }

  return (
    <View
      className="items-center justify-center rounded-full bg-primary px-1.5"
      style={{ height: HEIGHT, minWidth: HEIGHT }}
    >
      <Text
        // Android は行の上下に既定の余白を足すので、切っておかないと数字が下にずれる
        style={{
          color: "#FFFFFF",
          fontSize: 12,
          lineHeight: 14,
          fontWeight: "700",
          includeFontPadding: false,
        }}
      >
        {formatBadgeCount(count)}
      </Text>
    </View>
  );
}
