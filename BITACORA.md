# Bitácora de WhereToSmoke

Registro cronológico de decisiones y cambios. Lo más reciente va arriba.

## 2026-11-08 · Backend: hora feliz, cofre, comunas, álbum, círculos y reacciones (sin commit aún)

- **Hora feliz 4:20** (04:20-05:20 y 16:20-17:20 Bogotá): x2 en XP y monedas de check-in, reclamo de misión y cofre. Regla pura en `ReglasGamificacion`; `GET /api/gamificacion/evento` público.
- **Cofre diario** `POST /api/gamificacion/cofre`: una vez por día (UPDATE condicional sobre `usuarios.ultimo_cofre`), 3% artículo COMUN/RARO nuevo, 55% monedas 3-30, 42% XP 5-25. `Random` inyectable (`AleatorioConfig`). El perfil trae `cofreDisponible` y `multiplicadorEvento`.
- **Comunas y descubridor:** `spots.comuna` por centro más cercano (21 centros, `ComunasMedellin`; aproximado, no polígonos) y backfill idempotente al arrancar. `creadorId` es el descubridor (ahora lo fija el servidor); bono +30 monedas +40 XP por spot. Los spots exponen `comuna` y `descubridorNombre`.
- **Visitas:** tabla `visitas_spot` (usuario, spot, día) alimentada al crear, votar (logueado), calificar, comentar o subir foto. Base de álbum, ranking y metas.
- **Álbum** `GET /api/gamificacion/album` (sello + 50 monedas al completar una comuna, mínimo 3 spots), **ranking** `GET /api/leaderboard/comunas` (XP sumado de usuarios con visitas en 30 días, top 3), **meta de círculo** `GET|POST /api/circulos/{id}/meta[/reclamar]` (objetivo max(10, 5 x miembros); cofre 40 monedas + 30 XP por miembro y semana).
- **Reacciones** `POST /api/fotos/{id}/reaccion` (5 emojis, una por usuario; en BD se guarda un código). `FotoDTO` trae `reacciones` y `miReaccion`; los likes no cambian.
- Tablas nuevas por `ddl-auto=update`: `visitas_spot`, `sellos_comuna`, `reclamos_meta_circulo`, `reacciones_foto`; columnas `usuarios.ultimo_cofre`, `spots.comuna`.
- Tests: reglas puras, cofre, descubridor, visitas, álbum, ranking, metas y reacciones (con Mockito). Sin probar contra MySQL real las consultas nativas (INSERT IGNORE, ranking) ni los endpoints en vivo: el servidor :8081 corre el código viejo y hay que reiniciarlo.

## 2026-11-07 · Agente 1: WebSocket (sin commit aún)

- STOMP exige JWT en `CONNECT`; el remitente sale del Principal del servidor; orígenes vía `app.cors.allowed-origins`.
- `GeoChat.jsx` y `MapComponent.jsx` migrados a STOMP con el token en `connectHeaders` (ya no va en la URL).
- **Decisión del usuario:** las alertas en vivo (`/topic/alerts`) son solo para usuarios con login. No se abre ningún topic público.
- Pendiente: probar una conexión real (reiniciar el backend); el token de 24 h solo se valida al conectar.
## 2026-11-08 · Explorar, Círculos y Rutas como app móvil (sin commit aún)

**Navegación:** barra inferior = Mapa, Explorar, Misiones, Tienda, Perfil. `/explorar?tab=spots|feed|ranking` reúne Descubrir, Feed y Ranking; `/feed`, `/descubrir` y `/leaderboard` redirigen. En el HUD del mapa: pastilla directa «Mi círculo» (contador de miembros compartiendo) y menú ordenado por uso (Círculos, Ruta de bajo perfil, Ranking, Descubrir, modo claro/oscuro, perfil).
**Explorar (agente A):** `ExplorarPage` con control segmentado accesible; Spots (carruseles Tendencia/Mejor calificados, «Cerca de ti», chips de categoría), Feed (tarjetas con foto 1:1, like animado, comentarios en hoja), Ranking (podio 2-1-3, lista, «Tu posición» fija).
**Círculos y Rutas (agente B):** `BottomSheet` reutilizable (dialog, foco, Escape, safe-area, modo compacto); `TrustCircles` y `RouteCalculator` reescritos como hojas inferiores; «Ruta segura» y «Google Maps» en la `SpotCard`; arreglado un intervalo de ubicación que se filtraba y el mapa que ignoraba toques al cerrar el calculador a mitad.
**Arreglos míos:** `AuthModal` en Misiones, Tienda y Perfil ahora usa portal (quedaba bajo la barra); se oculta el control de zoom de Leaflet en móvil (era una franja blanca tapada por la búsqueda).
**Revisado en navegador (375 px):** Ranking, Spots, mapa con «Mi círculo» y modal de acceso como invitado.
**Sin probar:** hojas de Círculos y Rutas por mí (solo por el agente B, con usuario de prueba), Feed con likes/comentarios, «Cerca de ti» con datos, contador del HUD con varios miembros, errores/estados vacíos, dispositivo real.
**Pendiente / avisos:** las tarjetas de spot usan la mascota porque los endpoints de lista no traen foto; el leaderboard no devuelve `equipados` (casi todos los avatares salen por defecto); `AuthModal` conserva campos sin estilo (selector «¿Cómo te identificas?») y su capa no oscurece la barra inferior; `FeedPage`, `DescubrirPage` y `Leaderboard` (este aún lo usa `MapComponent`) quedaron como código muerto o casi; MapComponent aún guarda estado sin uso de Leaderboard/Sugeridos. Datos de prueba en la BD local: varios usuarios `demo…`/`ui…`/`chk…`/`tst…`.

## 2026-11-08 · Fase 3B: HUD del mapa (commit cc1d0ee)

- Nuevos `MapHUD.jsx`, `SpotCard.jsx`, `map-hud.css`; reescritos `Controls.jsx` (chips Todos/Tombo/Relax con contadores reales); `SearchBar` (`embedded`), `DayNightClock` (`compact`). `MapComponent.jsx` pierde ~360 líneas (columna de botones, personajes decorativos, Popup por spot).
- Móvil (375 px): búsqueda a ancho completo; chips Nivel/monedas/racha (llevan a Misiones/Tienda) o «Inicia sesión» para invitados; reloj como píldora; filtros; botón de ubicación y menú (Ranking, Descubrir, Círculos, Rutas, modo claro/oscuro, perfil); tarjeta inferior del spot con Cómo llegar / Ver detalle / Chat. Revisado en el navegador: sin solapes ni scroll horizontal.
- Sin probar: 1280 px, votos y Chat desde la tarjeta, acciones del menú (Ranking, Círculos, Rutas), safe-area y reduced-motion.
- Avisos: GeoChat en escritorio puede tapar la pila de acciones; `SpotDetailModal` y navbar comparten z-index 2000; `UserButton.jsx` quedó sin uso; `MapComponent.jsx` conserva 5 errores de lint previos.

## 2026-11-08 · Implementación del rediseño, Fases 1 y 2 (commit 0f9e2e4)

**Fase 1 (frontend):** tokens de diseño en `theme.css`, `SplashScreen` con progreso real (sesión, mapa, spots) y toque en Bob, navbar de 5 pestañas (Mapa, Feed, Misiones, Tienda, Perfil), accesos a Descubrir/IA/Info dentro de Perfil, botón flotante de IA en el mapa. Pendiente de probar: onboarding tras la splash, modo claro, backend caído.
**Defecto conocido:** en móvil la barra de búsqueda del mapa queda tapada por el reloj y la columna de botones izquierda se solapa → Fase 3B (HUD del mapa).

**Fase 2 (backend):** monedas, nivel (XP para nivel n = 50·n·(n−1), tope 50) con 7 rangos, racha con check-in diario (5 monedas el día 1, +2 por día, tope 25; +10 XP), misiones diarias/semanales con progreso desde eventos reales y reclamo atómico, tienda de cosméticos (15 artículos, 4 rarezas, nivel y precio), inventario, equipar/desequipar y registro auditable de monedas. 23 tests nuevos (25 en total) pasan.
**Probado de punta a punta (backend real, usuario de prueba):** registro, perfil, check-in (+5 monedas, idempotente), misiones, compra sin saldo → 402, rutas sin login → 403, catálogo público.
**Sin probar en ejecución:** compra con saldo suficiente, reclamar misión, equipar (solo con tests unitarios).
**Nota:** el test `WheretosmokeApplicationTests` levanta el contexto completo y puede crear tablas/sembrar datos en la BD local. Existe un usuario de prueba `demo…` en la BD local.
**Decisión:** premios = solo cosméticos virtuales con monedas del juego; nada de dinero real ni cupones.
**Fase 3A (frontend, código completo, sin commit):** `GamificacionContext` + `useGamificacion`, `gamificacionApi`, `utils/itemImage.js` (resuelve las imágenes del catálogo), `CharacterAvatar`, y las pantallas reales de Misiones (nivel, racha, check-in, misiones, reclamo animado, insignias, Top 3), Tienda (pestañas, rarezas, compra con confirmación) y Perfil (avatar con skin/marco/mascota, estadísticas, colección y vestidor). `npm run build` pasa y el lint está limpio en los archivos nuevos. Comprobadas por curl las formas de respuesta que el front supone (`bonoManana` numérico, inventario, equipados, equipar sin tenerlo → 400).
**URL del API centralizada:** el navegador integrado bloqueaba `localhost:5173 → localhost:8081`. Se creó `src/config.js` (`API_BASE`, `WS_URL`, `API_ORIGIN`) y un proxy de Vite (`/api` y `/ws` → `VITE_PROXY_TARGET`, por defecto `http://localhost:8081`); 21 archivos ya no tienen la URL escrita a mano. Por defecto las peticiones son relativas (mismo origen). Si el backend vive en otro dominio: `VITE_API_ORIGIN=https://api…` y `CORS_ORIGINS` en el backend; en producción hace falta un proxy inverso que sirva `/api` y `/ws`. Reinicia Vite tras cambiar `vite.config.js`.
**Verificado en navegador con sesión (usuario de prueba):** Misiones (check-in real: +5 monedas y +10 XP, racha 1, el estado persiste al recargar), Tienda (catálogo con rarezas, bloqueos por nivel y saldo, 0 imágenes rotas) y Perfil (avatar, estadísticas, vestidor y colección vacía). Arreglados: avatar por defecto (los PNG `Hombre/Mujer/elle` son solo ojos) y estilo del botón «Reclamar» deshabilitado.
**Todavía sin ejecutar en el navegador:** comprar con saldo suficiente, reclamar una misión completada, equipar/desequipar, modal de subida de nivel, ancho móvil con sesión.
**Problema de arte:** los skins `SKIN_PARCERO`, `SKIN_PARCERA` y `SKIN_ELLE` usan imágenes de ojos, no personajes; hay solo 6 personajes completos (`bud_smoking`, `bud_map`, `bud_angry`, `bud_police`, `hippie_guy`, `rainbow_guy`). Hay que reasignar el catálogo o crear más arte (el seeder solo inserta si falta el código, así que habría que actualizar la BD).
**Pendiente:** Fase 3B (HUD del mapa en móvil con nivel/monedas/racha, tarjeta de spot inferior), círculos de confianza sin enlace en Perfil (se abre desde el estado de `MapComponent`).

## 2026-11-08 · Rediseño: mapa y diseño en Stitch (sin commit aún)

- **Mapa arreglado:** CARTO exige API key y pintaba «API KEY REQUIRED». Ahora usa mosaicos de OpenStreetMap sin clave; el modo oscuro es un filtro CSS (`index.css`). Para producción definir `VITE_TILE_URL` con un proveedor propio (el uso intensivo de los mosaicos públicos de OSM no está permitido).
- **Decisiones del usuario:** premios = solo cosméticos virtuales (sin cupones ni dinero real); flujo = diseño primero, revisión, luego implementación por fases.
- **Stitch:** proyecto «WhereToSmoke Rediseño» (id 15478841977600443864) con sistema de diseño «WhereToSmoke Pro» (oscuro, verde #22C55E, dorado #FACC15, violeta #A78BFA, Outfit + Inter, esquinas 12). Generadas: pantalla de carga y Misiones. Mapa, Tienda y Perfil dieron timeout y se reintentan una a una.

## 2026-11-08 · Agente 3: círculos y votos (sin commit aún)

- SUBSCRIBE a `/topic/circulo/{id}` exige ser miembro activo del círculo.
- Votos tombo/relax (siguen anónimos): `VoteRateLimiter` + `VoteRateLimitFilter`, 10 votos/IP/hora y 1 voto por spot+fingerprint+IP; 429 al exceder. Test `VoteRateLimiterTest` pasa.
- Abierto: `/topic/chat/{spotId}` sigue escuchable por cualquier usuario con login; el 429 puede salir sin cabeceras CORS; tras un proxy hay que configurar `server.forward-headers-strategy`; TrustCircles debe suscribirse solo siendo miembro.
- Pendiente: reiniciar el backend y probar todo en ejecución.

## 2026-11-07 · Agente 2: push y TrustCircles (sin commit aún)

- `POST /api/push/subscribe` toma el usuario de la sesión (401 sin sesión); el frontend ya no manda `userId`.
- `TrustCircles.jsx` migrado a STOMP sobre SockJS (topic `/topic/circulo/{id}/ubicaciones`), token solo en `connectHeaders`.
- **Brecha detectada:** el SUBSCRIBE a un círculo no comprueba que el usuario sea miembro; cualquier usuario con login podría ver ubicaciones de un círculo ajeno. → Agente 3.
- Sin probar en ejecución; hay que reiniciar el backend.

## 2026-11-07 · Demo y arreglo de `/api/spots` (sin commit aún)

**Demo:** backend en :8081 (arranca en ~9 s con la config nueva) y frontend Vite en :5173.
Verificado con peticiones reales: sin login dan 403 `POST /spots`, `POST /push/broadcast`, `POST /ai/chat`,
`/admin/users` y `/favoritos`; públicos 200 `GET /spots`, leaderboard y geozonas; un origen ajeno no recibe cabeceras CORS.

**Bug encontrado:** `GET /api/spots` daba 500 (`LocalDateTime` no soportado). `JacksonConfig` creaba un
`ObjectMapper` sin módulos y, tras bajar `pom.xml` a Spring Boot 3.3.4, dejó de funcionar. La seguridad lo
mostraba como 403 porque `/error` exigía login.
**Arreglo:** `JacksonConfig` registra módulos (`findAndRegisterModules`) y fechas ISO; `/error` es público.

**Observaciones de la demo (pendientes):**
- Los mosaicos del mapa muestran «API KEY REQUIRED»: la clave `VITE_CARTO_API_KEY` de `cliente-mapa/.env` falta o no es válida.
- El filtro «Todos» marca 0 spots y el spot de prueba tiene nombre y categoría nulos.

## 2026-11-07 · Endurecimiento de seguridad (commit `791aa07`)

**Diagnóstico inicial**
- App: mapa social para la comunidad cannábica de Medellín (Spring Boot + MySQL + React 19 + Leaflet).
- Funcionalidad amplia (mapa, chat, feed, círculos, gamificación, admin, IA); seguridad y tests flojos.

**Hecho**
- Secretos (Azure OpenAI, VAPID, DB, JWT) movidos a `secrets.properties` (ignorado por git). Plantilla en `.env.example`.
- Archivos de claves (`private_key.txt`, `public_key.txt`, `keys.txt`) dejados de versionar.
- JWT: secreto obligatorio, sin valor por defecto en el código.
- `SecurityConfig`: `anyRequest().authenticated()`; broadcast push solo ADMIN.
- CORS configurable con `app.cors.allowed-origins`; quitados `@CrossOrigin("*")` y `CorsConfig` duplicado.
- Chat IA: login obligatorio, 1000 caracteres por mensaje, 20 mensajes por hora por usuario.
- Frontend: aviso al crear un spot sin sesión.

**Pendiente de acción manual**
- Rotar claves de Azure OpenAI, par VAPID y contraseña de MySQL: siguen en el historial de git.

## Cola de trabajo (en orden)

| # | Tarea | Estado |
|---|-------|--------|
| 1 | Autenticar el WebSocket (`/ws/**`) y validar remitente del chat | Pendiente |
| 2 | `POST /api/push/subscribe`: usar el usuario de la sesión, no `userId` por parámetro | Pendiente |
| 3 | Votos tombo/relax: limitar abuso (rate limit por IP + fingerprint) | Pendiente |
| 4 | Tests de los flujos críticos (auth, spots, votos) | Pendiente |
| 5 | Partir `MapComponent.jsx` (1.078 líneas) | Pendiente |
| 6 | Alinear README con el código (MySQL vs PostGIS, versiones en `pom.xml`) | Pendiente |
| 7 | Producto: moderación, coordenadas difuminadas, piloto en una comuna | Pendiente |

## 2026-11-08 · Cliente: "jugo" y mascota (solo frontend)

- Nuevos: `utils/eventosJuego.js` (bus emitir/suscribir), `components/fx/*` (Confeti, MonedasVoladoras, SubidaDeNivel, MascotaCompanera, LlamaRacha, FxLayer, IndicadorPull, EstadoVacio), `hooks/useHaptics`, `usePullToRefresh`, `useReducedMotion`.
- `useSound` ahora sintetiza con WebAudio (coin, pop, success, levelUp...) y respeta el toggle persistente; toggle visible en Perfil y en el menu del HUD.
- `GamificacionContext` emite checkin/mision/nivel/compra/cofre, detecta subida de nivel una sola vez (localStorage por usuario) y expone `getEvento`, `abrirCofre`, `getAlbum` (tolerantes a 404, sin llamarse al cargar).
- Tour inicial de 5 pasos con la mascota (relanzable desde Perfil), pull-to-refresh en Misiones y Perfil, entradas escalonadas y estados vacios con mascota.
- Pendiente: probar en dispositivo real (vibracion/sonido) y los endpoints `/gamificacion/evento|cofre|album` cuando existan en el backend.

## Capa social en Explorar (reacciones, comunas, descubridor, meta de círculo)
- Feed: barra de reacciones (🔥😂😮💚🌿) con actualización optimista y rollback (`ReaccionesBar.jsx`); el like con corazón se mantiene aparte (doble toque), las reacciones son expresivas y no sustituyen el contador de likes.
- Ranking: selector Personas | Comunas; tarjetas de territorio en `explorar/ComunasRanking.jsx`.
- Spots/SpotCard: chip de comuna, "Descubierto por @usuario" y filtro por comuna.
- Círculos: tarjeta "Meta semanal" con reclamo de cofre (`CirculoMeta.jsx`). API en `services/socialApi.js`, estilos en `components/social.css`.

## 2026-11-08 · Cliente: Hora feliz 4:20, cofre diario y álbum de comunas
- `hooks/useEventoHoraFeliz.js`: consulta `/gamificacion/evento` (público), cuenta atrás local, resincroniza cada 60 s, al volver la pestaña y justo en cada cambio de ventana; el contexto expone `evento`, `multiplicadorEvento` y `cofreDisponible`. Si el backend no responde, la píldora se oculta.
- `HoraFeliz.jsx`: píldora en el HUD (discreta fuera de ventana, dorada con pulso dentro), insignia x2 (chip de monedas, Misiones, check-in, recompensas) y aviso (confeti + toast + mascota) al empezar la ventana con la app abierta (evento `horafeliz` en el bus).
- `CofreDiario.jsx`: cofre SVG que se sacude, abre con animación y revela el premio (monedas con vuelo, XP o artículo con rareza); gris con cuenta atrás a medianoche de Bogotá; invitado ve invitación a registrarse. Usa `abrirCofre` (solo API) + `aplicarCofre` (al revelar: perfil, evento `cofre`). Punto rojo en el chip de nivel del HUD si hay cofre.
- `AlbumComunas.jsx` en Perfil: sellos por comuna con anillo de progreso, dorado con mascota si está completa, "pocos spots aún" si totalSpots < 3, detalle en BottomSheet.
- `multiplicador` de checkin/misión/cofre se muestra en toasts ("¡x2 por hora feliz!") y confeti dorado. Estilos en `hora-feliz.css` y `cofre-album.css`.

## 2026-11-08 · Backend: perfil público, amigos y mensajes privados
- Nuevo: `Amistad` (tabla `amistades`: UNA fila por par `usuario_menor < usuario_mayor` con índice único + `estado` PENDIENTE/ACEPTADA + `solicitante_id`; rechazar/cancelar borra la fila, así las solicitudes cruzadas simultáneas no pueden duplicarse), `Bloqueo` (`bloqueos`), `MensajePrivado` (`mensajes_privados`, índices `(par, id)` y `(para_id, leido, de_id)`).
- Servicios `PerfilPublicoService`, `AmistadService`, `BloqueoService`, `MensajePrivadoService`, `UsuarioResumenService` (carga en lote, sin N+1); `MensajeRateLimiter` (30 msgs/min por usuario, ventana deslizante en memoria). Un solo `SocialController` + `SocialExceptionHandler` ({"error":...}).
- Endpoints: `/api/usuarios/buscar|{id}/perfil|bloqueados|{id}/bloquear`, `/api/amigos[/solicitudes[/{id}/aceptar|rechazar|cancelar]]`, `/api/mensajes/conversaciones|no-leidos|{id}|{id}/leido`. Todo autenticado (matcher explícito en `SecurityConfig`).
- Tiempo real: `convertAndSendToUser(<id>, "/queue/mensajes", dto)` tras el commit; evento `{tipo:'leido', deId}`. El cliente se suscribe a `/user/queue/mensajes`. En `WebSocketConfig` el Principal STOMP ahora tiene `getName()` = id de usuario; se bloquea SUBSCRIBE a `/queue/**` y a cualquier `/user/**` salvo `/user/queue/<nombre>`, y SEND solo a `/app/**` (sin esto un cliente podía suplantar eventos enviando a `/user/<id>/queue/...`).
- Privacidad: el perfil no incluye email, monedas, ubicación ni visitas; quien me bloqueó responde 404 igual que un id inexistente.
- Tests: `SocialServiceTest` (Mockito). Sin verificar: las consultas JPQL contra datos reales en MySQL (solo se validó que el contexto arranca) y el WebSocket en vivo.

## 2026-11-08 · Cliente: perfil público, amigos y chat (frontend)
- Rutas nuevas: `/usuario/:id` (perfil público; el propio redirige a `/perfil`), `/amigos?tab=amigos|solicitudes|buscar`, `/chat` (bandeja) y `/chat/:id` (conversación, oculta la barra inferior y sigue al `visualViewport` para que el teclado no tape la entrada).
- `context/MensajesContext.jsx` (+ `mensajesStore.js`, `hooks/useMensajes.js`): un solo proveedor mantiene no leídos + solicitudes y la suscripción STOMP a `/user/queue/mensajes` (JWT en CONNECT, reconexión a 5 s). Toast + sonido suave si llega un mensaje fuera de esa conversación; sondeo cada 15 s si el socket cae (60 s si está vivo).
- Accesos: botones Amigos y Mensajes (con badge) en la cabecera de Explorar, tarjetas "Mis amigos" y "Mensajes" en Perfil, y "Mensajes" con punto en el menú del HUD (más punto en el botón del menú). Nombres tocables hacia el perfil en Ranking (podio y filas), top de comunas y miembros de círculos.
- Chat: burbujas con agrupación por día/remitente, "Ver mensajes anteriores" sin saltos de scroll, UI optimista con reintento/descartar, "Visto", aviso "mensaje nuevo" si estás leyendo más arriba, textarea autoajustable con contador y Enter para enviar. El texto siempre se pinta como texto.
- Pendiente: Feed y SpotCard no traen id de usuario (`FotoDTO`, `ComentarioFotoDTO`, `descubridorNombre` solo llevan el nombre), así que esos nombres aún no enlazan.
- Usuarios de prueba creados en local: `social_test_a` / `social_test_b` (@example.com).
