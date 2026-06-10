package com.importadora.principal.domain.service;

import com.importadora.principal.api.dto.ImpuestosAduanaResponse;
import com.importadora.principal.api.dto.ImportacionIniciarRequest;
import com.importadora.principal.api.dto.ImportacionRequest;
import com.importadora.principal.api.dto.ImportacionResponse;
import com.importadora.principal.api.dto.PagoAduanaRequest;
import com.importadora.principal.api.exception.BusinessRuleException;
import com.importadora.principal.api.exception.DuplicateResourceException;
import com.importadora.principal.api.exception.ResourceNotFoundException;
import com.importadora.principal.domain.model.EstadoImportacion;
import com.importadora.principal.domain.model.EstadoPagoAduana;
import com.importadora.principal.domain.model.EstadoPedido;
import com.importadora.principal.domain.model.EstadoVehiculo;
import com.importadora.principal.domain.model.Importacion;
import com.importadora.principal.domain.model.Pedido;
import com.importadora.principal.domain.model.Vehiculo;
import com.importadora.principal.domain.repository.ImportacionRepository;
import com.importadora.principal.domain.repository.PedidoRepository;
import com.importadora.principal.domain.repository.VehiculoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ImportacionService {

    private static final String PAIS_ORIGEN_DEFAULT = "Estados Unidos";
    private static final String ADUANA_DEFAULT = "Puerto Cortés";
    private static final BigDecimal TASA_DAI = new BigDecimal("0.15");
    private static final BigDecimal TASA_ISC = new BigDecimal("0.10");
    private static final BigDecimal TASA_IVA_ADUANA = new BigDecimal("0.15");

    private final ImportacionRepository importacionRepository;
    private final PedidoRepository pedidoRepository;
    private final VehiculoRepository vehiculoRepository;

    @Transactional(readOnly = true)
    public List<ImportacionResponse> listar() {
        return importacionRepository.findAllWithRelations().stream()
                .map(ImportacionResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public ImportacionResponse obtenerPorId(Long id) {
        return importacionRepository.findByIdWithRelations(id)
                .map(ImportacionResponse::from)
                .orElseThrow(() -> new ResourceNotFoundException("Importación no encontrada: id=" + id));
    }

    /**
     * Flujo unificado: crea registro aduanero y sincroniza Pedido + Vehículo en EN_IMPORTACION.
     */
    @Transactional
    public ImportacionResponse iniciarImportacion(Long pedidoId, ImportacionIniciarRequest request) {
        if (importacionRepository.existsByPedidoId(pedidoId)) {
            throw new DuplicateResourceException("Ya existe importación para el pedido: " + pedidoId);
        }

        Pedido pedido = pedidoRepository.findByIdWithRelations(pedidoId)
                .orElseThrow(() -> new ResourceNotFoundException("Pedido no encontrado: id=" + pedidoId));

        if (pedido.getEstado() != EstadoPedido.CONFIRMADO) {
            throw new BusinessRuleException(
                    "El pedido debe estar CONFIRMADO para iniciar importación (estado actual: "
                            + pedido.getEstado() + ")");
        }

        ImportacionIniciarRequest datos = request != null ? request : new ImportacionIniciarRequest(
                null, null, null, null, null, null, null, null, null, null);

        Importacion importacion = construirImportacion(pedido, datos, null, null, null);
        importacion = guardarConCodigo(importacion);

        aplicarEstadosImportacion(pedido, datos.paisOrigen());

        return ImportacionResponse.from(
                importacionRepository.findByIdWithRelations(importacion.getId()).orElse(importacion));
    }

    @Transactional
    public ImportacionResponse crear(ImportacionRequest request) {
        ImportacionIniciarRequest iniciar = new ImportacionIniciarRequest(
                request.paisOrigen(),
                request.aduana(),
                request.puertoOrigen(),
                request.puertoDestino(),
                request.naviera(),
                request.numeroBl(),
                request.numeroContenedor(),
                request.numeroDespacho(),
                request.fechaEstimadaEntrega(),
                request.ms2EmbarqueId());

        if (importacionRepository.existsByPedidoId(request.pedidoId())) {
            throw new DuplicateResourceException("Ya existe importación para el pedido: " + request.pedidoId());
        }

        Pedido pedido = pedidoRepository.findByIdWithRelations(request.pedidoId())
                .orElseThrow(() -> new ResourceNotFoundException("Pedido no encontrado: id=" + request.pedidoId()));

        if (pedido.getEstado() == EstadoPedido.CONFIRMADO) {
            Importacion importacion = construirImportacion(pedido, iniciar,
                    request.estado(), request.fechaInicio(), request.fechaEstimadaEntrega());
            importacion = guardarConCodigo(importacion);
            aplicarEstadosImportacion(pedido, request.paisOrigen());
            return ImportacionResponse.from(
                    importacionRepository.findByIdWithRelations(importacion.getId()).orElse(importacion));
        }

        if (pedido.getEstado() == EstadoPedido.EN_IMPORTACION) {
            Importacion importacion = construirImportacion(pedido, iniciar,
                    request.estado(), request.fechaInicio(), request.fechaEstimadaEntrega());
            importacion = guardarConCodigo(importacion);
            return ImportacionResponse.from(
                    importacionRepository.findByIdWithRelations(importacion.getId()).orElse(importacion));
        }

        throw new BusinessRuleException("El pedido debe estar CONFIRMADO o EN_IMPORTACION");
    }

    @Transactional
    public ImportacionResponse actualizar(Long id, ImportacionRequest request) {
        Importacion importacion = importacionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Importación no encontrada: id=" + id));

        importacion.setPaisOrigen(request.paisOrigen());
        importacion.setAduana(request.aduana());
        importacion.setPuertoOrigen(request.puertoOrigen());
        importacion.setPuertoDestino(request.puertoDestino());
        importacion.setNaviera(request.naviera());
        importacion.setNumeroBl(request.numeroBl());
        importacion.setNumeroContenedor(request.numeroContenedor());
        importacion.setNumeroDespacho(request.numeroDespacho());
        importacion.setMs2EmbarqueId(request.ms2EmbarqueId());
        if (request.estado() != null) {
            importacion.setEstado(request.estado());
        }
        if (request.fechaInicio() != null) {
            importacion.setFechaInicio(request.fechaInicio());
        }
        importacion.setFechaEstimadaEntrega(request.fechaEstimadaEntrega());

        Importacion guardada = importacionRepository.save(importacion);
        return ImportacionResponse.from(
                importacionRepository.findByIdWithRelations(guardada.getId()).orElse(guardada));
    }

    @Transactional(readOnly = true)
    public ImpuestosAduanaResponse calcularImpuestosAduana(Long id) {
        Importacion importacion = importacionRepository.findByIdWithRelations(id)
                .orElseThrow(() -> new ResourceNotFoundException("Importación no encontrada: id=" + id));
        return construirImpuestosResponse(importacion);
    }

    @Transactional
    public ImportacionResponse registrarPagoAduana(Long id, PagoAduanaRequest request) {
        Importacion importacion = importacionRepository.findByIdWithRelations(id)
                .orElseThrow(() -> new ResourceNotFoundException("Importación no encontrada: id=" + id));

        if (importacion.getEstadoPagoAduana() == EstadoPagoAduana.PAGADO
                || importacion.getEstadoPagoAduana() == EstadoPagoAduana.LIBERADO) {
            throw new BusinessRuleException("El pago aduanero ya fue registrado");
        }

        ImpuestosAduanaResponse calculados = construirImpuestosResponse(importacion);
        BigDecimal montoDai = request.montoDai() != null ? request.montoDai() : calculados.montoDai();
        BigDecimal montoIsc = request.montoIsc() != null ? request.montoIsc() : calculados.montoIsc();
        BigDecimal montoIva = request.montoIvaAduana() != null
                ? request.montoIvaAduana()
                : calculados.montoIvaAduana();
        BigDecimal total = montoDai.add(montoIsc).add(montoIva);

        importacion.setNumeroDua(request.numeroDua());
        importacion.setAgenteAduanal(request.agenteAduanal());
        importacion.setComprobantePagoSunca(request.comprobantePagoSunca());
        importacion.setReferenciaPoliza(request.referenciaPoliza());
        importacion.setMontoDai(montoDai);
        importacion.setMontoIsc(montoIsc);
        importacion.setMontoIvaAduana(montoIva);
        importacion.setMontoTotalImpuestos(total);
        importacion.setEstadoPagoAduana(EstadoPagoAduana.PAGADO);
        importacion.setFechaPagoAduana(LocalDate.now());
        if (importacion.getEstado() == EstadoImportacion.SOLICITADA
                || importacion.getEstado() == EstadoImportacion.EN_TRANSITO) {
            importacion.setEstado(EstadoImportacion.LIBERADA);
        }

        Importacion guardada = importacionRepository.save(importacion);
        return ImportacionResponse.from(
                importacionRepository.findByIdWithRelations(guardada.getId()).orElse(guardada));
    }

    @Transactional
    public void completarPorPedido(Long pedidoId) {
        importacionRepository.findByPedidoId(pedidoId).ifPresent(importacion -> {
            importacion.setEstado(EstadoImportacion.COMPLETADA);
            importacionRepository.save(importacion);
        });
    }

    private Importacion construirImportacion(
            Pedido pedido,
            ImportacionIniciarRequest datos,
            EstadoImportacion estado,
            java.time.LocalDate fechaInicio,
            java.time.LocalDate fechaEstimada) {
        return Importacion.builder()
                .pedido(pedido)
                .paisOrigen(orDefault(datos.paisOrigen(), PAIS_ORIGEN_DEFAULT))
                .aduana(orDefault(datos.aduana(), ADUANA_DEFAULT))
                .puertoOrigen(datos.puertoOrigen())
                .puertoDestino(datos.puertoDestino())
                .naviera(datos.naviera())
                .numeroBl(datos.numeroBl())
                .numeroContenedor(datos.numeroContenedor())
                .numeroDespacho(datos.numeroDespacho())
                .ms2EmbarqueId(datos.ms2EmbarqueId())
                .estado(estado != null ? estado : EstadoImportacion.SOLICITADA)
                .fechaInicio(fechaInicio)
                .fechaEstimadaEntrega(fechaEstimada != null ? fechaEstimada : datos.fechaEstimadaEntrega())
                .build();
    }

    private Importacion guardarConCodigo(Importacion importacion) {
        Importacion guardada = importacionRepository.save(importacion);
        if (guardada.getCodigo() == null || guardada.getCodigo().isBlank()) {
            guardada.setCodigo(String.format("IMP-%03d", guardada.getId()));
            guardada = importacionRepository.save(guardada);
        }
        return guardada;
    }

    private void aplicarEstadosImportacion(Pedido pedido, String paisOrigenVehiculo) {
        pedido.setEstado(EstadoPedido.EN_IMPORTACION);
        pedidoRepository.save(pedido);

        Vehiculo vehiculo = pedido.getVehiculo();
        vehiculo.setEstado(EstadoVehiculo.EN_IMPORTACION);
        vehiculo.setEsImportado(true);
        if (paisOrigenVehiculo != null && !paisOrigenVehiculo.isBlank()) {
            vehiculo.setPaisOrigen(paisOrigenVehiculo);
        } else if (vehiculo.getPaisOrigen() == null || vehiculo.getPaisOrigen().isBlank()) {
            vehiculo.setPaisOrigen(PAIS_ORIGEN_DEFAULT);
        }
        vehiculoRepository.save(vehiculo);
    }

    private ImpuestosAduanaResponse construirImpuestosResponse(Importacion importacion) {
        BigDecimal valorCif = importacion.getPedido().getPrecioBase();
        if (valorCif == null || valorCif.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessRuleException("El pedido no tiene precio base para calcular impuestos aduaneros");
        }
        BigDecimal montoDai = valorCif.multiply(TASA_DAI).setScale(2, RoundingMode.HALF_UP);
        BigDecimal montoIsc = valorCif.multiply(TASA_ISC).setScale(2, RoundingMode.HALF_UP);
        BigDecimal baseIva = valorCif.add(montoDai);
        BigDecimal montoIva = baseIva.multiply(TASA_IVA_ADUANA).setScale(2, RoundingMode.HALF_UP);
        BigDecimal total = montoDai.add(montoIsc).add(montoIva);
        return new ImpuestosAduanaResponse(
                importacion.getId(),
                importacion.getCodigo(),
                valorCif,
                montoDai,
                montoIsc,
                montoIva,
                total
        );
    }

    private String orDefault(String value, String defaultValue) {
        return value != null && !value.isBlank() ? value : defaultValue;
    }
}
