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
# System prompt - intelligent PM agent
# ---------------------------------------------------------------------------

def _build_system_prompt(board) -> str:
    board_state_lines = []
    total_cards = 0
    for col in sorted(board.columns, key=lambda c: c.position):
        cards_info = []
        for card in sorted(col.cards, key=lambda c: c.position):
            card_desc = f'    - [id={card.id}] "{card.title}"'
            if card.description:
                card_desc += f" — {card.description[:80]}"
            if card.priority:
                card_desc += f" (priority: {card.priority})"
            if card.due_date:
                card_desc += f" (due: {card.due_date.strftime('%Y-%m-%d')})"
            cards_info.append(card_desc)
            total_cards += 1
        if cards_info:
            board_state_lines.append(f'  Column "{col.name}" (id={col.id}) — {len(cards_info)} cards:')
            board_state_lines.extend(cards_info)
        else:
            board_state_lines.append(f'  Column "{col.name}" (id={col.id}) — empty')
    board_state = "\n".join(board_state_lines)

    return f"""You are a friendly and helpful personal Project Management assistant. Your name is Kanban AI.

You are helping the user manage their Kanban board called "{board.name}".

## Your personality
- Be warm, polite, and conversational — like a helpful colleague
- When the user says hello or asks general questions, respond naturally and conversationally
- Proactively describe what you see on their board when relevant
- Offer suggestions about workflow and project organization when appropriate
- Always respond in the same language the user writes in

## Current board state
Board: "{board.name}" — {len(board.columns)} columns, {total_cards} cards total

{board_state}

## What you can do
You can help the user by:
1. **Talking about their project** — explain what cards they have, what's in progress, what's done, suggest next steps
2. **Answering questions** — about their board, workflow, project management best practices
3. **Taking actions on the board** — but ONLY when the user explicitly asks you to create, move, delete cards or rename columns

## CRITICAL RULES about actions
- **DO NOT** take any board actions unless the user EXPLICITLY asks you to create/move/delete a card or rename a column
- A greeting like "Hello" or "Hi" should NEVER trigger any action
- Questions like "What do I have?" or "Show me my board" should NEVER trigger any action
- Only act when the user says things like: "create a card called X", "move X to Done", "delete the card X", "rename column X to Y"
- When in doubt, ASK the user what they want instead of taking action

## Response format
You MUST respond with a JSON object in this exact format:
{{"response": "your conversational message here", "actions": []}}

The "actions" array must be EMPTY unless the user explicitly requested a board action.

When the user explicitly requests an action, use these action types:
- {{"type": "create_card", "column_name": "column", "title": "card title", "description": "optional description"}}
- {{"type": "move_card", "card_id": ID, "column_name": "destination column"}}
- {{"type": "delete_card", "card_id": ID}}
- {{"type": "rename_column", "column_id": ID, "name": "new name"}}

## Examples

User: "Hello!"
{{"response": "Hi there! 👋 Welcome to your board \\"{board.name}\\". You currently have {total_cards} cards across {len(board.columns)} columns. How can I help you today?", "actions": []}}

User: "What's on my board?"
{{"response": "Here's a summary of your board...(describe columns and cards)...", "actions": []}}

User: "Create a card called 'Fix login bug' in the Backlog column"
{{"response": "Done! I've created the card 'Fix login bug' in your Backlog column.", "actions": [{{"type": "create_card", "column_name": "Backlog", "title": "Fix login bug", "description": ""}}]}}

User: "What should I work on next?"
{{"response": "Looking at your board, I'd suggest...(give project advice based on board state)...", "actions": []}}

IMPORTANT: Output ONLY the JSON object. No markdown fences. No text before or after the JSON."""


def _find_column_by_name(board, name: str):
    name_lower = name.lower().strip()
    for col in board.columns:
        if col.name.lower() == name_lower:
            return col
    for col in board.columns:
        if name_lower in col.name.lower():
            return col
    return None


# ---------------------------------------------------------------------------
# Execute actions returned by AI
# ---------------------------------------------------------------------------

def _execute_ai_actions(actions: list[dict], board, user_id: int, db: Session) -> tuple[int, list[str]]:
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

    # Strategy 2: Find JSON objects with bracket matching
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

    # Fallback: treat entire text as conversational response with no actions
    return raw_text.strip(), []


def _try_parse_json(candidate: str) -> tuple[str, list[dict]] | None:
    try:
        data = json.loads(candidate)
        if isinstance(data, dict) and "response" in data:
            acts = data.get("actions", [])
            return data["response"], acts if isinstance(acts, list) else []
    except json.JSONDecodeError:
        pass

    # Common AI JSON mistakes - try to fix them
    fixed = candidate
    fixed = fixed.replace("\\_", "_")
    fixed = re.sub(r'"actions\s*\[', '"actions":[', fixed)
    fixed = re.sub(r'(\{|,)\s*(\w+)\s*:', r'\1"\2":', fixed)
    fixed = re.sub(r',\s*([}\]])', r'\1', fixed)
    fixed = re.sub(r"'(\w+)':", r'"\1":', fixed)

    try:
        data = json.loads(fixed)
        if isinstance(data, dict) and "response" in data:
            acts = data.get("actions", [])
            return data["response"], acts if isinstance(acts, list) else []
    except json.JSONDecodeError:
        pass

    return None


def _user_requested_action(message: str) -> bool:
    """Check if the user's message contains explicit action keywords.

    This is a server-side safety net to prevent the AI from executing
    board actions when the user is just chatting or asking questions.
    The AI model sometimes hallucinates actions on simple messages like
    "Hello" — this function blocks that.
    """
    msg = message.lower().strip()

    # Action verbs that indicate the user wants to modify the board
    action_keywords = [
        "create", "add", "make", "new",          # create actions
        "move", "transfer", "shift", "drag",      # move actions
        "delete", "remove", "drop", "trash",      # delete actions
        "rename", "change name", "call it",       # rename actions
        # Romanian equivalents
        "creeaz", "adaug", "fă", "fa ",           # create (ro)
        "mută", "muta", "transferă", "transfera", # move (ro)
        "șterge", "sterge", "elimină", "elimina", # delete (ro)
        "redenumește", "redenumeste", "schimbă", "schimba numele",  # rename (ro)
    ]

    return any(kw in msg for kw in action_keywords)


@router.delete("/chat/{board_id}/history", status_code=204)
async def clear_chat_history(
    board_id: int,
    user_id: int = Depends(verify_token),
    db: Session = Depends(get_db),
):
    """Clear conversation history for a specific board."""
    board = db.query(Board).filter(Board.id == board_id, Board.user_id == user_id).first()
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")

    db.query(ConversationHistory).filter(
        ConversationHistory.board_id == board_id,
        ConversationHistory.user_id == user_id,
    ).delete()
    db.commit()
    from fastapi.responses import Response
    return Response(status_code=204)


@router.post("/chat", response_model=AIChatResponse)
async def chat(
    body: AIChatRequest,
    user_id: int = Depends(verify_token),
    db: Session = Depends(get_db),
):
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

    # Build messages for AI
    messages = [
        {"role": "system", "content": _build_system_prompt(board)},
        *[{"role": h.role, "content": h.message} for h in history],
        {"role": "user", "content": body.message},
    ]

    try:
        raw_reply = await call_openrouter(messages)
    except HTTPStatusError as e:
        if e.response.status_code == 429:
            raise HTTPException(status_code=429, detail="AI service rate limited.")
        raise HTTPException(status_code=502, detail=f"AI service error: {e.response.status_code}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI error: {str(e)}")

    # Parse AI response
    reply_text, actions = _parse_ai_response(raw_reply)

    # SERVER-SIDE GUARD: Only allow actions if user message contains
    # explicit action keywords. This prevents the AI from hallucinating
    # actions on greetings or simple questions.
    if actions and not _user_requested_action(body.message):
        actions = []

    # Execute actions ONLY if AI returned any
    actions_executed = 0
    if actions:
        db.expire_all()
        board = (
            db.query(Board)
            .options(joinedload(Board.columns).joinedload(KanbanColumn.cards))
            .filter(Board.id == body.board_id, Board.user_id == user_id)
            .first()
        )
        actions_executed, exec_notes = _execute_ai_actions(actions, board, user_id, db)

    if not reply_text:
        reply_text = raw_reply.strip() if raw_reply.strip() else "I'm here to help! What would you like to do with your board?"

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
