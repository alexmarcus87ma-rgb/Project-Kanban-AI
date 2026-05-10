from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from models import Board, KanbanColumn
from schemas.column import ColumnCreate, ColumnUpdate, ColumnResponse
from auth import verify_token

router = APIRouter(tags=["columns"])


@router.post("/api/boards/{board_id}/columns", response_model=ColumnResponse, status_code=201)
def create_column(
    board_id: int,
    body: ColumnCreate,
    user_id: int = Depends(verify_token),
    db: Session = Depends(get_db),
):
    board = db.query(Board).filter(Board.id == board_id, Board.user_id == user_id).first()
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")

    max_pos = (
        db.query(func.max(KanbanColumn.position))
        .filter(KanbanColumn.board_id == board_id)
        .scalar()
    )
    column = KanbanColumn(
        board_id=board_id,
        name=body.name,
        position=(max_pos + 1) if max_pos is not None else 0,
    )
    db.add(column)
    db.commit()
    db.refresh(column)
    return column


@router.patch("/api/columns/{column_id}", response_model=ColumnResponse)
def update_column(
    column_id: int,
    body: ColumnUpdate,
    user_id: int = Depends(verify_token),
    db: Session = Depends(get_db),
):
    column = (
        db.query(KanbanColumn)
        .join(Board, KanbanColumn.board_id == Board.id)
        .filter(KanbanColumn.id == column_id, Board.user_id == user_id)
        .first()
    )
    if not column:
        raise HTTPException(status_code=404, detail="Column not found")

    column.name = body.name
    column.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(column)
    return column


@router.delete("/api/columns/{column_id}", status_code=204)
def delete_column(
    column_id: int,
    user_id: int = Depends(verify_token),
    db: Session = Depends(get_db),
):
    column = (
        db.query(KanbanColumn)
        .join(Board, KanbanColumn.board_id == Board.id)
        .filter(KanbanColumn.id == column_id, Board.user_id == user_id)
        .first()
    )
    if not column:
        raise HTTPException(status_code=404, detail="Column not found")

    db.delete(column)
    db.commit()
    return Response(status_code=204)
