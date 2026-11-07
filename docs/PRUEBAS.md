Estado comprobado de EntreVecinos 1.0.0

La implementación funcional está preparada en JavaScript/Expo con persistencia local y adaptador Supabase. Se ejecutaron 26 pruebas de reglas, PostgreSQL, enlaces de autenticación y errores. Pasaron los siete recorridos locales de interfaz contra la exportación web de producción. También pasaron dos recorridos del adaptador remoto con peticiones interceptadas y PostgreSQL de pruebas: búsqueda/paginación/ficha directa entre más de 500 registros y recuperación de contraseña con Auth simulado.

En esta continuación se corrigió el inicio para que las publicaciones nuevas aparezcan antes que las antiguas. El recorrido solidario comprueba que una publicación recién creada aparece en la portada. La búsqueda remota normaliza mayúsculas y tildes e incluye las categorías en español; el cliente evita duplicar tarjetas al juntar páginas.

La exportación web de producción se abrió con Chromium y permitió iniciar sesión, sin errores de página o consola en ese recorrido. La exportación Android generó bytecode Hermes; esto acredita la compilación del código JavaScript para Android, no una APK instalable ni su funcionamiento en un dispositivo.

**La APK no se ha generado ni instalado.** La compilación nativa se intentó con Android SDK, NDK y toolchains JDK preparados, pero Maven redirige el artefacto de React Native a un dominio bloqueado por la red del entorno:

```text
com.facebook.react:react-android:0.88.1
https://repo.reactnative.dev/maven2/com/facebook/react/react-android/0.88.1/react-android-0.88.1-release.aar
HTTP 403 Forbidden
```

Se necesita habilitar `repo.reactnative.dev` en la configuración de red del entorno. No requiere Supabase ni una clave secreta. Después debe repetirse la compilación, regenerando los recursos nativos con `npm run build:android`, instalar el APK y completar las comprobaciones Android. No se ha sustituido este resultado por una afirmación de instalación exitosa.

| ID  | Estado comprobado                                               | Evidencia o límite                                                                                                                                                    |
| --- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A01 | Navegación web aprobada; Android pendiente                      | Tres módulos reales, regreso y portada móvil. No hay instalación Android.                                                                                             |
| A02 | Aprobado en local/web                                           | Cambio de San Miguel a Pueblo Libre filtra negocios; el filtro no altera la identidad del perfil.                                                                     |
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
| A16 | Persistencia local aprobada; sincronización remota no ejecutada | Recargar conserva datos/sesión. Las dos cuentas de prueba comparten el mismo almacenamiento del navegador. No se conectó Supabase ni se acreditaron dos dispositivos. |
| A17 | Aprobado en local/web                                           | Sin estrellas en las categorías de emergencia; las reglas rechazan valoraciones de emergencias.                                                                       |
| A18 | Bloqueado                                                       | No existe APK final. Red del entorno deniega el dominio de descarga de React Native.                                                                                  |

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

Quedan pendientes la compilación/instalación nativa, la verificación del APK sin Metro/USB, la prueba con un backend Supabase real y las comprobaciones de correo/recuperación y sincronización entre dispositivos. Las limitaciones funcionales previstas —sin adjuntos, GPS, pagos, chat continuo ni push— están descritas en README.
