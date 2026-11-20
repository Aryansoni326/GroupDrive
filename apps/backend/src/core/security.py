import hashlib
import hmac
import os
import time
from typing import Any, Dict, Optional
import jwt

# Secret key for JWT signing. In production, load from environment variable.
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "groupdrive-dealer-jwt-secret-key-production-grade-2026")
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60
REFRESH_TOKEN_EXPIRE_DAYS = 7

def hash_password(password: str, salt: Optional[str] = None) -> str:
    """
    Hash password using PBKDF2-HMAC-SHA256 with 100,000 iterations.
    Returns format: pbkdf2_sha256$<iterations>$<salt>$<hash_hex>
    """
    if salt is None:
        salt = os.urandom(16).hex()
    iterations = 100000
    pwd_hash = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        iterations,
    ).hex()
    return f"pbkdf2_sha256${iterations}${salt}${pwd_hash}"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify plain password against PBKDF2-HMAC-SHA256 hash.
    """
    try:
        parts = hashed_password.split("$")
        if len(parts) != 4 or parts[0] != "pbkdf2_sha256":
            return False
        iterations = int(parts[1])
        salt = parts[2]
        expected_hash = parts[3]
        actual_hash = hashlib.pbkdf2_hmac(
            "sha256",
            plain_password.encode("utf-8"),
            salt.encode("utf-8"),
            iterations,
        ).hex()
        return hmac.compare_digest(expected_hash, actual_hash)
    except Exception:
        return False

def create_access_token(
    data: Dict[str, Any],
    expires_delta_minutes: int = ACCESS_TOKEN_EXPIRE_MINUTES
) -> str:
    """
    Create a signed JWT access token containing claims.
    """
    to_encode = data.copy()
    expire = int(time.time()) + (expires_delta_minutes * 60)
    to_encode.update({
        "exp": expire,
        "iat": int(time.time()),
        "iss": "https://api.groupdrive.in",
        "aud": "groupdrive-dealer-app",
    })
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    return encoded_jwt

def create_refresh_token(user_id: str) -> str:
    """
    Create a long-lived refresh token.
    """
    expire = int(time.time()) + (REFRESH_TOKEN_EXPIRE_DAYS * 86400)
    payload = {
        "sub": user_id,
        "token_type": "refresh",
        "exp": expire,
        "iat": int(time.time()),
        "iss": "https://api.groupdrive.in",
        "aud": "groupdrive-dealer-app",
    }
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)

def decode_token(token: str) -> Dict[str, Any]:
    """
    Decode and verify JWT signature and expiration.
    Raises jwt.ExpiredSignatureError or jwt.InvalidTokenError on failure.
    """
    payload = jwt.decode(
        token,
        JWT_SECRET_KEY,
        algorithms=[JWT_ALGORITHM],
        audience=["groupdrive-dealer-app", "groupdrive-customer-app"],
        issuer="https://api.groupdrive.in",
    )
    return payload

