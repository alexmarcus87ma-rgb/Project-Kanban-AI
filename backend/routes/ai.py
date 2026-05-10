import json
import re
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from httpx import HTTPStatusError
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from schemas.ai import (
    AITestRequest,
    AITestResponse,
    AIChatRequest,
    AIChatResponse,
)
from services.ai_service import call_openrouter
from config import settings
from auth import verify_token
from database import get_db
from models import Board, KanbanColumn, Card, ConversationHistory

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
        if e.response.status_code == 429:
            raise HTTPException(status_code=429, detail="AI service rate limited.")
        raise HTTPException(status_code=502, detail=f"AI service error: {e.response.status_code}")


# ---------------------------------------------------------------------------
# Build system prompt with board state + JSON action schema
# ---------------------------------------------------------------------------

def _build_system_prompt(board) -> str:
    """Build a system prompt that describes the board and the JSON action format."""
    # Build board state description
    board_state_lines = []
    for col in sorted(board.columns, key=lambda c: c.position):
        cards_info = []
        for card in sorted(col.cards, key=lambda c: c.position):
            cards_info.append(f"id={card.id} \"{card.title}\"")
        cards_str = ", ".join(cards_info) if cards_info else "empty"
        board_state_lines.append(
            f"  - Column \"{col.name}\" (id={col.id}): [{cards_str}]"
        )
    board_state = "\n".join(board_state_lines)

    return f"""You are a Kanban board AI assistant. You MUST respond ONLY with a JSON object. No other text.

BOARD "{board.name}":
{board_state}

OUTPUT FORMAT - You must ALWAYS return exactly this JSON structure:
{{"response":"your message","actions":[]}}

ACTION TYPES for the "actions" array:
- {{"type":"create_card","column_name":"col","title":"name","description":""}}
- {{"type":"move_card","card_id":ID,"column_name":"destination col"}}
- {{"type":"delete_card","card_id":ID}}
- {{"type":"rename_column","column_id":ID,"name":"new name"}}

EXAMPLE - user says "move Build dashboard to Done":
{{"response":"Done! I moved Build dashboard to the Done column.","actions":[{{"type":"move_card","card_id":9,"column_name":"Done"}}]}}

EXAMPLE - user says "what cards do I have?":
{{"response":"You have 13 cards across 5 columns...","actions":[]}}

EXAMPLE - user says "create a card called API docs in Backlog":
{{"response":"Created API docs in Backlog!","actions":[{{"type":"create_card","column_name":"Backlog","title":"API docs","description":""}}]}}

RULES:
- Use card "id" values from the board state above for move/delete.
- Use column names (partial match OK) for column_name.
- Respond in the same language as the user.
- If a card/column doesn't exist, say so in "response" with empty actions.
- CRITICAL: Output ONLY the JSON object. No markdown. No backticks. No explanation outside the JSON."""


def _find_column_by_name(board, name: str):
    """Find a column by partial name match (case-insensitive)."""
    name_lower = name.lower().strip()
    # Try exact match first
    for col in board.columns:
        if col.name.lower() == name_lower:
            return col
    # Then partial match
    for col in board.columns:
        if name_lower in col.name.lower():
            return col
    return None


# ---------------------------------------------------------------------------
# Execute actions returned by AI
# ---------------------------------------------------------------------------

def _execute_ai_actions(actions: list[dict], board, user_id: int, db: Session) -> tuple[int, list[str]]:
    """
    Execute the actions that the AI decided on.
    Returns (actions_count, list of execution notes).
    """
    executed = 0
    notes = []

    for action in actions:
        action_type = action.get("type", "")

        try:
            if action_type == "create_card":
                col_name = action.get("column_name", "")
                title = action.get("title", "")
                description = action.get("description", "")

                if not title:
                    notes.append("Skipped create: no title provided")
                    continue

                target_col = _find_column_by_name(board, col_name)
                if not target_col:
                    notes.append(f"Skipped create: column '{col_name}' not found")
                    continue

                max_pos = (
                    db.query(func.max(Card.position))
                    .filter(Card.column_id == target_col.id)
                    .scalar()
                )
                card = Card(
                    column_id=target_col.id,
                    title=title,
                    description=description or "",
                    position=(max_pos + 1) if max_pos is not None else 0,
                )
                db.add(card)
                db.flush()
                executed += 1

            elif action_type == "move_card":
                card_id = action.get("card_id")
                col_name = action.get("column_name", "")

                if not card_id:
                    notes.append("Skipped move: no card_id")
                    continue

                dest_col = _find_column_by_name(board, col_name)
                if not dest_col:
                    notes.append(f"Skipped move: column '{col_name}' not found")
                    continue

                card = (
                    db.query(Card)
                    .join(KanbanColumn)
                    .join(Board)
                    .filter(Card.id == int(card_id), Board.user_id == user_id)
                    .first()
                )
                if not card:
                    notes.append(f"Skipped move: card id={card_id} not found")
                    continue

                max_pos = (
                    db.query(func.max(Card.position))
                    .filter(Card.column_id == dest_col.id)
                    .scalar()
                )
                card.column_id = dest_col.id
                card.position = (max_pos + 1) if max_pos is not None else 0
                card.updated_at = datetime.now(timezone.utc)
                executed += 1

            elif action_type == "delete_card":
                card_id = action.get("card_id")
                if not card_id:
                    notes.append("Skipped delete: no card_id")
                    continue

                card = (
                    db.query(Card)
                    .join(KanbanColumn)
                    .join(Board)
                    .filter(Card.id == int(card_id), Board.user_id == user_id)
                    .first()
                )
                if not card:
                    notes.append(f"Skipped delete: card id={card_id} not found")
                    continue

                db.delete(card)
                executed += 1

            elif action_type == "rename_column":
                col_id = action.get("column_id")
                new_name = action.get("name", "")
                if not col_id or not new_name:
                    notes.append("Skipped rename: missing column_id or name")
                    continue

                col = None
                for c in board.columns:
                    if c.id == int(col_id):
                        col = c
                        break

                if not col:
                    notes.append(f"Skipped rename: column id={col_id} not found")
                    continue

                col.name = new_name
                executed += 1

        except Exception as e:
            notes.append(f"Error executing {action_type}: {str(e)}")

    if executed > 0:
        db.commit()

    return executed, notes


def _parse_ai_response(raw_text: str) -> tuple[str, list[dict]]:
    """
    Parse the AI's JSON response into (text_reply, actions_list).
    Handles markdown fences, multiple JSON objects, and messy output.
    """
    text = raw_text.strip()

    # Strip markdown code fences if present
    text = re.sub(r"```(?:json)?\s*\n?", "", text)
    text = re.sub(r"\n?```", "", text)
    text = text.strip()

    # Strategy 1: Try to parse the whole thing as JSON
    try:
        data = json.loads(text)
        if isinstance(data, dict) and "response" in data:
            actions = data.get("actions", [])
            return data["response"], actions if isinstance(actions, list) else []
    except json.JSONDecodeError:
        pass

    # Strategy 2: Find ALL JSON objects with "response" key, take the first valid one with actions
    # Use a bracket-matching approach to extract JSON objects
    best_response = ""
    best_actions: list[dict] = []

    i = 0
    while i < len(text):
        if text[i] == '{':
            depth = 0
            j = i
            while j < len(text):
                if text[j] == '{':
                    depth += 1
                elif text[j] == '}':
                    depth -= 1
                    if depth == 0:
                        candidate = text[i:j+1]
                        parsed = _try_parse_json(candidate)
                        if parsed:
                            resp, acts = parsed
                            if len(acts) > len(best_actions):
                                best_response = resp
                                best_actions = acts
                            elif not best_response:
                                best_response = resp
                        break
                j += 1
        i += 1

    if best_response:
        return best_response, best_actions

    # Fallback: treat entire text as response with no actions
    return raw_text.strip(), []


def _try_parse_json(candidate: str) -> tuple[str, list[dict]] | None:
    """Try to parse a JSON candidate, with auto-repair for common AI mistakes."""
    # Try as-is first
    try:
        data = json.loads(candidate)
        if isinstance(data, dict) and "response" in data:
            acts = data.get("actions", [])
            return data["response"], acts if isinstance(acts, list) else []
    except json.JSONDecodeError:
        pass

    # Common AI JSON mistakes - try to fix them
    fixed = candidate
    # Fix escaped underscores (markdown leak): move\_card -> move_card
    fixed = fixed.replace("\\_", "_")
    # Fix missing colon after "actions" -> "actions":
    fixed = re.sub(r'"actions\s*\[', '"actions":[', fixed)
    # Fix missing quotes around keys
    fixed = re.sub(r'(\{|,)\s*(\w+)\s*:', r'\1"\2":', fixed)
    # Fix trailing commas before } or ]
    fixed = re.sub(r',\s*([}\]])', r'\1', fixed)
    # Fix single quotes used instead of double quotes
    fixed = re.sub(r"'(\w+)':", r'"\1":', fixed)

    try:
        data = json.loads(fixed)
        if isinstance(data, dict) and "response" in data:
            acts = data.get("actions", [])
            return data["response"], acts if isinstance(acts, list) else []
    except json.JSONDecodeError:
        pass

    return None


@router.post("/chat", response_model=AIChatResponse)
async def chat(
    body: AIChatRequest,
    user_id: int = Depends(verify_token),
    db: Session = Depends(get_db),
):
    """
    AI-powered chat endpoint:
    1. Sends the user message + board state to AI (OpenRouter)
    2. AI decides what to respond AND what board actions to take
    3. Backend executes the AI-decided actions
    4. Returns AI response + update status to frontend
    """
    if not settings.openrouter_api_key or settings.openrouter_api_key.startswith("${"):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI service not configured",
        )

    # Fetch board with columns and cards
    board = (
        db.query(Board)
        .options(joinedload(Board.columns).joinedload(KanbanColumn.cards))
        .filter(Board.id == body.board_id, Board.user_id == user_id)
        .first()
    )
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")

    # Build conversation history
    history = (
        db.query(ConversationHistory)
        .filter(
            ConversationHistory.board_id == body.board_id,
            ConversationHistory.user_id == user_id,
        )
        .order_by(ConversationHistory.created_at)
        .all()
    )

    # Build messages for AI - system prompt includes board state + JSON schema
    messages = [
        {"role": "system", "content": _build_system_prompt(board)},
        *[{"role": h.role, "content": h.message} for h in history],
        {"role": "user", "content": body.message},
    ]

    # Send everything to AI
    try:
        raw_reply = await call_openrouter(messages)
    except HTTPStatusError as e:
        if e.response.status_code == 429:
            raise HTTPException(status_code=429, detail="AI service rate limited.")
        raise HTTPException(status_code=502, detail=f"AI service error: {e.response.status_code}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI error: {str(e)}")

    # Parse AI structured response
    reply_text, actions = _parse_ai_response(raw_reply)

    # Execute any actions the AI decided on
    actions_executed = 0
    if actions:
        # Re-fetch board to get fresh state before executing
        db.expire_all()
        board = (
            db.query(Board)
            .options(joinedload(Board.columns).joinedload(KanbanColumn.cards))
            .filter(Board.id == body.board_id, Board.user_id == user_id)
            .first()
        )
        actions_executed, exec_notes = _execute_ai_actions(actions, board, user_id, db)

    # Fallback if AI returned empty response text
    if not reply_text:
        reply_text = raw_reply.strip() if raw_reply.strip() else "Done."

    # Save conversation history
    db.add(ConversationHistory(
        user_id=user_id, board_id=body.board_id,
        role="user", message=body.message,
    ))
    db.add(ConversationHistory(
        user_id=user_id, board_id=body.board_id,
        role="assistant", message=reply_text,
    ))
    db.commit()

    return AIChatResponse(
        reply=reply_text,
        model=settings.openrouter_model,
        actions_executed=actions_executed,
        board_updated=actions_executed > 0,
    )
