package com.medallo_map.wheretosmoke.controller;

import com.medallo_map.wheretosmoke.dto.SubscriptionDTO;
import com.medallo_map.wheretosmoke.service.PushNotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/push")
public class PushNotificationController {

    @Autowired
    private PushNotificationService pushNotificationService;

    /**
     * 📝 POST - Suscribirse a notificaciones
     * Endpoint: /api/push/subscribe
     * El usuario se toma de la sesión autenticada (JWT); no se acepta userId del cliente.
     */
    @PostMapping("/subscribe")
    public ResponseEntity<Void> suscribirse(@AuthenticationPrincipal UserDetails userDetails,
            @RequestBody SubscriptionDTO subscription) {
        if (userDetails == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        String userId = userDetails.getUsername();
        pushNotificationService.suscribir(userId, subscription);
        System.out.println("🔔 Nueva suscripción Push para usuario: " + userId);
        return ResponseEntity.ok().build();
    }

    /**
     * 📢 POST - Enviar broadcast (Solo admin por ahora)
     * Endpoint: /api/push/broadcast
     */
    @PostMapping("/broadcast")
    public void broadcast(@RequestParam String titulo, @RequestParam String mensaje) {
        pushNotificationService.enviarBroadcast(titulo, mensaje);
    }
}
