#!/usr/bin/env bash
set -euo pipefail

APP_REPO="${APP_REPO:-https://github.com/NokMyo/calendar.git}"
APP_DIR="${APP_DIR:-$HOME/calendar}"
NODE_MAJOR="${NODE_MAJOR:-20}"

log() {
  printf '\n[calendar] %s\n' "$1"
}

need_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "필요한 명령어를 찾지 못했습니다: $1" >&2
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

if ! command -v sudo >/dev/null 2>&1; then
  echo "sudo가 필요합니다. Raspberry Pi OS 기본 사용자 환경에서 다시 실행해 주세요." >&2
  exit 1
fi

ARCH="$(uname -m)"
if [ "$ARCH" != "aarch64" ] && [ "$ARCH" != "arm64" ]; then
  echo "경고: 현재 아키텍처는 $ARCH 입니다. 이 설치 스크립트는 Raspberry Pi OS 64-bit ARM64 환경을 기준으로 작성되었습니다."
fi

log "패키지 목록을 업데이트합니다."
sudo apt-get update

log "기본 도구를 설치합니다."
sudo apt-get install -y \
  ca-certificates \
  curl \
  git \
  gnupg \
  build-essential \
  python3 \
  pkg-config

log "Node.js ${NODE_MAJOR}.x 저장소를 준비합니다."
curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | sudo -E bash -

log "Electron 실행 라이브러리 이름을 확인합니다."
ASOUND_PACKAGE="$(pick_package libasound2t64 libasound2)"
if [ -z "$ASOUND_PACKAGE" ]; then
  echo "설치 가능한 ALSA 라이브러리 패키지를 찾지 못했습니다. libasound2t64 또는 libasound2가 필요합니다." >&2
  exit 1
fi

log "Node.js와 Electron 실행 라이브러리를 설치합니다."
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

need_command git
need_command node
need_command npm

log "Node 버전: $(node --version)"
log "npm 버전: $(npm --version)"

log "저장소를 준비합니다: $APP_DIR"
if [ -d "$APP_DIR/.git" ]; then
  cd "$APP_DIR"
  git pull --ff-only
else
  rm -rf "$APP_DIR"
  git clone "$APP_REPO" "$APP_DIR"
  cd "$APP_DIR"
fi

log "Node 의존성을 설치합니다."
npm install

log "앱을 빌드합니다."
npm run build

log "설치가 끝났습니다. 아래 명령어로 실행할 수 있습니다."
echo "cd $APP_DIR && npm start"
