package com.importadora.principal.domain.service;

import com.importadora.principal.api.dto.LoginResponse;
import com.importadora.principal.api.dto.RegisterRequest;
import com.importadora.principal.api.exception.BusinessRuleException;
import com.importadora.principal.api.exception.DuplicateResourceException;
import com.importadora.principal.domain.model.Cliente;
import com.importadora.principal.domain.model.RolUsuario;
import com.importadora.principal.domain.model.TipoCliente;
import com.importadora.principal.domain.model.Usuario;
import com.importadora.principal.domain.repository.ClienteRepository;
import com.importadora.principal.domain.repository.UsuarioRepository;
import com.importadora.principal.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class RegistrationService {

    private final UsuarioRepository usuarioRepository;
    private final ClienteRepository clienteRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @Transactional
    public LoginResponse register(RegisterRequest request) {
        if (!request.password().equals(request.confirmPassword())) {
            throw new BusinessRuleException("Las contraseñas no coinciden");
        }
        if (request.rol() == RolUsuario.ADMIN) {
            throw new BusinessRuleException("El rol Administrador no puede registrarse públicamente");
        }

        String email = request.email().trim().toLowerCase();
        if (usuarioRepository.existsByEmail(email)) {
            throw new DuplicateResourceException("El correo ya está registrado");
        }

        String username = generarUsernameUnico(email);
        Cliente cliente = null;
        if (request.rol() == RolUsuario.CLIENTE) {
            cliente = crearCliente(request, email);
        }

        Usuario usuario = Usuario.builder()
                .username(username)
                .password(passwordEncoder.encode(request.password()))
                .email(email)
                .rol(request.rol())
                .cliente(cliente)
                .activo(true)
                .build();

        usuario = usuarioRepository.save(usuario);
        return toLoginResponse(usuario);
    }

    private Cliente crearCliente(RegisterRequest request, String email) {
        String[] partes = dividirNombre(request.nombreCompleto());
        String numeroDoc = "WEB-" + System.currentTimeMillis();
        if (clienteRepository.existsByNumeroDocumento(numeroDoc)) {
            numeroDoc = "WEB-" + System.nanoTime();
        }
        if (clienteRepository.existsByEmail(email)) {
            throw new DuplicateResourceException("El correo ya está registrado como cliente");
        }

        Cliente cliente = clienteRepository.save(Cliente.builder()
                .tipoDocumento("CC")
                .numeroDocumento(numeroDoc)
                .nombres(partes[0])
                .apellidos(partes[1])
                .email(email)
                .telefono(request.telefono())
                .tipoCliente(TipoCliente.NUEVO)
                .build());
        cliente.setCodigo(String.format("CLI-%03d", cliente.getId()));
        return clienteRepository.save(cliente);
    }

    private String[] dividirNombre(String nombreCompleto) {
        String limpio = nombreCompleto.trim().replaceAll("\\s+", " ");
        int idx = limpio.indexOf(' ');
        if (idx < 0) {
            return new String[]{limpio, "Usuario"};
        }
        return new String[]{limpio.substring(0, idx), limpio.substring(idx + 1)};
    }

    private String generarUsernameUnico(String email) {
        String base = email.contains("@") ? email.substring(0, email.indexOf('@')) : email;
        base = base.replaceAll("[^a-zA-Z0-9._-]", "").toLowerCase();
        if (base.length() < 3) {
            base = "user" + base;
        }
        String candidate = base;
        int suffix = 1;
        while (usuarioRepository.existsByUsername(candidate)) {
            candidate = base + suffix++;
        }
        return candidate;
    }

    private LoginResponse toLoginResponse(Usuario usuario) {
        Long clienteId = null;
        String clienteNombre = null;
        if (usuario.getCliente() != null) {
            clienteId = usuario.getCliente().getId();
            clienteNombre = usuario.getCliente().nombreCompleto();
        }
        return new LoginResponse(
                jwtService.generateToken(usuario),
                "Bearer",
                jwtService.getExpirationMs(),
                usuario.getUsername(),
                usuario.getRol(),
                clienteId,
                clienteNombre
        );
    }
}
