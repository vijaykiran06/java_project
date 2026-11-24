package com.janseva;

import com.janseva.config.DotenvEnvironmentPostProcessor;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
@EnableAsync
@ConfigurationPropertiesScan
public class JanSevaApplication {

    public static void main(String[] args) {
        // Explicitly load .env file into System properties before Spring initializes
        DotenvEnvironmentPostProcessor.initEnvironment();
        SpringApplication.run(JanSevaApplication.class, args);
    }
}
