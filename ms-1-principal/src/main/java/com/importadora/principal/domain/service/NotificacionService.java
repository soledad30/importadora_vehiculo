package com.importadora.principal.domain.service;

import com.importadora.principal.api.dto.NotificacionResponse;
import com.importadora.principal.api.exception.BusinessRuleException;
import com.importadora.principal.api.exception.ResourceNotFoundException;
import com.importadora.principal.domain.model.CategoriaNotificacion;
import com.importadora.principal.domain.model.Cliente;
import com.importadora.principal.domain.model.NivelNotificacion;
import com.importadora.principal.domain.model.Notificacion;
import com.importadora.principal.domain.model.RolUsuario;
import com.importadora.principal.domain.repository.NotificacionRepository;
import com.importadora.principal.domain.repository.UsuarioRepository;
import com.importadora.principal.security.SecurityActor;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificacionService {

    private final NotificacionRepository notificacionRepository;
    private final UsuarioRepository usuarioRepository;
    private final SecurityActor securityActor;

    @Transactional(readOnly = true)
    public List<NotificacionResponse> listar(CategoriaNotificacion categoria) {
        var actor = securityActor.usuarioActual();
        return notificacionRepository.findForUsuario(actor.getId(), actor.getRol()).stream()
                .filter(n -> categoria == null || n.getCategoria() == categoria)
                .map(NotificacionResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public long contarNoLeidas() {
        var actor = securityActor.usuarioActual();
        return notificacionRepository.countNoLeidas(actor.getId(), actor.getRol());
    }

    @Transactional
    public NotificacionResponse marcarLeida(Long id) {
        Notificacion n = obtenerPropia(id);
        n.setLeida(true);
        return NotificacionResponse.from(notificacionRepository.save(n));
    }

    @Transactional
    public void marcarTodasLeidas() {
        var actor = securityActor.usuarioActual();
        notificacionRepository.findForUsuario(actor.getId(), actor.getRol()).stream()
                .filter(n -> !n.isLeida())
                .forEach(n -> {
                    n.setLeida(true);
                    notificacionRepository.save(n);
                });
    }

    @Transactional
    public void notificarRol(
            RolUsuario rol,
            CategoriaNotificacion categoria,
            NivelNotificacion nivel,
            String titulo,
            String mensaje,
            String referenciaTipo,
            Long referenciaId,
            String flujo) {
        guardar(Notificacion.builder()
                .categoria(categoria)
                .nivel(nivel)
                .titulo(titulo)
                .mensaje(mensaje)
                .rolDestino(rol)
                .referenciaTipo(referenciaTipo)
                .referenciaId(referenciaId)
                .flujo(flujo)
                .build());
    }

    @Transactional
    public void notificarUsuario(
            Long usuarioId,
            CategoriaNotificacion categoria,
            NivelNotificacion nivel,
            String titulo,
            String mensaje,
            String referenciaTipo,
            Long referenciaId,
            String flujo) {
        guardar(Notificacion.builder()
                .categoria(categoria)
                .nivel(nivel)
                .titulo(titulo)
                .mensaje(mensaje)
                .usuarioDestinoId(usuarioId)
                .referenciaTipo(referenciaTipo)
                .referenciaId(referenciaId)
                .flujo(flujo)
                .build());
    }

    @Transactional
    public void notificarCliente(
            Cliente cliente,
            CategoriaNotificacion categoria,
            NivelNotificacion nivel,
            String titulo,
            String mensaje,
            String referenciaTipo,
            Long referenciaId,
            String flujo) {
        usuarioRepository.findByClienteId(cliente.getId())
                .ifPresent(u -> notificarUsuario(
                        u.getId(), categoria, nivel, titulo, mensaje, referenciaTipo, referenciaId, flujo));
    }

    @Transactional
    public void nuevoVehiculoDisponible(String marca, String modelo, int anio, Long vehiculoId) {
        String titulo = marca + " " + modelo + " " + anio;
        String mensaje = "Nuevo vehículo disponible para compra: " + titulo;
        notificarRol(
                RolUsuario.CLIENTE,
                CategoriaNotificacion.VEHICULO,
                NivelNotificacion.EXITO,
                "Nuevo vehículo en catálogo",
                mensaje,
                "VEHICULO",
                vehiculoId,
                "MS-1 → Catálogo");
        notificarRol(
                RolUsuario.ADMIN,
                CategoriaNotificacion.STOCK,
                NivelNotificacion.INFO,
                "Vehículo agregado al inventario",
                titulo + " registrado como DISPONIBLE",
                "VEHICULO",
                vehiculoId,
                "MS-1 → Inventario");
        notificarRol(
                RolUsuario.VENDEDOR,
                CategoriaNotificacion.VEHICULO,
                NivelNotificacion.INFO,
                "Nuevo vehículo disponible",
                titulo + " listo para cotizar y vender",
                "VEHICULO",
                vehiculoId,
                "MS-1 → Ventas");
    }

    @Transactional
    public void nuevoClienteSinAsignar(String nombreCliente, Long clienteId) {
        notificarRol(
                RolUsuario.VENDEDOR,
                CategoriaNotificacion.CLIENTE,
                NivelNotificacion.INFO,
                "Nuevo cliente sin asignar",
                nombreCliente + " está disponible para tomar en tu cartera",
                "CLIENTE",
                clienteId,
                "MS-1 → CRM");
        notificarRol(
                RolUsuario.ADMIN,
                CategoriaNotificacion.CLIENTE,
                NivelNotificacion.INFO,
                "Cliente registrado",
                nombreCliente + " ingresó al sistema",
                "CLIENTE",
                clienteId,
                "MS-1 → CRM");
    }

    @Transactional
    public void pedidoCreado(String codigo, String clienteNombre, Long pedidoId, Cliente cliente) {
        notificarCliente(
                cliente,
                CategoriaNotificacion.PEDIDO,
                NivelNotificacion.INFO,
                "Pedido registrado",
                "Tu pedido " + codigo + " fue creado y está pendiente de confirmación",
                "PEDIDO",
                pedidoId,
                "MS-1 → Mis pedidos");
    }

    @Transactional
    public void pedidoEstado(String codigo, String estadoLabel, Long pedidoId, Cliente cliente) {
        notificarCliente(
                cliente,
                CategoriaNotificacion.PEDIDO,
                NivelNotificacion.EXITO,
                "Actualización de pedido " + codigo,
                "Tu pedido cambió a estado: " + estadoLabel,
                "PEDIDO",
                pedidoId,
                "MS-1 → Seguimiento");
    }

    @Transactional
    public void pedidoCancelado(String codigo, String motivo, Long pedidoId, Cliente cliente) {
        String msg = motivo == null || motivo.isBlank()
                ? "Tu pedido " + codigo + " fue cancelado"
                : "Tu pedido " + codigo + " fue cancelado. Motivo: " + motivo;
        notificarCliente(
                cliente,
                CategoriaNotificacion.PEDIDO,
                NivelNotificacion.ADVERTENCIA,
                "Pedido cancelado",
                msg,
                "PEDIDO",
                pedidoId,
                "MS-1 → Seguimiento");
    }

    @Transactional
    public void pedidoSinVendedor(String codigo, String clienteNombre, Long pedidoId) {
        notificarRol(
                RolUsuario.VENDEDOR,
                CategoriaNotificacion.PEDIDO,
                NivelNotificacion.ADVERTENCIA,
                "Pedido sin vendedor " + codigo,
                clienteNombre + " — puedes tomarlo o cerrarlo con motivo",
                "PEDIDO",
                pedidoId,
                "MS-1 → Ventas");
    }

    private Notificacion obtenerPropia(Long id) {
        var actor = securityActor.usuarioActual();
        Notificacion n = notificacionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notificación no encontrada: id=" + id));
        boolean esPropia = (n.getUsuarioDestinoId() != null && n.getUsuarioDestinoId().equals(actor.getId()))
                || (n.getUsuarioDestinoId() == null && n.getRolDestino() == actor.getRol());
        if (!esPropia) {
            throw new BusinessRuleException("No tiene permiso para esta notificación");
        }
        return n;
    }

    private void guardar(Notificacion n) {
        notificacionRepository.save(n);
    }
}
