/** これを超える件数は丸める。3 桁になると丸いバッジに収まらない */
const MAX_COUNT = 99;

/** バッジに出す件数。99 を超えたら "99+" にする */
export function formatBadgeCount(count: number): string {
  return count > MAX_COUNT ? `${MAX_COUNT}+` : String(count);
}
