package com.importadora.principal.api.dto;

public record PasoFlujoResponse(int paso, String nombre, String estado, String detalle) {

    public static PasoFlujoResponse ok(int paso, String nombre, String detalle) {
        return new PasoFlujoResponse(paso, nombre, "OK", detalle);
    }

    public static PasoFlujoResponse warn(int paso, String nombre, String detalle) {
        return new PasoFlujoResponse(paso, nombre, "WARN", detalle);
    }

    public static PasoFlujoResponse skip(int paso, String nombre, String detalle) {
        return new PasoFlujoResponse(paso, nombre, "SKIP", detalle);
    }

    public static PasoFlujoResponse error(int paso, String detalle) {
        return new PasoFlujoResponse(paso, "Error", "ERROR", detalle);
    }
}
