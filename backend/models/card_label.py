from sqlalchemy import Integer, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base


class CardLabel(Base):
    __tablename__ = "card_labels"
    __table_args__ = (
        Index("idx_card_labels_card_id", "card_id"),
        Index("idx_card_labels_label_id", "label_id"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    card_id: Mapped[int] = mapped_column(Integer, ForeignKey("cards.id"), nullable=False)
    label_id: Mapped[int] = mapped_column(Integer, ForeignKey("labels.id"), nullable=False)

    card = relationship("Card", back_populates="card_labels")
    label = relationship("Label", back_populates="card_labels")
