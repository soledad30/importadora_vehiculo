package com.importadora.principal.config;

import com.importadora.principal.integration.Ms2Properties;
import com.importadora.principal.integration.Ms3Properties;
import com.importadora.principal.security.JwtProperties;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties({JwtProperties.class, GoogleOAuthProperties.class, Ms2Properties.class, Ms3Properties.class})
public class AppConfig {
}
