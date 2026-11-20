from typing import List
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "GroupDrive Core API"
    VERSION: str = "1.0.0"
    API_V1_PREFIX: str = "/api/v1"
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "https://groupdrive.in",
        "https://dealer.groupdrive.in",
        "https://admin.groupdrive.in",
    ]

    class Config:
        case_sensitive = True

settings = Settings()

