package com.importadora.principal.api.controller;

import com.importadora.principal.api.dto.CambioContrasenaRequest;
import com.importadora.principal.api.dto.MiPerfilResponse;
import com.importadora.principal.api.dto.MiPerfilUpdateRequest;
import com.importadora.principal.domain.service.CuentaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/cuenta")
@RequiredArgsConstructor
@Tag(name = "Mi cuenta", description = "Perfil y contraseña del usuario autenticado")
public class CuentaController {

    private final CuentaService cuentaService;

    @GetMapping("/me")
    @PreAuthorize("hasAnyRole('ADMIN','VENDEDOR','CLIENTE')")
    @Operation(summary = "Obtener perfil del usuario autenticado")
    public MiPerfilResponse miPerfil() {
        return cuentaService.obtenerMiPerfil();
    }

    @PutMapping("/me")
    @PreAuthorize("hasAnyRole('ADMIN','VENDEDOR','CLIENTE')")
    @Operation(summary = "Actualizar datos personales del usuario autenticado")
    public MiPerfilResponse actualizarMiPerfil(@Valid @RequestBody MiPerfilUpdateRequest request) {
        return cuentaService.actualizarMiPerfil(request);
    }

    @PutMapping("/me/password")
    @PreAuthorize("hasAnyRole('ADMIN','VENDEDOR','CLIENTE')")
    @Operation(summary = "Cambiar contraseña del usuario autenticado")
    public ResponseEntity<Void> cambiarContrasena(@Valid @RequestBody CambioContrasenaRequest request) {
        cuentaService.cambiarContrasena(request);
        return ResponseEntity.noContent().build();
    }
}
