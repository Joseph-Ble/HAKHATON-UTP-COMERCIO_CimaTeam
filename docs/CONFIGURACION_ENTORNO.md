Entorno de compilación Android — 7 de noviembre de 2026

El entorno de continuación permite `repo.reactnative.dev`. Se descargaron con HTTP 200 los metadatos y el POM de React Native 0.88.1. Gradle descargó el AAR release completo (171568108 bytes); el bloqueo HTTP 403 anterior quedó resuelto. Se conservaron el preset `package_managers` y los demás dominios. No se necesitan credenciales ni configurar Supabase para compilar la versión local.

La APK se generó con `npm run build:android` y `assembleRelease`, manteniendo Expo SDK 58, React Native 0.88.1, Hermes y `arm64-v8a,x86_64`. Pasaron lint vital, R8 y validación de firma. El script reutiliza Android cuando ya existe y genera con Expo únicamente si falta el directorio, conservando los archivos nativos y la clave restaurados.

Herramientas utilizadas:

- Node 24.22.1 y las dependencias de `package-lock.json`, instaladas con `npm ci`.
- JDK 17.0.17 y 21.0.9 completos, Gradle 9.4.1.
- Android SDK `platforms;android-37.0`, Build Tools 37.0.0 y 36.0.0.
- NDK 27.1.12297006 y CMake 3.22.1.

El entorno dispone de unos 8 GB de disco. Fue necesario conservar herramientas y resultados intermedios en memoria temporal. Después del build se retiraron el NDK temporal y resultados regenerables de unión de bibliotecas para reservar espacio a la prueba de instalación. Para repetir el build hay que reinstalar el NDK y disponer de espacio suficiente para sus archivos y las cachés. No borres ni regeneres el código nativo restaurado para liberar espacio.

Configura `ANDROID_HOME`, JDK 21 para ejecutar Gradle y la toolchain JDK 17, además del proxy y la confianza TLS de la instancia. Los clientes Java deben confiar en la CA del entorno y utilizar su proxy HTTP/HTTPS. No copies rutas ni proxy del respaldo anterior. En esta instancia, las ubicaciones están en `/workspace/entrevecinos-tools/env.sh` y las propiedades de Gradle en `/workspace/entrevecinos-tools/gradle/gradle.properties`; son configuración temporal, fuera del producto.

No se utilizó EAS ni se hicieron push o despliegues. La verificación de la APK y sus límites se registran en `PRUEBAS.md` y en `artifacts/`.
