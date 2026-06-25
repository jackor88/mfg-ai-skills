from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    API_V1_STR: str = "/api/v1"
    DEBUG: bool = True

    PROJECT_NAME: str = "AI Pricing Engine"

    MYSQL_HOST: str = "localhost"
    MYSQL_PORT: int = 3306
    MYSQL_USER: str = "factory"
    MYSQL_PASSWORD: str = "factory123456"
    MYSQL_DATABASE: str = "factory_ai_platform"

    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_PASSWORD: str = "factory123456"
    REDIS_DB: int = 0

    RABBITMQ_HOST: str = "localhost"
    RABBITMQ_PORT: int = 5672
    RABBITMQ_USER: str = "factory"
    RABBITMQ_PASSWORD: str = "factory123456"
    RABBITMQ_VHOST: str = "/factory"

    BUSINESS_PLATFORM_URL: str = "http://localhost:3000"
    API_KEY: str = "your-api-key"

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
