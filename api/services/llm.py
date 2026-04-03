import logging

from fastapi import HTTPException
import litellm

from core.config import settings

logger = logging.getLogger(__name__)


async def complete(prompt: str, system: str | None = None) -> str:
    """Send a prompt to the configured LLM and return the text response."""
    messages: list[dict[str, str]] = []
    if system:
        messages.append({"role": "system", "content": system})
    messages.append({"role": "user", "content": prompt})

    try:
        response = await litellm.acompletion(
            model=settings.llm_model,
            messages=messages,
            api_key=settings.llm_api_key,
        )
        return response.choices[0].message.content
    except Exception as e:
        logger.error("LLM completion failed: %s", str(e))
        raise HTTPException(status_code=502, detail="LLM provider unavailable")
