import { TouchableOpacity, View } from "react-native";

import { Badge } from "@/components/badge";
import { ThemedText } from "@/components/themed-text";

export type MenuItem = {
  label: string;
  /** 右端に表示する補助テキスト（現在値など） */
  value?: string;
  /** 未対応の件数。0 なら出さない */
  badgeCount?: number;
  /** 削除・退会などの取り消しづらい操作は色を変える */
  destructive?: boolean;
  onPress?: () => void;
};

type MenuListProps = {
  /** セクション見出し。省略すると見出しなしで描画する */
  title?: string;
  items: MenuItem[];
};

/**
 * 設定・マイページで使うメニューリスト。
 * 行区切りのグループ表示にしている。
 */
export function MenuList({ title, items }: MenuListProps) {
  return (
    <View className="gap-2">
      {title ? (
        <ThemedText className="px-1 text-xs font-semibold uppercase opacity-50">{title}</ThemedText>
      ) : null}

      <View className="overflow-hidden rounded-2xl border border-black/10 bg-white dark:border-white/10 dark:bg-white/5">
        {items.map((item, index) => (
          <TouchableOpacity
            key={item.label}
            onPress={item.onPress}
            activeOpacity={0.6}
            disabled={!item.onPress}
            className={`flex-row items-center justify-between px-4 py-3.5 ${
              index > 0 ? "border-t border-black/5 dark:border-white/10" : ""
            }`}
          >
            <ThemedText
              lightColor={item.destructive ? "#DC2626" : undefined}
              darkColor={item.destructive ? "#FCA5A5" : undefined}
            >
              {item.label}
            </ThemedText>

            <View className="flex-row items-center gap-2">
              {item.badgeCount === undefined ? null : <Badge count={item.badgeCount} />}
              {item.value ? (
                <ThemedText className="text-sm opacity-50">{item.value}</ThemedText>
              ) : null}
              {item.onPress ? <ThemedText className="text-base opacity-30">›</ThemedText> : null}
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
