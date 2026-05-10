from datetime import datetime
from sqlalchemy import Integer, Text, DateTime, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base
from models._util import utcnow


class Card(Base):
    __tablename__ = "cards"
    __table_args__ = (
        Index("idx_cards_column_id", "column_id"),
        Index("idx_cards_position", "column_id", "position"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    column_id: Mapped[int] = mapped_column(Integer, ForeignKey("columns.id"), nullable=False)
    title: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    priority: Mapped[str | None] = mapped_column(Text, nullable=True)  # low, medium, high, urgent
    due_date: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    position: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=utcnow, onupdate=utcnow)

    column = relationship("KanbanColumn", back_populates="cards")
    card_labels = relationship("CardLabel", back_populates="card", cascade="all, delete-orphan")

    @property
    def labels(self):
        return [cl.label for cl in self.card_labels]
