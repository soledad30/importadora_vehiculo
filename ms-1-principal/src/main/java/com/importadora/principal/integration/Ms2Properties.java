package com.importadora.principal.integration;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.ms2")
public record Ms2Properties(String baseUrl, boolean enabled) {
}
