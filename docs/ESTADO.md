Estado de entrega

EntreVecinos está implementado con React Native, Expo y JavaScript. Los tres módulos, la administración y los flujos de coordinación funcionan sobre almacenamiento local. No hay rótulos de demostración en la portada. Ajustes explica los datos de ejemplo y la persistencia en el dispositivo.

Se comprobaron 20 pruebas de negocio/PostgreSQL, siete recorridos de interfaz, la revisión móvil posterior y una apertura/login de la exportación web de producción. Se exportó también el código Android en bytecode Hermes. Los detalles y límites están en PRUEBAS.md.

El esquema, las políticas y el adaptador Supabase están preparados. No se configuró ningún backend remoto, siguiendo la elección del usuario de dejarlo para después. Las pruebas de SQL se ejecutaron con PostgreSQL embebido, no contra un proyecto Supabase real. Los datos entre dispositivos todavía no se comparten.

La APK sigue pendiente: su compilación nativa se detuvo en la descarga de React Native desde `repo.reactnative.dev`, que responde HTTP 403 en este entorno y no figura en los dominios permitidos. Se solicitó habilitar ese dominio. No se ha instalado ni probado una APK, y no se entrega un archivo vacío o un bundle como si lo fuera.

Para retomar: habilitar el dominio, actualizar la configuración observada del entorno, ejecutar `npm run build:android` con SDK/JDK completos, verificar firma y paquete, instalar la APK y comprobar inicio en frío sin Metro/USB. Después puede conectarse Supabase, aplicar las migraciones y ensayar sincronización real entre dos dispositivos.

No se realizaron push, despliegues públicos ni cambios en cuentas externas. El código y las evidencias están guardados mediante commits locales. El primer hito verificado quedó en `0968ecf`; el historial completo se consulta con `git log --oneline`.
