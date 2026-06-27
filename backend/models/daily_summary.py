from datetime import date, datetime

from sqlalchemy import Date, DateTime, Text
from sqlalchemy.orm import Mapped, mapped_column

from backend.core.database import Base


class DailySummary(Base):
    __tablename__ = "daily_summaries"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    summary_date: Mapped[date] = mapped_column(Date, unique=True, index=True)
    summary_text: Mapped[str] = mapped_column(Text)
    categories: Mapped[str] = mapped_column(Text, default="[]")  # JSON array string
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
