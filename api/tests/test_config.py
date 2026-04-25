"""Tests for /config router + service."""
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from services import config as config_service
from core.config import settings
from schemas.config import ConfigUpdate


@pytest.fixture
def tmp_env(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> Path:
    env_path = tmp_path / ".env"
    monkeypatch.setattr(config_service, "ENV_PATH", env_path)
    return env_path


class TestMaskHelper:
    def test_long_value_shows_last_four(self) -> None:
        assert config_service._mask("abcdef1234") == "••••1234"

    def test_short_value_fully_masked(self) -> None:
        assert config_service._mask("abc") == "••••"

    def test_empty_value_returns_empty(self) -> None:
        assert config_service._mask("") == ""


class TestGetConfig:
    def test_masks_sensitive_keys(self, monkeypatch: pytest.MonkeyPatch) -> None:
        monkeypatch.setattr(settings, "llm_api_key", "supersecret9999")
        monkeypatch.setattr(settings, "notion_api_key", "")

        result = config_service.get_config()

        assert result.llm_api_key == "••••9999"
        assert result.notion_api_key == ""

    def test_does_not_mask_non_sensitive_keys(self, monkeypatch: pytest.MonkeyPatch) -> None:
        monkeypatch.setattr(settings, "llm_provider", "ollama")
        monkeypatch.setattr(settings, "llm_model", "llama3.2")

        result = config_service.get_config()

        assert result.llm_provider == "ollama"
        assert result.llm_model == "llama3.2"


class TestUpdateConfig:
    def test_writes_new_keys_to_env_file(self, tmp_env: Path) -> None:
        config_service.update_config(ConfigUpdate(llm_provider="anthropic"))

        content = tmp_env.read_text(encoding="utf-8")
        assert "LLM_PROVIDER=anthropic" in content

    def test_updates_settings_in_memory(self, tmp_env: Path) -> None:
        config_service.update_config(ConfigUpdate(llm_model="gpt-5"))

        assert settings.llm_model == "gpt-5"

    def test_preserves_unrelated_env_lines(self, tmp_env: Path) -> None:
        tmp_env.write_text("LLM_PROVIDER=openai\nUNRELATED=keepme\n", encoding="utf-8")

        config_service.update_config(ConfigUpdate(llm_provider="ollama"))

        content = tmp_env.read_text(encoding="utf-8")
        assert "UNRELATED=keepme" in content
        assert "LLM_PROVIDER=ollama" in content

    def test_excludes_unset_fields(self, tmp_env: Path) -> None:
        # Only llm_provider given — others must NOT appear in the file
        config_service.update_config(ConfigUpdate(llm_provider="ollama"))

        content = tmp_env.read_text(encoding="utf-8")
        assert "NOTION_API_KEY" not in content


class TestConfigRouter:
    def test_get_endpoint_returns_200(self, client: TestClient) -> None:
        response = client.get("/config/")
        assert response.status_code == 200
        assert "llm_provider" in response.json()

    def test_put_endpoint_updates_value(
        self, client: TestClient, tmp_env: Path
    ) -> None:
        response = client.put("/config/", json={"llm_model": "gpt-test"})

        assert response.status_code == 200
        assert response.json()["llm_model"] == "gpt-test"
