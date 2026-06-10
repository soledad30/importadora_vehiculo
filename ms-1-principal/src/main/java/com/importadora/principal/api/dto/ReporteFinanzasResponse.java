package com.importadora.principal.api.dto;

import java.math.BigDecimal;
import java.util.List;

public record ReporteFinanzasResponse(
        long facturasEmitidas,
        long facturasPagadas,
        long facturasBorrador,
        long facturasAnuladas,
        BigDecimal montoPorCobrar,
        BigDecimal montoCobrado,
        BigDecimal montoTotalFacturado,
        List<FacturaPendienteItem> pendientesCobro
) {
    public record FacturaPendienteItem(
            String numeroFactura,
            String cliente,
            String vehiculo,
            BigDecimal monto,
            String fechaEmision,
            long diasDesdeEmision
    ) {
    }
}
