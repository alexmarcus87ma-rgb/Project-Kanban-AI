from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session, joinedload
from database import get_db
from models import Board, KanbanColumn, Label, Card, CardLabel
from schemas.board import BoardCreate, BoardUpdate, BoardResponse, BoardDetailResponse
from auth import verify_token

router = APIRouter(prefix="/api/boards", tags=["boards"])

DEFAULT_COLUMNS = ["Backlog", "To Do", "In Progress", "Review", "Done"]


@router.get("", response_model=list[BoardResponse])
def list_boards(user_id: int = Depends(verify_token), db: Session = Depends(get_db)):
    return db.query(Board).filter(Board.user_id == user_id).all()


@router.post("", response_model=BoardResponse, status_code=201)
def create_board(body: BoardCreate, user_id: int = Depends(verify_token), db: Session = Depends(get_db)):
    board = Board(user_id=user_id, name=body.name)
    db.add(board)
    db.flush()

    for position, name in enumerate(DEFAULT_COLUMNS):
        col = KanbanColumn(board_id=board.id, name=name, position=position)
        db.add(col)

    db.commit()
    db.refresh(board)
    return board


@router.get("/{board_id}", response_model=BoardDetailResponse)
def get_board(board_id: int, user_id: int = Depends(verify_token), db: Session = Depends(get_db)):
    board = (
        db.query(Board)
        .options(
            joinedload(Board.columns).joinedload(KanbanColumn.cards).joinedload(Card.card_labels).joinedload(CardLabel.label),
            joinedload(Board.labels),
        )
        .filter(Board.id == board_id, Board.user_id == user_id)
        .first()
    )
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")
    return board


@router.patch("/{board_id}", response_model=BoardResponse)
def update_board(board_id: int, body: BoardUpdate, user_id: int = Depends(verify_token), db: Session = Depends(get_db)):
    board = db.query(Board).filter(Board.id == board_id, Board.user_id == user_id).first()
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")
    board.name = body.name
    db.commit()
    db.refresh(board)
    return board


@router.delete("/{board_id}", status_code=204)
def delete_board(board_id: int, user_id: int = Depends(verify_token), db: Session = Depends(get_db)):
    board = db.query(Board).filter(Board.id == board_id, Board.user_id == user_id).first()
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")
    db.delete(board)
    db.commit()
    return Response(status_code=204)
