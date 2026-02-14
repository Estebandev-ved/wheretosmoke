-- =========================================
-- 🔐 MIGRACIÓN: SISTEMA DE AUTENTICACIÓN
-- Ejecutar en phpMyAdmin después de migration_votacion.sql
-- =========================================

USE wheretosmoke_db;

-- 👤 TABLA DE USUARIOS
CREATE TABLE IF NOT EXISTS usuarios (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('USER', 'ADMIN') NOT NULL DEFAULT 'USER',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME,
    activo BOOLEAN DEFAULT TRUE,
    INDEX idx_email (email),
    INDEX idx_username (username)
);

-- 👑 CREAR USUARIO ADMIN POR DEFECTO
-- Password: admin123 (encriptado con BCrypt)
INSERT INTO
    usuarios (
        username,
        email,
        password,
        role,
        created_at,
        activo
    )
VALUES (
        'admin',
        'admin@wheretosmoke.com',
        '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZRGdjGj/n3bJZRRvR7r7JZfYZPDKe',
        'ADMIN',
        NOW(),
        TRUE
    );

-- 📊 VERIFICAR
DESCRIBE usuarios;

SELECT id, username, email, role FROM usuarios;