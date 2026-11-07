Estado comprobado de EntreVecinos 1.0.0

La implementación funcional está preparada en JavaScript/Expo con persistencia local y adaptador Supabase. Se ejecutaron 27 pruebas de reglas, PostgreSQL, enlaces de autenticación y errores. Pasaron los siete recorridos locales de interfaz contra la exportación web de producción. También pasaron dos recorridos del adaptador remoto con peticiones interceptadas y PostgreSQL de pruebas: búsqueda/paginación/ficha directa entre más de 500 registros y recuperación de contraseña con Auth simulado.

En esta continuación se corrigió el inicio para que las publicaciones nuevas aparezcan antes que las antiguas. El recorrido solidario comprueba que una publicación recién creada aparece en la portada. La búsqueda remota normaliza mayúsculas y tildes e incluye las categorías en español; el cliente evita duplicar tarjetas al juntar páginas.

La APK release se generó y se instaló limpiamente en un emulador Android 9/API 28 x86_64, sin aceleración KVM. El paquete es `pe.cimateam.entrevecinos` 1.0.0 (código 1), con bytecode Hermes incorporado y las arquitecturas arm64-v8a y x86_64. Pasaron la firma v2 con la clave de desarrollo original, alineación de páginas de 16 KB, lint vital y R8. El SHA-256 del APK instalado coincide con el de la entrega.

Pasaron seis comprobaciones nativas: portada tras instalación limpia, acceso a economía local, solidaridad y emergencias, cambio a Pueblo Libre con el negocio Aula Compartida y conservación de ese barrio/datos al reiniciar el proceso. Ambos lanzamientos devolvieron `Status: ok`; el primer tiempo de actividad fue 6009 ms y el arranque en frío 6471 ms en este emulador. Son métricas de la actividad, no un benchmark de teléfono físico. Wi-Fi y datos estaban desactivados y no había túneles ADB a Metro. No se probó un dispositivo ARM64 físico ni todos los flujos de autenticación en Android.

La primera prueba detectó un cálculo PBKDF2 de los ejemplos antes de mostrar contenido. Se sustituyó por una credencial pública precalculada y se comprobó su equivalencia con PBKDF2-SHA256/210000 mediante una implementación independiente. Se repitieron las 27 pruebas unitarias y los siete recorridos locales, incluyendo inicio de sesión con ejemplos. Las contraseñas creadas por usuarios mantienen sal aleatoria, derivación y validación PBKDF2. Los datos existentes no se regeneran.

El bloqueo HTTP 403 del entorno anterior quedó resuelto: se descargó el AAR completo de React Native 0.88.1 y el build final pasó. Las evidencias antiguas se conservan como historial; los resultados actuales se identifican debajo.

| ID  | Estado comprobado                                               | Evidencia o límite                                                                                                                                                    |
| --- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A01 | Aprobado en web y emulador Android | Portada, acceso a los tres módulos y regreso a inicio. |
| A02 | Aprobado en web y emulador Android | Pueblo Libre filtra Aula Compartida; la selección permanece tras cerrar el proceso. |
| A03 | Aprobado en local/web y adaptador remoto de pruebas             | Búsqueda de gasfitero, categorías, paginación y ficha fuera del conjunto inicial.                                                                                     |
| A04 | Aprobado en local/web y PostgreSQL embebido                     | Alta con Ana, consulta con Luis, edición propia y rechazo de edición ajena.                                                                                           |
| A05 | Aprobado en local/web y PostgreSQL embebido                     | Rango, promedio, unicidad, autorreseña y barrio histórico.                                                                                                            |
| A06 | Aprobado en local/web                                           | Venta consultable y creación de oferta con persistencia.                                                                                                              |
| A07 | Aprobado en local/web                                           | Demanda de repostero; enlace a ofertas implementado; presupuesto opcional.                                                                                            |
| A08 | Aprobado en local/web                                           | Trueque beterragas/espinacas visible tras cambio de cuenta; valoración al finalizar. Propuestas privadas reutilizan el flujo comprobado.                              |
| A09 | Aprobado en local/web y reglas                                  | Préstamo gratuito, intención y modalidad; rechazo de importe en ayuda gratuita.                                                                                       |
| A10 | Aprobado en local/web                                           | Información institucional antes de reportes de inseguridad; fuente y revisión visibles.                                                                               |
| A11 | Aprobado en local/web                                           | Orientación de sismos y lluvias/El Niño antes de reportes; fuentes y fechas.                                                                                          |
| A12 | Aprobado en local/web y reglas                                  | Etiqueta no verificada, sector, fecha del hecho/publicación; inseguridad pendiente de revisión.                                                                       |
| A13 | Aprobado en local/web y PostgreSQL embebido                     | Ana solicita, Luis ofrece, Ana acepta/responde y marca atendida; historial persistente y oferta privada.                                                              |
| A14 | Aprobado en local/web y PostgreSQL embebido                     | Reporte, ocultación administrativa y denegación de lectura directa al vecino.                                                                                         |
| A15 | Validaciones y permisos aprobados; red remota pendiente         | Errores de formulario, rechazo por servidor simulado y rollback de guardados inválidos. No se ensayó pérdida de red contra Supabase real.                             |
| A16 | Persistencia local aprobada; sincronización remota no ejecutada | Web conserva datos/sesión; Android conserva barrio y datos iniciales tras reiniciar. No se conectó un backend ni se ensayaron dos dispositivos. |
| A17 | Aprobado en local/web                                           | Sin estrellas en las categorías de emergencia; las reglas rechazan valoraciones de emergencias.                                                                       |
| A18 | Aprobado en emulador Android 9 x86_64 | APK release instalada y arrancada sin Metro, con firma y SHA-256 verificados. ARM64 incluido y sin ensayo físico. |

Las pruebas PostgreSQL ejecutan las migraciones con PGlite y roles `anon`/`authenticated`, usando una función mínima `auth.uid()`. Comprueban permisos y lógica SQL reales; no prueban el proveedor Auth, correo, transporte HTTP ni una instalación Supabase real. La conexión remota permanece sin configurar por decisión del usuario.

Las pruebas del adaptador remoto utilizan el SDK Supabase real y un bundle compilado con URL/clave públicas sintéticas. Playwright intercepta todas las peticiones a supabase.example.test: las lecturas se ejecutan contra PostgreSQL local con RLS y Auth se simula. Se confirma el intercambio de código, la actualización de contraseña y el cierre de sesión a nivel de cliente. No se enviaron correos, validaron firmas de tokens reales ni crearon recursos externos. El bundle de pruebas no se incluye en la entrega.

Las pruebas de interfaz se ejecutaron en Chromium mediante el destino web de React Native, con una resolución móvil de 390×844 y escritorio. No equivalen a probar Android nativo. Las fechas y marcas temporales se generan y muestran con las reglas de la app; los incidentes ilustrativos están archivados.

| Archivo                                                                   | Contenido                                                             |
| ------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `artifacts/pruebas-unitarias.txt`                                         | 26 pruebas aprobadas: negocio, SQL/RLS/RPC, enlaces y errores.        |
| `artifacts/pruebas-navegador.txt`                                         | Siete recorridos locales aprobados contra producción web.             |
| `artifacts/pruebas-adaptador-remoto.txt`                                  | Dos recorridos con SDK Supabase, PostgreSQL local y Auth simulado.    |
| `artifacts/pruebas-contacto.txt`                                          | Edición, consentimiento, revocación y coordinación privada aprobados. |
| `artifacts/pruebas-mobile.txt`                                            | Revisión posterior de la portada móvil.                               |
| `artifacts/export-web.txt`                                                | Exportación de producción web.                                        |
| `artifacts/export-android.txt`                                            | Exportación de bytecode Hermes Android.                               |
| `artifacts/compilacion-android.txt`                                       | Intento de build nativo y bloqueo HTTP 403.                           |
| `artifacts/resumen-pruebas.json`                                          | Resumen estructurado de resultados y límites.                         |
| `artifacts/inicio-desktop.png`, `inicio-mobile.png`, `ayuda-atendida.png` | Evidencias visuales de la interfaz.                                   |

Quedan pendientes la prueba en teléfono físico, el backend Supabase real y las comprobaciones de correo/recuperación y sincronización entre dispositivos. Los recorridos nativos cubren navegación y persistencia descritas arriba; los demás flujos conservan el alcance web/SQL indicado. Las limitaciones funcionales previstas están descritas en README.

Evidencias de esta continuación:

| Archivo | Resultado |
| --- | --- |
| `artifacts/restauracion-integridad.json` | ZIP, historial restaurado e inventarios verificados. |
| `artifacts/pruebas-unitarias-continuacion.txt` | 27 pruebas aprobadas, incluida la credencial pública precalculada. |
| `artifacts/pruebas-navegador-continuacion.txt` | Siete recorridos locales aprobados tras la corrección. |
| `artifacts/compilacion-android-verificada.txt` | Build final: 1m44s, 38 tareas ejecutadas y 617 reutilizadas. |
| `artifacts/apk-paquete-y-firma.txt` | Paquete, SDK, ABI, firma v2 y alineación de 16 KB. |
| `artifacts/android-instalacion.txt` | Desinstalación del ensayo previo e instalación limpia: Success. |
| `artifacts/android-smoke.json`, `artifacts/android-smoke.txt` | Seis comprobaciones nativas aprobadas, con cambio de PID en frío. |
| `artifacts/android-apk-instalado.json` | SHA-256 instalado y estado de red/Metro comprobados. |
| `artifacts/android-inicio.png`, `android-solidaria.png`, `android-emergencias.png` | Tres módulos visibles en Android nativo. |
| `artifacts/android-persistencia.png`, `android-filtro.png` | Barrio guardado y negocio Aula Compartida tras reiniciar. |
| `artifacts/verificacion-apk.json` | Resumen actual y límites de los ensayos. |
