from django.urls import path

from . import views

urlpatterns = [
    path("embarques", views.embarques),
    path("embarques/desde-lote", views.embarques_desde_lote),
    path("embarques/planificar", views.embarques_planificar),
    path("embarques/<int:embarque_id>/rastreo", views.embarque_rastreo),
    path("embarques/<int:embarque_id>/avanzar", views.embarque_avanzar),
    path("importaciones/resumen", views.importaciones_resumen),
    path("importaciones/proximas-llegadas", views.proximas_llegadas),
    path("cotizador/calcular", views.cotizador_calcular),
    path("cotizador/recientes", views.cotizador_recientes),
    path("proveedores", views.proveedores_lista),
    path("proveedores/resumen", views.proveedores_resumen),
    path("blockchain/registrar", views.blockchain_registrar),
    path("blockchain", views.blockchain_historial),
    path("blockchain/<str:vin>", views.blockchain_historial),
    path("ml/prediccion-demanda", views.ml_prediccion_demanda),
    path("ml/segmentacion-clientes", views.ml_segmentacion_clientes),
    path("ml/anomalias", views.ml_anomalias),
    path("ml/analisis-historico", views.ml_analisis_historico),
]
