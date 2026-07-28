#!/bin/bash
set -e

# Zolto Installation Script
# Fetches the latest binary release from GitHub

REPO="uxle/zolto"
BIN_DIR="/usr/local/bin"

echo "Installing Zolto..."
OS="$(uname -s)"
ARCH="$(uname -m)"

if [ "$OS" = "Linux" ]; then
  TARGET="zolto-linux-x64"
elif [ "$OS" = "Darwin" ]; then
  TARGET="zolto-macos-x64"
else
  echo "Unsupported OS: $OS. Please use npm install -g zolto"
  exit 1
fi

if [ "$ARCH" != "x86_64" ] && [ "$ARCH" != "arm64" ]; then
  echo "Unsupported Architecture: $ARCH"
  exit 1
fi

LATEST_RELEASE=$(curl -s https://api.github.com/repos/$REPO/releases/latest | grep "browser_download_url.*$TARGET" | cut -d : -f 2,3 | tr -d \")

if [ -z "$LATEST_RELEASE" ]; then
  echo "Could not find a release for $TARGET"
  exit 1
fi

echo "Downloading $TARGET..."
curl -L -o zolto "$LATEST_RELEASE"
chmod +x zolto

echo "Moving binary to $BIN_DIR (may require sudo)..."
sudo mv zolto "$BIN_DIR/zolto"

echo "Zolto installed successfully!"
zolto version
