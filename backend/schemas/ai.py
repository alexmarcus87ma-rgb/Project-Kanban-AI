from pydantic import BaseModel


class AITestRequest(BaseModel):
    prompt: str = "What is 2+2?"


class AITestResponse(BaseModel):
    result: str
    model: str


class AIChatRequest(BaseModel):
    message: str
    board_id: int


class AIChatResponse(BaseModel):
    reply: str
    model: str
