"""Crea tablas DynamoDB y bucket MinIO para MS-3 (ejecutar tras docker compose)."""

import os
import sys

try:
    import boto3
    from botocore.exceptions import ClientError
except ImportError:
    print("ERROR: pip install boto3")
    sys.exit(1)

DYNAMODB_ENDPOINT = os.getenv("DYNAMODB_ENDPOINT", "http://localhost:8000")
S3_ENDPOINT = os.getenv("S3_ENDPOINT", "http://localhost:9000")
S3_ACCESS_KEY = os.getenv("S3_ACCESS_KEY", "minioadmin")
S3_SECRET_KEY = os.getenv("S3_SECRET_KEY", "minioadmin123")
S3_BUCKET = os.getenv("S3_BUCKET", "importadora-ms3-docs")
TABLE_DOCUMENTOS = os.getenv("DYNAMODB_TABLE_DOCUMENTOS", "ms3-documentos")
TABLE_INSPECCIONES = os.getenv("DYNAMODB_TABLE_INSPECCIONES", "ms3-inspecciones")


def dynamo_client():
    return boto3.client(
        "dynamodb",
        endpoint_url=DYNAMODB_ENDPOINT,
        region_name="us-east-1",
        aws_access_key_id="local",
        aws_secret_access_key="local",
    )


def ensure_dynamo_tables():
    client = dynamo_client()
    existing = client.list_tables().get("TableNames", [])

    if TABLE_DOCUMENTOS not in existing:
        client.create_table(
            TableName=TABLE_DOCUMENTOS,
            KeySchema=[{"AttributeName": "id", "KeyType": "HASH"}],
            AttributeDefinitions=[{"AttributeName": "id", "AttributeType": "S"}],
            BillingMode="PAY_PER_REQUEST",
        )
        print(f"  + Tabla DynamoDB: {TABLE_DOCUMENTOS}")

    if TABLE_INSPECCIONES not in existing:
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
        print(f"  + Tabla DynamoDB: {TABLE_INSPECCIONES}")

    if TABLE_DOCUMENTOS in existing and TABLE_INSPECCIONES in existing:
        print(f"  = Tablas DynamoDB ya existen")


def ensure_s3_bucket():
    s3 = boto3.client(
        "s3",
        endpoint_url=S3_ENDPOINT,
        aws_access_key_id=S3_ACCESS_KEY,
        aws_secret_access_key=S3_SECRET_KEY,
        region_name="us-east-1",
    )
    try:
        s3.head_bucket(Bucket=S3_BUCKET)
        print(f"  = Bucket S3 ya existe: {S3_BUCKET}")
    except ClientError:
        s3.create_bucket(Bucket=S3_BUCKET)
        print(f"  + Bucket S3: {S3_BUCKET}")


if __name__ == "__main__":
    print("MS-3 — inicializando DynamoDB + MinIO...")
    ensure_dynamo_tables()
    ensure_s3_bucket()
    print("MS-3 listo.")
