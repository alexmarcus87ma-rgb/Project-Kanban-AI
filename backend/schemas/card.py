from datetime import datetime
from pydantic import BaseModel


class CardCreate(BaseModel):
    column_id: int
    title: str
    description: str | None = None


class CardUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    column_id: int | None = None
    position: int | None = None


class CardResponse(BaseModel):
    id: int
    column_id: int
    title: str
    description: str | None
    position: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
