from datetime import datetime
from sqlalchemy import Integer, Text, DateTime, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base


class Board(Base):
    __tablename__ = "boards"
    __table_args__ = (
        Index("idx_boards_user_id", "user_id"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="boards")
    columns = relationship("KanbanColumn", back_populates="board", cascade="all, delete-orphan", order_by="KanbanColumn.position")
    conversation_history = relationship("ConversationHistory", back_populates="board", cascade="all, delete-orphan")
