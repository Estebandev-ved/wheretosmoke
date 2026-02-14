package com.medallo_map.wheretosmoke.controller;

import com.medallo_map.wheretosmoke.dto.SubscriptionDTO;
import com.medallo_map.wheretosmoke.service.PushNotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/push")
@CrossOrigin(origins = "*")
public class PushNotificationController {

    @Autowired
    private PushNotificationService pushNotificationService;

    /**
     * 📝 POST - Suscribirse a notificaciones
     * Endpoint: /api/push/subscribe?userId=xxx
     */
    @PostMapping("/subscribe")
    public void suscribirse(@RequestParam String userId, @RequestBody SubscriptionDTO subscription) {
        pushNotificationService.suscribir(userId, subscription);
        System.out.println("🔔 Nueva suscripción Push para usuario: " + userId);
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
