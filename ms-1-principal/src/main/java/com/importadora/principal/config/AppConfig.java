package com.importadora.principal.config;

import com.importadora.principal.security.JwtProperties;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties({JwtProperties.class, GoogleOAuthProperties.class})
public class AppConfig {
}
