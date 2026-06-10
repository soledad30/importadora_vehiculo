import jwt
from django.conf import settings
from rest_framework.exceptions import AuthenticationFailed


def user_from_bearer(auth_header: str | None) -> dict:
    if not auth_header or not auth_header.startswith("Bearer "):
        raise AuthenticationFailed("Token requerido")
    token = auth_header[7:]
    try:
        return jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256", "HS384"])
    except jwt.PyJWTError as exc:
        raise AuthenticationFailed("Token inválido") from exc
