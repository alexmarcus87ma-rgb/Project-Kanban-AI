from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Board, KanbanColumn
from schemas.column import ColumnUpdate, ColumnResponse
from auth import verify_token

router = APIRouter(tags=["columns"])


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
    column.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(column)
    return column
