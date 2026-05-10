from fastapi import APIRouter, Depends, HTTPException, status, Response
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from database import get_db
from models import User, Board, KanbanColumn
from schemas.auth import LoginRequest, RegisterRequest, TokenResponse, UserResponse
from auth import create_token, delete_token, verify_token, bearer_scheme, hash_password, verify_password

router = APIRouter(prefix="/api/auth", tags=["auth"])

DEFAULT_COLUMNS = [
    "Backlog",
    "To Do",
    "In Progress",
    "Review",
    "Done",
]


def _get_raw_token(credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)) -> str:
    if not credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    return credentials.credentials


@router.post("/register", response_model=TokenResponse, status_code=201)
def register(body: RegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.username == body.username).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Username already taken")

    user = User(username=body.username, password_hash=hash_password(body.password))
    db.add(user)
    db.flush()

    # Create a default board for the new user
    board = Board(user_id=user.id, name="My First Board")
    db.add(board)
    db.flush()

    for position, name in enumerate(DEFAULT_COLUMNS):
        col = KanbanColumn(board_id=board.id, name=name, position=position)
        db.add(col)

    db.commit()

    token = create_token(user.id)
    return TokenResponse(token=token)


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == body.username).first()
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    token = create_token(user.id)
    return TokenResponse(token=token)


@router.get("/me", response_model=UserResponse)
def get_current_user(user_id: int = Depends(verify_token), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.post("/logout", status_code=204)
def logout(
    user_id: int = Depends(verify_token),
    raw_token: str = Depends(_get_raw_token),
):
    delete_token(raw_token)
    return Response(status_code=204)
