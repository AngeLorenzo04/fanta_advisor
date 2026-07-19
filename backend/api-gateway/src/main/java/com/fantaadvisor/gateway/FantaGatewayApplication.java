package com.fantaadvisor.gateway;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication(scanBasePackages = {"com.fantaadvisor.gateway", "com.fantaadvisor.shared"})
@EntityScan(basePackages = {"com.fantaadvisor.shared.model"})
@EnableJpaRepositories(basePackages = {"com.fantaadvisor.shared.repository"})
public class FantaGatewayApplication {
    public static void main(String[] args) {
        SpringApplication.run(FantaGatewayApplication.class, args);
    }
}
