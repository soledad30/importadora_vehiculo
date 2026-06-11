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
        String email = request.email().trim().toLowerCase();
        if (usuarioRepository.existsByEmail(email)) {
            throw new DuplicateResourceException("El correo ya está registrado");
        }

        String cedula = normalizarDocumento(request.cedulaDocumento());
        validarDocumentoUnico(cedula);

        String username = generarUsernameUnico(email);
        Cliente cliente = crearCliente(request, email, cedula);

        Usuario usuario = Usuario.builder()
                .username(username)
                .password(passwordEncoder.encode(request.password()))
                .email(email)
                .rol(RolUsuario.CLIENTE)
                .cliente(cliente)
                .activo(true)
                .build();

        usuario = usuarioRepository.save(usuario);

        return toLoginResponse(usuario);
    }

    private Cliente crearCliente(RegisterRequest request, String email, String cedula) {
        String[] partes = dividirNombre(request.nombreCompleto());
        if (clienteRepository.existsByEmail(email)) {
            throw new DuplicateResourceException("El correo ya está registrado como cliente");
        }

        Cliente cliente = clienteRepository.save(Cliente.builder()
                .tipoDocumento(inferirTipoDocumento(cedula))
                .numeroDocumento(cedula)
                .nombres(partes[0])
                .apellidos(partes[1])
                .email(email)
                .telefono(telefonoOrDefault(request.telefono()))
                .tipoCliente(TipoCliente.NUEVO)
                .build());
        cliente.setCodigo(String.format("CLI-%03d", cliente.getId()));
        return clienteRepository.save(cliente);
    }

    private void validarDocumentoUnico(String cedula) {
        if (clienteRepository.existsByNumeroDocumento(cedula)) {
            throw new DuplicateResourceException("La cédula o RUC ya está registrado");
        }
    }

    private String telefonoOrDefault(String telefono) {
        if (telefono == null || telefono.isBlank()) {
            return "N/D";
        }
        return telefono.trim();
    }

    private String normalizarDocumento(String documento) {
        return documento == null ? "" : documento.trim().toUpperCase();
    }

    private String inferirTipoDocumento(String documento) {
        if (documento.contains("-") || documento.length() > 12) {
            return "RUC";
        }
        return "CC";
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
