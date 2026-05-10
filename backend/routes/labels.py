from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from database import get_db
from models import Board, Label
from schemas.label import LabelCreate, LabelUpdate, LabelResponse
from auth import verify_token

router = APIRouter(prefix="/api/boards/{board_id}/labels", tags=["labels"])


def _get_board_for_user(board_id: int, user_id: int, db: Session) -> Board:
    board = db.query(Board).filter(Board.id == board_id, Board.user_id == user_id).first()
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")
    return board


@router.get("", response_model=list[LabelResponse])
def list_labels(board_id: int, user_id: int = Depends(verify_token), db: Session = Depends(get_db)):
    _get_board_for_user(board_id, user_id, db)
    return db.query(Label).filter(Label.board_id == board_id).all()


@router.post("", response_model=LabelResponse, status_code=201)
def create_label(board_id: int, body: LabelCreate, user_id: int = Depends(verify_token), db: Session = Depends(get_db)):
    _get_board_for_user(board_id, user_id, db)
    label = Label(board_id=board_id, name=body.name, color=body.color)
    db.add(label)
    db.commit()
    db.refresh(label)
    return label


@router.patch("/{label_id}", response_model=LabelResponse)
def update_label(board_id: int, label_id: int, body: LabelUpdate, user_id: int = Depends(verify_token), db: Session = Depends(get_db)):
    _get_board_for_user(board_id, user_id, db)
    label = db.query(Label).filter(Label.id == label_id, Label.board_id == board_id).first()
    if not label:
        raise HTTPException(status_code=404, detail="Label not found")
    if body.name is not None:
        label.name = body.name
    if body.color is not None:
        label.color = body.color
    db.commit()
    db.refresh(label)
    return label


@router.delete("/{label_id}", status_code=204)
def delete_label(board_id: int, label_id: int, user_id: int = Depends(verify_token), db: Session = Depends(get_db)):
    _get_board_for_user(board_id, user_id, db)
    label = db.query(Label).filter(Label.id == label_id, Label.board_id == board_id).first()
    if not label:
        raise HTTPException(status_code=404, detail="Label not found")
    db.delete(label)
    db.commit()
    return Response(status_code=204)
