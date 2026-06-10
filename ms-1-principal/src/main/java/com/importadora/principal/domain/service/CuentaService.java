package com.importadora.principal.domain.service;

import com.importadora.principal.api.dto.CambioContrasenaRequest;
import com.importadora.principal.api.dto.ClienteResponse;
import com.importadora.principal.api.dto.MiPerfilResponse;
import com.importadora.principal.api.dto.MiPerfilUpdateRequest;
import com.importadora.principal.api.dto.VendedorResponse;
import com.importadora.principal.api.exception.BusinessRuleException;
import com.importadora.principal.api.exception.DuplicateResourceException;
import com.importadora.principal.domain.model.Cliente;
import com.importadora.principal.domain.model.RolUsuario;
import com.importadora.principal.domain.model.Usuario;
import com.importadora.principal.domain.model.Vendedor;
import com.importadora.principal.domain.repository.ClienteRepository;
import com.importadora.principal.domain.repository.UsuarioRepository;
import com.importadora.principal.domain.repository.VendedorRepository;
import com.importadora.principal.security.SecurityActor;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class CuentaService {

    private final SecurityActor securityActor;
    private final UsuarioRepository usuarioRepository;
    private final ClienteRepository clienteRepository;
    private final VendedorRepository vendedorRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public MiPerfilResponse obtenerMiPerfil() {
        Usuario usuario = securityActor.usuarioActual();
        ClienteResponse cliente = null;
        VendedorResponse vendedor = null;

        if (usuario.getRol() == RolUsuario.CLIENTE) {
            Cliente c = usuario.getCliente();
            if (c == null) {
                throw new BusinessRuleException("Su cuenta no tiene un perfil de cliente vinculado");
            }
            cliente = ClienteResponse.from(clienteRepository.findById(c.getId()).orElse(c));
        } else if (usuario.getRol() == RolUsuario.VENDEDOR) {
            Vendedor v = vendedorRepository.findByUsuarioId(usuario.getId())
                    .orElseThrow(() -> new BusinessRuleException("Perfil de vendedor no encontrado"));
            vendedor = VendedorResponse.from(v, BigDecimal.ZERO);
        }

        return new MiPerfilResponse(
                usuario.getId(),
                usuario.getUsername(),
                usuario.getEmail(),
                usuario.getRol(),
                cliente,
                vendedor
        );
    }

    @Transactional
    public MiPerfilResponse actualizarMiPerfil(MiPerfilUpdateRequest request) {
        Usuario usuario = securityActor.usuarioActual();
        actualizarEmailUsuario(usuario, request.email());

        switch (usuario.getRol()) {
            case CLIENTE -> actualizarPerfilCliente(usuario, request);
            case VENDEDOR -> actualizarPerfilVendedor(usuario, request);
            case ADMIN -> {
                if (request.nombreCompleto() != null || request.telefono() != null
                        || request.direccion() != null || request.ciudad() != null
                        || request.zonaAsignada() != null) {
                    throw new BusinessRuleException("El administrador solo puede actualizar su correo");
                }
            }
        }

        usuarioRepository.save(usuario);
        return obtenerMiPerfil();
    }

    @Transactional
    public void cambiarContrasena(CambioContrasenaRequest request) {
        Usuario usuario = securityActor.usuarioActual();
        if (!passwordEncoder.matches(request.contrasenaActual(), usuario.getPassword())) {
            throw new BusinessRuleException("La contraseña actual es incorrecta");
        }
        usuario.setPassword(passwordEncoder.encode(request.contrasenaNueva()));
        usuarioRepository.save(usuario);
    }

    private void actualizarEmailUsuario(Usuario usuario, String emailRaw) {
        if (emailRaw == null || emailRaw.isBlank()) {
            return;
        }
        String email = emailRaw.trim().toLowerCase();
        if (email.equalsIgnoreCase(usuario.getEmail())) {
            return;
        }
        if (usuarioRepository.existsByEmail(email)) {
            throw new DuplicateResourceException("Email ya registrado: " + email);
        }
        usuario.setEmail(email);
    }

    private void actualizarPerfilCliente(Usuario usuario, MiPerfilUpdateRequest request) {
        Cliente cliente = usuario.getCliente();
        if (cliente == null) {
            throw new BusinessRuleException("Su cuenta no tiene un perfil de cliente vinculado");
        }

        if (request.nombreCompleto() != null && !request.nombreCompleto().isBlank()) {
            String[] nombre = dividirNombre(request.nombreCompleto());
            cliente.setNombres(nombre[0]);
            cliente.setApellidos(nombre[1]);
        }
        if (request.telefono() != null) {
            cliente.setTelefono(request.telefono());
        }
        if (request.direccion() != null) {
            cliente.setDireccion(request.direccion());
        }
        if (request.ciudad() != null) {
            cliente.setCiudad(request.ciudad());
        }
        if (request.email() != null && !request.email().isBlank()) {
            String email = request.email().trim().toLowerCase();
            if (!cliente.getEmail().equalsIgnoreCase(email) && clienteRepository.existsByEmail(email)) {
                throw new DuplicateResourceException("Email ya registrado: " + email);
            }
            cliente.setEmail(email);
        }

        clienteRepository.save(cliente);
    }

    private void actualizarPerfilVendedor(Usuario usuario, MiPerfilUpdateRequest request) {
        Vendedor vendedor = vendedorRepository.findByUsuarioId(usuario.getId())
                .orElseThrow(() -> new BusinessRuleException("Perfil de vendedor no encontrado"));

        if (request.nombreCompleto() != null && !request.nombreCompleto().isBlank()) {
            vendedor.setNombreCompleto(request.nombreCompleto().trim());
        }
        if (request.telefono() != null) {
            vendedor.setTelefono(request.telefono());
        }
        if (request.zonaAsignada() != null) {
            vendedor.setZonaAsignada(request.zonaAsignada());
        }
        if (request.email() != null && !request.email().isBlank()) {
            String email = request.email().trim().toLowerCase();
            if (!vendedor.getEmail().equalsIgnoreCase(email) && vendedorRepository.existsByEmailIgnoreCase(email)) {
                throw new DuplicateResourceException("Email ya registrado: " + email);
            }
            vendedor.setEmail(email);
        }

        vendedorRepository.save(vendedor);
    }

    private String[] dividirNombre(String nombreCompleto) {
        String limpio = nombreCompleto.trim().replaceAll("\\s+", " ");
        int idx = limpio.indexOf(' ');
        if (idx < 0) {
            return new String[]{limpio, "Cliente"};
        }
        return new String[]{limpio.substring(0, idx), limpio.substring(idx + 1)};
    }
}
