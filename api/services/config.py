import logging
from pathlib import Path

from schemas.config import ConfigRead, ConfigUpdate
from core.config import settings

logger = logging.getLogger(__name__)

ENV_PATH = Path(__file__).resolve().parent.parent / ".env"

ENV_KEY_MAP: dict[str, str] = {
    "youtube_api_key": "YOUTUBE_API_KEY",
    "llm_provider": "LLM_PROVIDER",
    "llm_model": "LLM_MODEL",
    "llm_api_key": "LLM_API_KEY",
    "ollama_base_url": "OLLAMA_BASE_URL",
    "notion_api_key": "NOTION_API_KEY",
    "remnote_api_key": "REMNOTE_API_KEY",
}

SENSITIVE_KEYS = {"youtube_api_key", "llm_api_key", "notion_api_key", "remnote_api_key"}


def _mask(value: str) -> str:
    """Mask a secret value, showing only the last 4 characters."""
    if len(value) <= 4:
        return "••••" if value else ""
    return "••••" + value[-4:]


def get_config() -> ConfigRead:
    """Read current config values, masking sensitive keys."""
    data: dict[str, str] = {}
    for field in ConfigRead.model_fields:
        raw_value: str = getattr(settings, field)
        if field in SENSITIVE_KEYS and raw_value:
            data[field] = _mask(raw_value)
        else:
            data[field] = raw_value
    return ConfigRead(**data)


def _parse_env_file() -> dict[str, str]:
    """Parse the .env file into a dict preserving order."""
    env_vars: dict[str, str] = {}
    if not ENV_PATH.exists():
        return env_vars
    for line in ENV_PATH.read_text(encoding="utf-8").splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("#"):
            continue
        if "=" in stripped:
            key, _, value = stripped.partition("=")
            env_vars[key.strip()] = value.strip()
    return env_vars


def _write_env_file(env_vars: dict[str, str]) -> None:
    """Write env vars back to the .env file."""
    lines = [f"{key}={value}" for key, value in env_vars.items()]
    ENV_PATH.write_text("\n".join(lines) + "\n", encoding="utf-8")


def update_config(data: ConfigUpdate) -> ConfigRead:
    """Update config values in the .env file and reload settings."""
    env_vars = _parse_env_file()
    updates = data.model_dump(exclude_unset=True)

    for field, value in updates.items():
        env_key = ENV_KEY_MAP[field]
        env_vars[env_key] = value
        setattr(settings, field, value)

    _write_env_file(env_vars)
    logger.info("Updated config keys: %s", list(updates.keys()))

    return get_config()
