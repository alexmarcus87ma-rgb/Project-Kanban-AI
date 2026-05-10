from datetime import datetime
from pydantic import BaseModel, Field
from .column import ColumnResponse
from .label import LabelResponse


class BoardCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)


class BoardUpdate(BaseModel):
    name: str = Field(min_length=1, max_length=100)


class BoardResponse(BaseModel):
    id: int
    user_id: int
    name: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class BoardDetailResponse(BaseModel):
    id: int
    user_id: int
    name: str
    created_at: datetime
    updated_at: datetime
    columns: list[ColumnResponse] = []
    labels: list[LabelResponse] = []

    model_config = {"from_attributes": True}
