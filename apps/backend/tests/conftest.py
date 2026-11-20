import pytest
from src.core.security_middleware import login_rate_limiter, general_rate_limiter

@pytest.fixture(autouse=True)
def reset_rate_limiters():
    login_rate_limiter.reset()
    general_rate_limiter.reset()
    yield
    login_rate_limiter.reset()
    general_rate_limiter.reset()

