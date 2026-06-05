package com.importadora.principal.config;

import com.importadora.principal.domain.model.Cliente;
import com.importadora.principal.domain.model.RolUsuario;
import com.importadora.principal.domain.model.TipoCliente;
import com.importadora.principal.domain.model.Usuario;
import com.importadora.principal.domain.model.Vendedor;
import com.importadora.principal.domain.repository.ClienteRepository;
import com.importadora.principal.domain.repository.UsuarioRepository;
import com.importadora.principal.domain.repository.VendedorRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;

@Component
@Order(1)
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UsuarioRepository usuarioRepository;
    private final ClienteRepository clienteRepository;
    private final VendedorRepository vendedorRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        Cliente clienteDemo = crearClienteDemo();
        crearUsuarioSiNoExiste("admin", "admin123", "admin@importadora.com", RolUsuario.ADMIN, null);
        Usuario vendedorUser = crearUsuarioSiNoExiste(
                "vendedor", "vendedor123", "vendedor@importadora.com", RolUsuario.VENDEDOR, null);
        crearUsuarioSiNoExiste("cliente", "cliente123", "cliente@importadora.com", RolUsuario.CLIENTE, clienteDemo);
        crearVendedorDemo(vendedorUser);
        log.info("Usuarios de demostración listos (admin / vendedor / cliente)");
    }

    private Cliente crearClienteDemo() {
        return clienteRepository.findByNumeroDocumento("1234567890")
                .orElseGet(() -> {
                    Cliente c = clienteRepository.save(Cliente.builder()
                            .tipoDocumento("CC")
                            .numeroDocumento("1234567890")
                            .nombres("Juan")
                            .apellidos("Pérez")
                            .email("juan.perez@email.com")
                            .telefono("+505 8845-1234")
                            .direccion("Managua, Nicaragua")
                            .ciudad("Managua")
                            .tipoCliente(TipoCliente.VIP)
                            .notas("Cliente demo del sistema")
                            .activo(true)
                            .build());
                    c.setCodigo(String.format("CLI-%03d", c.getId()));
                    return clienteRepository.save(c);
                });
    }

    private Usuario crearUsuarioSiNoExiste(
            String username,
            String password,
            String email,
            RolUsuario rol,
            Cliente cliente) {
        return usuarioRepository.findByUsername(username).orElseGet(() ->
                usuarioRepository.save(Usuario.builder()
                        .username(username)
                        .password(passwordEncoder.encode(password))
                        .email(email)
                        .rol(rol)
                        .cliente(cliente)
                        .activo(true)
                        .build()));
    }

    private void crearVendedorDemo(Usuario usuario) {
        if (vendedorRepository.findByUsuarioId(usuario.getId()).isPresent()) {
            return;
        }
        Vendedor v = vendedorRepository.save(Vendedor.builder()
                .usuario(usuario)
                .nombreCompleto("Roberto Flores")
                .telefono("+505 8812-1111")
                .email("roberto@auto.com")
                .cedula("001-120590-0001A")
                .zonaAsignada("Managua Norte")
                .fechaIngreso(LocalDate.now().minusMonths(6))
                .metaMensual(new BigDecimal("50000"))
                .comisionPorcentaje(new BigDecimal("2.5"))
                .enCampo(false)
                .build());
        v.setCodigo(String.format("VEN-%03d", v.getId()));
        vendedorRepository.save(v);
    }
}
