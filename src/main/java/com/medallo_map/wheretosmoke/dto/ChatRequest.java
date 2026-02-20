package com.medallo_map.wheretosmoke.dto;

import lombok.Data;

@Data
public class ChatRequest {
    private String message;
    private Double latitude;
    private Double longitude;
}
