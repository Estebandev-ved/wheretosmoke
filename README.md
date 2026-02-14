# 🌿 WhereToSmoke - Medallo Map

![License](https://img.shields.io/badge/license-MIT-green)
![Java](https://img.shields.io/badge/Java-21-red)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.x-brightgreen)
![React](https://img.shields.io/badge/React-19-blue)
![Vite](https://img.shields.io/badge/Vite-5.x-yellow)

**WhereToSmoke** es una aplicación interactiva diseñada para la comunidad cannábica, permitiendo a los usuarios descubrir, calificar y compartir puntos seguros y amigables para el consumo ("Spots"). Con un enfoque en la seguridad, la comunidad y la experiencia de usuario, App ofrece un mapa dinámico, chat en tiempo real, gamificación y mucho más.

---

## ✨ Características Principales

### 🗺️ Mapa Interactivo
*   **Exploración Visual:** Encuentra spots cercanos con iconos personalizados en un mapa interactivo (Leaflet).
*   **Geozonas y Rutas:** Cálculo de rutas óptimas hacia los spots y visualización de zonas seguras.
*   **Modo Día/Noche:** Interfaz adaptable con temas claros y oscuros para cualquier momento del día.

### 👥 Comunidad y Social
*   **GeoChat en Tiempo Real:** Chatea con otros usuarios cercanos a tu ubicación.
*   **Feed de Fotos:** Comparte tus experiencias visuales con la comunidad.
*   **Sistema de Confianza:** Círculos de confianza y valoraciones de spots para garantizar la seguridad.

### 🎮 Gamificación
*   **Logros y Niveles:** Desbloquea medallas y sube de nivel por tu participación.
*   **Leaderboard:** Compite por ser el usuario más activo y confiable.

### 🛡️ Seguridad y Administración
*   **Botón de Pánico:** Acceso rápido a alertas en caso de emergencia.
*   **Dashboard de Administración:** Gestión completa de usuarios, spots y zonas por parte de los administradores.
*   **Autenticación Robusta:** Seguridad basada en JWT y roles de usuario.

---

## 🛠️ Tech Stack

El proyecto utiliza una arquitectura moderna y escalable:

### Backend (API REST)
*   **Lenguaje:** Java 21
*   **Framework:** Spring Boot (Web, Security, Data JPA, WebSocket)
*   **Base de Datos:** MySQL con extensiones espaciales (Hibernate Spatial)
*   **Seguridad:** Spring Security + JWT (JSON Web Tokens)
*   **Notificaciones:** WebPush & WebSocket (StompJS)

### Frontend (SPA)
*   **Framework:** React 19
*   **Build Tool:** Vite
*   **Mapas:** Leaflet & React-Leaflet
*   **Estilos:** CSS Modules / Custom CSS con diseño responsivo
*   **Estado:** Context API (Auth, Sound, Achievement)

---

## 🚀 Instalación y Despliegue

Sigue estos pasos para correr el proyecto localmente.

### Prerrequisitos
*   Java JDK 21
*   Maven 3.8+
*   Node.js 18+ y NPM
*   MySQL 8.0+

### 1. Configuración del Backend

```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/wheretosmoke.git
cd wheretosmoke

# Configurar base de datos
# Crea una base de datos en MySQL llamada 'wheretosmoke_db'
# Actualiza src/main/resources/application.properties con tus credenciales

# Ejecutar la aplicación
./mvnw spring-boot:run
```

### 2. Configuración del Frontend

```bash
# Navegar al directorio del cliente
cd cliente-mapa

# Instalar dependencias
npm install

# Correr servidor de desarrollo
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`.

---

## 📸 Capturas de Pantalla

*(Espacio reservado para screenshots de la aplicación: Mapa, Login, Dashboard, etc.)*

---

## 🤝 Contribución

¡Las contribuciones son bienvenidas! Si tienes ideas para mejorar la app:

1.  Haz un Fork del proyecto.
2.  Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`).
3.  Commit a tus cambios (`git commit -m 'Add some AmazingFeature'`).
4.  Push a la rama (`git push origin feature/AmazingFeature`).
5.  Abre un Pull Request.

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Consulta el archivo `LICENSE` para más detalles.

---

<p align="center">
  Hecho con 💚 por el equipo de Medallo Map
</p>
