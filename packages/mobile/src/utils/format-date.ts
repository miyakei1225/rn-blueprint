/**
 * 日時表示に使う純粋関数。
 * 文言そのものは i18n 側が持つので、ここでは「今日か」「残り何時間か」といった
 * 表示の判断材料だけを返す。
 */

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

export type RelativeDay = "today" | "tomorrow" | "other";

/**
 * 対象の日付が今日・明日・それ以外のどれかを返す。
 * 24 時間の経過ではなく暦日が変わったかで判定する（23:00 の 2 時間後は「明日」）。
 */
export function getRelativeDay(target: Date, now: Date): RelativeDay {
  const days = calendarDayDiff(target, now);
  if (days === 0) {
    return "today";
  }
  if (days === 1) {
    return "tomorrow";
  }
  return "other";
}

/** 暦日での差。今日は 0、昨日は -1、明日は 1。 */
export function calendarDayDiff(target: Date, now: Date): number {
  // 夏時間のある地域で 1 日が 24 時間にならないことがあるので四捨五入する
  return Math.round((startOfDay(target).getTime() - startOfDay(now).getTime()) / DAY_MS);
}

export type Remaining = {
  unit: "days" | "hours" | "minutes";
  count: number;
};

/**
 * 期限までの残り時間。日 → 時間 → 分 の順に単位を切り替える。
 * すでに期限を過ぎている場合は null を返す。
 */
export function getRemaining(target: Date, now: Date): Remaining | null {
  const diff = target.getTime() - now.getTime();
  if (diff <= 0) {
    return null;
  }
  if (diff >= DAY_MS) {
    return { unit: "days", count: Math.floor(diff / DAY_MS) };
  }
  if (diff >= HOUR_MS) {
    return { unit: "hours", count: Math.floor(diff / HOUR_MS) };
  }
  // 1 分未満でも「残り 0 分」とは出さない
  return { unit: "minutes", count: Math.max(1, Math.floor(diff / MINUTE_MS)) };
}

/** 24 時間表記の HH:mm。Intl の実装差に左右されないよう手で組む */
export function formatTime(date: Date): string {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}
