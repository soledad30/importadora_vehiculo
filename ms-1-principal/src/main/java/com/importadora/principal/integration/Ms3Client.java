package com.importadora.principal.integration;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

@Component
@Slf4j
public class Ms3Client {

    private final Ms3Properties properties;
    private final RestClient restClient;

    public Ms3Client(Ms3Properties properties) {
        this.properties = properties;
        this.restClient = RestClient.builder()
                .baseUrl(properties.baseUrl())
                .build();
    }

    public JsonNode analizarInspeccion(
            String bearerToken,
            byte[] imageBytes,
            String filename,
            String vin,
            String vehiculo) {
        if (!properties.enabled() || imageBytes == null || imageBytes.length == 0) {
            return null;
        }
        try {
            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("file", new ByteArrayResource(imageBytes) {
                @Override
                public String getFilename() {
                    return filename != null ? filename : "foto.jpg";
                }
            });
            body.add("vin", vin != null ? vin : "");
            body.add("vehiculo", vehiculo != null ? vehiculo : "");

            return restClient.post()
                    .uri("/api/inspeccion/analizar")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + bearerToken)
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .body(body)
                    .retrieve()
                    .body(JsonNode.class);
        } catch (RestClientException ex) {
            log.warn("MS-3 inspección no disponible: {}", ex.getMessage());
            return null;
        }
    }

    public JsonNode health() {
        if (!properties.enabled()) {
            return null;
        }
        try {
            return restClient.get().uri("/health").retrieve().body(JsonNode.class);
        } catch (RestClientException ex) {
            log.warn("MS-3 health: {}", ex.getMessage());
            return null;
        }
    }

    public JsonNode resumenDocumentos(String bearerToken) {
        return get("/api/documentos/resumen", bearerToken);
    }

    public JsonNode documentosPorVin(String bearerToken, String vin) {
        if (vin == null || vin.isBlank()) {
            return null;
        }
        return get("/api/documentos/por-vin/" + vin.trim().toUpperCase(), bearerToken);
    }

    public JsonNode inspeccionPorVin(String bearerToken, String vin) {
        if (vin == null || vin.isBlank()) {
            return null;
        }
        return getOptional("/api/inspeccion/por-vin/" + vin.trim().toUpperCase(), bearerToken);
    }

    private JsonNode getOptional(String path, String bearerToken) {
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
            log.debug("MS-3 {}: {}", path, ex.getMessage());
            return null;
        }
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
            log.warn("MS-3 no disponible {}: {}", path, ex.getMessage());
            return null;
        }
    }
}
