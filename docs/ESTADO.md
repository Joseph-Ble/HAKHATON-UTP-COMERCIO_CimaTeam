Estado de entrega — 7 de noviembre de 2026

EntreVecinos conserva React Native, Expo SDK 58 y JavaScript, sus tres módulos, administración y coordinación sobre almacenamiento local. Ajustes explica los datos de ejemplo y la persistencia. Supabase sigue preparado y sin un proyecto remoto configurado.

Se verificó el SHA-256 del ZIP de transferencia y sus once sumas internas. El bundle se restauró con HEAD `666eb171302cb8a45107701b58139e9d01c953ed` y los cuatro commits completos. Se comprobaron 78 archivos versionados y 274 archivos locales al restaurar; se conservaron los archivos nativos y la clave de desarrollo. Solo se adaptó la ruta del SDK en la configuración local de Android.

Las correcciones se limitaron a conservar Android entre compilaciones y eliminar el cálculo inicial del hash de las cuentas públicas de ejemplo, que bloqueaba el arranque en el emulador por software. Ese hash sigue siendo PBKDF2-SHA256 de 210000 iteraciones. El registro, la autenticación de contraseñas y los datos locales existentes mantienen su comportamiento y compatibilidad.

La APK release se generó con `npm run build:android`, Hermes y `arm64-v8a,x86_64`. Firma v2 válida con la clave de desarrollo original, alineación de 16 KB y paquete `pe.cimateam.entrevecinos`, versión 1.0.0, código 1, Android mínimo API 24 y target API 36.

Archivo: `artifacts/EntreVecinos-1.0.0.apk`. Checksum: `artifacts/EntreVecinos-1.0.0.sha256`. Resumen verificable: `artifacts/verificacion-apk.json`.

Pasaron 27 pruebas unitarias/PostgreSQL/autenticación, siete recorridos locales de producción web y dos del adaptador remoto con Auth simulado. También pasaron seis comprobaciones nativas sobre Android 9/API 28 x86_64: primer arranque limpio, acceso a los tres módulos, filtro de barrio y arranque en frío con datos persistidos. El APK instalado tiene el mismo SHA-256 que el entregado; se comprobaron Wi-Fi y datos desactivados y ningún túnel ADB a Metro. No se ensayó un teléfono físico ARM64.

Quedan pendientes el backend Supabase real, el correo/recuperación con un proveedor real y la sincronización entre dispositivos. Los ensayos remotos emplean PostgreSQL de pruebas y Auth simulado. Las herramientas temporales y los requisitos de recompilación están descritos en `CONFIGURACION_ENTORNO.md`.

Las correcciones y las evidencias se guardaron primero en commits locales posteriores al checkpoint restaurado. Tras una autorización posterior del usuario, el historial completo se publicó en la rama `main` de `https://github.com/Joseph-Ble/HAKHATON-UTP-COMERCIO_CimaTeam`. El repositorio permanece privado. No se hicieron despliegues ni cambios en servicios de la aplicación.
