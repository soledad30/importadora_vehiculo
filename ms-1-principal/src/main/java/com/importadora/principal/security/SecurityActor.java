package com.importadora.principal.security;

import com.importadora.principal.api.exception.BusinessRuleException;
import com.importadora.principal.domain.model.RolUsuario;
import com.importadora.principal.domain.model.Usuario;
import com.importadora.principal.domain.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class SecurityActor {

    private final UsuarioRepository usuarioRepository;

    public RolUsuario rolActual() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new BusinessRuleException("Sesión no válida");
        }
        return auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .filter(a -> a.startsWith("ROLE_"))
                .map(a -> RolUsuario.valueOf(a.substring(5)))
                .findFirst()
                .orElseThrow(() -> new BusinessRuleException("Rol no reconocido"));
    }

    public Usuario usuarioActual() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new BusinessRuleException("Sesión no válida");
        }
        return usuarioRepository.findByUsernameWithCliente(auth.getName())
                .orElseThrow(() -> new BusinessRuleException("Usuario no encontrado"));
    }

    public void validarClientePropio(Long clienteId) {
        if (rolActual() != RolUsuario.CLIENTE) {
            return;
        }
        Usuario usuario = usuarioActual();
        if (usuario.getCliente() == null || !usuario.getCliente().getId().equals(clienteId)) {
            throw new BusinessRuleException("No tiene permiso para ver datos de otro cliente");
        }
    }
}
