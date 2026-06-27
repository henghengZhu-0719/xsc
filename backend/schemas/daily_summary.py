import json
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, field_validator


class DailySummaryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    summary_date: date
    summary_text: str
    categories: list[str]
    updated_at: datetime

    @field_validator("categories", mode="before")
    @classmethod
    def parse_categories(cls, v: str | list) -> list[str]:
        if isinstance(v, str):
            return json.loads(v)
        return v
