import { client } from "@/generated/client.gen";

// `EXPO_PUBLIC_` 付きの変数は Babel がバンドル時にリテラルへ展開するため、この経路だけが
// EAS ビルドに確実に届く。app.config.ts の extra 経由 (Constants.expoConfig.extra) だけに
// 頼ると、`expo export` した成果物が localhost を向いたままになることがある。
const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

// 生成済みクライアントに baseUrl を設定する。認証が必要な場合はここで
// Authorization ヘッダーを追加するインターセプターを差し込む。
client.setConfig({
  baseUrl: apiUrl,
});

export { client };
