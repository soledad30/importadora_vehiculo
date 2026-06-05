package com.importadora.principal.api.dto;

import com.importadora.principal.domain.model.EstadoImportacion;
import com.importadora.principal.domain.model.Importacion;
import com.importadora.principal.domain.model.Pedido;
import com.importadora.principal.domain.model.Vehiculo;

import java.time.Instant;
import java.time.LocalDate;

public record ImportacionResponse(
        Long id,
        String codigo,
        Long pedidoId,
        String pedidoCodigo,
        Long vehiculoId,
        String vehiculoVin,
        String vehiculoTitulo,
        String paisOrigen,
        String aduana,
        String puertoOrigen,
        String puertoDestino,
        String naviera,
        String numeroBl,
        String numeroContenedor,
        String numeroDespacho,
        String ms2EmbarqueId,
        EstadoImportacion estado,
        LocalDate fechaInicio,
        LocalDate fechaEstimadaEntrega,
        Instant creadoEn,
        Instant actualizadoEn
) {
    public static ImportacionResponse from(Importacion i) {
        Pedido pedido = i.getPedido();
        Vehiculo v = pedido != null ? pedido.getVehiculo() : null;
        String pedidoCodigo = pedido != null && pedido.getCodigo() != null
                ? pedido.getCodigo()
                : (pedido != null ? String.format("PED-%03d", pedido.getId()) : null);
        String codigo = i.getCodigo() != null ? i.getCodigo() : String.format("IMP-%03d", i.getId());
        String titulo = v != null ? v.getMarca() + " " + v.getModelo() + " " + v.getAnio() : null;

        return new ImportacionResponse(
                i.getId(),
                codigo,
                pedido != null ? pedido.getId() : null,
                pedidoCodigo,
                v != null ? v.getId() : null,
                v != null ? v.getVin() : null,
                titulo,
                i.getPaisOrigen(),
                i.getAduana(),
                i.getPuertoOrigen(),
                i.getPuertoDestino(),
                i.getNaviera(),
                i.getNumeroBl(),
                i.getNumeroContenedor(),
                i.getNumeroDespacho(),
                i.getMs2EmbarqueId(),
                i.getEstado(),
                i.getFechaInicio(),
                i.getFechaEstimadaEntrega(),
                i.getCreadoEn(),
                i.getActualizadoEn()
        );
    }
}
