EntreVecinos es una aplicación Android construida con React Native, Expo y JavaScript. Integra economía local, publicaciones solidarias y coordinación de apoyo vecinal. La interfaz también puede ejecutarse en el navegador para desarrollo y pruebas.

Las decisiones del usuario posteriores al documento original están registradas en `docs/DECISIONES.md`: JavaScript, desarrollo autorizado sin límite fijo de 48 horas, Supabase configurable después y presentación sin rótulos de demostración en la portada.

**Ejecutar la aplicación.** Requiere Node 22 o posterior compatible con Expo SDK 58 y npm. Desde esta carpeta:

```sh
npm ci
npm start
```

Para navegador: `npm run web`. Para Android durante desarrollo, utiliza un dispositivo o emulador compatible con la versión de Expo; la APK interna permite instalar sin Expo Go, Metro ni USB. La versión mínima de Android generada por este proyecto es API 24 (Android 7).

**Datos locales y cuentas.** Sin variables de Supabase la app inicializa datos de ejemplo y persiste cambios con AsyncStorage. La sesión nativa usa SecureStore. Las contraseñas locales se almacenan con sal y PBKDF2-SHA256 (210 000 iteraciones). La información sobre esta modalidad aparece en Ajustes; no hay rótulos «Demo» en la portada.

| Perfil de ejemplo | Correo                    | Contraseña   |
| ----------------- | ------------------------- | ------------ |
| Ana Torres        | ana@vecinos.example       | Vecinos2026! |
| Luis Mendoza      | luis@vecinos.example      | Vecinos2026! |
| Moderación        | comunidad@vecinos.example | Vecinos2026! |

También puedes cambiar entre estas cuentas desde Ajustes. Sirven para datos ficticios y pruebas. Puedes registrar otra cuenta local con contraseña exclusiva. La lectura pública no exige cuenta.

Los cambios locales se conservan al cerrar y abrir. Dos dispositivos mantienen bases independientes. Desinstalar la app o limpiar los datos puede borrarlos. Cambiar de cuenta en un mismo dispositivo permite ensayar los flujos entre vecinos, pero no demuestra sincronización remota. Los permisos de la demo local validan las operaciones de la app; la seguridad frente a un cliente manipulado depende del backend con RLS.

**Funciones implementadas.**

- Inicio con los tres módulos y selector de barrio; búsqueda textual por negocio/producto/oficio y filtros.
- Directorio con categorías, ficha, alta/edición/desactivación/retirada propias, estrellas y recomendaciones del mismo barrio declarado.
- Consulta y creación de venta, compra, trueque y ayuda gratuita; pedir/ofrecer donación, préstamo o favor; estados y valoraciones de experiencias finalizadas.
- Emergencias con orientación institucional antes de reportes; fuentes y fechas; dos categorías, solicitud/oferta de ayuda, respuesta privada, cierre e historial.
- Propuestas privadas para coordinar sin publicar teléfono; contacto externo opcional con consentimiento y retirada.
- Perfil, publicaciones/negocios propios, actividad, ofertas recibidas/enviadas y respuestas.
- Reportar contenido; moderación para aprobar/ocultar y catálogo editorial básico. Publicaciones de inseguridad y sus ediciones pasan por revisión.

Las estrellas no aparecen en emergencias. Las opiniones no certifican calidad ni residencia. Las experiencias solidarias no equivalen a compras verificadas. Las recomendaciones institucionales no implican respaldo al aplicativo. La app no reemplaza canales oficiales. El directorio no afirma disponibilidad en vivo de equipos locales.

**Conectar Supabase después.** La instalación actual puede funcionar enteramente en local. Para compartir datos:

1. Crea un proyecto Supabase dedicado. Aplica, en orden, todos los SQL de `supabase/migrations/` mediante SQL Editor o Supabase CLI. La primera migración crea tablas, RLS, restricciones, trigger de perfil y `app_command`; la segunda carga orientación editorial; la tercera añade lecturas paginadas, búsqueda, consulta directa de fichas y el contexto de la cuenta.
2. Activa correo/contraseña en Auth y configura confirmación de correo y entrega. En Auth → URL Configuration, autoriza los destinos de tu aplicación: `entrevecinos:///cuenta`, `entrevecinos:///recuperar` y las URL equivalentes de tu dominio web. Incluye las variantes de dos barras si el dispositivo las utiliza. La app utiliza PKCE: solicita y abre el enlace de recuperación desde la misma instalación/navegador. Prueba registro, confirmación y recuperación antes de usarlos con vecinos reales. Las cuentas locales no se migran automáticamente.
3. Copia `.env.example` a `.env` y configura exclusivamente `EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. La clave publicable es apropiada para clientes; las políticas de servidor son obligatorias.
4. Reinicia Metro con caché limpia (`npx expo start -c`) o recompila la APK. Las variables `EXPO_PUBLIC_*` se incorporan al bundle; una APK ya instalada no cambia de backend por editar un archivo del ordenador.
5. Registra dos cuentas y verifica los flujos desde sesiones/dispositivos independientes. Concede moderación desde SQL administrativo, usando el UUID de la cuenta autorizada:

```sql
insert into public.user_roles(user_id, role)
values ('UUID-DE-LA-CUENTA', 'moderator');
```

Nadie puede asignarse roles modificando su perfil. El APK nunca debe incluir una clave `secret`/`service_role`, conexión SQL ni contraseña de base de datos. Las tablas públicas de perfiles no contienen el correo de acceso. Las ofertas, propuestas y denuncias tienen políticas de lectura privadas. Las escrituras no se conceden directamente a usuarios: pasan por RPC con comprobación del actor y validación en PostgreSQL.

Para cargar ejemplos en un proyecto remoto NUEVO de pruebas se proporciona `scripts/seed-supabase.mjs`. Tras aplicar migraciones, configura la clave administrativa solo en tu entorno local y ejecuta explícitamente `node --env-file=.env scripts/seed-supabase.mjs --examples`. El script rechaza proyectos con negocios existentes y no se ha ejecutado contra ningún servicio remoto. No distribuyas las cuentas conocidas en un servicio público.

El adaptador remoto no cambia a almacenamiento local si hay errores de red. Mostrará errores comprensibles y no afirmará que publicó sin confirmación. Los listados remotos consultan filtros y texto en PostgreSQL y cargan páginas de 24 resultados con «Ver más». Una ficha se consulta por identificador, aunque no esté en el inicio. Se eliminó el límite anterior de 500 registros por tabla. La carga de inicio contiene una selección pequeña de publicaciones públicas y la actividad privada de la cuenta según RLS; las opiniones e historial de cada ficha se consultan al abrirla. Realtime no es necesario para la coordinación actual: se actualiza al entrar, después de guardar y mediante Actualizar.

La recuperación de contraseña incluye solicitud del correo, recepción de enlace/code PKCE, pantalla de nueva contraseña y cierre de sesión. Las rutas de autenticación ignoran dominios ajenos y no muestran tokens ni mensajes técnicos del proveedor. La entrega real del correo y el comportamiento del enlace en Android deben verificarse una vez configurado Supabase y generado el APK.

**Compilar e instalar Android.** Se incluye un perfil `preview` de EAS que genera APK de distribución interna con JavaScript incorporado:

```sh
npx eas-cli login
npx eas-cli build --platform android --profile preview
```

EAS requiere tu cuenta/proyecto y puede tener cuotas o esperas. No se ha ejecutado un build en una cuenta externa. Para compilación local configura Android SDK y toolchains JDK 17 y JDK 21 completos (incluyendo `javac`), según las dependencias de Expo SDK 58, React Native 0.88 y Gradle 9:

```sh
export ANDROID_HOME=/ruta/a/tu/android-sdk
npm run build:android
```

El script genera el proyecto nativo con Expo y ejecuta `assembleRelease`. La configuración generada usa la clave de desarrollo para distribución interna; no es una firma de producción para Google Play. Conserva y protege tu keystore propio si preparas una versión pública. El directorio nativo se regenera y está excluido de Git. La APK y el checksum se copian a `artifacts/EntreVecinos-1.0.0.apk` y `artifacts/EntreVecinos-1.0.0.sha256` cuando la compilación termina correctamente.

Para instalar, transfiere la APK al Android, ábrela y autoriza la instalación desde esa fuente. Alternativamente, con herramientas Android: `adb install -r artifacts/EntreVecinos-1.0.0.apk`. Una vez instalada, prueba apertura en frío sin Metro y sin USB. Consulta `docs/PRUEBAS.md` para el estado comprobado de la entrega.

**Pruebas y estructura.**

```sh
npm test
# con Metro web ya disponible en localhost:8081:
npm run test:e2e
npm run export:web
```

Las pruebas SQL usan PostgreSQL embebido PGlite y una emulación mínima de `auth.uid()`/roles de Supabase. Ejecutan la migración y prueban RPC/RLS; no equivalen a probar Auth, red, correo o despliegue de un Supabase real. Los recorridos Playwright usan Chromium (`CHROMIUM_PATH` configurable) y el mismo código React Native para web; la verificación Android se registra por separado.

Para probar la exportación web de producción, ejecuta `npm run export:web`, sirve `dist` con `python scripts/serve-web.py` y utiliza `VECINOS_TEST_BASE_URL=http://localhost:8082 npm run test:e2e -- tests/e2e/flows.spec.js`.

Se incluyen además dos recorridos del adaptador remoto con el SDK Supabase real, peticiones interceptadas y PostgreSQL local: búsqueda/paginación sobre más de 500 registros y recuperación de contraseña. El proveedor Auth y el correo son simulados; no se crea ninguna cuenta externa. Para repetirlos:

```sh
EXPO_PUBLIC_SUPABASE_URL=https://supabase.example.test EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_synthetic_test_only npx expo export --platform web --output-dir artifacts/remote-test-bundle
python scripts/serve-web.py --port 8083 --directory artifacts/remote-test-bundle
# En otra terminal, con el servidor activo:
VECINOS_REMOTE_TEST_URL=http://localhost:8083 VECINOS_TEST_OUTPUT=artifacts/browser-remote-tests VECINOS_TEST_REPORT=artifacts/playwright-remote-results.json npm run test:e2e -- tests/e2e/remote.spec.js
```

El bundle sintético de pruebas queda separado y excluido de los paquetes de entrega. `VECINOS_TEST_REPORT` y `VECINOS_TEST_OUTPUT` permiten separar las evidencias de cada ejecución. Los dos casos remotos se omiten en una ejecución habitual si no se indica `VECINOS_REMOTE_TEST_URL`.

| Carpeta                | Contenido                                                         |
| ---------------------- | ----------------------------------------------------------------- |
| `app/`                 | Rutas Expo Router, todas en JavaScript.                           |
| `src/screens/`         | Pantallas de consulta, detalle, formularios, cuenta y moderación. |
| `src/components/`      | Sistema visual, componentes accesibles e ilustración propia.      |
| `src/core/`            | Catálogos, validaciones y reglas de negocio comprobables.         |
| `src/data/`            | Persistencia local, sesiones y adaptador Supabase.                |
| `supabase/migrations/` | Esquema, permisos, operaciones atómicas y contenido editorial.    |
| `tests/`               | Reglas, permisos SQL y recorridos de navegador.                   |
| `artifacts/`           | Evidencias, capturas y APK si se pudo generar.                    |
| `docs/`                | Decisiones, fuentes, pruebas y especificación original.           |

Las limitaciones actuales incluyen ausencia de adjuntos, GPS, pagos, push, chat continuo, verificación de identidad/residencia y alertas oficiales en vivo. La moderación es manual. La recuperación remota requiere configurar y verificar su destino; no está acreditada contra un backend real. Antes de un piloto público se requiere configurar el servicio, verificar los flujos remotos, revisar fuentes y contactos locales, y definir la operación y retención de datos de la comunidad.
