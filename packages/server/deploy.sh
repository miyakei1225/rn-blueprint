#!/usr/bin/env bash
set -euo pipefail
shopt -s inherit_errexit 2>/dev/null || true

# API を Cloud Run にデプロイする。
#   ./deploy.sh dev   -> dev プロジェクト
#   ./deploy.sh prd   -> prd プロジェクト

SCRIPT_NAME="$(basename "$0")"
readonly SCRIPT_NAME
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
readonly SCRIPT_DIR
# ビルドコンテキストはリポジトリルート (理由はルートの Dockerfile 冒頭を参照)
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
readonly REPO_ROOT

# ---- プロジェクト固有の設定 ----
# 以下の値をプロジェクトに合わせて変更する。
readonly SERVICE_NAME="blueprint-api"
readonly REGION="asia-northeast1"
readonly DEV_PROJECT_ID="your-project-dev"
readonly PRD_PROJECT_ID="your-project-prd"

# Cloud SQL (PostgreSQL)。インスタンス名は dev / prd で共通で、プロジェクトで分ける。
readonly SQL_INSTANCE_NAME="blueprint-db"
readonly DB_USER="app"
readonly DB_NAME="blueprint"
# パスワードは Secret Manager から注入する (README の「秘匿情報」を参照)
readonly DB_PASSWORD_SECRET="blueprint-db-password"
readonly MAX_INSTANCES=5
# MAX_INSTANCES × この値が Cloud SQL の最大接続数を超えないこと
readonly DB_MAX_POOL_SIZE=3
# ---- ここまで ----

readonly LOG_LEVEL="${LOG_LEVEL:-info}"
readonly COLOR_RED='\033[0;31m'
readonly COLOR_GREEN='\033[0;32m'
readonly COLOR_YELLOW='\033[1;33m'
readonly COLOR_BLUE='\033[0;34m'
readonly COLOR_RESET='\033[0m'

log_info() { printf '%b[INFO]%b %s\n' "${COLOR_GREEN}" "${COLOR_RESET}" "$*"; }
log_warn() { printf '%b[WARN]%b %s\n' "${COLOR_YELLOW}" "${COLOR_RESET}" "$*" >&2; }
log_error() { printf '%b[ERROR]%b %s\n' "${COLOR_RED}" "${COLOR_RESET}" "$*" >&2; }
log_debug() { [[ "${LOG_LEVEL}" != "debug" ]] && return 0; printf '%b[DEBUG]%b %s\n' "${COLOR_BLUE}" "${COLOR_RESET}" "$*" >&2; }
die() {
  log_error "$*"
  exit 1
}

usage() {
  cat <<EOU
${SCRIPT_NAME} - API を Cloud Run にデプロイする

Usage: ${SCRIPT_NAME} <dev|prd> [options]
       ${SCRIPT_NAME} status <dev|prd>
       ${SCRIPT_NAME} test

Subcommands:
  dev          開発環境 (${DEV_PROJECT_ID}) にデプロイ
  prd          本番環境 (${PRD_PROJECT_ID}) にデプロイ
  status       デプロイ済みサービスの URL とヘルスチェック結果を表示
  test         スクリプト自身のスモークテスト

Options:
  -h, --help   ヘルプ表示
  --yes        確認をスキップ (prd デプロイ時のみ確認あり)
  --dry-run    実行せずコマンドを表示するだけ
EOU
}

confirm() {
  local prompt="$1"
  if [[ "${ASSUME_YES:-false}" == "true" ]]; then
    return 0
  fi
  read -r -p "${prompt} (yes/no): " answer
  [[ "$answer" =~ ^[Yy][Ee][Ss]$ ]]
}

check_requirements() {
  local missing=()
  local required_commands=(gcloud curl)

  for cmd in "${required_commands[@]}"; do
    command -v "$cmd" > /dev/null 2>&1 || missing+=("$cmd")
  done
  ((${#missing[@]} > 0)) && die "Missing commands: ${missing[*]} (https://cloud.google.com/sdk/docs/install)"
  return 0
}

# 環境名 -> プロジェクト ID
project_id_for() {
  local env="$1"
  case "$env" in
    dev) printf '%s' "$DEV_PROJECT_ID" ;;
    prd) printf '%s' "$PRD_PROJECT_ID" ;;
    *)
      log_error "Unknown environment: $env" >&2
      return 1
      ;;
  esac
}

# 環境名 -> Cloud SQL のインスタンス接続名 (<project>:<region>:<instance>)
instance_connection_name_for() {
  local env="$1"
  local project_id
  project_id="$(project_id_for "$env")" || return 1
  printf '%s:%s:%s' "$project_id" "$REGION" "$SQL_INSTANCE_NAME"
}

service_url() {
  local project_id="$1"
  local url
  url="$(gcloud run services describe "$SERVICE_NAME" \
    --project "$project_id" \
    --region "$REGION" \
    --format 'value(status.url)' 2>&1)" || {
    log_error "Failed to describe service: $url"
    return 1
  }
  printf '%s' "$url"
}

parse_args() {
  COMMAND=""
  COMMAND_ARGS=()
  DRY_RUN=false
  ASSUME_YES=false

  while [[ $# -gt 0 ]]; do
    case "$1" in
      -h | --help)
        usage
        exit 0
        ;;
      --yes)
        ASSUME_YES=true
        shift
        ;;
      --dry-run)
        DRY_RUN=true
        shift
        ;;
      -*)
        die "Unknown option: $1"
        ;;
      *)
        # 最初の非オプション引数がサブコマンド、以降はその引数
        # (`status dev` の dev をサブコマンドと解釈しないため順序で判定する)
        if [[ -z "$COMMAND" ]]; then
          case "$1" in
            dev | prd | status | test) COMMAND="$1" ;;
            *) die "Unknown command: $1" ;;
          esac
        else
          COMMAND_ARGS+=("$1")
        fi
        shift
        ;;
    esac
  done

  if [[ -z "$COMMAND" ]]; then
    usage
    exit 0
  fi
}

cmd_deploy() {
  local env="$1"
  local project_id instance_connection_name
  project_id="$(project_id_for "$env")"
  instance_connection_name="$(instance_connection_name_for "$env")"

  check_requirements

  log_info "Environment: ${env}"
  log_info "Project:     ${project_id}"
  log_info "Service:     ${SERVICE_NAME}"
  log_info "Region:      ${REGION}"
  log_info "Cloud SQL:   ${instance_connection_name}"

  local -a deploy_cmd=(
    gcloud run deploy "$SERVICE_NAME"
    --source "$REPO_ROOT"
    --project "$project_id"
    --region "$REGION"
    --platform managed
    --allow-unauthenticated
    --port 8080
    --memory 512Mi
    --cpu 1
    --min-instances 0
    --max-instances "$MAX_INSTANCES"
    --timeout 60
    # コンテナ内の /cloudsql/<接続名> に Unix ソケットが生える
    --add-cloudsql-instances "$instance_connection_name"
    --set-env-vars "NODE_ENV=production,APP_ENV=${env},INSTANCE_CONNECTION_NAME=${instance_connection_name},DB_USER=${DB_USER},DB_NAME=${DB_NAME},DB_MAX_POOL_SIZE=${DB_MAX_POOL_SIZE}"
    --set-secrets "DB_PASSWORD=${DB_PASSWORD_SECRET}:latest"
  )

  if [[ "$DRY_RUN" == "true" ]]; then
    log_info "DRY RUN: ${deploy_cmd[*]}"
    return 0
  fi

  if [[ "$env" == "prd" ]]; then
    confirm "本番 (${project_id}) にデプロイします。続行しますか?" || die "Aborted by user"
  fi

  log_info "Deploying..."
  "${deploy_cmd[@]}"

  log_info "Deployment complete"
  cmd_status "$env"
}

cmd_status() {
  local env="${1:-}"
  [[ -n "$env" ]] || die "Usage: ${SCRIPT_NAME} status <dev|prd>"

  check_requirements

  local project_id url http_code
  project_id="$(project_id_for "$env")"
  url="$(service_url "$project_id")" || return 1

  log_info "Service URL: ${url}"

  http_code="$(curl -s -o /dev/null -w '%{http_code}' --max-time 30 "${url}/health")" || {
    log_error "Health check request failed"
    return 1
  }

  case "$http_code" in
    200)
      log_info "Health check: OK (200)"
      curl -s --max-time 30 "${url}/health"
      printf '\n'
      ;;
    *)
      log_error "Health check failed with status ${http_code}"
      return 1
      ;;
  esac
}

cmd_test() {
  local failed=0

  "$0" --help > /dev/null 2>&1 || {
    log_error "FAIL: --help"
    ((failed++)) || true
  }
  [[ "$(project_id_for dev)" == "$DEV_PROJECT_ID" ]] || {
    log_error "FAIL: project_id_for dev"
    ((failed++)) || true
  }
  [[ "$(project_id_for prd)" == "$PRD_PROJECT_ID" ]] || {
    log_error "FAIL: project_id_for prd"
    ((failed++)) || true
  }
  [[ "$(instance_connection_name_for dev)" == "${DEV_PROJECT_ID}:${REGION}:${SQL_INSTANCE_NAME}" ]] || {
    log_error "FAIL: instance_connection_name_for dev"
    ((failed++)) || true
  }
  # check_requirements は不足時に die (exit 1) するため、サブシェルで実行する。
  # そのまま呼ぶとスクリプトごと終了し、この || ハンドラも下のサマリも実行されない。
  (check_requirements) > /dev/null 2>&1 || {
    log_error "FAIL: check_requirements (gcloud / curl が見つからない)"
    ((failed++)) || true
  }

  ((failed > 0)) && {
    log_error "Failed: ${failed} tests"
    return 1
  }
  log_info "All tests passed"
}

main() {
  parse_args "$@"

  case "$COMMAND" in
    dev | prd) cmd_deploy "$COMMAND" ;;
    status) cmd_status ${COMMAND_ARGS[@]+"${COMMAND_ARGS[@]}"} ;;
    test) cmd_test ;;
    *) die "Unknown command: $COMMAND" ;;
  esac
}

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  main "$@"
fi
