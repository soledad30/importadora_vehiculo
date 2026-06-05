package com.importadora.principal.api.dto;

public record AuthConfigResponse(
        String googleClientId,
        boolean googleEnabled
) {
}
