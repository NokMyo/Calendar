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
  RED="$(printf '\033[91m')"
  GREEN="$(printf '\033[92m')"
  YELLOW="$(printf '\033[93m')"
  CYAN="$(printf '\033[96m')"
  WHITE="$(printf '\033[97m')"
else
  BOLD=""
  DIM=""
  RESET=""
  RED=""
  GREEN=""
  YELLOW=""
  CYAN=""
  WHITE=""
fi

STEP=0
TOTAL_STEPS=8
LINE="--------------------------------------------"

print_banner() {
  printf '\n'
  printf '%b\n' "${WHITE}+--------------------------------------------+${RESET}"
  printf '%b%-44s%b\n' "${WHITE}|${RESET} ${BOLD}" "$APP_NAME" "${RESET}${WHITE}|${RESET}"
  printf '%b\n' "${WHITE}|${RESET} Raspberry Pi OS 64-bit ARM64 target ${WHITE}|${RESET}"
  printf '%b\n' "${WHITE}+--------------------------------------------+${RESET}"
  printf '\n'
}

section() {
  STEP=$((STEP + 1))
  printf '\n%b\n' "${WHITE}${BOLD}> [$STEP/$TOTAL_STEPS] $1${RESET}"
  printf '%b\n' "${DIM}${LINE}${RESET}"
}

info() {
  printf '%b\n' "${CYAN}i${RESET} $1"
}

success() {
  printf '%b\n' "${GREEN}+${RESET} $1"
}

warn() {
  printf '%b\n' "${YELLOW}!${RESET} $1"
}

fail() {
  printf '%b\n' "${RED}x${RESET} $1" >&2
}

on_error() {
  local exit_code=$?
  printf '\n'
  fail "Installation failed. Exit code: ${exit_code}"
  info "Check the message above to find where it failed."
  exit "$exit_code"
}

trap on_error ERR

need_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    fail "Required command not found: $1"
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

section "Checking environment"
if ! command -v sudo >/dev/null 2>&1; then
  fail "sudo is required. Please run this script from the default Raspberry Pi OS user environment."
  exit 1
fi
success "sudo is available"

ARCH="$(uname -m)"
if [ "$ARCH" != "aarch64" ] && [ "$ARCH" != "arm64" ]; then
  warn "Current architecture is $ARCH. This script targets Raspberry Pi OS 64-bit ARM64."
else
  success "ARM64 environment detected: $ARCH"
fi

info "Install path: $APP_DIR"
info "Repository: $APP_REPO"

section "Updating package lists"
sudo apt-get update
success "Package lists updated"

section "Installing base tools and Korean fonts"
sudo apt-get install -y \
  ca-certificates \
  curl \
  git \
  gnupg \
  build-essential \
  python3 \
  pkg-config \
  fontconfig \
  fonts-noto-cjk
sudo fc-cache -f
success "Base tools, fontconfig, and Korean fonts installed"

section "Preparing Node.js ${NODE_MAJOR}.x repository"
curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | sudo -E bash -
success "Node.js repository is ready"

section "Installing Electron runtime libraries"
ASOUND_PACKAGE="$(pick_package libasound2t64 libasound2)"
if [ -z "$ASOUND_PACKAGE" ]; then
  fail "No installable ALSA library package found. libasound2t64 or libasound2 is required."
  exit 1
fi
info "Selected ALSA package: $ASOUND_PACKAGE"

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
success "Node.js and Electron runtime libraries installed"

need_command git
need_command node
need_command npm
success "Node version: $(node --version)"
success "npm version: $(npm --version)"

section "Preparing calendar repository"
if [ -d "$APP_DIR/.git" ]; then
  info "Existing repository found. Updating it now."
  cd "$APP_DIR"
  git pull --ff-only
else
  info "Cloning repository."
  rm -rf "$APP_DIR"
  git clone "$APP_REPO" "$APP_DIR"
  cd "$APP_DIR"
fi
success "Repository is ready"

section "Installing Node dependencies"
npm install
success "Node dependencies installed"

section "Building app"
npm run build
success "App build completed"

printf '\n%b\n' "${GREEN}+--------------------------------------------+${RESET}"
printf '%b\n' "${GREEN}|${RESET} ${BOLD}Installation completed.${RESET}                  ${GREEN}|${RESET}"
printf '%b\n' "${GREEN}+--------------------------------------------+${RESET}"
printf '\n'
printf '%b\n' "Run command:"
printf '%b\n' "${BOLD}cd $APP_DIR && npm start${RESET}"
printf '\n'
