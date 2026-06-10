package com.importadora.principal.domain.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.importadora.principal.api.dto.ChecklistEntregaResponse;
import com.importadora.principal.api.dto.ChecklistItemResponse;
import com.importadora.principal.domain.model.EstadoFactura;
import com.importadora.principal.domain.model.EstadoImportacion;
import com.importadora.principal.domain.model.EstadoPagoAduana;
import com.importadora.principal.domain.model.Pedido;
import com.importadora.principal.domain.repository.FacturaRepository;
import com.importadora.principal.domain.repository.ImportacionRepository;
import com.importadora.principal.integration.Ms3Client;
import com.importadora.principal.integration.RequestTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ChecklistEntregaService {

    private final FacturaRepository facturaRepository;
    private final ImportacionRepository importacionRepository;
    private final Ms3Client ms3Client;
    private final RequestTokenProvider tokenProvider;

    @Transactional(readOnly = true)
    public ChecklistEntregaResponse evaluar(Pedido pedido) {
        String vin = pedido.getVehiculo().getVin();
        String codigo = pedido.getCodigo() != null ? pedido.getCodigo() : "PED-" + pedido.getId();
        List<ChecklistItemResponse> items = new ArrayList<>();

        boolean facturaPagada = facturaRepository.findByPedidoId(pedido.getId())
                .map(f -> f.getEstado() == EstadoFactura.PAGADA)
                .orElse(false);
        items.add(new ChecklistItemResponse(
                "FACTURA_PAGADA",
                "Factura pagada",
                facturaPagada,
                true,
                facturaPagada ? "Factura en estado PAGADA" : "Debe emitir y registrar pago de factura"));

        boolean importacionOk = importacionRepository.findByPedidoId(pedido.getId())
                .map(i -> i.getEstado() == EstadoImportacion.COMPLETADA
                        || i.getEstado() == EstadoImportacion.LIBERADA
                        || i.getEstado() == EstadoImportacion.EN_TRANSITO)
                .orElse(false);
        items.add(new ChecklistItemResponse(
                "IMPORTACION_TRAMITE",
                "Importación en trámite o liberada",
                importacionOk,
                true,
                importacionOk ? "Importación registrada" : "Inicie y avance la importación aduanera"));

        boolean pagoSuncaOk = importacionRepository.findByPedidoId(pedido.getId())
                .map(i -> i.getEstadoPagoAduana() == EstadoPagoAduana.PAGADO
                        || i.getEstadoPagoAduana() == EstadoPagoAduana.LIBERADO)
                .orElse(false);
        items.add(new ChecklistItemResponse(
                "PAGO_SUNCA",
                "Pago aduanero SUNCA registrado",
                pagoSuncaOk,
                true,
                pagoSuncaOk
                        ? "Comprobante SUNCA registrado"
                        : "Registre DUA, agente aduanal y comprobante de pago SUNCA"));

        String token = tokenProvider.bearerToken().orElse(null);
        JsonNode docs = token != null ? ms3Client.documentosPorVin(token, vin) : null;
        boolean tituloOk = docVerificado(docs, "Titulo");
        boolean blOk = docVerificado(docs, "BL");
        boolean polizaOk = docVerificado(docs, "Poliza");

        items.add(new ChecklistItemResponse(
                "DOC_TITULO",
                "Título de propiedad verificado",
                tituloOk,
                true,
                tituloOk ? "Documento Titulo VERIFICADO en MS-3" : "Suba y verifique título USA (MS-3)"));
        items.add(new ChecklistItemResponse(
                "DOC_BL",
                "Bill of Lading verificado",
                blOk,
                true,
                blOk ? "Documento BL VERIFICADO en MS-3" : "Suba y verifique BL (MS-3)"));
        items.add(new ChecklistItemResponse(
                "DOC_POLIZA",
                "Póliza de importación verificada",
                polizaOk,
                true,
                polizaOk ? "Documento Poliza VERIFICADO en MS-3" : "Suba y verifique póliza (MS-3)"));

        JsonNode inspeccion = token != null ? ms3Client.inspeccionPorVin(token, vin) : null;
        boolean inspeccionOk = inspeccion != null && inspeccion.has("vin");
        items.add(new ChecklistItemResponse(
                "INSPECCION_IA",
                "Inspección IA realizada",
                inspeccionOk,
                false,
                inspeccionOk ? "Inspección registrada para el VIN" : "Opcional: ejecutar inspección IA"));

        boolean listo = items.stream()
                .filter(ChecklistItemResponse::obligatorio)
                .allMatch(ChecklistItemResponse::completado);

        return new ChecklistEntregaResponse(
                pedido.getId(),
                codigo,
                vin,
                listo,
                items
        );
    }

    private boolean docVerificado(JsonNode docs, String tipo) {
        if (docs == null || !docs.isArray()) {
            return false;
        }
        for (JsonNode doc : docs) {
            if (tipo.equals(doc.path("tipo").asText()) && "VERIFICADO".equals(doc.path("estado").asText())) {
                return true;
            }
        }
        return false;
    }
}
