from datetime import datetime
from pydantic import BaseModel
from .column import ColumnResponse


class BoardResponse(BaseModel):
    id: int
    user_id: int
    name: str
    created_at: datetime
    updated_at: datetime


class BoardDetailResponse(BaseModel):
    id: int
    user_id: int
    name: str
    created_at: datetime
    updated_at: datetime
    columns: list[ColumnResponse] = []

    model_config = {"from_attributes": True}
