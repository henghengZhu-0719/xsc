from datetime import datetime

from sqlalchemy import DateTime, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from backend.core.database import Base


class FoodTemplate(Base):
    """常用食物模板，用于新增冰箱食材时给出默认单位/次数换算。"""

    __tablename__ = "food_templates"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    category: Mapped[str | None] = mapped_column(String(20), nullable=True)
    default_unit: Mapped[str | None] = mapped_column(String(10), nullable=True)
    portions_per_unit: Mapped[int] = mapped_column(Integer, default=1)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.now, onupdate=datetime.now
    )
