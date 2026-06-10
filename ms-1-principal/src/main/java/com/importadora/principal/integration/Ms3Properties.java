package com.importadora.principal.integration;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.ms3")
public record Ms3Properties(String baseUrl, boolean enabled) {
}
