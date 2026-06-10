package com.importadora.principal.integration;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

@Component
@Slf4j
public class Ms2Client {

    private final Ms2Properties properties;
    private final RestClient restClient;

    public Ms2Client(Ms2Properties properties) {
        this.properties = properties;
        this.restClient = RestClient.builder()
                .baseUrl(properties.baseUrl())
                .build();
    }

    public JsonNode prediccionDemanda(String bearerToken, int meses) {
        return get("/api/ml/prediccion-demanda?meses=" + meses, bearerToken);
    }

    public JsonNode analisisHistorico(String bearerToken) {
        return get("/api/ml/analisis-historico", bearerToken);
    }

    public JsonNode blockchainHistorial(String bearerToken, String vin) {
        String path = vin == null || vin.isBlank() ? "/api/blockchain" : "/api/blockchain/" + vin;
        return get(path, bearerToken);
    }

    public JsonNode registrarBlockchain(String bearerToken, String vin, String evento, String descripcion) {
        if (!properties.enabled() || vin == null || vin.isBlank()) {
            return null;
        }
        try {
            return restClient.post()
                    .uri("/api/blockchain/registrar")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + bearerToken)
                    .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                    .body(java.util.Map.of(
                            "vin", vin,
                            "evento", evento != null ? evento : "REGISTRO",
                            "descripcion", descripcion != null ? descripcion : ""))
                    .retrieve()
                    .body(JsonNode.class);
        } catch (RestClientException ex) {
            log.warn("MS-2 blockchain registrar no disponible: {}", ex.getMessage());
            return null;
        }
    }

    public JsonNode sincronizarEmbarques(String bearerToken) {
        return get("/api/embarques", bearerToken);
    }

    private JsonNode get(String path, String bearerToken) {
        if (!properties.enabled()) {
            return null;
        }
        try {
            return restClient.get()
                    .uri(path)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + bearerToken)
                    .retrieve()
                    .body(JsonNode.class);
        } catch (RestClientException ex) {
            log.warn("MS-2 no disponible {}: {}", path, ex.getMessage());
            return null;
        }
    }
}
