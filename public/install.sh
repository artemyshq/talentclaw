#!/usr/bin/env sh
# TalentClaw installer for macOS arm64
# Usage: curl -fsSL https://talentclaw.sh/install.sh | sh
set -eu

PACKAGE="@artemyshq/talentclaw-cli-darwin-arm64"
VERSION="0.4.1"
INSTALL_DIR="${HOME}/.talentclaw/bin"

# ── Preflight ────────────────────────────────────────────────

OS="$(uname -s)"
ARCH="$(uname -m)"

if [ "$OS" != "Darwin" ]; then
  echo "Error: This installer is for macOS only."
  echo "Detected OS: $OS"
  exit 1
fi

if [ "$ARCH" != "arm64" ]; then
  echo "Error: This installer is for Apple Silicon (arm64) only."
  echo "Detected architecture: $ARCH"
  echo ""
  echo "For Intel Macs, use: npm install -g talentclaw"
  exit 1
fi

echo ""
echo "  🦀 TalentClaw v${VERSION} — installer for macOS arm64"
echo ""

# ── Download ─────────────────────────────────────────────────

TARBALL_URL="https://registry.npmjs.org/${PACKAGE}/-/talentclaw-cli-darwin-arm64-${VERSION}.tgz"
TMPDIR_PATH="$(mktemp -d)"

cleanup() {
  rm -rf "$TMPDIR_PATH"
}
trap cleanup EXIT

echo "  Downloading binary..."
if ! curl -fsSL "$TARBALL_URL" -o "$TMPDIR_PATH/package.tgz" 2>/dev/null; then
  echo ""
  echo "  Error: Failed to download from npm registry."
  echo "  URL: $TARBALL_URL"
  echo ""
  echo "  The package may not be published yet. Try: npx talentclaw"
  exit 1
fi

# ── Extract ──────────────────────────────────────────────────

echo "  Extracting..."
tar -xzf "$TMPDIR_PATH/package.tgz" -C "$TMPDIR_PATH"

BINARY="$TMPDIR_PATH/package/bin/talentclaw"
if [ ! -f "$BINARY" ]; then
  echo "  Error: Binary not found in package."
  exit 1
fi

# ── Install ──────────────────────────────────────────────────

echo "  Installing to ${INSTALL_DIR}/talentclaw..."
mkdir -p "$INSTALL_DIR"
cp "$BINARY" "$INSTALL_DIR/talentclaw"
chmod +x "$INSTALL_DIR/talentclaw"

# ── PATH ─────────────────────────────────────────────────────

case ":${PATH}:" in
  *":${INSTALL_DIR}:"*)
    # Already in PATH
    ;;
  *)
    SHELL_NAME="$(basename "$SHELL")"
    case "$SHELL_NAME" in
      zsh)  RC_FILE="$HOME/.zshrc" ;;
      bash) RC_FILE="$HOME/.bashrc" ;;
      *)    RC_FILE="" ;;
    esac

    if [ -n "$RC_FILE" ]; then
      echo "" >> "$RC_FILE"
      echo "# TalentClaw" >> "$RC_FILE"
      echo "export PATH=\"${INSTALL_DIR}:\$PATH\"" >> "$RC_FILE"
      echo "  Added ${INSTALL_DIR} to PATH in ${RC_FILE}"
    else
      echo "  Add this to your shell profile:"
      echo "    export PATH=\"${INSTALL_DIR}:\$PATH\""
    fi
    ;;
esac

# ── Done ─────────────────────────────────────────────────────

echo ""
echo "  ✓ TalentClaw installed successfully!"
echo ""
echo "  Get started:"
echo "    talentclaw"
echo ""
echo "  If the command isn't found, restart your terminal or run:"
echo "    export PATH=\"${INSTALL_DIR}:\$PATH\""
echo ""
