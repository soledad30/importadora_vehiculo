package com.importadora.principal.domain.service;

import com.importadora.principal.api.dto.ImagenVehiculoResponse;
import com.importadora.principal.api.exception.BusinessRuleException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Service
@Slf4j
public class VehiculoImagenStorageService {

    private static final Set<String> EXTENSIONES = Set.of("jpg", "jpeg", "png", "webp", "gif");
    private static final String RUTA_PUBLICA = "/api/v1/archivos/vehiculos/";

    private final Path directorio;

    public VehiculoImagenStorageService(
            @Value("${app.uploads.vehiculos-dir:uploads/vehiculos}") String vehiculosDir) {
        this.directorio = Paths.get(vehiculosDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.directorio);
        } catch (IOException e) {
            throw new IllegalStateException("No se pudo crear carpeta de imágenes: " + this.directorio, e);
        }
        log.info("Imágenes de vehículos en: {}", this.directorio);
    }

    public ImagenVehiculoResponse guardar(MultipartFile archivo) {
        if (archivo == null || archivo.isEmpty()) {
            throw new BusinessRuleException("Seleccione una imagen desde su carpeta");
        }
        String extension = resolverExtension(archivo);
        String nombre = UUID.randomUUID() + "." + extension;
        Path destino = directorio.resolve(nombre).normalize();
        if (!destino.startsWith(directorio)) {
            throw new BusinessRuleException("Nombre de archivo no válido");
        }
        try {
            archivo.transferTo(destino);
        } catch (IOException e) {
            throw new BusinessRuleException("No se pudo guardar la imagen: " + e.getMessage());
        }
        return new ImagenVehiculoResponse(RUTA_PUBLICA + nombre, nombre);
    }

    public Path resolverArchivo(String nombreArchivo) {
        Path archivo = directorio.resolve(nombreArchivo).normalize();
        if (!archivo.startsWith(directorio) || !Files.exists(archivo)) {
            throw new BusinessRuleException("Imagen no encontrada");
        }
        return archivo;
    }

    private String resolverExtension(MultipartFile archivo) {
        String original = archivo.getOriginalFilename();
        String extension = null;
        if (original != null && original.contains(".")) {
            extension = original.substring(original.lastIndexOf('.') + 1).toLowerCase(Locale.ROOT);
        }
        if (extension == null || !EXTENSIONES.contains(extension)) {
            String contentType = archivo.getContentType();
            extension = switch (contentType != null ? contentType : "") {
                case "image/jpeg" -> "jpg";
                case "image/png" -> "png";
                case "image/webp" -> "webp";
                case "image/gif" -> "gif";
                default -> null;
            };
        }
        if (extension == null || !EXTENSIONES.contains(extension)) {
            throw new BusinessRuleException("Formato no soportado. Use JPG, PNG, WEBP o GIF");
        }
        return extension;
    }
}
