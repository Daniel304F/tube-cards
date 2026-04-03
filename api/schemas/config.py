from sqlmodel import SQLModel


class ConfigRead(SQLModel):
    youtube_api_key: str
    llm_provider: str
    llm_model: str
    llm_api_key: str
    ollama_base_url: str
    notion_api_key: str
    remnote_api_key: str


class ConfigUpdate(SQLModel):
    youtube_api_key: str | None = None
    llm_provider: str | None = None
    llm_model: str | None = None
    llm_api_key: str | None = None
    ollama_base_url: str | None = None
    notion_api_key: str | None = None
    remnote_api_key: str | None = None
