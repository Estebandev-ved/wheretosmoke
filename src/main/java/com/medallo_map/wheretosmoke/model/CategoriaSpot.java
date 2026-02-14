package com.medallo_map.wheretosmoke.model;

/**
 * 📍 CATEGORÍAS DE SPOTS
 */
public enum CategoriaSpot {
    PARQUE(" Parque público"),
    MIRADOR(" Mirador"),
    ROOF(" Roof/Terraza"),
    NATURALEZA(" Naturaleza"),
    INDOOR(" Indoor"),
    CALLEJON(" Callejón"),
    OTRO(" Otro");

    private final String descripcion;

    CategoriaSpot(String descripcion) {
        this.descripcion = descripcion;
    }

    public String getDescripcion() {
        return descripcion;
    }
}
