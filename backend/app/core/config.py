from pydantic import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "SmartHealthcare"
    API_PREFIX: str = "/api"

    class Config:
        env_file = ".env"

settings = Settings()
