#!/bin/bash

# Configuration
FLUTTER_CHANNEL="stable"
FLUTTER_VERSION="3.24.0" # Match your project version if needed

if [ ! -d "flutter" ]; then
  echo "Downloading Flutter SDK..."
  git clone https://github.com/flutter/flutter.git -b $FLUTTER_CHANNEL
fi

export PATH="$PATH:`pwd`/flutter/bin"

echo "Setting up Flutter..."
flutter/bin/flutter config --enable-web
flutter/bin/flutter doctor
flutter/bin/flutter pub get
