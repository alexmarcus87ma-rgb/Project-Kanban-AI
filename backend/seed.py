import hashlib
from sqlalchemy.orm import Session
from models import User, Board, KanbanColumn


SEED_USERNAME = "user"
SEED_PASSWORD = "password"
SEED_BOARD_NAME = "My Board"
SEED_COLUMNS = ["Backlog", "Discovery", "In Progress", "Review", "Done"]


def _hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


def seed_db(db: Session) -> None:
    user = db.query(User).filter(User.username == SEED_USERNAME).first()
    if not user:
        user = User(username=SEED_USERNAME, password_hash=_hash_password(SEED_PASSWORD))
        db.add(user)
        db.flush()

    board = db.query(Board).filter(Board.user_id == user.id).first()
    if not board:
        board = Board(user_id=user.id, name=SEED_BOARD_NAME)
        db.add(board)
        db.flush()

        for position, name in enumerate(SEED_COLUMNS):
            col = KanbanColumn(board_id=board.id, name=name, position=position)
            db.add(col)

    db.commit()
