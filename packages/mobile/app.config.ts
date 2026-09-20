import type { ConfigContext, ExpoConfig } from "expo/config";

import packageJson from "./package.json";

// EAS プロジェクトを作ると `eas init` が projectId を払い出す。OTA 更新の配信先は
// https://u.expo.dev/<projectId>。雛形の時点では実プロジェクトが無いので環境変数で渡す。
const easProjectId = process.env.EAS_PROJECT_ID;

export default ({ config }: ConfigContext): ExpoConfig | Partial<ExpoConfig> => {
  return {
    ...config,
    // バージョンの SoT は package.json (release-please が更新する)。app.json には持たせない
    version: packageJson.version,
    // ネイティブの互換性をビルド内容のハッシュで判定する。JS だけの変更は OTA で配信でき、
    // ネイティブモジュールが変わると自動で別ランタイム扱いになる
    runtimeVersion: {
      policy: "fingerprint",
    },
    updates: {
      ...config.updates,
      url: easProjectId ? `https://u.expo.dev/${easProjectId}` : undefined,
    },
    extra: {
      ...config.extra,
      apiUrl: process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000",
      eas: {
        ...config.extra?.eas,
        projectId: easProjectId,
      },
    },
  };
};
