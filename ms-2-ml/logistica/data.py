"""Datos semilla — reemplazar con modelos Django + BD cuando se persista."""

EMBARQUES = [
    {
        "id": "1",
        "codigo": "IMP-2025-0034",
        "vehiculo": "Toyota RAV4 XLE 2024",
        "referencia": "VIN: 2T3P1RFV5RC123456",
        "origen": "Miami, FL",
        "destino": "Corinto, NI",
        "naviera": "Evergreen",
        "estadoBadge": "EN_TRANSITO",
        "etapaActual": "EN_TRANSITO",
        "etapas": ["COMPRADO", "EMBARCADO", "EN_TRANSITO", "EN_ADUANA", "LIBERADO", "EN_LOTE"],
    },
    {
        "id": "2",
        "codigo": "IMP-2025-0028",
        "vehiculo": "Honda CR-V EX 2023",
        "referencia": "Contenedor: EGLU4523891",
        "origen": "Houston, TX",
        "destino": "Puerto Cortés, HN",
        "naviera": "Maersk",
        "estadoBadge": "EN_ADUANA",
        "etapaActual": "EN_ADUANA",
        "etapas": ["COMPRADO", "EMBARCADO", "EN_TRANSITO", "EN_ADUANA", "LIBERADO", "EN_LOTE"],
    },
    {
        "id": "3",
        "codigo": "IMP-2025-0019",
        "vehiculo": "Nissan Rogue SV 2024",
        "referencia": "BL: EGLV089234",
        "origen": "Los Angeles, CA",
        "destino": "Corinto, NI",
        "naviera": "MSC",
        "estadoBadge": "LIBERADO",
        "etapaActual": "LIBERADO",
        "etapas": ["COMPRADO", "EMBARCADO", "EN_TRANSITO", "EN_ADUANA", "LIBERADO", "EN_LOTE"],
    },
]

PROVEEDORES = [
    {"id": 1, "nombre": "Copart", "tipo": "SUBASTA", "detalle": "Dallas, TX | Houston, TX", "metrica": "2,340 compras", "color": "blue"},
    {"id": 2, "nombre": "IAAI", "tipo": "SUBASTA", "detalle": "Miami, FL | Atlanta, GA", "metrica": "1,890 compras", "color": "orange"},
    {"id": 3, "nombre": "Manheim", "tipo": "SUBASTA", "detalle": "Los Angeles, CA", "metrica": "980 compras", "color": "green"},
    {"id": 4, "nombre": "Evergreen", "tipo": "NAVIERA", "detalle": "Houston > Puerto Cortés", "metrica": "18-22 días", "color": "blue"},
    {"id": 5, "nombre": "Maersk", "tipo": "NAVIERA", "detalle": "Miami > Corinto", "metrica": "20-25 días", "color": "orange"},
    {"id": 6, "nombre": "MSC", "tipo": "NAVIERA", "detalle": "LA > Puerto Cortés", "metrica": "22-28 días", "color": "green"},
    {"id": 7, "nombre": "Cargo Express S.A.", "tipo": "AGENTE", "detalle": "Puerto Cortés", "metrica": "156 despachos", "color": "blue"},
    {"id": 8, "nombre": "Aduanas del Norte", "tipo": "AGENTE", "detalle": "Corinto", "metrica": "98 despachos", "color": "orange"},
    {"id": 9, "nombre": "Global Customs HN", "tipo": "AGENTE", "detalle": "San Pedro Sula", "metrica": "72 despachos", "color": "green"},
    {"id": 10, "nombre": "AutoNation Dealer", "tipo": "DEALER", "detalle": "Texas, USA", "metrica": "420 vehículos", "color": "purple"},
    {"id": 11, "nombre": "CarMax Export", "tipo": "DEALER", "detalle": "Florida, USA", "metrica": "310 vehículos", "color": "blue"},
    {"id": 12, "nombre": "DriveTime Wholesale", "tipo": "DEALER", "detalle": "California, USA", "metrica": "185 vehículos", "color": "green"},
]

BLOCKCHAIN_HISTORIAL = {
    "titulo": "Toyota RAV4 2024",
    "vin": "2T3P1RFV5RC123456",
    "blockchainId": "0x7a3f...8b2c",
    "red": "Ethereum",
    "eventos": [
        {"fecha": "2024-08-15", "titulo": "ORIGEN - Compra en Subasta", "detalle": "Copart Dallas, TX - Lote #45892301", "tipo": "ORIGEN"},
        {"fecha": "2024-08-22", "titulo": "EMBARQUE - Puerto de Salida", "detalle": "Puerto Houston, TX - BL: EGLV089234", "tipo": "EMBARQUE"},
        {"fecha": "2024-09-10", "titulo": "TRANSITO - En Alta Mar", "detalle": "Naviera: Evergreen - Contenedor: EGLU4523891", "tipo": "TRANSITO"},
        {"fecha": "2024-10-02", "titulo": "ADUANA - Llegada a Puerto", "detalle": "Puerto Cortés, Honduras - DUA: 2024-HC-08923", "tipo": "ADUANA"},
        {"fecha": "2024-10-10", "titulo": "LIBERACION - Despacho Aduanero", "detalle": "Agente: Cargo Express - Póliza: POL-2024-4521", "tipo": "LIBERACION"},
        {"fecha": "2024-10-15", "titulo": "ENTREGA - En Lote de Venta", "detalle": "AutoImport Pro - Lote Central, San Pedro Sula", "tipo": "ENTREGA"},
    ],
    "ultimoTxHash": "0x7a3f8e2b1c9d4f6a8e0b2c4d6f8a0b2c4d6e8f0a2b4c6d8e0f2a4b6c8d0e2f4",
    "block": "#18,234,567",
    "gas": "0.0023 ETH",
    "confirmaciones": 847,
}

BLOCKCHAIN_CATALOGO = [
    BLOCKCHAIN_HISTORIAL,
    {
        "titulo": "Honda CR-V 2023",
        "vin": "1HGBH41JXMN109186",
        "blockchainId": "0x9c2e...4a1f",
        "red": "Ethereum",
        "eventos": [
            {"fecha": "2024-09-01", "titulo": "ORIGEN - Compra Dealer", "detalle": "AutoNation Dealer, Texas", "tipo": "ORIGEN"},
            {"fecha": "2024-09-18", "titulo": "EMBARQUE - Puerto de Salida", "detalle": "Houston, TX - BL: MAEU772341", "tipo": "EMBARQUE"},
            {"fecha": "2024-10-05", "titulo": "TRANSITO - En Alta Mar", "detalle": "Naviera: Maersk - Contenedor: MAEU8829102", "tipo": "TRANSITO"},
            {"fecha": "2024-11-12", "titulo": "ADUANA - Llegada a Puerto", "detalle": "Puerto Cortés, Honduras - DUA: 2024-HC-09102", "tipo": "ADUANA"},
        ],
        "ultimoTxHash": "0x9c2e4a1f8b3d2e1c0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7",
        "block": "#18,241,902",
        "gas": "0.0019 ETH",
        "confirmaciones": 412,
    },
    {
        "titulo": "Nissan Rogue 2024",
        "vin": "1N4BL4BV5RC123456",
        "blockchainId": "0x4f8b...9e3d",
        "red": "Polygon",
        "eventos": [
            {"fecha": "2024-10-20", "titulo": "ORIGEN - Compra Subasta", "detalle": "IAAI Miami, FL - Lote #77234102", "tipo": "ORIGEN"},
            {"fecha": "2024-11-02", "titulo": "EMBARQUE - Puerto de Salida", "detalle": "Los Angeles, CA - BL: EGLV089234", "tipo": "EMBARQUE"},
            {"fecha": "2024-11-28", "titulo": "TRANSITO - En Alta Mar", "detalle": "Naviera: MSC - Contenedor: MSCU4412987", "tipo": "TRANSITO"},
        ],
        "ultimoTxHash": "0x4f8b9e3d2c1a0f9e8d7c6b5a49382716050493827160504938271605049382716",
        "block": "#52,891,004",
        "gas": "0.004 MATIC",
        "confirmaciones": 128,
    },
]
