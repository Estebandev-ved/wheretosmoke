package com.medallo_map.wheretosmoke.service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.PrecisionModel;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import com.medallo_map.wheretosmoke.dto.AlertaDTO;
import com.medallo_map.wheretosmoke.dto.SpotDetalleDTO;
import com.medallo_map.wheretosmoke.dto.SpotVotacionDTO;
import com.medallo_map.wheretosmoke.model.HistorialAlerta;
import com.medallo_map.wheretosmoke.model.Reporte;
import com.medallo_map.wheretosmoke.model.Spot;
import com.medallo_map.wheretosmoke.repository.HistorialAlertaRepository;
import com.medallo_map.wheretosmoke.repository.ReporteRepository;
import com.medallo_map.wheretosmoke.repository.SpotRepository;

@Service
public class SpotService {

    @Autowired
    private SpotRepository spotRepository;

    @Autowired
    private ReporteRepository reporteRepository;

    @Autowired
    private HistorialAlertaRepository historialAlertaRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private PushNotificationService pushNotificationService;

    @Autowired
    private GeoZonaService geoZonaService;

    @Autowired
    private MisionService misionService;

    @Autowired
    private VisitaService visitaService;

    @Autowired
    private DescubridorService descubridorService;

    @Autowired
    private com.medallo_map.wheretosmoke.repository.UsuarioRepository usuarioRepository;

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(SpotService.class);

    // Factory para crear objetos Point (necesario para JTS)
    private static final GeometryFactory geometryFactory = new GeometryFactory(new PrecisionModel(), 4326);

    // CONFIGURACION: Votos necesarios para cambiar el estado
    private static final int VOTOS_NECESARIOS = 3;

    // TIEMPO DE VALIDEZ de un voto (2 horas)
    private static final int HORAS_VALIDEZ = 2;

    public List<Spot> getAllSpots() {
        return spotRepository.findAll();
    }

    // SPOTS CERCANOS CON POSTGIS
    // Usa tipos geometricos nativos para mejor performance
    public List<SpotDetalleDTO> getSpotsCercanos(double lat, double lng, double radius) {
        // Crear punto Point desde coordenadas
        Point ubicacionUsuario = geometryFactory.createPoint(new Coordinate(lng, lat));
        List<Spot> spots = spotRepository.findCercanos(ubicacionUsuario, radius);
        return spots.stream().map(this::enrichSpotWithVotes).toList();
    }

    // MEJORES SPOTS
    public List<SpotDetalleDTO> getMejoresSpots() {
        List<Spot> spots = spotRepository.findMejores(PageRequest.of(0, 10));
        return spots.stream().map(this::enrichSpotWithVotes).toList();
    }

    // TRENDING SPOTS
    public List<SpotDetalleDTO> getTrendingSpots() {
        List<Spot> spots = spotRepository.findTrending(PageRequest.of(0, 10));
        return spots.stream().map(this::enrichSpotWithVotes).toList();
    }

    // Helper para convertir a DTO con votos
    private SpotDetalleDTO enrichSpotWithVotes(Spot spot) {
        SpotDetalleDTO dto = SpotDetalleDTO.fromSpot(spot);

        LocalDateTime limite = LocalDateTime.now().minusHours(HORAS_VALIDEZ);
        int votosTombo = reporteRepository.contarVotosPorTipo(spot.getId(), "TOMBO", limite);
        int votosRelax = reporteRepository.contarVotosPorTipo(spot.getId(), "RELAX", limite);

        dto.setVotosTombo(votosTombo);
        dto.setVotosRelax(votosRelax);

        // No cargamos fotos/comentarios detallados en listas para rendimiento
        return dto;
    }

    /**
     * GUARDAR UN NUEVO SPOT - CON VALIDACION DE GEO-ZONA
     */
    public Spot guardarSpot(Spot spot) {
        return guardarSpot(spot, null);
    }

    /** Variante con usuario autenticado: cuenta para misiones (CREAR_SPOT). */
    public Spot guardarSpot(Spot spot, Long usuarioId) {
        // Validar que este en Medellin
        if (!geoZonaService.puntoEnMedellin(spot.getLatitud(), spot.getLongitud())) {
            throw new RuntimeException("Solo se permiten spots en Medellin");
        }

        // Validar que este en zona activa
        if (!geoZonaService.puntoEnZonaPermitida(spot.getLatitud(), spot.getLongitud())) {
            throw new RuntimeException("Esta zona aun no esta disponible. Proximamente!");
        }

        // Todo OK, crear spot. Comuna y descubridor los fija el servidor (se ignoran los del cliente).
        spot.setId(null);
        spot.setEstado("VERDE");
        spot.setUltimaAlerta(LocalDateTime.now());
        spot.setComuna(ComunasMedellin.asignar(spot.getLatitud(), spot.getLongitud()));
        if (usuarioId != null) {
            spot.setCreadorId(usuarioId);
        }
        Spot guardado = spotRepository.save(spot);
        if (usuarioId != null) {
            try {
                descubridorService.premiar(usuarioId, guardado.getId());
            } catch (RuntimeException e) {
                log.warn("No se pudo pagar el bono de descubridor del spot {}: {}", guardado.getId(), e.getMessage());
            }
            visitaService.registrar(usuarioId, guardado);
            usuarioRepository.findById(usuarioId)
                    .ifPresent(u -> guardado.setDescubridorNombre(u.getUsername()));
        }
        misionService.registrarAccion(usuarioId, com.medallo_map.wheretosmoke.model.AccionMision.CREAR_SPOT);
        return guardado;
    }

    /**
     * OBTENER TODOS LOS SPOTS (con limpieza automatica)
     */
    public List<Spot> obtenerTodos() {
        List<Spot> spots = spotRepository.findAll();
        LocalDateTime limite = LocalDateTime.now().minusHours(HORAS_VALIDEZ);

        for (Spot spot : spots) {
            if ("ROJO".equals(spot.getEstado()) && spot.getUltimaAlerta().isBefore(limite)) {
                spot.setEstado("VERDE");
                spotRepository.save(spot);
            }
        }
        return spots;
    }

    /**
     * OBTENER TODOS CON INFORMACION DE VOTACION
     */
    public List<SpotVotacionDTO> obtenerTodosConVotos(String fingerprint) {
        List<Spot> spots = obtenerTodos();
        completarDescubridores(spots);
        List<SpotVotacionDTO> resultado = new ArrayList<>();
        LocalDateTime limite = LocalDateTime.now().minusHours(HORAS_VALIDEZ);

        for (Spot spot : spots) {
            int votosTombo = reporteRepository.contarVotosPorTipo(spot.getId(), "TOMBO", limite);
            int votosRelax = reporteRepository.contarVotosPorTipo(spot.getId(), "RELAX", limite);
            boolean yaVoto = reporteRepository.usuarioYaVoto(spot.getId(), fingerprint, limite);

            String mensaje = construirMensajeEstado(votosTombo, votosRelax, spot.getEstado());

            resultado.add(new SpotVotacionDTO(spot, votosTombo, votosRelax, yaVoto, mensaje));
        }

        return resultado;
    }

    /**
     * 4️⃣ REPORTAR POLICÍA (TOMBO) - CON WEBSOCKET
     */
    public SpotVotacionDTO reportarPolicia(Long spotId, String fingerprint) {
        return reportarPolicia(spotId, fingerprint, null);
    }

    /** usuarioId (opcional): si el votante está autenticado, el voto nuevo cuenta para misiones. */
    public SpotVotacionDTO reportarPolicia(Long spotId, String fingerprint, Long usuarioId) {
        Spot spot = spotRepository.findById(spotId)
                .orElseThrow(() -> new RuntimeException("Spot no encontrado"));

        LocalDateTime limite = LocalDateTime.now().minusHours(HORAS_VALIDEZ);

        // ✅ Verificar si ya votó
        if (reporteRepository.usuarioYaVoto(spotId, fingerprint, limite)) {
            return construirRespuesta(spot, fingerprint, "Ya votaste en este spot");
        }

        // Guardar el nuevo voto con ubicacion del spot
        Reporte nuevoReporte = new Reporte();
        nuevoReporte.setSpotId(spotId);
        nuevoReporte.setTipoReporte("TOMBO");
        nuevoReporte.setUserFingerprint(fingerprint);
        nuevoReporte.setTimestamp(LocalDateTime.now());
        // IMPORTANTE: Guardar ubicacion para rutas de bajo perfil
        nuevoReporte.setLocation(spot.getLocation());
        reporteRepository.save(nuevoReporte);
        // Solo votos nuevos de usuarios logueados; el límite diario lo pone la meta de la misión
        misionService.registrarAccion(usuarioId, com.medallo_map.wheretosmoke.model.AccionMision.VOTAR_SPOT);
        visitaService.registrar(usuarioId, spot);

        // 🔢 Contar votos TOMBO actuales
        int votosTombo = reporteRepository.contarVotosPorTipo(spotId, "TOMBO", limite);
        int votosRelax = reporteRepository.contarVotosPorTipo(spotId, "RELAX", limite);

        // 💾 Guardar contadores en el spot (para trending/stats)
        spot.setVotosTombo(votosTombo);
        spot.setVotosRelax(votosRelax);

        // 🚨 Si hay suficientes votos, cambiar a ROJO y enviar alerta
        if (votosTombo >= VOTOS_NECESARIOS && !"ROJO".equals(spot.getEstado())) {
            spot.setEstado("ROJO");
            spot.setUltimaAlerta(LocalDateTime.now());
            spotRepository.save(spot);

            // 📡 ENVIAR ALERTA POR WEBSOCKET A TODOS LOS USUARIOS
            enviarAlertaWebSocket(spot, "TOMBO");

            // ENVIAR PUSH NOTIFICATION
            pushNotificationService.enviarBroadcast(
                    "ALERTA POLICIA!",
                    "Se reportaron tombos en " + spot.getNombre());
        } else {
            // Guardar aunque no cambie el estado (para actualizar contadores)
            spotRepository.save(spot);
        }

        return construirRespuesta(spot, fingerprint, "Voto registrado");
    }

    /**
     * 5️⃣ REPORTAR RELAX - CON WEBSOCKET
     */
    public SpotVotacionDTO reportarRelax(Long spotId, String fingerprint) {
        return reportarRelax(spotId, fingerprint, null);
    }

    public SpotVotacionDTO reportarRelax(Long spotId, String fingerprint, Long usuarioId) {
        Spot spot = spotRepository.findById(spotId)
                .orElseThrow(() -> new RuntimeException("Spot no encontrado"));

        LocalDateTime limite = LocalDateTime.now().minusHours(HORAS_VALIDEZ);

        // ✅ Verificar si ya votó
        if (reporteRepository.usuarioYaVoto(spotId, fingerprint, limite)) {
            return construirRespuesta(spot, fingerprint, "Ya votaste en este spot");
        }

        // Guardar el nuevo voto con ubicacion del spot
        Reporte nuevoReporte = new Reporte();
        nuevoReporte.setSpotId(spotId);
        nuevoReporte.setTipoReporte("RELAX");
        nuevoReporte.setUserFingerprint(fingerprint);
        nuevoReporte.setTimestamp(LocalDateTime.now());
        // IMPORTANTE: Guardar ubicacion para rutas de bajo perfil
        nuevoReporte.setLocation(spot.getLocation());
        reporteRepository.save(nuevoReporte);
        // Solo votos nuevos de usuarios logueados; el límite diario lo pone la meta de la misión
        misionService.registrarAccion(usuarioId, com.medallo_map.wheretosmoke.model.AccionMision.VOTAR_SPOT);
        visitaService.registrar(usuarioId, spot);

        // 🔢 Contar votos actuales (ambos tipos)
        int votosRelax = reporteRepository.contarVotosPorTipo(spotId, "RELAX", limite);
        int votosTombo = reporteRepository.contarVotosPorTipo(spotId, "TOMBO", limite);

        // 💾 Guardar contadores en el spot (para trending/stats)
        spot.setVotosTombo(votosTombo);
        spot.setVotosRelax(votosRelax);

        // 🥦 Si hay suficientes votos, cambiar a VERDE
        if (votosRelax >= VOTOS_NECESARIOS && !"VERDE".equals(spot.getEstado())) {
            spot.setEstado("VERDE");
            spot.setUltimaAlerta(LocalDateTime.now());
            spotRepository.save(spot);

            // 📡 ENVIAR ALERTA POR WEBSOCKET A TODOS LOS USUARIOS
            enviarAlertaWebSocket(spot, "RELAX");

            // ENVIAR PUSH NOTIFICATION
            pushNotificationService.enviarBroadcast(
                    "ZONA DESPEJADA",
                    "El spot " + spot.getNombre() + " ahora es seguro.");
        } else {
            // Guardar aunque no cambie el estado (para actualizar contadores)
            spotRepository.save(spot);
        }

        return construirRespuesta(spot, fingerprint, "Voto registrado");
    }

    /**
     * 📡 ENVIAR ALERTA POR WEBSOCKET
     */
    private void enviarAlertaWebSocket(Spot spot, String tipoAlerta) {
        // 📊 Registrar en historial
        LocalDateTime ahora = LocalDateTime.now();
        HistorialAlerta historial = HistorialAlerta.builder()
                .spotId(spot.getId())
                .tipoAlerta(tipoAlerta)
                .timestamp(ahora)
                .diaSemana(ahora.getDayOfWeek().getValue())
                .horaDia(ahora.getHour())
                .build();
        historialAlertaRepository.save(historial);

        AlertaDTO alerta = AlertaDTO.builder()
                .spotId(spot.getId())
                .spotNombre(spot.getNombre())
                .latitud(spot.getLatitud())
                .longitud(spot.getLongitud())
                .tipoAlerta(tipoAlerta)
                .mensaje(tipoAlerta.equals("TOMBO")
                        ? "ALERTA! Policia reportada en " + spot.getNombre()
                        : "Zona despejada: " + spot.getNombre())
                .timestamp(ahora.format(DateTimeFormatter.ofPattern("HH:mm:ss")))
                .build();

        // Enviar a todos los suscriptores de /topic/alerts
        messagingTemplate.convertAndSend("/topic/alerts", alerta);
        System.out.println("Alerta enviada: " + alerta.getMensaje());
    }

    /**
     * LIMPIEZA PERIODICA DE REPORTES ANTIGUOS
     */
    public void limpiarReportesAntiguos() {
        LocalDateTime limite = LocalDateTime.now().minusHours(HORAS_VALIDEZ);
        List<Reporte> reportesViejos = reporteRepository.findByTimestampBefore(limite);
        reporteRepository.deleteAll(reportesViejos);
    }

    // ═══════════════════════════════════════════════════════════════
    // METODOS AUXILIARES
    // ═══════════════════════════════════════════════════════════════

    /** Rellena descubridorNombre (username del creador) con una sola consulta para toda la lista. */
    private void completarDescubridores(List<Spot> spots) {
        java.util.Set<Long> ids = new java.util.HashSet<>();
        for (Spot s : spots) {
            if (s.getCreadorId() != null) {
                ids.add(s.getCreadorId());
            }
        }
        if (ids.isEmpty()) {
            return;
        }
        java.util.Map<Long, String> nombres = new java.util.HashMap<>();
        usuarioRepository.findAllById(ids).forEach(u -> nombres.put(u.getId(), u.getUsername()));
        for (Spot s : spots) {
            if (s.getCreadorId() != null) {
                s.setDescubridorNombre(nombres.get(s.getCreadorId()));
            }
        }
    }

    private SpotVotacionDTO construirRespuesta(Spot spot, String fingerprint, String mensaje) {
        LocalDateTime limite = LocalDateTime.now().minusHours(HORAS_VALIDEZ);

        int votosTombo = reporteRepository.contarVotosPorTipo(spot.getId(), "TOMBO", limite);
        int votosRelax = reporteRepository.contarVotosPorTipo(spot.getId(), "RELAX", limite);
        boolean yaVoto = reporteRepository.usuarioYaVoto(spot.getId(), fingerprint, limite);

        String mensajeEstado = construirMensajeEstado(votosTombo, votosRelax, spot.getEstado());

        return new SpotVotacionDTO(spot, votosTombo, votosRelax, yaVoto, mensajeEstado);
    }

    private String construirMensajeEstado(int votosTombo, int votosRelax, String estado) {
        if ("ROJO".equals(estado)) {
            return String.format("PELIGRO - %d votos TOMBO", votosTombo);
        } else if (votosTombo > 0) {
            return String.format("%d/%d votos para PELIGRO", votosTombo, VOTOS_NECESARIOS);
        } else if (votosRelax > 0) {
            return String.format("%d votos RELAX", votosRelax);
        } else {
            return "Sin reportes recientes";
        }
    }
}
