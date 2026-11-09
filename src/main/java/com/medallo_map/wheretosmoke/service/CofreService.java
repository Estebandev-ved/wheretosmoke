package com.medallo_map.wheretosmoke.service;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Random;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.medallo_map.wheretosmoke.dto.ArticuloTiendaDTO;
import com.medallo_map.wheretosmoke.dto.CofreDTO;
import com.medallo_map.wheretosmoke.exception.NegocioException;
import com.medallo_map.wheretosmoke.model.ArticuloTienda;
import com.medallo_map.wheretosmoke.model.InventarioUsuario;
import com.medallo_map.wheretosmoke.model.RarezaArticulo;
import com.medallo_map.wheretosmoke.model.Usuario;
import com.medallo_map.wheretosmoke.repository.ArticuloTiendaRepository;
import com.medallo_map.wheretosmoke.repository.InventarioUsuarioRepository;
import com.medallo_map.wheretosmoke.repository.UsuarioRepository;
import com.medallo_map.wheretosmoke.service.ReglasGamificacion.PremioCofre;
import com.medallo_map.wheretosmoke.service.ReglasGamificacion.TipoCofre;

import lombok.RequiredArgsConstructor;

/**
 * COFRE DIARIO (una vez por día Bogotá).
 * Idempotente y atómico: el UPDATE condicional sobre usuarios.ultimo_cofre solo tiene éxito
 * una vez al día, así que dos peticiones paralelas no pagan dos premios. Todo (marca del día,
 * premio e inventario) va en una sola transacción: si algo falla, se revierte y puede reintentar.
 * El azar es inyectable (Random) para poder probarlo.
 */
@Service
@RequiredArgsConstructor
public class CofreService {

    private final UsuarioRepository usuarioRepository;
    private final ArticuloTiendaRepository articuloRepository;
    private final InventarioUsuarioRepository inventarioRepository;
    private final MonedasService monedasService;
    private final Clock clock;
    private final Random random;

    @Transactional
    public CofreDTO abrir(Long usuarioId) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new NegocioException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));
        LocalDate hoy = LocalDate.now(clock);
        int puntosAntes = usuario.getPuntos() == null ? 0 : usuario.getPuntos();

        if (hoy.equals(usuario.getUltimoCofre()) || usuarioRepository.registrarCofre(usuarioId, hoy) == 0) {
            return yaAbierto(usuarioId, puntosAntes);
        }

        double rTipo = random.nextDouble();
        double rValor = random.nextDouble();
        PremioCofre premio = ReglasGamificacion.sortearCofre(rTipo, rValor);
        ArticuloTienda articulo = null;
        if (premio.tipo() == TipoCofre.ARTICULO) {
            articulo = elegirArticulo(usuarioId);
            if (articulo == null) { // ya tiene todos los elegibles: se compensa con monedas
                premio = new PremioCofre(TipoCofre.MONEDAS, ReglasGamificacion.monedasCofre(rValor), 0);
            }
        }

        int mult = ReglasGamificacion.multiplicadorEvento(clock);
        int monedas = premio.monedas() * mult;
        int xp = premio.xp() * mult;

        Integer saldoActual = usuarioRepository.obtenerMonedas(usuarioId);
        int saldo = saldoActual == null ? 0 : saldoActual;
        if (monedas > 0) {
            saldo = monedasService.acreditar(usuarioId, monedas, "COFRE", hoy.toString());
        }
        if (xp > 0) {
            usuarioRepository.sumarXp(usuarioId, xp);
        }
        ArticuloTiendaDTO articuloDto = null;
        if (articulo != null) {
            inventarioRepository.save(InventarioUsuario.builder().usuarioId(usuarioId).articulo(articulo)
                    .fechaCompra(LocalDateTime.now(clock)).build());
            articuloDto = ArticuloTiendaDTO.de(articulo, true, false, false);
        }

        int puntosDespues = puntosAntes + xp;
        int nivelAntes = ReglasGamificacion.nivelPara(puntosAntes);
        int nivelDespues = ReglasGamificacion.nivelPara(puntosDespues);
        return CofreDTO.builder()
                .yaAbierto(false)
                .tipo(articulo != null ? TipoCofre.ARTICULO.name() : premio.tipo().name())
                .monedas(monedas).xp(xp).articulo(articuloDto)
                .saldoMonedas(saldo).puntos(puntosDespues).nivel(nivelDespues)
                .subioNivel(nivelDespues > nivelAntes)
                .multiplicador(mult)
                .segundosParaSiguiente(ReglasGamificacion.segundosHastaFinDia(clock))
                .build();
    }

    /** Cosmético COMUN/RARO de pago que el usuario aún no tiene, al azar. Null si no queda ninguno. */
    private ArticuloTienda elegirArticulo(Long usuarioId) {
        Set<Long> propios = inventarioRepository.findByUsuarioId(usuarioId).stream()
                .map(i -> i.getArticulo().getId()).collect(Collectors.toSet());
        List<ArticuloTienda> candidatos = articuloRepository
                .findByActivoTrueAndRarezaInAndPrecioGreaterThan(List.of(RarezaArticulo.COMUN, RarezaArticulo.RARO), 0)
                .stream().filter(a -> !propios.contains(a.getId())).toList();
        if (candidatos.isEmpty()) {
            return null;
        }
        return candidatos.get(random.nextInt(candidatos.size()));
    }

    private CofreDTO yaAbierto(Long usuarioId, int puntos) {
        Integer saldo = usuarioRepository.obtenerMonedas(usuarioId);
        return CofreDTO.builder()
                .yaAbierto(true)
                .saldoMonedas(saldo == null ? 0 : saldo).puntos(puntos)
                .nivel(ReglasGamificacion.nivelPara(puntos))
                .multiplicador(ReglasGamificacion.multiplicadorEvento(clock))
                .segundosParaSiguiente(ReglasGamificacion.segundosHastaFinDia(clock))
                .build();
    }
}
