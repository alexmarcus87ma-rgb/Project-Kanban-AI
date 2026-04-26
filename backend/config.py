from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    debug: bool = False
    database_url: str = "sqlite:///./database.db"
    openrouter_api_key: str = ""
    openrouter_model: str = "google/gemma-4-31b-it:free"
    openrouter_base_url: str = "https://openrouter.ai/api/v1"

    class Config:
        env_file = "../.env"
        env_file_encoding = "utf-8"


settings = Settings()
