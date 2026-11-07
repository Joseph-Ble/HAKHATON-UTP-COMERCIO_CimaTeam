# ESPECIFICACIÓN MAESTRA Y ORDEN DE IMPLEMENTACIÓN — APK VECINAL

> **Proyecto:** Aplicativo vecinal para economía local, economía solidaria y respuesta ante emergencias.  
> **Contexto:** Hackathon, MVP funcional en 48 horas.  
> **Destinatario:** Agente de desarrollo de software autónomo.  
> **Objetivo de esta instrucción:** IMPLEMENTAR una aplicación Android instalable (.apk), no solo producir diseños, diagramas o documentación.  
> **Estado:** Especificación funcional consolidada a partir de la propuesta del equipo y sus ajustes de auditoría. Las prioridades de MVP y las decisiones técnicas indicadas abajo son criterios de ejecución, no funcionalidades que ya existan.

## 0. Instrucción para el agente

Actúa como arquitecto y desarrollador full stack responsable de producir un **MVP Android funcional, navegable y demostrable**. Usa este documento como fuente de verdad de los requisitos del producto. No simplifiques eliminando uno de los tres módulos ni reemplaces funciones reales con botones decorativos. Implementa flujos de extremo a extremo, persistencia, controles básicos de acceso, estados vacíos, errores, pruebas y generación del APK. La interfaz debe ser profesional, accesible, mobile-first y sencilla para usuarios sin conocimientos técnicos.

**Reglas de ejecución:**
1. Primero inspecciona el proyecto y reutiliza tecnología y código válidos si ya existen. Si el repositorio está vacío, utiliza la arquitectura sugerida en §11.
2. Construye por incrementos verificables. Prioriza la sección **MVP obligatorio** y luego las ampliaciones. No añadas módulos ajenos al alcance.
3. No inventes integraciones institucionales ni afirmes que los reportes vecinales están verificados. Las recomendaciones institucionales deben tener fuente identificable y comprobable.
4. No introduzcas una IA, pagos electrónicos, geolocalización exacta ni chat complejo como prerrequisitos.
5. Si faltan credenciales o servicios externos, deja la integración preparada y documentada y habilita un **modo demostración claramente identificado**; no simules que existe un backend real en producción.
6. Ejecuta compilación, pruebas y flujo manual mínimo. Guarda un commit **local** al completar cada hito verificado; **no hagas push ni despliegues** sin autorización expresa.
7. Entrega el APK generado, instrucciones de instalación, credenciales de prueba (solo ficticias), resumen de pruebas, limitaciones y ubicación de archivos. No asegures haber terminado una función que no hayas comprobado.

## 1. Reto original y finalidad

**Reto:** Crear en 48 horas un aplicativo que permita a los ciudadanos obtener productos y servicios cercanos con costos mínimos y sin transporte mayor, avalados por recomendaciones de vecinos; integrar mecanismos de intercambios solidarios; y evolucionar ante emergencias para coordinar soporte entre vecinos.

**Requisitos del reto a respetar:**
- Directorio de oficios, profesiones, establecimientos y servicios cercanos, respaldado por **recomendaciones de vecinos de la misma zona** ("Visto Bueno Vecinal").
- Espacio comunitario para pedir y ofrecer ayuda, herramientas, donaciones, movilidad o intercambio de habilidades **sin necesidad de dinero**.
- Identificación de servicios o grupos de apoyo disponibles durante una emergencia.
- Canal para comunicar situaciones críticas y **solicitar, ofrecer y coordinar** apoyo, no únicamente mostrar avisos.
- Evaluación del producto: usabilidad, confiabilidad, escalabilidad, propuesta, código/funcionalidad e innovación.

**Propuesta del equipo:** tres apartados clicables en inicio: **Economía local**, **Economía solidaria** y **Respuesta ante emergencias**. El módulo solidario también permite compra y venta, además de intercambios. Este agregado NO sustituye el requisito de ayuda sin dinero.

## 2. Usuarios, barrio y reglas generales

- **Visitante:** puede consultar fichas, publicaciones públicas dentro del aplicativo y recomendaciones; para publicar, valorar, contactar mediante funcionalidades que requieran cuenta u ofrecer ayuda, inicia sesión.
- **Vecino registrado:** puede crear y administrar sus publicaciones, registrar sus negocios, calificar según reglas, reportar contenido y responder a solicitudes de ayuda.
- **Moderador/administrador:** puede revisar reportes de contenido, ocultar publicaciones inapropiadas y gestionar el catálogo editorial de recomendaciones institucionales. Basta un panel básico protegido.
- **Cobertura:** soportar **varios barrios/sectores**. Al registrarse, el usuario escoge su distrito/barrio/sector de una lista; la app filtra por zona y puede ofrecer "ver zonas cercanas". **Esta es una decisión provisional de implementación**, pues el equipo no especificó si comenzará con un solo barrio. Preparar una zona piloto y datos de demostración.
- **Privacidad:** no solicitar ni hacer pública la dirección exacta de una vivienda ni datos de personas vulnerables. Mostrar sector o referencia aproximada. La geolocalización GPS es opcional, nunca indispensable para consultar la app.
- **Consulta pública:** las fichas y publicaciones no dependen de ser su autor; son visibles para los visitantes del ámbito definido. Solo publicar/modificar requiere autenticación.
- **Identidad:** perfil básico con nombre visible, correo/login, barrio, fecha de registro y contacto opcional consentido. Nadie puede editar contenido ajeno.

## 3. Pantalla principal y navegación

La pantalla de inicio presenta **exactamente tres accesos principales**, visualmente diferenciados:

1. **Economía local** — "Encuentra negocios y servicios de tu barrio".
2. **Economía solidaria** — "Compra, vende, intercambia y ayuda a tus vecinos".
3. **Respuesta ante emergencias** — "Infórmate, reporta y coordina apoyo".

Incluir navegación atrás, barra superior con barrio elegido, búsqueda donde aplique, perfil/ingreso y acceso claro a crear una publicación. Las secciones internas deben abrir pantallas reales y nunca terminar en callejones sin salida.

## 4. Módulo A — Economía local

### 4.1. Objetivo

Ayudar al ciudadano a encontrar **productos, negocios, oficios y profesionales cercanos**, sin tener que desplazarse demasiado, con información y recomendaciones de personas de su barrio.

### 4.2. Entrada, buscador y categorías

- Un **buscador** permite buscar por nombre de negocio, producto, oficio, profesión o servicio.
- Categorías seleccionables: **Tiendas y minimarkets**, **Ferreterías**, **Educación y apoyo escolar**, **Alimentos y restaurantes**, **Salud y bienestar**, **Servicios técnicos y del hogar**, **Belleza y cuidado personal**, **Otros servicios y emprendimientos**.
- La categoría **Servicios técnicos y del hogar** incluye gasfitería, carpintería, electricidad, cerrajería; otras categorías pueden incluir paseadores de mascotas o profesores particulares.
- Filtros mínimos: barrio/sector, categoría y texto; ordenar por relevancia o recomendaciones. Ordenar por distancia solo si hay coordenadas válidas consentidas, sin inventar kilómetros.

### 4.3. Listado y detalle

Al tocar, por ejemplo, **Tiendas y minimarkets**, se muestra una lista de comercios registrados. Ejemplos ilustrativos propuestos por el equipo: **Tiendas Mas, Hasac y la tienda de la vecina María**; usar nombres claramente de demostración hasta contar con datos reales y permisos.

Cada tarjeta muestra nombre, categoría, referencia aproximada de ubicación, descripción breve y valoración. Al tocarla se abre ficha con:
- Nombre del negocio o profesional.
- Categoría y descripción de productos/servicios.
- Barrio, dirección comercial voluntariamente publicada o referencia de ubicación; distancia solo si verificable.
- Fotografías opcionales.
- Horario, medios de contacto autorizados, responsable de la ficha.
- Promedio de **1–5 estrellas** y cantidad de valoraciones.
- Recomendaciones aportadas por vecinos de la zona (**Visto Bueno Vecinal**), sin presentar el sistema como certificación oficial de calidad.

Un usuario autenticado puede crear/editar/desactivar **sus propias** fichas de negocio. El administrador puede moderar.

### 4.4. Valoración y "Visto Bueno Vecinal"

- Escala de **una a cinco estrellas**, donde 1 es la experiencia más negativa y 5 la más positiva.
- No permitir autocalificarse ni calificar el mismo negocio repetidamente desde la misma cuenta (actualizar la calificación propia, si se decide habilitarlo).
- Mostrar **número de recomendaciones del mismo sector** por separado del promedio global cuando sea posible; al menos registrar barrio del autor y filtrar por él.
- Una estrella o comentario representa opinión vecinal, **no validación estatal o garantía profesional**.

### 4.5. Diferencia frente a economía solidaria

Los **negocios y servicios habituales/permanentes** se registran en economía local. En economía solidaria se publican **ofertas y necesidades puntuales**. Un carpintero puede tener una ficha profesional local y, adicionalmente, ofrecer un mueble específico para vender o donar, pero no se debe obligar a duplicar fichas para el mismo servicio.

## 5. Módulo B — Economía solidaria

### 5.1. Objetivo y menú

Espacio público de publicaciones para **conectar vecinos**. Conservar los **tres accesos principales expresamente solicitados**:

1. **¿Quieres vender?**
2. **¿Quieres comprar?**
3. **¿Quieres intercambiar?**

En cada opción se puede **CONSULTAR PUBLICACIONES DE OTRAS PERSONAS** y **CREAR UNA PROPIA**. No se debe implementar solo un formulario de publicación. Añadir dentro del mismo módulo una **modalidad o filtro "Ayuda gratuita / donación / préstamo"**, sin convertir necesariamente este módulo en cuatro entradas principales; así se cumple el componente sin dinero del reto.

### 5.2. Quiero vender

- Muestra un listado de **ofertas**: productos y servicios puntuales disponibles.
- Permite publicar: título, descripción, categoría, imágenes opcionales, precio opcional, sector, contacto autorizado, fecha y estado.
- Ejemplo original: un carpintero anuncia que ofrece determinados trabajos en su local o zona, con información para contactarlo. Si es una oferta profesional recurrente, orientar a crear también su ficha en Economía local.
- Quien consulta puede buscar, filtrar, abrir la publicación y contactar al autor.

### 5.3. Quiero comprar

- Muestra solicitudes/demandas de productos o servicios y un botón de "Publicar lo que busco".
- Formulario: título, características, fotografía de referencia opcional, presupuesto opcional, sector, contacto y estado.
- Ejemplo original: "Busco comprar un **repostero**"; los vecinos que lo vendan o fabriquen pueden responder.
- Incluir buscador/enlace a ofertas relevantes de "Quiero vender" para que alguien que busca un producto también pueda descubrir una oferta ya publicada. No duplicar datos.

### 5.4. Quiero intercambiar

- Listado de propuestas de trueque.
- Formulario: **qué ofrezco**, **qué quiero recibir**, cantidades o características, imágenes opcionales, sector, contacto y estado.
- Ejemplo original: "Tengo **beterragas** y quiero intercambiarlas por **espinacas**".
- Los interesados pueden revisar, contactar y acordar el intercambio; no requiere pasarela de pagos.

### 5.5. Ayuda sin dinero (requisito del reto)

Como subtipo de publicación o filtro transversal, permitir:
- **Necesito ayuda gratuita**: préstamo de herramientas, traslado solidario, ayuda temporal, materiales, etc.
- **Ofrezco ayuda/donación**: objetos, tiempo, conocimientos o habilidades.
- Indicar si es donación, préstamo o favor; qué se necesita/ofrece, sector y estado.
- Ejemplo: "Necesito prestada una escalera por una tarde" o "Puedo donar materiales de construcción".

### 5.6. Estados, comunicación y calificación

- Estados de publicación: **activa**, **en coordinación**, **finalizada** o **cancelada**.
- Cada publicación tiene autor, tipo, fecha, sector, texto, medio de contacto y fotos opcionales.
- Para contactar, utilizar un enlace o mecanismo externo simple (p. ej., WhatsApp) **solo cuando el autor haya dado permiso para publicar ese contacto**; alternativa segura: solicitud de contacto con notificación dentro de la app si resulta viable. Nunca exponer números no consentidos.
- Calificar con **1–5 estrellas la experiencia de compra, venta o intercambio**, no características personales. No permitir autovaloración o duplicados; idealmente mostrar opción de valoración cuando se marque la experiencia como finalizada. Si no se puede comprobar la transacción, no anunciar "compra verificada".
- Permitir **reportar contenido** engañoso, ofensivo o inapropiado.

## 6. Módulo C — Respuesta ante emergencias

### 6.1. Objetivo y accesos

Al entrar se muestran **dos categorías**:
1. **Inseguridad ciudadana**.
2. **Fenómenos naturales y sus efectos** (incluye **sismos y consecuencias del fenómeno El Niño**: lluvias intensas, inundaciones, huaicos, deslizamientos, etc.).

**Regla común de ambas pantallas:** mostrar **PRIMERO recomendaciones de prevención y actuación**, y **DESPUÉS publicaciones vecinales**. NO hay estrellas ni valoraciones de popularidad en este módulo.

### 6.2. Inseguridad ciudadana

**Recomendaciones iniciales:** cómo actuar ante robo o intento de robo, protegerse sin exponerse, comunicar incidentes, acudir a las autoridades y qué información aportar a los servicios pertinentes. Fuentes recomendadas: **PNP y MININTER**, priorizando contenido oficial comprobado.

**Publicaciones:** el usuario puede leer y crear avisos sobre robos, intentos de robo o conductas observadas que susciten preocupación. Campos: título, descripción factual, tipo de incidente, fecha/hora, sector aproximado y fotos opcionales. Se contempla adjuntar **videos o grabaciones de cámaras** como funcionalidad futura, sujeta a moderación y privacidad. Ejemplo del equipo: un vecino advierte sobre un comportamiento sospechoso y adjunta evidencia. No permitir afirmaciones difamatorias, identificación pública de presuntos responsables sin verificación ni doxxing. Etiquetar **"Reporte vecinal no verificado"**.

### 6.3. Fenómenos naturales y sus efectos

**Recomendaciones iniciales:** qué hacer antes/durante/después de un sismo; preparación ante lluvias intensas, inundaciones, huaicos y deslizamientos; mochila de emergencia; rutas o zonas seguras cuando exista referencia oficial vigente. Distinguir alerta vigente de material educativo, **sin inventar alertas en tiempo real**.

**Publicaciones:** reportar vías inundadas, afectaciones, deslizamientos observados o **necesidades de apoyo**. Campos: título, tipo, descripción, fecha/hora, barrio/sector, foto opcional y necesidades. Etiquetar como reporte vecinal, no alerta oficial. No hacer públicas identidades ni domicilios precisos de personas vulnerables.

### 6.4. Coordinación real de ayuda (OBLIGATORIO)

Las publicaciones de emergencia no deben terminar en mera lectura. Incorporar un subtipo **"Solicitud de ayuda"** y una acción **"Ofrecer ayuda"**:
- Vecino A publica: necesidad concreta, tipo de apoyo, sector y estado **abierta**.
- Vecino B pulsa **Ofrecer ayuda** y queda registrada su oferta vinculada a esa solicitud.
- Vecino A puede ver respuestas y cambiar estado a **en coordinación**, **atendida** o **cancelada**.
- Ambos disponen de medio de coordinación consentido. Mantener historial mínimo de estado y hora.
- Si se trata de rescate, violencia activa, riesgo eléctrico u otra amenaza grave, la interfaz debe priorizar **contactar servicios oficiales** y no promover intervenciones peligrosas de voluntarios.

Agregar también un **directorio básico de grupos y servicios de apoyo** de la zona, por ejemplo entidades locales de atención, bomberos, defensa civil y organizaciones registradas. No inventar grupos, números ni disponibilidad. En demostración, marcar explícitamente los registros ficticios.

### 6.5. Fuentes institucionales y verificación

Las recomendaciones pueden proceder de:
- **INDECI:** preparación, respuesta y orientación ante emergencias.
- **IGP:** información y divulgación sobre actividad sísmica.
- **SENAMHI:** pronósticos y avisos meteorológicos.
- **MINAM:** información ambiental y material relevante sobre fenómeno El Niño.
- **CENEPRED:** riesgos y vulnerabilidades.
- **PNP / MININTER:** seguridad ciudadana.
- **Municipalidad / Defensa Civil:** orientación y recursos de la localidad.
- **ONG y organizaciones humanitarias reconocidas:** material **complementario**, no presentado como pronunciamiento de una autoridad oficial.

Modelo inicial **editorial/curado**, no integración automática: cada tarjeta debe guardar **título, contenido breve, institución, URL de fuente, fecha de consulta/revisión, categoría y tipo de evento**. Cargar solo recomendaciones con fuente real comprobada. **No afirmar que una institución valida o respalda el aplicativo.**

Separar visualmente:
- **"Información institucional"**: contenido referenciado a una publicación de autoridad competente.
- **"Reporte vecinal no verificado"**: contenido generado por usuarios, con fecha/hora y sector.

### 6.6. Seguridad y moderación específica

- Sin estrellas, likes competitivos ni rankings de incidentes.
- Poder **reportar publicación**; moderador puede ocultar material problemático.
- No mostrar dirección exacta ni nombre/datos de víctimas o personas vulnerables sin necesidad y consentimiento.
- No publicar rostros, matrículas o acusaciones no verificadas; usar controles, revisión o anonimización apropiada antes de difundir material sensible.
- Fotos opcionales para MVP; **carga y reproducción de videos de vigilancia es fase posterior**, no requisito bloqueante para entregar una APK de 48 horas.
- Mostrar advertencia: **la app no reemplaza a Policía, Bomberos, Defensa Civil ni canales oficiales**. No generar avisos meteorológicos o sísmicos en tiempo real a partir de reportes ciudadanos.

## 7. Reglas globales de publicaciones, búsquedas y estados

- Crear, listar, buscar/filtrar, abrir detalle, editar/eliminar **solo publicaciones propias**, cambiar estado y reportar contenido.
- Cada publicación guarda identificador, autor, módulo, subtipo, título, descripción, barrio, fecha/hora, estado y adjuntos admitidos.
- Ordenar publicaciones por fecha, con marca temporal visible; destacar "activa" vs "finalizada" y evitar presentar avisos antiguos como recientes.
- Búsqueda textual simple en comercios/publicaciones; no hace falta algoritmo IA de recomendaciones.
- Estados vacíos y errores comprensibles: "Todavía no hay publicaciones en tu zona" y botón para crear, errores de conexión, formularios inválidos y confirmaciones reales tras persistencia.
- Validar campos requeridos, longitudes, tamaño/tipo de archivo y permisos en cliente **y servidor**. Mostrar éxito solo tras confirmación de guardado.
- **Contacto:** opción acordada por autor, no exposición obligatoria de teléfono, correo o domicilio.
- Los registros de ejemplo deben estar marcados **DEMO**; no presentar negocios ni emergencias ficticias como hechos actuales.

## 8. Pantallas mínimas del APK

1. Bienvenida / inicio con tres módulos.
2. Registro / inicio de sesión / recuperación básica si la plataforma lo facilita; selección y cambio de barrio.
3. Economía local: buscador, categorías, listado de resultados.
4. Ficha de establecimiento + estrellas y recomendaciones.
5. Crear/editar ficha del negocio propio.
6. Economía solidaria: tres opciones + filtro/modalidad de ayuda gratuita.
7. Listado de publicaciones por opción y buscador.
8. Detalle y formulario de nueva publicación / edición / cambio de estado.
9. Valoración de experiencia solidaria.
10. Emergencias: elegir inseguridad o fenómenos naturales.
11. Recomendaciones institucionales primero y publicaciones después, en cada categoría.
12. Crear y consultar reporte vecinal o solicitud de ayuda.
13. Ofrecer ayuda, revisar respuestas y cerrar solicitud.
14. Directorio de grupos/servicios de apoyo.
15. Perfil y mis publicaciones / mis negocios.
16. Pantalla simple de moderación para usuario autorizado (puede ser web responsiva separada si reduce costo).

## 9. Modelo de datos mínimo propuesto

Estas son entidades lógicas; el agente puede normalizarlas con claves foráneas e índices adecuados:

- `users`: id, alias/nombre visible, correo/identidad auth, rol, barrio_id, contacto_consentido, timestamps.
- `neighborhoods`: id, distrito, nombre de barrio/sector, estado.
- `businesses`: id, owner_id, barrio_id, nombre, categoría, descripción, referencia_zona, dirección_comercial_publica_opcional, horario, contacto_opcional, foto, estado.
- `business_reviews`: id, business_id, author_id, rating(1..5), comentario_opcional, barrio_autor_al_valorar, timestamp; único `(business_id, author_id)`.
- `posts`: id, author_id, barrio_id, módulo (`solidaria`/`emergencias`), tipo (`venta`, `compra`, `trueque`, `ayuda_gratuita`, `seguridad`, `fenomeno`, `solicitud_ayuda`), título, descripción, ofrece, solicita, precio_opcional, zona_aproximada, fecha_hecho, estado, timestamps.
- `post_media`: id, post_id, tipo, ruta, metadatos; fotos MVP, videos fase futura.
- `solidarity_reviews`: id, post_id o experiencia_id, author_id, rating(1..5), timestamp; prevenir duplicados/autovaloración.
- `help_offers`: id, help_post_id, volunteer_id, mensaje, estado, timestamp.
- `institutional_guidance`: id, categoría, título, contenido, entidad, fuente_url, revisado_en, publicado_en_opcional, visible.
- `support_services`: id, barrio_id o cobertura, nombre, categoría, fuente, contacto_confirmado, disponible_no_confirmado_por_defecto.
- `content_reports`: id, reporter_id, tipo_objeto, objeto_id, motivo, estado, timestamps.

**Controles de acceso:** propietario modifica solo sus recursos; acceso público de lectura únicamente a lo publicado/visible; moderadores revisan reportes; nadie concede permisos cambiando un parámetro en la app. Si se usa Supabase, configurar **RLS** y políticas de acceso. No almacenar contraseñas en tablas de la aplicación.

## 10. Alcance y prioridades para 48 horas

### P0 — MVP obligatorio para que el reto esté cumplido

- App Android instalable, inicio de tres módulos, interfaz móvil coherente.
- Login/registro básico (lectura pública), selección de barrio, datos persistentes.
- Economía local: categorías, búsqueda, listado, ficha, alta de negocio, estrellas y recomendaciones vecinales.
- Economía solidaria: **ver y publicar** venta, compra, trueque y ayuda gratuita; contacto autorizado y estados.
- Emergencias: recomendaciones con fuente y fecha; reportes vecinales por las dos categorías, **solicitar/ofrecer ayuda**, estados y directorio básico de grupos de apoyo.
- Moderación mínima: reportar contenido y opción administrativa para ocultarlo.
- Validaciones, permisos, pruebas de flujos y errores básicos.
- APK que abre y navega en un Android real o emulador, no solo vista web o mockup.

### P1 — Añadir solo si P0 ya pasa pruebas

- Fotos subidas a almacenamiento, filtros avanzados, conteos mejorados de recomendaciones, notificaciones simples, experiencia de contacto más fluida, recursos locales adicionales.

### P2 — Después de la hackathon

- Video de cámaras de seguridad, moderación de video, chat y notificaciones en tiempo real avanzadas, geolocalización precisa/automática, verificación de usuarios compleja, integración con organismos oficiales vía API (solo si existe autorización), algoritmos de recomendación e IA.

**Recorte si falta tiempo:** nunca eliminar el componente de **ayuda sin dinero**, la diferencia entre información oficial y reporte vecinal, el flujo **ofrecer ayuda** ni la posibilidad de **consultar** publicaciones. Reducir adornos, medios adjuntos y automatizaciones antes de recortar estos flujos.

## 11. Arquitectura y estrategia de ejecución recomendadas

**Si no hay código preexistente:** optar por **React + TypeScript + Vite + Capacitor (Android)**, diseño mobile-first y **Supabase** para autenticación, PostgreSQL y almacenamiento opcional. Es una recomendación pragmática para construir el APK en 48 horas, **no un requisito de negocio**. Si ya existe un backend/proyecto funcional, reutilizarlo sin introducir migraciones innecesarias. No conectar a bases de datos de otros proyectos.

- Mantener componentes y servicios organizados por módulos; no mezclar UI con acceso a datos.
- Definir migraciones y datos de ejemplo de un barrio piloto; preparar otro sector para comprobar filtros.
- No colocar llaves de servicio o secretos de administración en el APK. Usar claves públicas apropiadas con políticas de seguridad en el servidor.
- Si no hay acceso a servicio remoto, ofrecer modo demostración **etiquetado** con datos locales para probar la navegación, pero explicar que **no sincroniza publicaciones entre vecinos**. No considerar el modo local suficiente para acreditar persistencia compartida real.
- Android: configurar identificador de app, nombre, icono básico, permisos mínimos y compilación reproducible. Producir **APK debug instalable** para demo; APK release firmado únicamente si se dispone de configuración de firma legítima.

## 12. Plan corto de trabajo

- **0–4 h:** inspección, estructura de datos, navegación, prototipo móvil navegable, criterios de aceptación, base del proyecto.
- **4–16 h:** registro/barrio, economía local, fichas y recomendaciones.
- **16–28 h:** economía solidaria, publicaciones, búsqueda, estados y ayuda gratuita.
- **28–38 h:** emergencias, contenido institucional, reportes, ofrecer ayuda, grupos de soporte y moderación mínima.
- **38–44 h:** pruebas integradas, seguridad básica, correcciones y compilación Android.
- **44–48 h:** instalación/verificación en dispositivo, datos de demostración, documentación y ensayo de exposición.

Esta secuencia es orientativa; si una dependencia bloquea la construcción, priorizar rutas funcionales completas en lugar de interfaces inconexas. Para dos desarrolladores, separar **UI/Capacitor** y **datos/auth/seguridad** con integración continua de cada flujo.

## 13. Pruebas y criterios de aceptación (DEBEN DEMOSTRARSE)

| ID | Prueba observable | Resultado esperado |
|---|---|---|
| A01 | Abrir APK en Android | Muestra tres módulos y permite entrar/regresar sin fallos. |
| A02 | Cambiar barrio | Listados se filtran por sector sin revelar domicilios particulares. |
| A03 | Buscar "gasfitero" o filtrar "Ferreterías" | Devuelve negocios de ejemplo persistidos y fichas con contacto autorizado. |
| A04 | Crear ficha de negocio con cuenta A | Se ve desde cuenta B; cuenta B no puede editarla. |
| A05 | Valorar negocio | Se registra entre 1–5, se actualiza promedio; no hay autocalificación ni duplicados. |
| A06 | Entrar a "Quiero vender" | Se ven publicaciones públicas ajenas y se puede crear una oferta. |
| A07 | Entrar a "Quiero comprar" | Se ven solicitudes; publicar "Busco repostero" y poder consultar ofertas. |
| A08 | Entrar a "Quiero intercambiar" | Crear trueque beterragas/espinacas, verlo desde otra cuenta y contactar. |
| A09 | Crear solicitud de préstamo gratuito | Aparece como ayuda sin dinero y puede marcarse finalizada. |
| A10 | Abrir inseguridad ciudadana | Primero recomendaciones con fuente; luego publicaciones sin estrellas. |
| A11 | Abrir fenómenos naturales | Ver orientación sobre sismos/El Niño antes de reportes, con fuentes y fechas. |
| A12 | Publicar reporte vecinal | Se muestra fecha, sector y rótulo "No verificado", sin suplantar alerta oficial. |
| A13 | Solicitar y ofrecer ayuda | Cuenta B puede ofrecer apoyo; cuenta A ve respuesta y cambia estado a atendida. |
| A14 | Moderar | Usuario reporta contenido; moderador puede ocultarlo; otros no pueden moderar. |
| A15 | Manejar errores | Formularios validan, accesos indebidos se rechazan y no se muestran éxitos falsos. |
| A16 | Reinstalar/abrir en otro dispositivo conectado | Datos compartidos persisten si el backend está configurado; si es DEMO local, se informa explícitamente la limitación. |
| A17 | Revisar calificaciones de emergencias | No hay estrellas ni rankings en ninguna pantalla del módulo. |
| A18 | Instalar el archivo .apk entregado | Inicia sin depender de un servidor de desarrollo local ni de conexión USB al ordenador. |

## 14. Entregables finales exigidos al agente

1. **Código fuente** organizado, con instrucciones para ejecutar y compilar.
2. **APK Android** verificable, con ubicación exacta y versión.
3. **Esquema/migraciones de base de datos** y datos ficticios mínimos (al menos dos barrios, tres negocios, tres publicaciones solidarias, dos reportes y una solicitud con oferta de ayuda).
4. **README** con configuración, variables de entorno (sin secretos), credenciales demo ficticias, modo demo vs backend real e instalación en Android.
5. **Evidencia de pruebas** A01–A18, indicando cuáles pasaron, fallaron o no pudieron ejecutarse; sin inventar resultados.
6. **Resumen de estado**: hecho, pendiente, riesgos, limitaciones y próximos pasos; hashes de commits locales, sin push.

## 15. Restricciones y decisiones pendientes resueltas para empezar

- **Tres entradas principales:** fijas. "Ayuda gratuita" se añade como subtipo/filtro dentro de Economía solidaria, sin eliminar vender/comprar/intercambiar.
- **Zonas múltiples:** implementarlas con barrio piloto como predeterminado; decisión modificable después.
- **Contacto:** externo/consentido en MVP, sin desarrollar chat propio obligatorio.
- **Imágenes:** opcionales; videos en fase posterior.
- **Recomendaciones oficiales:** curadas con fuente y fecha, no conexión directa ni validación oficial de la aplicación.
- **Reportes vecinales:** no verificados por defecto, sin estrellas, moderables.
- **Pagos dentro de la app:** fuera de alcance.
- **Finalidad:** conectar personas y facilitar coordinación, no reemplazar servicios públicos ni garantizar seguridad física.

**ORDEN FINAL:** empieza a implementar el MVP conforme a esta especificación. Primero comprueba el estado del repositorio; después ejecuta el plan y entrega un APK que funcione realmente. Si aparece una decisión menor no especificada, toma una opción sencilla, segura y documenta la decisión en vez de bloquearte. Si aparece un riesgo de seguridad o una credencial faltante, no lo ocultes: entrega la mejor versión funcional posible, separando lo real del modo demostración.
