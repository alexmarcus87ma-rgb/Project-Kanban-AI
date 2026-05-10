from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from models import Board, KanbanColumn, Card, Label, CardLabel
from schemas.card import CardCreate, CardUpdate, CardResponse
from schemas.label import LabelResponse
from auth import verify_token

router = APIRouter(tags=["cards"])

VALID_PRIORITIES = {"low", "medium", "high", "urgent"}


def _get_card_for_user(card_id: int, user_id: int, db: Session) -> Card:
    card = (
        db.query(Card)
        .join(KanbanColumn, Card.column_id == KanbanColumn.id)
        .join(Board, KanbanColumn.board_id == Board.id)
        .filter(Card.id == card_id, Board.user_id == user_id)
        .first()
    )
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    return card


def _card_to_response(card: Card) -> CardResponse:
    labels = [
        LabelResponse.model_validate(cl.label)
        for cl in card.card_labels
    ]
    return CardResponse(
        id=card.id,
        column_id=card.column_id,
        title=card.title,
        description=card.description,
        priority=card.priority,
        due_date=card.due_date,
        position=card.position,
        created_at=card.created_at,
        updated_at=card.updated_at,
        labels=labels,
    )


def _sync_card_labels(card: Card, label_ids: list[int], board_id: int, db: Session):
    """Replace card's labels with the given label_ids (must belong to same board)."""
    # Validate all labels belong to this board
    if label_ids:
        valid = db.query(Label.id).filter(Label.board_id == board_id, Label.id.in_(label_ids)).all()
        valid_ids = {row[0] for row in valid}
        invalid = set(label_ids) - valid_ids
        if invalid:
            raise HTTPException(status_code=400, detail=f"Invalid label IDs: {sorted(invalid)}")

    # Remove existing
    for cl in list(card.card_labels):
        db.delete(cl)
    db.flush()

    # Add new
    for lid in label_ids:
        db.add(CardLabel(card_id=card.id, label_id=lid))


@router.post("/api/boards/{board_id}/cards", response_model=CardResponse, status_code=201)
def create_card(
    board_id: int,
    body: CardCreate,
    user_id: int = Depends(verify_token),
    db: Session = Depends(get_db),
):
    board = db.query(Board).filter(Board.id == board_id, Board.user_id == user_id).first()
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")

    column = db.query(KanbanColumn).filter(
        KanbanColumn.id == body.column_id,
        KanbanColumn.board_id == board_id,
    ).first()
    if not column:
        raise HTTPException(status_code=404, detail="Column not found")

    if body.priority and body.priority not in VALID_PRIORITIES:
        raise HTTPException(status_code=400, detail=f"Priority must be one of: {', '.join(sorted(VALID_PRIORITIES))}")

    max_pos = db.query(func.max(Card.position)).filter(Card.column_id == body.column_id).scalar()
    position = (max_pos + 1) if max_pos is not None else 0

    card = Card(
        column_id=body.column_id,
        title=body.title,
        description=body.description,
        priority=body.priority,
        due_date=body.due_date,
        position=position,
    )
    db.add(card)
    db.flush()

    if body.label_ids:
        _sync_card_labels(card, body.label_ids, board_id, db)

    db.commit()
    db.refresh(card)
    return _card_to_response(card)


@router.patch("/api/cards/{card_id}", response_model=CardResponse)
def update_card(
    card_id: int,
    body: CardUpdate,
    user_id: int = Depends(verify_token),
    db: Session = Depends(get_db),
):
    card = _get_card_for_user(card_id, user_id, db)

    if body.title is not None:
        card.title = body.title
    if body.description is not None:
        card.description = body.description
    if body.priority is not None:
        if body.priority not in VALID_PRIORITIES:
            raise HTTPException(status_code=400, detail=f"Priority must be one of: {', '.join(sorted(VALID_PRIORITIES))}")
        card.priority = body.priority
    if body.due_date is not None:
        card.due_date = body.due_date
    if body.column_id is not None:
        col = (
            db.query(KanbanColumn)
            .join(Board, KanbanColumn.board_id == Board.id)
            .filter(KanbanColumn.id == body.column_id, Board.user_id == user_id)
            .first()
        )
        if not col:
            raise HTTPException(status_code=404, detail="Target column not found")
        card.column_id = body.column_id
    if body.position is not None:
        card.position = body.position

    if body.label_ids is not None:
        # Find the board this card belongs to
        column = db.query(KanbanColumn).filter(KanbanColumn.id == card.column_id).first()
        _sync_card_labels(card, body.label_ids, column.board_id, db)

    card.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(card)
    return _card_to_response(card)


@router.delete("/api/cards/{card_id}", status_code=204)
def delete_card(
    card_id: int,
    user_id: int = Depends(verify_token),
    db: Session = Depends(get_db),
):
    card = _get_card_for_user(card_id, user_id, db)
    db.delete(card)
    db.commit()
    return Response(status_code=204)
