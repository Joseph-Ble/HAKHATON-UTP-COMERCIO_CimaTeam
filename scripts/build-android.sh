#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
: "${ANDROID_HOME:?Configura ANDROID_HOME con tu Android SDK}"
export EXPO_NO_TELEMETRY=1
npx expo prebuild --platform android --no-install
printf 'sdk.dir=%s\n' "$ANDROID_HOME" > android/local.properties
cd android
./gradlew assembleRelease -PreactNativeArchitectures="${VECINOS_ARCHS:-arm64-v8a,x86_64}" --no-daemon --console=plain
cd ..
mkdir -p artifacts
cp android/app/build/outputs/apk/release/app-release.apk artifacts/EntreVecinos-1.0.0.apk
sha256sum artifacts/EntreVecinos-1.0.0.apk > artifacts/EntreVecinos-1.0.0.sha256
