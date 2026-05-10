from pathlib import Path
from pydantic_settings import BaseSettings

_config_dir = Path(__file__).resolve().parent
_env_path = _config_dir.parent / ".env"
_db_path = _config_dir / "data" / "database.db"
_db_path.parent.mkdir(parents=True, exist_ok=True)


class Settings(BaseSettings):
    debug: bool = False
    database_url: str = f"sqlite:///{_db_path}"
    openrouter_api_key: str = ""
    openrouter_model: str = "openrouter/auto"
    openrouter_base_url: str = "https://openrouter.ai/api/v1"

    class Config:
        env_file = str(_env_path)
        env_file_encoding = "utf-8"


settings = Settings()
