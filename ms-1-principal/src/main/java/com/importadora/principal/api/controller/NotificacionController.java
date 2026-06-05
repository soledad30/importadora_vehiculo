package com.importadora.principal.api.controller;

import com.importadora.principal.api.dto.NotificacionResponse;
import com.importadora.principal.domain.model.CategoriaNotificacion;
import com.importadora.principal.domain.service.NotificacionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/notificaciones")
@RequiredArgsConstructor
@Tag(name = "Notificaciones", description = "Centro de alertas por rol")
public class NotificacionController {

    private final NotificacionService notificacionService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','VENDEDOR','CLIENTE')")
    @Operation(summary = "Listar notificaciones del usuario/rol actual")
    public List<NotificacionResponse> listar(
            @RequestParam(required = false) CategoriaNotificacion categoria) {
        return notificacionService.listar(categoria);
    }

    @GetMapping("/no-leidas")
    @PreAuthorize("hasAnyRole('ADMIN','VENDEDOR','CLIENTE')")
    @Operation(summary = "Contar notificaciones no leídas")
    public Map<String, Long> noLeidas() {
        return Map.of("total", notificacionService.contarNoLeidas());
    }

    @PostMapping("/{id}/leida")
    @PreAuthorize("hasAnyRole('ADMIN','VENDEDOR','CLIENTE')")
    @Operation(summary = "Marcar notificación como leída")
    public NotificacionResponse marcarLeida(@PathVariable Long id) {
        return notificacionService.marcarLeida(id);
    }

    @PostMapping("/marcar-todas-leidas")
    @PreAuthorize("hasAnyRole('ADMIN','VENDEDOR','CLIENTE')")
    @Operation(summary = "Marcar todas las notificaciones como leídas")
    public void marcarTodasLeidas() {
        notificacionService.marcarTodasLeidas();
    }
}
