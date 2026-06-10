package com.importadora.principal.config;

import com.importadora.principal.domain.service.VehiculoImagenStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import java.nio.file.Files;
import java.nio.file.Path;

@RestController
@RequiredArgsConstructor
class VehiculoArchivoController {

    private final VehiculoImagenStorageService imagenStorageService;

    @GetMapping("/api/v1/archivos/vehiculos/{nombre}")
    public ResponseEntity<Resource> obtener(@PathVariable String nombre) {
        Path archivo = imagenStorageService.resolverArchivo(nombre);
        String contentType = MediaType.APPLICATION_OCTET_STREAM_VALUE;
        try {
            String detected = Files.probeContentType(archivo);
            if (detected != null) {
                contentType = detected;
            }
        } catch (Exception ignored) {
            // usar octet-stream por defecto
        }
        return ResponseEntity.ok()
                .header(HttpHeaders.CACHE_CONTROL, "public, max-age=86400")
                .contentType(MediaType.parseMediaType(contentType))
                .body(new FileSystemResource(archivo));
    }
}
