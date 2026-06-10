"""Almacenamiento de archivos — S3 (MinIO local / AWS en producción)."""

import os
import uuid
import mimetypes

import boto3
from botocore.client import Config
from botocore.exceptions import ClientError

S3_ENDPOINT = os.getenv("S3_ENDPOINT", "http://localhost:9000")
S3_ACCESS_KEY = os.getenv("S3_ACCESS_KEY", "minioadmin")
S3_SECRET_KEY = os.getenv("S3_SECRET_KEY", "minioadmin123")
S3_BUCKET = os.getenv("S3_BUCKET", "importadora-ms3-docs")
S3_REGION = os.getenv("S3_REGION", "us-east-1")
S3_USE_SSL = os.getenv("S3_USE_SSL", "false").lower() == "true"


def _client():
    return boto3.client(
        "s3",
        endpoint_url=S3_ENDPOINT,
        aws_access_key_id=S3_ACCESS_KEY,
        aws_secret_access_key=S3_SECRET_KEY,
        region_name=S3_REGION,
        config=Config(signature_version="s3v4"),
        use_ssl=S3_USE_SSL,
    )


def ensure_bucket() -> None:
    client = _client()
    try:
        client.head_bucket(Bucket=S3_BUCKET)
    except ClientError:
        client.create_bucket(Bucket=S3_BUCKET)


def _content_type(filename: str) -> str:
    guessed, _ = mimetypes.guess_type(filename)
    return guessed or "application/octet-stream"


def upload_bytes(content: bytes, filename: str, prefix: str = "docs") -> str:
    ensure_bucket()
    ext = os.path.splitext(filename)[1] or ".bin"
    key = f"{prefix}/{uuid.uuid4().hex}{ext}"
    _client().put_object(
        Bucket=S3_BUCKET,
        Key=key,
        Body=content,
        ContentType=_content_type(filename),
    )
    return key


def download_bytes(key: str) -> bytes | None:
    if not key:
        return None
    try:
        resp = _client().get_object(Bucket=S3_BUCKET, Key=key)
        return resp["Body"].read()
    except ClientError:
        return None


def presigned_url(key: str, expires: int = 3600) -> str | None:
    if not key:
        return None
    try:
        return _client().generate_presigned_url(
            "get_object",
            Params={"Bucket": S3_BUCKET, "Key": key},
            ExpiresIn=expires,
        )
    except ClientError:
        return None
