from pydantic import BaseModel, Field
from typing import Union, Literal


class AITestRequest(BaseModel):
    prompt: str = "What is 2+2?"


class AITestResponse(BaseModel):
    result: str
    model: str


class AIChatRequest(BaseModel):
    message: str
    board_id: int


# Structured output actions that AI can request
class CreateCardAction(BaseModel):
    type: Literal["create_card"]
    column_id: int
    title: str
    description: str = ""


class MoveCardAction(BaseModel):
    type: Literal["move_card"]
    card_id: int
    column_id: int


class DeleteCardAction(BaseModel):
    type: Literal["delete_card"]
    card_id: int


class RenameColumnAction(BaseModel):
    type: Literal["rename_column"]
    column_id: int
    name: str


# Union of all possible action types
KanbanAction = Union[CreateCardAction, MoveCardAction, DeleteCardAction, RenameColumnAction]


class AIStructuredOutput(BaseModel):
    """The structured response format we request from AI"""
    response: str = Field(description="Text response to the user")
    actions: list[KanbanAction] = Field(default_factory=list, description="Optional Kanban board modifications")


class AIChatResponse(BaseModel):
    reply: str
    model: str
    actions_executed: int = 0  # Count of successfully executed actions
    board_updated: bool = False  # Whether board state changed
