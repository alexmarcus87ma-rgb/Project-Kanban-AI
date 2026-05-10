from datetime import datetime
from pydantic import BaseModel
from .label import LabelResponse


class CardCreate(BaseModel):
    column_id: int
    title: str
    description: str | None = None
    priority: str | None = None
    due_date: datetime | None = None
    label_ids: list[int] = []


class CardUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    column_id: int | None = None
    position: int | None = None
    priority: str | None = None
    due_date: datetime | None = None
    label_ids: list[int] | None = None


class CardResponse(BaseModel):
    id: int
    column_id: int
    title: str
    description: str | None
    priority: str | None = None
    due_date: datetime | None = None
    position: int
    created_at: datetime
    updated_at: datetime
    labels: list[LabelResponse] = []

    model_config = {"from_attributes": True}
