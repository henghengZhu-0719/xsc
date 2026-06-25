from datetime import date, datetime

from sqlalchemy import Date, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.core.database import Base


class MealRecord(Base):
    __tablename__ = "meal_records"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    meal_date: Mapped[date] = mapped_column(Date, index=True)
    meal_type: Mapped[str] = mapped_column(String(10))
    note: Mapped[str | None] = mapped_column(String(200), nullable=True)
    extra_food: Mapped[str | None] = mapped_column(
        String(200), nullable=True
    )  # 冰箱外的临时食物，如外卖
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.now, onupdate=datetime.now
    )

    items: Mapped[list["MealRecordItem"]] = relationship(
        back_populates="meal_record", cascade="all, delete-orphan"
    )


class MealRecordItem(Base):
    __tablename__ = "meal_record_items"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    meal_record_id: Mapped[int] = mapped_column(
        ForeignKey("meal_records.id", ondelete="CASCADE")
    )
    fridge_item_id: Mapped[int | None] = mapped_column(
        ForeignKey("fridge_items.id", ondelete="SET NULL"), nullable=True
    )
    food_name: Mapped[str] = mapped_column(String(50))  # 创建时的食材名快照
    portions_consumed: Mapped[int] = mapped_column(Integer, default=1)

    meal_record: Mapped["MealRecord"] = relationship(back_populates="items")
