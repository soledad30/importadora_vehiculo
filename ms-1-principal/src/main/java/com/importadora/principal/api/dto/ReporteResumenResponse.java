package com.importadora.principal.api.dto;

import java.math.BigDecimal;
import java.util.List;

public record ReporteResumenResponse(
        BigDecimal ventasTotales,
        BigDecimal ventasMesActual,
        long pedidosPendientes,
        long pedidosEnProceso,
        long pedidosCompletados,
        long vehiculosDisponibles,
        long vehiculosVendidos,
        long clientesActivos,
        long importacionesActivas,
        long facturasEmitidas,
        List<VendedorRankingItem> topVendedores
) {
    public record VendedorRankingItem(
            String codigo,
            String nombreCompleto,
            BigDecimal ventasTotales,
            BigDecimal comisionPorcentaje
    ) {
    }
}
