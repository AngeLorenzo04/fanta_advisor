package com.fantaadvisor.solver;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication(scanBasePackages = {"com.fantaadvisor.solver", "com.fantaadvisor.shared"})
@EntityScan(basePackages = {"com.fantaadvisor.shared.model"})
@EnableJpaRepositories(basePackages = {"com.fantaadvisor.shared.repository"})
public class FantaSolverApplication {
    public static void main(String[] args) {
        SpringApplication.run(FantaSolverApplication.class, args);
    }
}
