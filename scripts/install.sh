#!/usr/bin/env bash
set -euo pipefail

APP_REPO="${APP_REPO:-https://github.com/NokMyo/calendar.git}"
APP_DIR="${APP_DIR:-$HOME/calendar}"

log() {
  printf '\n[calendar] %s\n' "$1"
}

need_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "필요한 명령어를 찾지 못했습니다: $1" >&2
    exit 1
  fi
}

if ! command -v sudo >/dev/null 2>&1; then
  echo "sudo가 필요합니다. 먼저 sudo를 설치하거나 root 계정으로 실행해 주세요." >&2
  exit 1
fi

log "기본 패키지를 업데이트합니다."
sudo apt-get update

log "필요한 패키지를 설치합니다."
sudo apt-get install -y \
  git \
  curl \
  build-essential \
  python3 \
  pkg-config \
  nodejs \
  npm \
  libgtk-3-0 \
  libnss3 \
  libxss1 \
  libasound2 \
  libatk-bridge2.0-0 \
  libdrm2 \
  libgbm1

need_command git
need_command node
need_command npm

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
