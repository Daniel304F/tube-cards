from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    youtube_api_key: str = ""
    llm_provider: str = "openai"
    llm_api_key: str = ""
    llm_model: str = "gpt-4o-mini"
    ollama_base_url: str = "http://localhost:11434"
    notion_api_key: str = ""
    notion_database_id: str = ""
    remnote_api_key: str = ""
    database_url: str = "sqlite:///./data/app.db"

    model_config = {"env_file": ".env"}


settings = Settings()
