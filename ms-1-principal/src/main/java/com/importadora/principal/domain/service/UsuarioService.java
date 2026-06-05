package com.importadora.principal.domain.service;

import com.importadora.principal.api.dto.ResetPasswordRequest;
import com.importadora.principal.api.dto.UsuarioRequest;
import com.importadora.principal.api.dto.UsuarioResponse;
import com.importadora.principal.api.exception.BusinessRuleException;
import com.importadora.principal.api.exception.DuplicateResourceException;
import com.importadora.principal.api.exception.ResourceNotFoundException;
import com.importadora.principal.domain.model.Cliente;
import com.importadora.principal.domain.model.RolUsuario;
import com.importadora.principal.domain.model.Usuario;
import com.importadora.principal.domain.repository.ClienteRepository;
import com.importadora.principal.domain.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final ClienteRepository clienteRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public List<UsuarioResponse> listar() {
        RolUsuario actor = rolActual();
        return usuarioRepository.findAll().stream()
                .filter(u -> puedeVer(actor, u))
                .map(UsuarioResponse::from)
                .toList();
    }

    @Transactional
    public UsuarioResponse crear(UsuarioRequest request) {
        RolUsuario actor = rolActual();
        validarCreacion(actor, request);

        if (usuarioRepository.existsByUsername(request.username())) {
            throw new DuplicateResourceException("Usuario ya existe: " + request.username());
        }
        if (usuarioRepository.existsByEmail(request.email())) {
            throw new DuplicateResourceException("Email ya registrado: " + request.email());
        }

        Cliente cliente = resolverCliente(request.rol(), request.clienteId());

        Usuario usuario = Usuario.builder()
                .username(request.username())
                .password(passwordEncoder.encode(request.password()))
                .email(request.email())
                .rol(request.rol())
                .cliente(cliente)
                .activo(true)
                .build();

        return UsuarioResponse.from(usuarioRepository.save(usuario));
    }

    @Transactional
    public void desactivar(Long id) {
        if (rolActual() != RolUsuario.ADMIN) {
            throw new BusinessRuleException("Solo el administrador puede cambiar el estado del usuario");
        }
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado: id=" + id));
        usuario.setActivo(!usuario.isActivo());
        usuarioRepository.save(usuario);
    }

    @Transactional
    public UsuarioResponse toggleActivo(Long id) {
        desactivar(id);
        return usuarioRepository.findById(id)
                .map(UsuarioResponse::from)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado: id=" + id));
    }

    /**
     * Restablece la contraseña de un vendedor o cliente (p. ej. olvidó su clave).
     * La recuperación automática por correo está planificada; ver docs/RECUPERACION_CONTRASENA.md.
     */
    @Transactional
    public void actualizarContrasena(Long id, ResetPasswordRequest request) {
        if (rolActual() != RolUsuario.ADMIN) {
            throw new BusinessRuleException("Solo el administrador puede restablecer contraseñas");
        }
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado: id=" + id));
        if (!usuario.isActivo()) {
            throw new BusinessRuleException("No se puede cambiar la contraseña de un usuario inactivo");
        }
        if (usuario.getRol() == RolUsuario.ADMIN) {
            throw new BusinessRuleException("La contraseña de administradores no se restablece desde aquí");
        }
        if (usuario.getRol() != RolUsuario.CLIENTE && usuario.getRol() != RolUsuario.VENDEDOR) {
            throw new BusinessRuleException("Solo se puede restablecer la contraseña de vendedores o clientes");
        }
        usuario.setPassword(passwordEncoder.encode(request.password()));
        usuarioRepository.save(usuario);
    }

    private void validarCreacion(RolUsuario actor, UsuarioRequest request) {
        if (actor == RolUsuario.ADMIN) {
            if (request.rol() == RolUsuario.CLIENTE && request.clienteId() == null) {
                throw new BusinessRuleException("Los usuarios CLIENTE deben vincularse a un cliente (clienteId)");
            }
            if (request.rol() != RolUsuario.CLIENTE && request.clienteId() != null) {
                throw new BusinessRuleException("clienteId solo aplica para rol CLIENTE");
            }
            return;
        }
        if (actor == RolUsuario.VENDEDOR) {
            if (request.rol() != RolUsuario.CLIENTE) {
                throw new BusinessRuleException("El vendedor solo puede registrar usuarios con rol CLIENTE");
            }
            if (request.clienteId() == null) {
                throw new BusinessRuleException("Debe seleccionar el cliente al que pertenece el usuario");
            }
            return;
        }
        throw new BusinessRuleException("No tiene permisos para registrar usuarios");
    }

    private Cliente resolverCliente(RolUsuario rol, Long clienteId) {
        if (rol != RolUsuario.CLIENTE) {
            return null;
        }
        return clienteRepository.findById(clienteId)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente no encontrado: id=" + clienteId));
    }

    private boolean puedeVer(RolUsuario actor, Usuario u) {
        if (actor == RolUsuario.ADMIN) {
            return true;
        }
        if (actor == RolUsuario.VENDEDOR) {
            return u.getRol() == RolUsuario.CLIENTE;
        }
        return false;
    }

    private RolUsuario rolActual() {
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
}
