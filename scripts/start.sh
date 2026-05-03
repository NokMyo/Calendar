#!/usr/bin/env bash
set -euo pipefail

APP_NAME="Seoldam Calendar Classic Launcher"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ELECTRON_BIN="$APP_DIR/node_modules/.bin/electron"
SANDBOX_BIN="$APP_DIR/node_modules/electron/dist/chrome-sandbox"

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

print_banner() {
  printf '\n'
  printf '%b\n' "${WHITE}+--------------------------------------------+${RESET}"
  printf '%b%-44s%b\n' "${WHITE}|${RESET} ${BOLD}" "$APP_NAME" "${RESET}${WHITE}|${RESET}"
  printf '%b\n' "${WHITE}|${RESET} Preparing Electron runtime             ${WHITE}|${RESET}"
  printf '%b\n' "${WHITE}+--------------------------------------------+${RESET}"
  printf '\n'
}

section() {
  printf '\n%b\n' "${WHITE}${BOLD}> $1${RESET}"
  printf '%b\n' "${DIM}--------------------------------------------${RESET}"
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
  fail "Launch failed. Exit code: ${exit_code}"
  info "Check the message above to find where it failed."
  exit "$exit_code"
}

trap on_error ERR

configure_sandbox() {
  if [ ! -f "$SANDBOX_BIN" ]; then
    warn "chrome-sandbox was not found. Skipping sandbox permission setup."
    return 0
  fi

  local owner
  local mode
  owner="$(stat -c '%U:%G' "$SANDBOX_BIN" 2>/dev/null || echo unknown)"
  mode="$(stat -c '%a' "$SANDBOX_BIN" 2>/dev/null || echo unknown)"

  if [ "$owner" = "root:root" ] && [ "$mode" = "4755" ]; then
    success "Chrome sandbox permission is already configured"
    return 0
  fi

  info "Current sandbox permission: owner=$owner mode=$mode"

  if ! command -v sudo >/dev/null 2>&1; then
    fail "sudo is required to configure chrome-sandbox."
    fail "Run manually: chown root:root '$SANDBOX_BIN' && chmod 4755 '$SANDBOX_BIN'"
    exit 1
  fi

  info "Configuring chrome-sandbox permission with sudo"
  sudo chown root:root "$SANDBOX_BIN"
  sudo chmod 4755 "$SANDBOX_BIN"
  success "Chrome sandbox permission configured"
}

print_banner

section "Checking app directory"
info "App path: $APP_DIR"

if [ ! -f "$APP_DIR/package.json" ]; then
  fail "package.json was not found. Run this script inside the calendar repository."
  exit 1
fi
success "App directory is ready"

section "Checking Electron binary"
if [ ! -x "$ELECTRON_BIN" ]; then
  fail "Electron binary was not found. Run npm install first."
  fail "Command: cd '$APP_DIR' && npm install"
  exit 1
fi
success "Electron binary is ready"

section "Checking display session"
if [ -z "${DISPLAY:-}" ] && [ -z "${WAYLAND_DISPLAY:-}" ]; then
  warn "No DISPLAY or WAYLAND_DISPLAY was detected."
  warn "Electron needs a graphical session such as Raspberry Pi OS Desktop, X11, Wayland, VNC, or XRDP."
else
  success "Graphical session detected"
fi

section "Configuring Chromium sandbox"
configure_sandbox

section "Starting Seoldam Calendar Classic"
cd "$APP_DIR"
info "Launching Electron"
exec "$ELECTRON_BIN" . "$@"
