#!/bin/bash
set -e # Exit immediately if a command exits with a non-zero status

# Configuration
FLUTTER_CHANNEL="stable"
# Use a shallow clone to save time and bandwidth
if [ ! -d "flutter" ]; then
  echo ">>> Downloading Flutter SDK ($FLUTTER_CHANNEL)..."
  git clone https://github.com/flutter/flutter.git -b $FLUTTER_CHANNEL --depth 1
fi

export PATH="$PATH:`pwd`/flutter/bin"

echo ">>> Setting up Flutter..."
flutter/bin/flutter config --enable-web
flutter/bin/flutter doctor
flutter/bin/flutter pub get
echo ">>> Flutter setup complete."
