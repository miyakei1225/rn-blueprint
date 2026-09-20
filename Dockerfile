# packages/server (Cloud Run) のイメージ。
#
# ビルドコンテキストがリポジトリルートなのは、pnpm workspace の lockfile が
# ルートに 1 つしかないため。packages/server 単体をコンテキストにすると
# `pnpm install --frozen-lockfile` が lockfile を見つけられない。

FROM node:24-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable
WORKDIR /repo

# --frozen-lockfile は lockfile と全 importer の package.json の一致を検証するので、
# mobile 側の package.json も必要。ただし依存を入れるのは server だけにしたい。
#
# ここで --config.nodeLinker=isolated を渡しているのは、pnpm-workspace.yaml の
# hoisted linker のままだと --filter を付けても workspace 全体 (Expo 込み 500MB 超) が
# ルートの node_modules にホイストされてしまうため。hoisted が必要なのは React Native の
# autolinking であって、このイメージには関係ない。node-linker は lockfile に
# 記録されない設定なので --frozen-lockfile の検証には影響しない。
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/mobile/package.json packages/mobile/
COPY packages/api-spec/package.json packages/api-spec/
COPY packages/server/package.json packages/server/
RUN pnpm install --frozen-lockfile --filter @rn-blueprint/server --config.nodeLinker=isolated

FROM deps AS build
COPY packages/server/tsconfig.json packages/server/
COPY packages/server/src packages/server/src
# pnpm 11 はスクリプト実行前に依存の整合を検証し、ずれていれば install をやり直す。
# このイメージは --filter で server の依存だけを入れた「意図的に不完全な」workspace
# なので、その検証には必ず失敗する。直前の deps ステージが --frozen-lockfile で
# 入れ終えているため、ここでは検証を切る。
RUN pnpm --config.verifyDepsBeforeRun=false --filter @rn-blueprint/server build

FROM base AS prod-deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/mobile/package.json packages/mobile/
COPY packages/api-spec/package.json packages/api-spec/
COPY packages/server/package.json packages/server/
RUN pnpm install --frozen-lockfile --prod --filter @rn-blueprint/server --config.nodeLinker=isolated

# base ではなく node:24-slim から始めるのは、pnpm のストア (約 460MB) と corepack の
# キャッシュ (約 20MB) をイメージに残さないため。install を同じステージで実行すると、
# 実行時に使わないこれらが丸ごと層に載る。CMD は node を直接叩くので pnpm は要らない。
FROM node:24-slim AS release
ENV NODE_ENV=production
WORKDIR /repo
COPY --from=prod-deps /repo/node_modules node_modules
COPY --from=prod-deps /repo/packages/server/node_modules packages/server/node_modules
# "type": "module" を読ませるために実行時も必要
COPY packages/server/package.json packages/server/
COPY --from=build /repo/packages/server/dist packages/server/dist

WORKDIR /repo/packages/server

# Cloud Run は PORT を注入する。この既定値はローカル docker run 用
ENV PORT=8080
EXPOSE 8080

USER node

CMD ["node", "dist/index.js"]
