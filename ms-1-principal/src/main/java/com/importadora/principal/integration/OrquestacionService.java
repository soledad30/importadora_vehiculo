package com.importadora.principal.integration;

import com.fasterxml.jackson.databind.JsonNode;
import com.importadora.principal.api.dto.FlujoCompletoResponse;
import com.importadora.principal.api.dto.PasoFlujoResponse;
import com.importadora.principal.domain.model.CategoriaNotificacion;
import com.importadora.principal.domain.model.Cliente;
import com.importadora.principal.domain.model.EstadoPedido;
import com.importadora.principal.domain.model.NivelNotificacion;
import com.importadora.principal.domain.model.Pedido;
import com.importadora.principal.domain.model.RolUsuario;
import com.importadora.principal.domain.service.NotificacionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrquestacionService {

    private final Ms2Client ms2Client;
    private final Ms3Client ms3Client;
    private final RequestTokenProvider tokenProvider;
    private final NotificacionService notificacionService;

    public void despuesDeCrearPedido(Pedido pedido) {
        tokenProvider.bearerToken().ifPresent(token -> {
            try {
                JsonNode prediccion = ms2Client.prediccionDemanda(token, 3);
                if (prediccion != null) {
                    int total = prediccion.path("totalProyectado").asInt(0);
                    notificacionService.notificarRol(
                            RolUsuario.ADMIN,
                            CategoriaNotificacion.PREDICCION,
                            NivelNotificacion.INFO,
                            "Predicción de demanda (MS-2)",
                            "Demanda proyectada próximos 3 meses: " + total + " unidades",
                            "PEDIDO",
                            pedido.getId(),
                            "MS-1 → MS-2 ML");
                }
                ms2Client.sincronizarEmbarques(token);
            } catch (Exception ex) {
                log.warn("Orquestación post-pedido MS-2: {}", ex.getMessage());
            }
        });
    }

    public void despuesDeConfirmarPedido(Pedido pedido) {
        tokenProvider.bearerToken().ifPresent(token -> {
            try {
                String vin = pedido.getVehiculo().getVin();
                JsonNode reg = ms2Client.registrarBlockchain(
                        token, vin, "INGRESO",
                        "Pedido " + pedido.getCodigo() + " confirmado — ingreso a cadena");
                if (reg != null) {
                    notificacionService.notificarRol(
                            RolUsuario.ADMIN,
                            CategoriaNotificacion.BLOCKCHAIN,
                            NivelNotificacion.INFO,
                            "Registro blockchain (ingreso)",
                            "VIN " + vin + " — evento de ingreso registrado en MS-2",
                            "PEDIDO",
                            pedido.getId(),
                            "MS-1 → MS-2 Blockchain");
                }
            } catch (Exception ex) {
                log.warn("Orquestación confirmar MS-2: {}", ex.getMessage());
            }
        });
    }

    public void despuesDeEntregarPedido(Pedido pedido) {
        tokenProvider.bearerToken().ifPresent(token -> {
            try {
                String vin = pedido.getVehiculo().getVin();
                JsonNode reg = ms2Client.registrarBlockchain(
                        token, vin, "ENTREGA",
                        "Pedido " + pedido.getCodigo() + " entregado al cliente");
                if (reg != null) {
                    notificacionService.notificarRol(
                            RolUsuario.ADMIN,
                            CategoriaNotificacion.BLOCKCHAIN,
                            NivelNotificacion.EXITO,
                            "Registro blockchain (entrega)",
                            "VIN " + vin + " — entrega final registrada",
                            "PEDIDO",
                            pedido.getId(),
                            "MS-1 → MS-2 Blockchain");
                }
            } catch (Exception ex) {
                log.warn("Orquestación entrega MS-2: {}", ex.getMessage());
            }
        });
    }

    public void despuesDeIniciarImportacion(Pedido pedido) {
        tokenProvider.bearerToken().ifPresent(token -> {
            try {
                ms2Client.sincronizarEmbarques(token);
                notificacionService.notificarRol(
                        RolUsuario.ADMIN,
                        CategoriaNotificacion.IMPORTACION,
                        NivelNotificacion.INFO,
                        "Embarque sincronizado (MS-2)",
                        "Importación del pedido " + pedido.getCodigo() + " vinculada en MS-2",
                        "PEDIDO",
                        pedido.getId(),
                        "MS-1 → MS-2 Logística");
            } catch (Exception ex) {
                log.warn("Orquestación importación MS-2: {}", ex.getMessage());
            }
        });
    }

    public FlujoCompletoResponse ejecutarFlujoCompleto(
            Pedido pedido,
            EstadoPedido estadoFinal,
            MultipartFile foto) {
        List<PasoFlujoResponse> pasos = new ArrayList<>();
        Optional<String> tokenOpt = tokenProvider.bearerToken();

        pasos.add(PasoFlujoResponse.ok(1, "Pedido registrado en MS-1", pedido.getCodigo()));

        if (tokenOpt.isEmpty()) {
            pasos.add(PasoFlujoResponse.error(2, "Token JWT no disponible para orquestación"));
            return new FlujoCompletoResponse(pedido.getId(), pedido.getCodigo(), pasos);
        }
        String token = tokenOpt.get();

        notificacionService.notificarRol(
                RolUsuario.VENDEDOR,
                CategoriaNotificacion.PEDIDO,
                NivelNotificacion.INFO,
                "Nuevo pedido " + pedido.getCodigo(),
                pedido.getCliente().nombreCompleto() + " — revisar y confirmar",
                "PEDIDO",
                pedido.getId(),
                "Flujo 9 pasos → paso 3");
        pasos.add(PasoFlujoResponse.ok(3, "Notificación a vendedor (MS-1)", "Enviada"));

        if (foto != null && !foto.isEmpty()) {
            try {
                JsonNode inspeccion = ms3Client.analizarInspeccion(
                        token,
                        foto.getBytes(),
                        foto.getOriginalFilename(),
                        pedido.getVehiculo().getVin(),
                        pedido.getVehiculo().getMarca() + " " + pedido.getVehiculo().getModelo());
                if (inspeccion != null) {
                    String resultado = inspeccion.path("resultado").asText("Análisis completado");
                    pasos.add(PasoFlujoResponse.ok(4, "MS-3 analizó fotos", resultado));
                    notificarInspeccionCliente(pedido.getCliente(), pedido, resultado);
                } else {
                    pasos.add(PasoFlujoResponse.warn(4, "MS-3 no disponible", "Inspección omitida"));
                }
            } catch (Exception ex) {
                pasos.add(PasoFlujoResponse.warn(4, "MS-3 error", ex.getMessage()));
            }
        } else {
            pasos.add(PasoFlujoResponse.skip(4, "MS-3 inspección", "Sin foto adjunta"));
        }

        JsonNode blockchain = ms2Client.registrarBlockchain(
                token,
                pedido.getVehiculo().getVin(),
                "INGRESO",
                "Flujo 9 pasos — pedido " + pedido.getCodigo());
        pasos.add(blockchain != null
                ? PasoFlujoResponse.ok(5, "Blockchain ingreso (MS-2)", "Registrado")
                : PasoFlujoResponse.warn(5, "Blockchain (MS-2)", "No disponible"));

        JsonNode prediccion = ms2Client.prediccionDemanda(token, 3);
        if (prediccion != null) {
            int total = prediccion.path("totalProyectado").asInt(0);
            pasos.add(PasoFlujoResponse.ok(6, "MS-2 predicción demanda", total + " unidades proyectadas"));
            notificacionService.notificarRol(
                    RolUsuario.ADMIN,
                    CategoriaNotificacion.PREDICCION,
                    NivelNotificacion.INFO,
                    "Predicción post-pedido",
                    "Demanda proyectada: " + total,
                    "PEDIDO",
                    pedido.getId(),
                    "Flujo 9 pasos → paso 6");
        } else {
            pasos.add(PasoFlujoResponse.warn(6, "MS-2 ML", "No disponible"));
        }

        notificacionService.pedidoEstado(
                pedido.getCodigo(),
                estadoFinal.name(),
                pedido.getId(),
                pedido.getCliente());
        pasos.add(PasoFlujoResponse.ok(7, "Cliente notificado", estadoFinal.name()));

        JsonNode docs = ms3Client.resumenDocumentos(token);
        if (docs != null) {
            int total = docs.path("total").asInt(0);
            int verificados = docs.path("verificados").asInt(0);
            pasos.add(PasoFlujoResponse.ok(
                    8, "Documentos S3 (MS-3)", total + " documentos (" + verificados + " verificados)"));
        } else {
            pasos.add(PasoFlujoResponse.warn(8, "Documentos S3 (MS-3)", "MS-3 no disponible"));
        }

        if (estadoFinal == EstadoPedido.ENTREGADO) {
            JsonNode entrega = ms2Client.registrarBlockchain(
                    token,
                    pedido.getVehiculo().getVin(),
                    "ENTREGA",
                    "Flujo 9 pasos — entrega pedido " + pedido.getCodigo());
            pasos.add(entrega != null
                    ? PasoFlujoResponse.ok(9, "Blockchain entrega (MS-2)", "Completado")
                    : PasoFlujoResponse.warn(9, "Blockchain entrega (MS-2)", "No disponible"));
        } else {
            pasos.add(PasoFlujoResponse.skip(9, "Blockchain entrega", "Pendiente hasta entrega final"));
        }

        return new FlujoCompletoResponse(pedido.getId(), pedido.getCodigo(), pasos);
    }

    public JsonNode inspeccionarVehiculo(Pedido pedido, MultipartFile foto) {
        return tokenProvider.bearerToken()
                .map(token -> {
                    try {
                        JsonNode result = ms3Client.analizarInspeccion(
                                token,
                                foto.getBytes(),
                                foto.getOriginalFilename(),
                                pedido.getVehiculo().getVin(),
                                pedido.getVehiculo().getMarca() + " " + pedido.getVehiculo().getModelo());
                        if (result != null) {
                            String resultado = result.path("resultado").asText("Análisis completado");
                            notificarInspeccionCliente(pedido.getCliente(), pedido, resultado);
                        }
                        return result;
                    } catch (Exception ex) {
                        log.warn("Inspección MS-3: {}", ex.getMessage());
                        return null;
                    }
                })
                .orElse(null);
    }

    private void notificarInspeccionCliente(Cliente cliente, Pedido pedido, String resultado) {
        notificacionService.notificarCliente(
                cliente,
                CategoriaNotificacion.DOCUMENTO,
                NivelNotificacion.INFO,
                "Inspección IA completada",
                "Pedido " + pedido.getCodigo() + ": " + resultado,
                "PEDIDO",
                pedido.getId(),
                "MS-1 → MS-3 DL");
    }
}
