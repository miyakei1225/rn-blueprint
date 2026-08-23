import Constants from "expo-constants";
import { client } from "@/src/generated/client.gen";

const apiUrl = (Constants.expoConfig?.extra?.apiUrl as string | undefined) ?? "http://localhost:3000";

// 生成済みクライアントに baseUrl を設定する。認証が必要な場合はここで
// Authorization ヘッダーを追加するインターセプターを差し込む。
client.setConfig({
  baseUrl: apiUrl,
});

export { client };
