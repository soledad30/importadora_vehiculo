package com.importadora.principal.api.controller;

import com.importadora.principal.api.dto.ResetPasswordRequest;
import com.importadora.principal.api.dto.UsuarioRequest;
import com.importadora.principal.api.dto.UsuarioResponse;
import com.importadora.principal.domain.service.UsuarioService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/usuarios")
@RequiredArgsConstructor
@Tag(name = "Usuarios", description = "Registro y gestión de usuarios del sistema")
public class UsuarioController {

    private final UsuarioService usuarioService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Listar usuarios")
    public List<UsuarioResponse> listar() {
        return usuarioService.listar();
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Registrar usuario")
    public ResponseEntity<UsuarioResponse> crear(@Valid @RequestBody UsuarioRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(usuarioService.crear(request));
    }

    @PostMapping("/{id}/toggle-activo")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Activar o desactivar usuario")
    public UsuarioResponse toggleActivo(@PathVariable Long id) {
        return usuarioService.toggleActivo(id);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Desactivar usuario")
    public ResponseEntity<Void> desactivar(@PathVariable Long id) {
        usuarioService.desactivar(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/password")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Restablecer contraseña (vendedor o cliente que olvidó su clave)")
    public ResponseEntity<Void> restablecerContrasena(
            @PathVariable Long id,
            @Valid @RequestBody ResetPasswordRequest request) {
        usuarioService.actualizarContrasena(id, request);
        return ResponseEntity.noContent().build();
    }
}
