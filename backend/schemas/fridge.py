from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field


class FridgeItemCreate(BaseModel):
    name: str = Field(description="食材名称，如鸡蛋、牛肉")
    category: str | None = Field(default=None, description="食材分类，如肉类、蛋类、蔬菜")
    quantity: float = Field(default=1, description="数量")
    unit: str | None = Field(default=None, description="单位，如个、克、斤")
    portions_total: int = Field(default=1, description="总可食用次数，如一包蔬菜可吃 3 次")
    expire_date: date | None = Field(default=None, description="保质期/过期日期")


class FridgeItemUpdate(BaseModel):
    name: str | None = Field(default=None, description="食材名称")
    category: str | None = Field(default=None, description="食材分类")
    quantity: float | None = Field(default=None, description="数量")
    unit: str | None = Field(default=None, description="单位")
    portions_total: int | None = Field(default=None, description="总可食用次数")
    portions_remaining: int | None = Field(default=None, description="剩余可食用次数，用于手动纠偏")
    expire_date: date | None = Field(default=None, description="保质期/过期日期")


class FridgeItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int = Field(description="食材 ID")
    name: str = Field(description="食材名称")
    category: str | None = Field(description="食材分类")
    quantity: float = Field(description="数量")
    unit: str | None = Field(description="单位")
    portions_total: int = Field(description="总可食用次数")
    portions_remaining: int = Field(description="剩余可食用次数")
    expire_date: date | None = Field(description="保质期/过期日期")
    created_at: datetime = Field(description="创建时间")
    updated_at: datetime = Field(description="最近更新时间")
