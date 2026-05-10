from datetime import datetime
from sqlalchemy import Integer, Text, DateTime, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base
from models._util import utcnow


class Label(Base):
    __tablename__ = "labels"
    __table_args__ = (
        Index("idx_labels_board_id", "board_id"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    board_id: Mapped[int] = mapped_column(Integer, ForeignKey("boards.id"), nullable=False)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    color: Mapped[str] = mapped_column(Text, nullable=False, default="#6366f1")
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=utcnow)

    board = relationship("Board", back_populates="labels")
    card_labels = relationship("CardLabel", back_populates="label", cascade="all, delete-orphan")
