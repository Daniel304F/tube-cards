from fastapi import APIRouter

from schemas.config import ConfigRead, ConfigUpdate
from services import config as config_service

router = APIRouter(prefix="/config", tags=["config"])


@router.get("/", response_model=ConfigRead)
async def get_config() -> ConfigRead:
    return config_service.get_config()


@router.put("/", response_model=ConfigRead)
async def update_config(data: ConfigUpdate) -> ConfigRead:
    return config_service.update_config(data)
