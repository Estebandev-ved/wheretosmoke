package com.medallo_map.wheretosmoke.controller;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.medallo_map.wheretosmoke.dto.CirculoDTO;
import com.medallo_map.wheretosmoke.model.CirculoConfianza;
import com.medallo_map.wheretosmoke.model.Usuario;
import com.medallo_map.wheretosmoke.repository.UsuarioRepository;
import com.medallo_map.wheretosmoke.service.CirculoConfianzaService;

@RestController
@RequestMapping("/api/circulos")
public class CirculoConfianzaController {

        @Autowired
        private CirculoConfianzaService circuloService;

        @Autowired
        private UsuarioRepository usuarioRepository;

        /**
         * Crear nuevo circulo de confianza
         */
        @PostMapping
        public ResponseEntity<?> crearCirculo(
                        @RequestBody Map<String, String> request,
                        @AuthenticationPrincipal UserDetails userDetails) {

                if (userDetails == null) {
                        return ResponseEntity.status(401)
                                        .body(Map.of("error", "No autenticado. Inicia sesión primero."));
                }

                Usuario usuario = usuarioRepository.findByUsername(userDetails.getUsername())
                                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

                String nombre = request.get("nombre");
                String color = request.getOrDefault("color", "#4CAF50");

                CirculoConfianza circulo = circuloService.crearCirculo(nombre, usuario.getId(), color);

                return ResponseEntity.ok(Map.of(
                                "id", circulo.getId(),
                                "nombre", circulo.getNombre(),
                                "codigoInvitacion", circulo.getCodigoInvitacion(),
                                "color", circulo.getColor(),
                                "mensaje", "Circulo creado exitosamente"));
        }

        /**
         * Unirse a un circulo con codigo de invitacion
         */
        @PostMapping("/unirse")
        public ResponseEntity<?> unirseACirculo(
                        @RequestBody Map<String, String> request,
                        @AuthenticationPrincipal UserDetails userDetails) {

                if (userDetails == null) {
                        return ResponseEntity.status(401)
                                        .body(Map.of("error", "No autenticado. Inicia sesión primero."));
                }

                Usuario usuario = usuarioRepository.findByUsername(userDetails.getUsername())
                                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

                String codigoInvitacion = request.get("codigoInvitacion");
                boolean exito = circuloService.unirseACirculo(codigoInvitacion, usuario.getId());

                if (exito) {
                        return ResponseEntity.ok(Map.of("mensaje", "Te uniste al circulo exitosamente"));
                } else {
                        return ResponseEntity.badRequest().body(Map.of("error", "Codigo de invitacion invalido"));
                }
        }

        /**
         * Obtener mis circulos
         */
        @GetMapping("/mis-circulos")
        public ResponseEntity<?> obtenerMisCirculos(
                        @AuthenticationPrincipal UserDetails userDetails) {

                if (userDetails == null) {
                        return ResponseEntity.status(401)
                                        .body(Map.of("error", "No autenticado. Inicia sesión primero."));
                }

                Usuario usuario = usuarioRepository.findByUsername(userDetails.getUsername())
                                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

                List<CirculoDTO> circulos = circuloService.obtenerCirculosDeUsuario(usuario.getId());
                return ResponseEntity.ok(circulos);
        }

        /**
         * Actualizar mi ubicacion en un circulo
         */
        @PostMapping("/{circuloId}/ubicacion")
        public ResponseEntity<?> actualizarUbicacion(
                        @PathVariable Long circuloId,
                        @RequestBody Map<String, Object> request,
                        @AuthenticationPrincipal UserDetails userDetails) {

                if (userDetails == null) {
                        return ResponseEntity.status(401)
                                        .body(Map.of("error", "No autenticado. Inicia sesión primero."));
                }

                Usuario usuario = usuarioRepository.findByUsername(userDetails.getUsername())
                                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

                Double latitud = ((Number) request.get("latitud")).doubleValue();
                Double longitud = ((Number) request.get("longitud")).doubleValue();
                Long enSpotId = request.get("enSpotId") != null
                                ? ((Number) request.get("enSpotId")).longValue()
                                : null;

                circuloService.actualizarUbicacion(circuloId, usuario.getId(), latitud, longitud, enSpotId);

                return ResponseEntity.ok(Map.of("mensaje", "Ubicacion actualizada"));
        }

        /**
         * Dejar de compartir ubicacion en un circulo
         */
        @DeleteMapping("/{circuloId}/ubicacion")
        public ResponseEntity<?> detenerCompartirUbicacion(
                        @PathVariable Long circuloId,
                        @AuthenticationPrincipal UserDetails userDetails) {

                if (userDetails == null) {
                        return ResponseEntity.status(401)
                                        .body(Map.of("error", "No autenticado. Inicia sesión primero."));
                }

                Usuario usuario = usuarioRepository.findByUsername(userDetails.getUsername())
                                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

                circuloService.detenerCompartirUbicacion(circuloId, usuario.getId());

                return ResponseEntity.ok(Map.of("mensaje", "Dejaste de compartir ubicacion"));
        }

        /**
         * Salir de un circulo
         */
        @DeleteMapping("/{circuloId}/salir")
        public ResponseEntity<?> salirDeCirculo(
                        @PathVariable Long circuloId,
                        @AuthenticationPrincipal UserDetails userDetails) {

                if (userDetails == null) {
                        return ResponseEntity.status(401)
                                        .body(Map.of("error", "No autenticado. Inicia sesión primero."));
                }

                Usuario usuario = usuarioRepository.findByUsername(userDetails.getUsername())
                                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

                circuloService.salirDeCirculo(circuloId, usuario.getId());

                return ResponseEntity.ok(Map.of("mensaje", "Saliste del circulo"));
        }
}
