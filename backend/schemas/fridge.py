from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field


class FridgeItemBase(BaseModel):
    name: str = Field(description="食材名称，如鸡蛋、牛肉")
    category: str | None = Field(default=None, description="食材分类，如肉类、蛋类、蔬菜")
    quantity: float = Field(default=1, description="数量")
    unit: str | None = Field(default=None, description="单位，如个、克、斤")
    expire_date: date | None = Field(default=None, description="保质期/过期日期")


class FridgeItemCreate(FridgeItemBase):
    pass


class FridgeItemUpdate(BaseModel):
    name: str | None = Field(default=None, description="食材名称")
    category: str | None = Field(default=None, description="食材分类")
    quantity: float | None = Field(default=None, description="数量")
    unit: str | None = Field(default=None, description="单位")
    expire_date: date | None = Field(default=None, description="保质期/过期日期")


class FridgeItemOut(FridgeItemBase):
    model_config = ConfigDict(from_attributes=True)

    id: int = Field(description="食材 ID")
    created_at: datetime = Field(description="创建时间")
    updated_at: datetime = Field(description="最近更新时间")
