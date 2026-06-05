package com.importadora.principal.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.google")
public record GoogleOAuthProperties(
        String clientId
) {
    public boolean isEnabled() {
        return clientId != null && !clientId.isBlank();
    }
}
