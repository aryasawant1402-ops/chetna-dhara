from datetime import datetime

from sqlalchemy import DateTime, Integer, String, Text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class SessionRecord(Base):
    __tablename__ = "sessions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    display_name: Mapped[str] = mapped_column(String(40))
    age_years: Mapped[int] = mapped_column(Integer)
    condition: Mapped[str] = mapped_column(String(20))
    pace: Mapped[str] = mapped_column(String(20))
    status: Mapped[str] = mapped_column(String(20), default="active")
    summary_json: Mapped[str | None] = mapped_column(Text, nullable=True)
