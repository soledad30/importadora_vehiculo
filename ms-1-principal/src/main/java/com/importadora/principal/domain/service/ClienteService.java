package com.importadora.principal.domain.service;

import com.importadora.principal.api.dto.ClienteRequest;
import com.importadora.principal.api.dto.ClienteResponse;
import com.importadora.principal.api.exception.BusinessRuleException;
import com.importadora.principal.api.exception.DuplicateResourceException;
import com.importadora.principal.api.exception.ResourceNotFoundException;
import com.importadora.principal.domain.model.Cliente;
import com.importadora.principal.domain.model.RolUsuario;
import com.importadora.principal.domain.model.TipoCliente;
import com.importadora.principal.domain.repository.ClienteRepository;
import com.importadora.principal.security.SecurityActor;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ClienteService {

    private final ClienteRepository clienteRepository;
    private final SecurityActor securityActor;
    private final NotificacionService notificacionService;

    @Transactional(readOnly = true)
    public List<ClienteResponse> listar() {
        RolUsuario rol = securityActor.rolActual();
        var actor = securityActor.usuarioActual();

        List<Cliente> clientes = switch (rol) {
            case ADMIN -> clienteRepository.findAllWithVendedorAsignado();
            case VENDEDOR -> clienteRepository.findCarteraOrSinAsignar(actor.getId());
            default -> List.of();
        };

        return clientes.stream()
                .map(this::asegurarCodigoSiFalta)
                .map(ClienteResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public ClienteResponse obtenerPorId(Long id) {
        return clienteRepository.findById(id)
                .map(this::asegurarCodigoSiFalta)
                .map(ClienteResponse::from)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente no encontrado: id=" + id));
    }

    @Transactional
    public ClienteResponse asignarAMi(Long id) {
        Cliente cliente = clienteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente no encontrado: id=" + id));

        RolUsuario rol = securityActor.rolActual();
        if (rol != RolUsuario.ADMIN && rol != RolUsuario.VENDEDOR) {
            throw new BusinessRuleException("No tiene permiso para asignar clientes");
        }

        var actor = securityActor.usuarioActual();
        cliente.setVendedorAsignado(actor);
        return ClienteResponse.from(clienteRepository.save(cliente));
    }

    @Transactional
    public ClienteResponse crear(ClienteRequest request) {
        String documento = normalizarDocumento(request.cedulaRuc());
        validarUnicidad(documento, request.email());

        String[] nombre = dividirNombre(request.nombreCompleto());
        Cliente cliente = Cliente.builder()
                .tipoDocumento(inferirTipoDocumento(documento))
                .numeroDocumento(documento)
                .nombres(nombre[0])
                .apellidos(nombre[1])
                .email(request.email().trim().toLowerCase())
                .telefono(request.telefono())
                .direccion(request.direccion())
                .ciudad(request.ciudad())
                .notas(request.notas())
                .tipoCliente(request.tipoCliente() != null ? request.tipoCliente() : TipoCliente.REGULAR)
                .build();

        cliente = clienteRepository.save(cliente);
        cliente.setCodigo(formatoCodigo(cliente.getId()));
        Cliente guardado = clienteRepository.save(cliente);
        notificacionService.nuevoClienteSinAsignar(guardado.nombreCompleto(), guardado.getId());
        return ClienteResponse.from(guardado);
    }

    @Transactional
    public ClienteResponse actualizar(Long id, ClienteRequest request) {
        Cliente cliente = clienteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente no encontrado: id=" + id));

        String documento = normalizarDocumento(request.cedulaRuc());
        clienteRepository.findByNumeroDocumento(documento)
                .filter(c -> !c.getId().equals(id))
                .ifPresent(c -> {
                    throw new DuplicateResourceException("Documento ya registrado: " + documento);
                });

        String email = request.email().trim().toLowerCase();
        if (!cliente.getEmail().equalsIgnoreCase(email) && clienteRepository.existsByEmail(email)) {
            throw new DuplicateResourceException("Email ya registrado: " + email);
        }

        String[] nombre = dividirNombre(request.nombreCompleto());
        cliente.setTipoDocumento(inferirTipoDocumento(documento));
        cliente.setNumeroDocumento(documento);
        cliente.setNombres(nombre[0]);
        cliente.setApellidos(nombre[1]);
        cliente.setEmail(email);
        cliente.setTelefono(request.telefono());
        cliente.setDireccion(request.direccion());
        cliente.setCiudad(request.ciudad());
        cliente.setNotas(request.notas());
        cliente.setTipoCliente(request.tipoCliente());

        if (cliente.getCodigo() == null || cliente.getCodigo().isBlank()) {
            cliente.setCodigo(formatoCodigo(cliente.getId()));
        }

        return ClienteResponse.from(clienteRepository.save(cliente));
    }

    @Transactional
    public void desactivar(Long id) {
        cambiarActivo(id, false);
    }

    @Transactional
    public ClienteResponse toggleActivo(Long id) {
        Cliente cliente = clienteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente no encontrado: id=" + id));
        cliente.setActivo(!cliente.isActivo());
        return ClienteResponse.from(clienteRepository.save(cliente));
    }

    private void cambiarActivo(Long id, boolean activo) {
        Cliente cliente = clienteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente no encontrado: id=" + id));
        cliente.setActivo(activo);
        clienteRepository.save(cliente);
    }

    private Cliente asegurarCodigoSiFalta(Cliente c) {
        if (c.getCodigo() == null || c.getCodigo().isBlank()) {
            c.setCodigo(formatoCodigo(c.getId()));
            if (c.getTipoCliente() == null) {
                c.setTipoCliente(TipoCliente.REGULAR);
            }
            return clienteRepository.save(c);
        }
        if (c.getTipoCliente() == null) {
            c.setTipoCliente(TipoCliente.REGULAR);
            return clienteRepository.save(c);
        }
        return c;
    }

    private void validarUnicidad(String documento, String email) {
        if (clienteRepository.existsByNumeroDocumento(documento)) {
            throw new DuplicateResourceException("Documento ya registrado: " + documento);
        }
        if (clienteRepository.existsByEmail(email.trim().toLowerCase())) {
            throw new DuplicateResourceException("Email ya registrado: " + email);
        }
    }

    private String normalizarDocumento(String cedulaRuc) {
        return cedulaRuc == null ? "" : cedulaRuc.trim().toUpperCase();
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
            return new String[]{limpio, "Cliente"};
        }
        return new String[]{limpio.substring(0, idx), limpio.substring(idx + 1)};
    }

    private String formatoCodigo(Long id) {
        return String.format("CLI-%03d", id);
    }
}
