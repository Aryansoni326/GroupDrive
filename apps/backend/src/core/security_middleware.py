import time
import threading
from typing import Dict, List, Tuple
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response, JSONResponse

class InMemoryRateLimiter:
    """
    Thread-safe sliding window rate limiter for protecting endpoints
    against brute-force credential stuffing and denial of service.
    """
    def __init__(self):
        self._lock = threading.Lock()
        # Maps client_key -> List of timestamps
        self._records: Dict[str, List[float]] = {}

    def is_allowed(self, key: str, max_requests: int, window_seconds: int) -> Tuple[bool, int]:
        """
        Returns (is_allowed, remaining_seconds_to_wait).
        """
        now = time.time()
        cutoff = now - window_seconds
        with self._lock:
            timestamps = self._records.get(key, [])
            # Prune old timestamps
            valid_timestamps = [t for t in timestamps if t > cutoff]

            if len(valid_timestamps) >= max_requests:
                earliest = valid_timestamps[0]
                retry_after = max(1, int(earliest + window_seconds - now))
                self._records[key] = valid_timestamps
                return False, retry_after

            valid_timestamps.append(now)
            self._records[key] = valid_timestamps
            return True, 0

    def reset(self):
        """Clears all tracking records (useful in tests)."""
        with self._lock:
            self._records.clear()


# Global limiter instances
login_rate_limiter = InMemoryRateLimiter()
general_rate_limiter = InMemoryRateLimiter()


class SecurityHeadersAndRateLimitMiddleware(BaseHTTPMiddleware):
    """
    Enterprise Application Security Middleware:
    1. Injects defense-in-depth HTTP security headers (OWASP recommended).
    2. Enforces brute-force rate limits on sensitive authentication paths.
    3. Prevents API abuse and DoS across general endpoints.
    """
    async def dispatch(self, request: Request, call_next):
        client_ip = request.client.host if request.client else "127.0.0.1"
        path = request.url.path

        # 1. Stricter Rate Limiting on Authentication Endpoints (Brute-force protection)
        if path.endswith("/auth/login-password"):
            allowed, retry_after = login_rate_limiter.is_allowed(
                key=f"auth:{client_ip}",
                max_requests=20, # 20 attempts per minute
                window_seconds=60,
            )
            if not allowed:
                return JSONResponse(
                    status_code=429,
                    content={
                        "success": False,
                        "detail": "Rate limit exceeded. Too many login attempts. Please retry after 60 seconds.",
                    },
                    headers={"Retry-After": str(retry_after)},
                )

        # 2. General API Rate Limiting (DoS protection)
        elif path.startswith("/api/v1/"):
            allowed, retry_after = general_rate_limiter.is_allowed(
                key=f"api:{client_ip}",
                max_requests=300, # 300 requests per minute
                window_seconds=60,
            )
            if not allowed:
                return JSONResponse(
                    status_code=429,
                    content={
                        "success": False,
                        "detail": "Rate limit exceeded. Too many API requests. Please slow down.",
                    },
                    headers={"Retry-After": str(retry_after)},
                )

        # Execute downstream handlers
        response = await call_next(request)

        # 3. Inject OWASP Security Headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"

        # Prevent browser caching of sensitive business API responses
        if path.startswith("/api/v1/"):
            response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate"
            response.headers["Pragma"] = "no-cache"

        return response

