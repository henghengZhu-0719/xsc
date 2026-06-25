from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field

MEAL_TYPES = ("breakfast", "lunch", "dinner")


class MealRecordItemCreate(BaseModel):
    fridge_item_id: int = Field(description="冰箱食材 ID")
    portions_consumed: int = Field(default=1, description="这次消耗的可食用次数")


class MealRecordCreate(BaseModel):
    meal_date: date = Field(description="用餐日期")
    meal_type: str = Field(description="餐次：breakfast / lunch / dinner")
    note: str | None = Field(default=None, description="备注")
    extra_food: str | None = Field(
        default=None, description="冰箱外的临时食物，如外卖"
    )
    items: list[MealRecordItemCreate] = Field(
        default_factory=list, description="这顿饭吃了冰箱里的哪些食材"
    )


class MealRecordUpdate(BaseModel):
    meal_date: date | None = Field(default=None, description="用餐日期")
    meal_type: str | None = Field(default=None, description="餐次")
    note: str | None = Field(default=None, description="备注")
    extra_food: str | None = Field(default=None, description="冰箱外的临时食物")
    items: list[MealRecordItemCreate] | None = Field(
        default=None, description="提供则整体替换这顿饭关联的冰箱食材消耗记录"
    )


class MealRecordItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int = Field(description="关联记录 ID")
    fridge_item_id: int | None = Field(description="冰箱食材 ID，食材被删除后为空")
    food_name: str = Field(description="食材名称（创建时快照）")
    portions_consumed: int = Field(description="消耗的可食用次数")


class MealRecordOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int = Field(description="记录 ID")
    meal_date: date = Field(description="用餐日期")
    meal_type: str = Field(description="餐次")
    note: str | None = Field(description="备注")
    extra_food: str | None = Field(description="冰箱外的临时食物")
    items: list[MealRecordItemOut] = Field(description="关联的冰箱食材消耗记录")
    created_at: datetime = Field(description="创建时间")
    updated_at: datetime = Field(description="最近更新时间")
