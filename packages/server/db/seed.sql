-- ローカル確認用のシード。`pnpm db:seed` で流し込む。
--
-- テーブルを追加したら、ここに対応するサンプルデータを追加する。
-- 本番の Cloud SQL には絶対に流し込まない。

-- 例: users テーブルを追加したとき
-- INSERT INTO users (id, name, email) VALUES
--   ('aaaaaaaa-1111-4111-8111-111111111111', 'サンプルユーザー', 'sample@example.com')
-- ON CONFLICT (id) DO NOTHING;
