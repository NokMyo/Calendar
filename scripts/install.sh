#!/usr/bin/env bash
set -euo pipefail

APP_NAME="Seoldam Calendar Classic Installer"
APP_REPO="${APP_REPO:-https://github.com/NokMyo/calendar.git}"
APP_DIR="${APP_DIR:-$HOME/calendar}"
NODE_MAJOR="${NODE_MAJOR:-20}"

if [ -t 1 ]; then
  BOLD="$(printf '\033[1m')"
  DIM="$(printf '\033[2m')"
  RESET="$(printf '\033[0m')"
  RED="$(printf '\033[31m')"
  GREEN="$(printf '\033[32m')"
  YELLOW="$(printf '\033[33m')"
  BLUE="$(printf '\033[34m')"
  CYAN="$(printf '\033[36m')"
else
  BOLD=""
  DIM=""
  RESET=""
  RED=""
  GREEN=""
  YELLOW=""
  BLUE=""
  CYAN=""
fi

STEP=0
TOTAL_STEPS=8

print_banner() {
  printf '\n'
  printf '%b\n' "${CYAN}╭────────────────────────────────────────────╮${RESET}"
  printf '%b%-44s%b\n' "${CYAN}│${RESET} ${BOLD}" "$APP_NAME" "${RESET}${CYAN}│${RESET}"
  printf '%b\n' "${CYAN}│${RESET} Raspberry Pi OS 64-bit ARM64 target ${CYAN}│${RESET}"
  printf '%b\n' "${CYAN}╰────────────────────────────────────────────╯${RESET}"
  printf '\n'
}

section() {
  STEP=$((STEP + 1))
  printf '\n%b\n' "${BLUE}▶ [$STEP/$TOTAL_STEPS]${RESET} ${BOLD}$1${RESET}"
  printf '%b\n' "${DIM}────────────────────────────────────────────${RESET}"
}

info() {
  printf '%b\n' "${CYAN}ℹ${RESET} $1"
}

success() {
  printf '%b\n' "${GREEN}✓${RESET} $1"
}

warn() {
  printf '%b\n' "${YELLOW}⚠${RESET} $1"
}

fail() {
  printf '%b\n' "${RED}✕${RESET} $1" >&2
}

on_error() {
  local exit_code=$?
  printf '\n'
  fail "설치 중 오류가 발생했습니다. 종료 코드: ${exit_code}"
  info "오류가 난 줄 위쪽의 메시지를 확인해 주세요."
  exit "$exit_code"
}

trap on_error ERR

need_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    fail "필요한 명령어를 찾지 못했습니다: $1"
    exit 1
  fi
}

pick_package() {
  for package_name in "$@"; do
    if apt-cache show "$package_name" >/dev/null 2>&1; then
      echo "$package_name"
      return 0
    fi
  done

  echo ""
  return 1
}

print_banner

section "실행 환경 확인"
if ! command -v sudo >/dev/null 2>&1; then
  fail "sudo가 필요합니다. Raspberry Pi OS 기본 사용자 환경에서 다시 실행해 주세요."
  exit 1
fi
success "sudo 확인 완료"

ARCH="$(uname -m)"
if [ "$ARCH" != "aarch64" ] && [ "$ARCH" != "arm64" ]; then
  warn "현재 아키텍처는 $ARCH 입니다. 이 스크립트는 Raspberry Pi OS 64-bit ARM64 기준입니다."
else
  success "ARM64 환경 확인: $ARCH"
fi

info "설치 경로: $APP_DIR"
info "저장소: $APP_REPO"

section "패키지 목록 업데이트"
sudo apt-get update
success "패키지 목록 업데이트 완료"

section "기본 도구 설치"
sudo apt-get install -y \
  ca-certificates \
  curl \
  git \
  gnupg \
  build-essential \
  python3 \
  pkg-config
success "기본 도구 설치 완료"

section "Node.js ${NODE_MAJOR}.x 저장소 준비"
curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | sudo -E bash -
success "Node.js 저장소 준비 완료"

section "Electron 실행 라이브러리 설치"
ASOUND_PACKAGE="$(pick_package libasound2t64 libasound2)"
if [ -z "$ASOUND_PACKAGE" ]; then
  fail "설치 가능한 ALSA 라이브러리 패키지를 찾지 못했습니다. libasound2t64 또는 libasound2가 필요합니다."
  exit 1
fi
info "ALSA 패키지 선택: $ASOUND_PACKAGE"

sudo apt-get install -y \
  nodejs \
  libgtk-3-0 \
  libnss3 \
  libxss1 \
  "$ASOUND_PACKAGE" \
  libatk-bridge2.0-0 \
  libdrm2 \
  libgbm1 \
  libx11-xcb1 \
  libxcomposite1 \
  libxdamage1 \
  libxrandr2
success "Node.js와 Electron 실행 라이브러리 설치 완료"

need_command git
need_command node
need_command npm
success "Node 버전: $(node --version)"
success "npm 버전: $(npm --version)"

section "calendar 저장소 준비"
if [ -d "$APP_DIR/.git" ]; then
  info "기존 저장소가 있어 최신 상태로 업데이트합니다."
  cd "$APP_DIR"
  git pull --ff-only
else
  info "새로 저장소를 다운로드합니다."
  rm -rf "$APP_DIR"
  git clone "$APP_REPO" "$APP_DIR"
  cd "$APP_DIR"
fi
success "저장소 준비 완료"

section "Node 의존성 설치"
npm install
success "의존성 설치 완료"

section "앱 빌드"
npm run build
success "앱 빌드 완료"

printf '\n%b\n' "${GREEN}╭────────────────────────────────────────────╮${RESET}"
printf '%b\n' "${GREEN}│${RESET} ${BOLD}설치가 완료되었습니다.${RESET}                    ${GREEN}│${RESET}"
printf '%b\n' "${GREEN}╰────────────────────────────────────────────╯${RESET}"
printf '\n'
printf '%b\n' "실행 명령어:"
printf '%b\n' "${BOLD}cd $APP_DIR && npm start${RESET}"
printf '\n'
