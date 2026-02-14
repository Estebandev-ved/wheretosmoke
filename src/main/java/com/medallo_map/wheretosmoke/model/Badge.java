package com.medallo_map.wheretosmoke.model;

/**
 * BADGES DISPONIBLES
 * 
 * Los badges son logros que el usuario puede desbloquear.
 */
public enum Badge {
    PIONERO("Pionero", "Creaste tu primer spot", 10),
    CENTINELA("Centinela", "10 alertas verificadas", 50),
    GUARDIAN("Guardián", "50 alertas verificadas", 200),
    EXPLORADOR("Explorador", "Visitaste 10 spots diferentes", 30),
    FOTOGRAFO("Fotógrafo", "Subiste 5 fotos", 25),
    COMENTARISTA("Comentarista", "Dejaste 10 comentarios", 20),
    VETERANO("Veterano", "1 mes activo en la app", 100),
    LEYENDA("Leyenda", "500 puntos totales", 0);

    private final String nombre;
    private final String descripcion;
    private final int puntosRequeridos;

    Badge(String nombre, String descripcion, int puntosRequeridos) {
        this.nombre = nombre;
        this.descripcion = descripcion;
        this.puntosRequeridos = puntosRequeridos;
    }

    public String getNombre() {
        return nombre;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public int getPuntosRequeridos() {
        return puntosRequeridos;
    }
}
