from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from models import Board, KanbanColumn, Card
from schemas.card import CardCreate, CardUpdate, CardResponse
from auth import verify_token

router = APIRouter(tags=["cards"])


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

    max_pos = db.query(func.max(Card.position)).filter(Card.column_id == body.column_id).scalar()
    position = (max_pos + 1) if max_pos is not None else 0

    card = Card(
        column_id=body.column_id,
        title=body.title,
        description=body.description,
        position=position,
    )
    db.add(card)
    db.commit()
    db.refresh(card)
    return card


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

    card.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(card)
    return card


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
