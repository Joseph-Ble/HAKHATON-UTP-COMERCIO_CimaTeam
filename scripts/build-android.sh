#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
: "${ANDROID_HOME:?Configura ANDROID_HOME con tu Android SDK}"
export EXPO_NO_TELEMETRY=1
export EXPO_OFFLINE="${EXPO_OFFLINE:-1}"
if [[ ! -d android ]]; then
  npx expo prebuild --platform android --no-install
elif [[ ! -f android/gradlew ]]; then
  printf '%s\n' 'El directorio android existe pero no contiene gradlew. Revisa los archivos nativos antes de continuar.' >&2
  exit 1
fi
printf 'sdk.dir=%s\n' "$ANDROID_HOME" > android/local.properties
cd android
./gradlew assembleRelease -PreactNativeArchitectures="${VECINOS_ARCHS:-arm64-v8a,x86_64}" --no-daemon --console=plain
cd ..
mkdir -p artifacts
cp android/app/build/outputs/apk/release/app-release.apk artifacts/EntreVecinos-1.0.0.apk
sha256sum artifacts/EntreVecinos-1.0.0.apk > artifacts/EntreVecinos-1.0.0.sha256
