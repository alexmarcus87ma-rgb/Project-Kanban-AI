from datetime import datetime
from pydantic import BaseModel
from .card import CardResponse


class ColumnCreate(BaseModel):
    name: str


class ColumnUpdate(BaseModel):
    name: str


class ColumnResponse(BaseModel):
    id: int
    board_id: int
    name: str
    position: int
    created_at: datetime
    updated_at: datetime
    cards: list[CardResponse] = []

    model_config = {"from_attributes": True}
