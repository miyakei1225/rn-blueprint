/**
 * ヘルスチェック用リポジトリの契約（インターフェース）。
 *
 * domain はここで型（契約）だけを持ち、実装は置かない。
 * 実装は infra/repository/health-repository-impl.ts に書く。
 *
 * 新しいエンティティを追加する際のリポジトリ定義の書き方の見本になっている。
 *   - 型（契約）: src/domain/repository/<entity>-repository.ts
 *   - 実装: src/infra/repository/<entity>-repository-impl.ts
 */
export type HealthRepository = {
  /** DB に SELECT 1 を発行し、疎通を確認する */
  ping(): Promise<boolean>;
};
