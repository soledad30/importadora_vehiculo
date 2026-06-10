#!/usr/bin/env python3
"""
MS-3 | DynamoDB + S3 (MinIO)
Crea tablas NoSQL y bucket de archivos.

Ejecutar:
  pip install boto3
  python ms3-setup-dynamodb.py

Requiere: DynamoDB Local :8000 y MinIO :9000 (docker compose up -d)
"""

import os
import sys

try:
    import boto3
    from botocore.exceptions import ClientError
except ImportError:
    print("Instalar: pip install boto3")
    sys.exit(1)

# --- Configuracion local (produccion AWS: quitar ENDPOINT) ---
DYNAMODB_ENDPOINT = os.getenv("DYNAMODB_ENDPOINT", "http://localhost:8000")
S3_ENDPOINT = os.getenv("S3_ENDPOINT", "http://localhost:9000")
S3_ACCESS_KEY = os.getenv("S3_ACCESS_KEY", "minioadmin")
S3_SECRET_KEY = os.getenv("S3_SECRET_KEY", "minioadmin123")
S3_BUCKET = os.getenv("S3_BUCKET", "importadora-ms3-docs")
TABLE_DOCUMENTOS = "ms3-documentos"
TABLE_INSPECCIONES = "ms3-inspecciones"


def dynamo():
    return boto3.client(
        "dynamodb",
        endpoint_url=DYNAMODB_ENDPOINT,
        region_name="us-east-1",
        aws_access_key_id="local",
        aws_secret_access_key="local",
    )


def crear_tabla_documentos(client):
    if TABLE_DOCUMENTOS in client.list_tables()["TableNames"]:
        print(f"  = Tabla ya existe: {TABLE_DOCUMENTOS}")
        return
    client.create_table(
        TableName=TABLE_DOCUMENTOS,
        KeySchema=[{"AttributeName": "id", "KeyType": "HASH"}],
        AttributeDefinitions=[{"AttributeName": "id", "AttributeType": "S"}],
        BillingMode="PAY_PER_REQUEST",
    )
    print(f"  + Tabla creada: {TABLE_DOCUMENTOS}")
    print("    PK: id (String UUID)")
    print("    Atributos: num_id, nombre, vehiculo, tipo, fecha, estado, s3_key, ocr_json")


def crear_tabla_inspecciones(client):
    if TABLE_INSPECCIONES in client.list_tables()["TableNames"]:
        print(f"  = Tabla ya existe: {TABLE_INSPECCIONES}")
        return
    client.create_table(
        TableName=TABLE_INSPECCIONES,
        KeySchema=[{"AttributeName": "id", "KeyType": "HASH"}],
        AttributeDefinitions=[
            {"AttributeName": "id", "AttributeType": "S"},
            {"AttributeName": "activa", "AttributeType": "S"},
            {"AttributeName": "fecha", "AttributeType": "S"},
        ],
        GlobalSecondaryIndexes=[
            {
                "IndexName": "activa-fecha-index",
                "KeySchema": [
                    {"AttributeName": "activa", "KeyType": "HASH"},
                    {"AttributeName": "fecha", "KeyType": "RANGE"},
                ],
                "Projection": {"ProjectionType": "ALL"},
            }
        ],
        BillingMode="PAY_PER_REQUEST",
    )
    client.get_waiter("table_exists").wait(TableName=TABLE_INSPECCIONES)
    print(f"  + Tabla creada: {TABLE_INSPECCIONES}")
    print("    PK: id (String UUID)")
    print("    GSI: activa-fecha-index (activa + fecha)")
    print("    Atributos: vin, modelo_detectado, danos_json, s3_key, ...")


def crear_bucket_s3():
    s3 = boto3.client(
        "s3",
        endpoint_url=S3_ENDPOINT,
        aws_access_key_id=S3_ACCESS_KEY,
        aws_secret_access_key=S3_SECRET_KEY,
        region_name="us-east-1",
    )
    try:
        s3.head_bucket(Bucket=S3_BUCKET)
        print(f"  = Bucket ya existe: {S3_BUCKET}")
    except ClientError:
        s3.create_bucket(Bucket=S3_BUCKET)
        print(f"  + Bucket S3 creado: {S3_BUCKET}")
        print("    Rutas: documentos/  inspecciones/")


def main():
    print("MS-3 - DynamoDB + S3")
    print(f"  DynamoDB: {DYNAMODB_ENDPOINT}")
    print(f"  S3/MinIO: {S3_ENDPOINT}")
    client = dynamo()
    crear_tabla_documentos(client)
    crear_tabla_inspecciones(client)
    crear_bucket_s3()
    print("MS-3 OK")


if __name__ == "__main__":
    main()
