from datetime import datetime
from sqlalchemy import Integer, Text, DateTime, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base


class ConversationHistory(Base):
    __tablename__ = "conversation_history"
    __table_args__ = (
        Index("idx_conversation_board", "board_id"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    board_id: Mapped[int] = mapped_column(Integer, ForeignKey("boards.id"), nullable=False)
    role: Mapped[str] = mapped_column(Text, nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)

    user = relationship("User", back_populates="conversation_history")
    board = relationship("Board", back_populates="conversation_history")
