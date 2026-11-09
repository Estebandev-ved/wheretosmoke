package com.medallo_map.wheretosmoke.service;

import com.azure.ai.openai.OpenAIClient;
import com.azure.ai.openai.OpenAIClientBuilder;
import com.azure.ai.openai.models.ChatCompletions;
import com.azure.ai.openai.models.ChatCompletionsOptions;
import com.azure.ai.openai.models.ChatRequestMessage;
import com.azure.ai.openai.models.ChatRequestSystemMessage;
import com.azure.ai.openai.models.ChatRequestUserMessage;
import com.azure.core.credential.AzureKeyCredential;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class AzureOpenAIService {

    @Value("${azure.openai.endpoint}")
    private String endpoint;

    @Value("${azure.openai.api-key}")
    private String apiKey;

    @Value("${azure.openai.model}")
    private String deploymentOrModelName;

    private OpenAIClient client;

    private OpenAIClient getClient() {
        if (client == null) {
            // Limpiar la URL del endpoint si contiene rutas adicionales
            String baseUrl = endpoint;
            if (baseUrl.contains("/openai")) {
                baseUrl = baseUrl.split("/openai")[0];
            }

            client = new OpenAIClientBuilder()
                    .endpoint(baseUrl)
                    .credential(new AzureKeyCredential(apiKey))
                    .buildClient();
        }
        return client;
    }

    public String getChatResponse(String userMessage, com.medallo_map.wheretosmoke.model.Usuario usuario, Double lat,
            Double lon) {
        List<ChatRequestMessage> chatMessages = new ArrayList<>();

        // Construir contexto del usuario
        StringBuilder userContext = new StringBuilder();
        if (usuario != null) {
            userContext.append("Estás hablando con ").append(usuario.getUsername()).append(". ");
            if (usuario.getPuntos() != null) {
                userContext.append("Tiene ").append(usuario.getPuntos()).append(" puntos en la app. ");
            }
        }

        // Construir contexto de ubicación
        StringBuilder locationContext = new StringBuilder();
        if (lat != null && lon != null) {
            locationContext.append("La ubicación actual del usuario es: Latitud ").append(lat).append(", Longitud ")
                    .append(lon).append(". ");
            locationContext.append("Usa esta información para sugerir spots cercanos si te lo piden. ");
        } else {
            locationContext.append("No se conoce la ubicación actual del usuario. ");
        }

        // Mensaje del sistema mejorado
        String systemPrompt = "Eres un asistente inteligente y útil para la aplicación 'Peguelo' (o 'Donde Fumar'). "
                +
                "Esta aplicación ayuda a las personas en Medellín a encontrar lugares seguros y amigables para el consumo de cannabis. "
                +
                "\n\nContexto del Usuario: " + userContext.toString() +
                "\nContexto de Ubicación: " + locationContext.toString() +
                "\n\nTu objetivo es ayudar a los usuarios a navegar la app, dar recomendaciones generales de seguridad y responder dudas sobre la cultura cannábica en Medellín de forma responsable. "
                +
                "Si te preguntan por lugares cercanos y tienes la ubicación, indícales qué zonas podrían estar cerca . "
                +
                "No promuevas el consumo en lugares prohibidos por la ley (como cerca de colegios o parques infantiles). "
                +
                "Sé amigable, relajado y conciso.";

        chatMessages.add(new ChatRequestSystemMessage(systemPrompt));

        // Mensaje del usuario
        chatMessages.add(new ChatRequestUserMessage(userMessage));

        ChatCompletionsOptions options = new ChatCompletionsOptions(chatMessages);
        // options.setMaxTokens(800);
        // options.setMaxCompletionTokens(800);
        // options.setTemperature(0.7);

        try {
            ChatCompletions chatCompletions = getClient().getChatCompletions(deploymentOrModelName, options);
            if (chatCompletions.getChoices() != null && !chatCompletions.getChoices().isEmpty()) {
                return chatCompletions.getChoices().get(0).getMessage().getContent();
            } else {
                return "Lo siento, no pude generar una respuesta en este momento.";
            }
        } catch (Exception e) {
            e.printStackTrace();
            return "Ocurrió un error al contactar a la IA: " + e.getMessage();
        }
    }
}
