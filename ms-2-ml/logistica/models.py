from django.db import models


class Embarque(models.Model):
    ETAPAS = [
        "COMPRADO", "EMBARCADO", "EN_TRANSITO", "EN_ADUANA", "LIBERADO", "EN_LOTE"
    ]
    ESTADO_BADGE = {
        "COMPRADO": "EN_TRANSITO",
        "EMBARCADO": "EN_TRANSITO",
        "EN_TRANSITO": "EN_TRANSITO",
        "EN_ADUANA": "EN_ADUANA",
        "LIBERADO": "LIBERADO",
        "EN_LOTE": "COMPLETADO",
    }

    ms1_importacion_id = models.IntegerField(null=True, blank=True, unique=True)
    ms1_lote_id = models.IntegerField(null=True, blank=True, unique=True)
    codigo = models.CharField(max_length=32)
    vehiculo = models.CharField(max_length=120)
    referencia = models.CharField(max_length=120, blank=True, default="")
    origen = models.CharField(max_length=80, blank=True, default="")
    destino = models.CharField(max_length=80, blank=True, default="")
    naviera = models.CharField(max_length=80, blank=True, default="")
    etapa_actual = models.CharField(max_length=24, default="COMPRADO")
    fecha_estimada = models.DateField(null=True, blank=True)
    creado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-creado_en"]

    def to_dict(self) -> dict:
        return {
            "id": str(self.pk),
            "codigo": self.codigo,
            "ms1LoteId": self.ms1_lote_id,
            "vehiculo": self.vehiculo,
            "referencia": self.referencia,
            "origen": self.origen,
            "destino": self.destino,
            "naviera": self.naviera,
            "estadoBadge": self.ESTADO_BADGE.get(self.etapa_actual, "EN_TRANSITO"),
            "etapaActual": self.etapa_actual,
            "etapas": self.ETAPAS,
        }


class BlockchainEvento(models.Model):
    vin = models.CharField(max_length=17, db_index=True)
    evento = models.CharField(max_length=80)
    descripcion = models.TextField(blank=True, default="")
    registrado_por = models.CharField(max_length=80, blank=True, default="")
    creado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-creado_en"]

    def to_dict(self) -> dict:
        return {
            "vin": self.vin,
            "evento": self.evento,
            "descripcion": self.descripcion,
            "registradoPor": self.registrado_por or "MS-2",
            "fecha": self.creado_en.strftime("%Y-%m-%d %H:%M"),
        }


class CotizacionHistorial(models.Model):
    vehiculo = models.CharField(max_length=120)
    cif = models.DecimalField(max_digits=12, decimal_places=2)
    impuestos = models.DecimalField(max_digits=12, decimal_places=2)
    total = models.DecimalField(max_digits=12, decimal_places=2)
    margen = models.IntegerField(default=30)
    venta = models.DecimalField(max_digits=12, decimal_places=2)
    creado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-creado_en"]

    def to_dict(self) -> dict:
        return {
            "vehiculo": self.vehiculo,
            "cif": float(self.cif),
            "impuestos": float(self.impuestos),
            "total": float(self.total),
            "margen": self.margen,
            "venta": float(self.venta),
        }
