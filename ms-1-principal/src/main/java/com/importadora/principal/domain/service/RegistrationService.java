package com.importadora.principal.domain.service;

import com.importadora.principal.api.dto.LoginResponse;
import com.importadora.principal.api.dto.RegisterRequest;
import com.importadora.principal.api.exception.BusinessRuleException;
import com.importadora.principal.api.exception.DuplicateResourceException;
import com.importadora.principal.domain.model.Cliente;
import com.importadora.principal.domain.model.RolUsuario;
import com.importadora.principal.domain.model.TipoCliente;
import com.importadora.principal.domain.model.Usuario;
import com.importadora.principal.domain.model.Vendedor;
import com.importadora.principal.domain.repository.ClienteRepository;
import com.importadora.principal.domain.repository.UsuarioRepository;
import com.importadora.principal.domain.repository.VendedorRepository;
import com.importadora.principal.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;

@Service
@RequiredArgsConstructor
public class RegistrationService {

    private final UsuarioRepository usuarioRepository;
    private final ClienteRepository clienteRepository;
    private final VendedorRepository vendedorRepository;
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

        String cedula = normalizarDocumento(request.cedulaDocumento());
        validarDocumentoUnico(cedula, request.rol());

        String username = generarUsernameUnico(email);
        Cliente cliente = null;
        if (request.rol() == RolUsuario.CLIENTE) {
            cliente = crearCliente(request, email, cedula);
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

        if (request.rol() == RolUsuario.VENDEDOR) {
            crearVendedor(request, email, cedula, usuario);
        }

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

    private void crearVendedor(RegisterRequest request, String email, String cedula, Usuario usuario) {
        Vendedor vendedor = Vendedor.builder()
                .usuario(usuario)
                .nombreCompleto(request.nombreCompleto().trim())
                .telefono(telefonoOrDefault(request.telefono()))
                .email(email)
                .cedula(cedula)
                .fechaIngreso(LocalDate.now())
                .metaMensual(BigDecimal.ZERO)
                .comisionPorcentaje(BigDecimal.ZERO)
                .enCampo(false)
                .build();
        vendedor = vendedorRepository.save(vendedor);
        vendedor.setCodigo(String.format("VEN-%03d", vendedor.getId()));
        vendedorRepository.save(vendedor);
    }

    private void validarDocumentoUnico(String cedula, RolUsuario rol) {
        if (rol == RolUsuario.CLIENTE && clienteRepository.existsByNumeroDocumento(cedula)) {
            throw new DuplicateResourceException("La cédula o RUC ya está registrado");
        }
        if (rol == RolUsuario.VENDEDOR && vendedorRepository.existsByCedula(cedula)) {
            throw new DuplicateResourceException("La cédula ya está registrada");
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
