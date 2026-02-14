package com.medallo_map.wheretosmoke;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

/**
 * 🚀 APLICACIÓN PRINCIPAL - WhereToSmoke
 * 
 * @EnableJpaRepositories: Le dice a Spring que escanee el paquete 'repository'
 *                         para encontrar todas las interfaces que extienden
 *                         JpaRepository
 */
@SpringBootApplication
@EnableJpaRepositories(basePackages = "com.medallo_map.wheretosmoke.repository")
public class WheretosmokeApplication {

	public static void main(String[] args) {
		SpringApplication.run(WheretosmokeApplication.class, args);
	}

}
