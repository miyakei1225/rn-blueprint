import { useQuery } from "@tanstack/react-query";

import "@/services/apiClient";
import { getHealth } from "@/generated/sdk.gen";

// TanStack Query + 生成済み API クライアントの組み合わせ例。
// openapi.yaml を実際の仕様に差し替えたら、生成された SDK 関数に置き換える。
export function useHealthCheck() {
  return useQuery({
    queryKey: ["health"],
    queryFn: async () => {
      // throwOnError を付けないと失敗時に data が undefined のまま返り、
      // TanStack Query が「queryFn が undefined を返した」とエラーにする。
      const { data } = await getHealth({ throwOnError: true });
      return data;
    },
  });
}
