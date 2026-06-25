from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class FoodTemplateCreate(BaseModel):
    name: str = Field(description="食物名称，如鸡蛋、牛肉")
    category: str | None = Field(default=None, description="分类，如肉类、蛋类、蔬菜")
    default_unit: str | None = Field(default=None, description="默认单位，如个、份、包")
    portions_per_unit: int = Field(default=1, description="每个单位可食用次数，如牛肉 1 份=2 次")


class FoodTemplateUpdate(BaseModel):
    name: str | None = Field(default=None, description="食物名称")
    category: str | None = Field(default=None, description="分类")
    default_unit: str | None = Field(default=None, description="默认单位")
    portions_per_unit: int | None = Field(default=None, description="每个单位可食用次数")


class FoodTemplateOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int = Field(description="模板 ID")
    name: str = Field(description="食物名称")
    category: str | None = Field(description="分类")
    default_unit: str | None = Field(description="默认单位")
    portions_per_unit: int = Field(description="每个单位可食用次数")
    created_at: datetime = Field(description="创建时间")
    updated_at: datetime = Field(description="最近更新时间")
