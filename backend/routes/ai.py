from fastapi import APIRouter, Depends, HTTPException, status
from httpx import HTTPStatusError
from sqlalchemy.orm import Session, joinedload
from schemas.ai import AITestRequest, AITestResponse, AIChatRequest, AIChatResponse
from services.ai_service import call_openrouter
from config import settings
from auth import verify_token
from database import get_db
from models import Board, KanbanColumn, ConversationHistory

router = APIRouter(prefix="/api/ai", tags=["ai"])


@router.post("/test", response_model=AITestResponse)
async def test_ai(
    body: AITestRequest,
    user_id: int = Depends(verify_token),
):
    """Test the AI service with a simple prompt."""
    if not settings.openrouter_api_key or settings.openrouter_api_key.startswith("${"):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI service not configured",
        )

    try:
        result = await call_openrouter([{"role": "user", "content": body.prompt}])
        return AITestResponse(result=result, model=settings.openrouter_model)
    except HTTPStatusError as e:
        if e.response.status_code == 401:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="AI service not configured or invalid API key",
            )
        elif e.response.status_code == 429:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="AI service rate limited. Please try again later.",
            )
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"AI service error: {e.response.status_code}",
        )


def _build_system_prompt(board) -> str:
    """Build a system prompt that describes the Kanban board state."""
    lines = [
        "You are a helpful project management assistant.",
        f'The user is working on a Kanban board called "{board.name}".',
        "",
        "Current board state:",
    ]
    for col in sorted(board.columns, key=lambda c: c.position):
        card_titles = [c.title for c in sorted(col.cards, key=lambda c: c.position)]
        count = len(card_titles)
        card_str = ", ".join(card_titles) if card_titles else "empty"
        lines.append(f"  - {col.name} ({count} card{'s' if count != 1 else ''}): {card_str}")
    lines += ["", "Help the user with task planning, prioritization, and productivity."]
    return "\n".join(lines)


@router.post("/chat", response_model=AIChatResponse)
async def chat(
    body: AIChatRequest,
    user_id: int = Depends(verify_token),
    db: Session = Depends(get_db),
):
    """Send a message to the AI with full Kanban context and conversation history."""
    # Guard: API key
    if not settings.openrouter_api_key or settings.openrouter_api_key.startswith("${"):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI service not configured",
        )

    # Fetch board with columns and cards (ownership check)
    board = (
        db.query(Board)
        .options(joinedload(Board.columns).joinedload(KanbanColumn.cards))
        .filter(Board.id == body.board_id, Board.user_id == user_id)
        .first()
    )
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")

    # Load conversation history for this board
    history = (
        db.query(ConversationHistory)
        .filter(
            ConversationHistory.board_id == body.board_id,
            ConversationHistory.user_id == user_id,
        )
        .order_by(ConversationHistory.created_at)
        .all()
    )

    # Build messages list: system prompt + history + new message
    messages = [
        {"role": "system", "content": _build_system_prompt(board)},
        *[{"role": h.role, "content": h.message} for h in history],
        {"role": "user", "content": body.message},
    ]

    # Call OpenRouter
    try:
        reply = await call_openrouter(messages)
    except HTTPStatusError as e:
        if e.response.status_code == 401:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="AI service not configured or invalid API key",
            )
        elif e.response.status_code == 429:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="AI service rate limited. Please try again later.",
            )
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"AI service error: {e.response.status_code}",
        )

    # Persist both turns to conversation history
    db.add(ConversationHistory(
        user_id=user_id,
        board_id=body.board_id,
        role="user",
        message=body.message,
    ))
    db.add(ConversationHistory(
        user_id=user_id,
        board_id=body.board_id,
        role="assistant",
        message=reply,
    ))
    db.commit()

    return AIChatResponse(reply=reply, model=settings.openrouter_model)
