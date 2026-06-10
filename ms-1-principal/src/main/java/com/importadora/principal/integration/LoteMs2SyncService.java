package com.importadora.principal.integration;

import com.fasterxml.jackson.databind.JsonNode;
import com.importadora.principal.domain.model.EstadoLoteImportacion;
import com.importadora.principal.domain.model.LoteImportacion;
import com.importadora.principal.domain.repository.LoteImportacionRepository;
import com.importadora.principal.domain.repository.VehiculoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class LoteMs2SyncService {

    private static final Map<EstadoLoteImportacion, String> LOTE_A_ETAPA_MS2 = Map.of(
            EstadoLoteImportacion.PLANIFICADO, "COMPRADO",
            EstadoLoteImportacion.EMBARCADO, "EMBARCADO",
            EstadoLoteImportacion.EN_TRANSITO, "EN_TRANSITO",
            EstadoLoteImportacion.EN_ADUANA, "EN_ADUANA",
            EstadoLoteImportacion.LIBERADO, "LIBERADO",
            EstadoLoteImportacion.EN_PATIO, "EN_LOTE"
    );

    private final Ms2Properties properties;
    private final RequestTokenProvider tokenProvider;
    private final LoteImportacionRepository loteRepository;
    private final VehiculoRepository vehiculoRepository;

    public void sincronizar(LoteImportacion lote) {
        if (!properties.enabled()) {
            return;
        }
        tokenProvider.bearerToken().ifPresent(token -> {
            try {
                int cantidad = (int) vehiculoRepository.countByLoteId(lote.getId());
                Map<String, Object> body = new LinkedHashMap<>();
                body.put("id", lote.getId());
                body.put("codigo", lote.getCodigo());
                body.put("numeroContenedor", lote.getNumeroContenedor());
                body.put("naviera", lote.getNaviera());
                body.put("puertoOrigen", lote.getPuertoOrigen());
                body.put("puertoDestino", lote.getPuertoDestino());
                body.put("estado", lote.getEstado().name());
                body.put("fechaEmbarque", lote.getFechaEmbarque() != null ? lote.getFechaEmbarque().toString() : null);
                body.put("cantidadVehiculos", cantidad);

                RestClient client = RestClient.builder().baseUrl(properties.baseUrl()).build();
                JsonNode resp = client.post()
                        .uri("/api/embarques/desde-lote")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(body)
                        .retrieve()
                        .body(JsonNode.class);

                if (resp != null && resp.has("id")) {
                    String embarqueId = resp.get("id").asText();
                    if (!embarqueId.equals(lote.getMs2EmbarqueId())) {
                        lote.setMs2EmbarqueId(embarqueId);
                        loteRepository.save(lote);
                    }
                }
            } catch (RestClientException ex) {
                log.warn("Sync lote MS-2 falló para lote {}: {}", lote.getId(), ex.getMessage());
            }
        });
    }

    public void avanzarEmbarque(LoteImportacion lote) {
        String etapa = LOTE_A_ETAPA_MS2.get(lote.getEstado());
        if (etapa == null) {
            return;
        }
        Optional<String> embarqueIdOpt = Optional.ofNullable(lote.getMs2EmbarqueId());
        if (embarqueIdOpt.isEmpty()) {
            sincronizar(lote);
            embarqueIdOpt = Optional.ofNullable(lote.getMs2EmbarqueId());
        }
        embarqueIdOpt.ifPresent(embarqueId -> tokenProvider.bearerToken().ifPresent(token -> {
            try {
                RestClient client = RestClient.builder().baseUrl(properties.baseUrl()).build();
                client.post()
                        .uri("/api/embarques/" + embarqueId + "/avanzar")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .retrieve()
                        .body(JsonNode.class);
            } catch (RestClientException ex) {
                log.warn("Avanzar embarque lote MS-2 {}: {}", embarqueId, ex.getMessage());
            }
        }));
    }
}
