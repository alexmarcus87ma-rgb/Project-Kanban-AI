from sqlalchemy.orm import Session
from models import User, Board, KanbanColumn, Card
from auth import hash_password

SEED_USERNAME = "user"
SEED_PASSWORD = "password"
SEED_BOARD_NAME = "Project Workflow"
SEED_COLUMNS = [
    "Ideas/Backlog",
    "Refinement/Planning",
    "Development/In Progress",
    "Testing/QA",
    "Deployment/Release",
    "Done"
]

SEED_CARDS = {
    "Ideas/Backlog": [
        {"title": "Add user authentication", "description": "Implement login/logout flow"},
        {"title": "Dark mode support", "description": "Add theme switcher and dark theme colors"},
        {"title": "Email notifications", "description": "Send updates when tasks are assigned"},
        {"title": "Real-time collaboration", "description": "Add WebSocket support for live board updates across users"},
        {"title": "Advanced filtering and search", "description": "Allow users to filter cards by tags, assignee, and due date"},
        {"title": "Export to CSV", "description": "Enable exporting board state and analytics as CSV files"},
    ],
    "Refinement/Planning": [
        {"title": "Design API schema", "description": "Define REST endpoints and data models"},
        {"title": "Write database migrations", "description": "Plan schema changes and rollback strategy"},
    ],
    "Development/In Progress": [
        {"title": "Build dashboard", "description": "Create main landing page with overview"},
        {"title": "Implement drag-and-drop", "description": "Add card movement between columns"},
    ],
    "Testing/QA": [
        {"title": "User acceptance testing", "description": "Validate against requirements"},
        {"title": "Performance testing", "description": "Load test with 10k cards"},
    ],
    "Deployment/Release": [
        {"title": "Deploy to staging", "description": "Run full integration tests"},
    ],
    "Done": [
        {"title": "Project setup", "description": "Initialize repo and CI/CD"},
        {"title": "Database schema", "description": "Design and create initial schema"},
    ],
}


def seed_db(db: Session) -> None:
    """Seed database only if user doesn't exist yet."""
    user = db.query(User).filter(User.username == SEED_USERNAME).first()
    if not user:
        user = User(username=SEED_USERNAME, password_hash=hash_password(SEED_PASSWORD))
        db.add(user)
        db.flush()
    else:
        # User already exists, skip seeding to preserve existing data
        return

    board = Board(user_id=user.id, name=SEED_BOARD_NAME)
    db.add(board)
    db.flush()

    columns_by_name = {}
    for position, name in enumerate(SEED_COLUMNS):
        col = KanbanColumn(board_id=board.id, name=name, position=position)
        db.add(col)
        db.flush()
        columns_by_name[name] = col

    for column_name, cards in SEED_CARDS.items():
        column = columns_by_name[column_name]
        for card_position, card_data in enumerate(cards):
            card = Card(
                column_id=column.id,
                title=card_data["title"],
                description=card_data["description"],
                position=card_position,
            )
            db.add(card)

    db.commit()
