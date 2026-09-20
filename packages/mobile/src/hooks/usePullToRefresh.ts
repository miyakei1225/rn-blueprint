import { useCallback, useState } from "react";

/**
 * 引っ張って更新のスピナーを、ユーザーが引っ張ったときだけ出す。
 *
 * TanStack Query の `isRefetching` をそのまま RefreshControl に渡すと、`useFocusEffect`
 * での再取得でもスピナー分の contentInset が入り、タブを表示するたびにリストが動く。
 */
export function usePullToRefresh(refetch: () => Promise<unknown>) {
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  return { refreshing, onRefresh };
}
