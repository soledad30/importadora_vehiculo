package com.importadora.principal.domain.service;

import com.importadora.principal.api.dto.VendedorRequest;
import com.importadora.principal.api.dto.VendedorResumenResponse;
import com.importadora.principal.api.dto.VendedorResponse;
import com.importadora.principal.api.exception.BusinessRuleException;
import com.importadora.principal.api.exception.DuplicateResourceException;
import com.importadora.principal.api.exception.ResourceNotFoundException;
import com.importadora.principal.domain.model.EstadoPedido;
import com.importadora.principal.domain.model.RolUsuario;
import com.importadora.principal.domain.model.Usuario;
import com.importadora.principal.domain.model.Vendedor;
import com.importadora.principal.domain.repository.PedidoRepository;
import com.importadora.principal.domain.repository.UsuarioRepository;
import com.importadora.principal.domain.repository.VendedorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class VendedorService {

    private static final String PASSWORD_DEFAULT = "vendedor123";

    private final VendedorRepository vendedorRepository;
    private final UsuarioRepository usuarioRepository;
    private final PedidoRepository pedidoRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public List<VendedorResponse> listar() {
        return vendedorRepository.findAllWithUsuario().stream()
                .map(v -> VendedorResponse.from(v, ventasTotales(v.getUsuario().getId())))
                .sorted(Comparator.comparing(VendedorResponse::nombreCompleto))
                .toList();
    }

    @Transactional(readOnly = true)
    public VendedorResumenResponse resumen() {
        List<Vendedor> todos = vendedorRepository.findAllWithUsuario();
        BigDecimal ventasEquipo = todos.stream()
                .map(v -> ventasTotales(v.getUsuario().getId()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        return new VendedorResumenResponse(
                todos.size(),
                vendedorRepository.countByUsuario_ActivoTrue(),
                vendedorRepository.countByEnCampoTrue(),
                ventasEquipo
        );
    }

    @Transactional(readOnly = true)
    public VendedorResponse obtener(Long id) {
        Vendedor v = vendedorRepository.findByIdWithUsuario(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vendedor no encontrado: id=" + id));
        return VendedorResponse.from(v, ventasTotales(v.getUsuario().getId()));
    }

    @Transactional
    public VendedorResponse crear(VendedorRequest request) {
        String email = request.email().trim().toLowerCase();
        if (vendedorRepository.existsByEmailIgnoreCase(email) || usuarioRepository.existsByEmail(email)) {
            throw new DuplicateResourceException("El correo ya está registrado: " + email);
        }
        if (vendedorRepository.existsByCedula(request.cedula())) {
            throw new DuplicateResourceException("La cédula ya está registrada: " + request.cedula());
        }

        String username = generarUsernameUnico(email);
        String password = request.password() != null && !request.password().isBlank()
                ? request.password()
                : PASSWORD_DEFAULT;

        Usuario usuario = usuarioRepository.save(Usuario.builder()
                .username(username)
                .password(passwordEncoder.encode(password))
                .email(email)
                .rol(RolUsuario.VENDEDOR)
                .activo(true)
                .build());

        Vendedor vendedor = Vendedor.builder()
                .usuario(usuario)
                .nombreCompleto(request.nombreCompleto().trim())
                .telefono(request.telefono())
                .email(email)
                .cedula(request.cedula().trim())
                .zonaAsignada(request.zonaAsignada())
                .fechaIngreso(request.fechaIngreso())
                .metaMensual(request.metaMensual())
                .comisionPorcentaje(request.comisionPorcentaje())
                .enCampo(false)
                .build();

        vendedor = vendedorRepository.save(vendedor);
        vendedor.setCodigo(formatoCodigo(vendedor.getId()));
        vendedor = vendedorRepository.save(vendedor);

        return VendedorResponse.from(
                vendedorRepository.findByIdWithUsuario(vendedor.getId()).orElse(vendedor),
                BigDecimal.ZERO);
    }

    @Transactional
    public VendedorResponse toggleActivo(Long id) {
        if (rolActual() != RolUsuario.ADMIN) {
            throw new BusinessRuleException("Solo el administrador puede cambiar el estado del vendedor");
        }
        Vendedor vendedor = vendedorRepository.findByIdWithUsuario(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vendedor no encontrado: id=" + id));
        Usuario usuario = vendedor.getUsuario();
        usuario.setActivo(!usuario.isActivo());
        usuarioRepository.save(usuario);
        return VendedorResponse.from(vendedor, ventasTotales(usuario.getId()));
    }

    private BigDecimal ventasTotales(Long usuarioId) {
        return pedidoRepository.sumTotalByVendedorUsuarioIdAndEstado(usuarioId, EstadoPedido.ENTREGADO);
    }

    private String generarUsernameUnico(String email) {
        String base = email.contains("@") ? email.substring(0, email.indexOf('@')) : email;
        base = base.replaceAll("[^a-zA-Z0-9._-]", "").toLowerCase();
        if (base.length() < 3) {
            base = "ven" + base;
        }
        String candidate = base;
        int suffix = 1;
        while (usuarioRepository.existsByUsername(candidate)) {
            candidate = base + suffix++;
        }
        return candidate;
    }

    private String formatoCodigo(Long id) {
        return String.format("VEN-%03d", id);
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
