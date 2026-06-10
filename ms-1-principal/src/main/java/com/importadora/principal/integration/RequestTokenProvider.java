package com.importadora.principal.integration;

import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.Optional;

@Component
public class RequestTokenProvider {

    public Optional<String> bearerToken() {
        var attrs = RequestContextHolder.getRequestAttributes();
        if (!(attrs instanceof ServletRequestAttributes servletAttrs)) {
            return Optional.empty();
        }
        String auth = servletAttrs.getRequest().getHeader("Authorization");
        if (auth == null || !auth.startsWith("Bearer ")) {
            return Optional.empty();
        }
        return Optional.of(auth.substring(7));
    }
}
