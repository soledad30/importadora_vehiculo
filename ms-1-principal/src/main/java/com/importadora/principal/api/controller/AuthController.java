package com.importadora.principal.api.controller;

import com.importadora.principal.api.dto.AuthConfigResponse;
import com.importadora.principal.api.dto.GoogleLoginRequest;
import com.importadora.principal.api.dto.LoginRequest;
import com.importadora.principal.api.dto.LoginResponse;
import com.importadora.principal.api.dto.RegisterRequest;
import com.importadora.principal.domain.service.AuthService;
import com.importadora.principal.domain.service.RegistrationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Autenticación", description = "Login JWT y Google")
public class AuthController {

    private final AuthService authService;
    private final RegistrationService registrationService;

    @GetMapping("/config")
    @Operation(summary = "Configuración pública de autenticación (Google Client ID)")
    public AuthConfigResponse config() {
        return authService.authConfig();
    }

    @PostMapping("/login")
    @Operation(summary = "Iniciar sesión con usuario y contraseña")
    public LoginResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @PostMapping("/google")
    @Operation(summary = "Iniciar sesión con token de Google (GIS)")
    public LoginResponse loginWithGoogle(@Valid @RequestBody GoogleLoginRequest request) {
        return authService.loginWithGoogle(request);
    }

    @PostMapping("/register")
    @Operation(summary = "Registro público (solo rol CLIENTE)")
    public ResponseEntity<LoginResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(registrationService.register(request));
    }
}
