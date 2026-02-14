package com.medallo_map.wheretosmoke.service;

import com.medallo_map.wheretosmoke.dto.SubscriptionDTO;
import nl.martijndwars.webpush.Notification;
import nl.martijndwars.webpush.PushService;
import nl.martijndwars.webpush.Subscription;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class PushNotificationService {

    @Autowired
    private PushService pushService;

    // 💾 ALMACENAMIENTO EN MEMORIA (idealmente usar Base de Datos)
    // Map<UsuarioID/Fingerprint, List<Subscription>>
    private static final ConcurrentHashMap<String, List<Subscription>> suscripciones = new ConcurrentHashMap<>();

    /**
     * 📝 SUSCRIBIR USUARIO
     */
    public void suscribir(String usuarioId, SubscriptionDTO subDTO) {
        Subscription subscription = new Subscription(
                subDTO.getEndpoint(),
                new Subscription.Keys(subDTO.getKeys().getP256dh(), subDTO.getKeys().getAuth()));

        suscripciones.computeIfAbsent(usuarioId, k -> new ArrayList<>()).add(subscription);

        // Enviar notificación de bienvenida
        enviarNotificacion(usuarioId, "¡Bienvenido a WhereToSmoke!", "Recibirás alertas de tombos y spots cercanos.");
    }

    /**
     * 📤 ENVIAR NOTIFICACIÓN A UN USUARIO
     */
    public void enviarNotificacion(String usuarioId, String titulo, String mensaje) {
        List<Subscription> subs = suscripciones.get(usuarioId);
        if (subs == null || subs.isEmpty())
            return;

        String payload = String.format("{\"title\": \"%s\", \"body\": \"%s\"}", titulo, mensaje);

        List<Subscription> invalidas = new ArrayList<>();

        for (Subscription sub : subs) {
            try {
                Notification notification = new Notification(sub, payload);
                pushService.send(notification);
            } catch (Exception e) {
                System.err.println("Error enviando push: " + e.getMessage());
                // Si falla (410 Gone), eliminar suscripción
                if (e.getMessage() != null && e.getMessage().contains("410")) {
                    invalidas.add(sub);
                }
            }
        }

        // Limpiar suscripciones inválidas
        if (!invalidas.isEmpty()) {
            subs.removeAll(invalidas);
        }
    }

    /**
     * 📢 ENVIAR NOTIFICACIÓN A TODOS (Broadcast)
     */
    public void enviarBroadcast(String titulo, String mensaje) {
        suscripciones.keySet().forEach(user -> enviarNotificacion(user, titulo, mensaje));
    }
}
