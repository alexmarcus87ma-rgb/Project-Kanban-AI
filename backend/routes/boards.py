from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from database import get_db
from models import Board, KanbanColumn
from schemas.board import BoardResponse, BoardDetailResponse
from auth import verify_token

router = APIRouter(prefix="/api/boards", tags=["boards"])


@router.get("", response_model=list[BoardResponse])
def list_boards(user_id: int = Depends(verify_token), db: Session = Depends(get_db)):
    return db.query(Board).filter(Board.user_id == user_id).all()


@router.get("/{board_id}", response_model=BoardDetailResponse)
def get_board(board_id: int, user_id: int = Depends(verify_token), db: Session = Depends(get_db)):
    board = (
        db.query(Board)
        .options(
            joinedload(Board.columns).joinedload(KanbanColumn.cards)
        )
        .filter(Board.id == board_id, Board.user_id == user_id)
        .first()
    )
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")
    return board
