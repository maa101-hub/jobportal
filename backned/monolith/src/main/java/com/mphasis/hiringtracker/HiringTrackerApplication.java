package com.mphasis.hiringtracker;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

/**
 * Single entry point for the Hiring Tracking Application monolith.
 *
 * <p>The former microservices (user, job, application, offer) now live together
 * in this one Spring Boot application. Component scanning, entity scanning and
 * JPA repository scanning are rooted at {@code com.mphasis} so that both the
 * {@code com.mphasis.jobportal.*} and {@code com.mphasis.jobpostal.*} package
 * trees are picked up.
 */
@SpringBootApplication
@ComponentScan(basePackages = "com.mphasis")
@EntityScan(basePackages = "com.mphasis")
@EnableJpaRepositories(basePackages = "com.mphasis")
public class HiringTrackerApplication {

    public static void main(String[] args) {
        SpringApplication.run(HiringTrackerApplication.class, args);
    }
}
