from datetime import date as date_type

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.core.database import get_db
from backend.schemas.daily_summary import DailySummaryOut
from backend.services import daily_summary as summary_service

router = APIRouter(prefix="/daily-summaries", tags=["每日饮食总结"])


@router.get(
    "/{date}",
    response_model=DailySummaryOut,
    summary="获取某日持久化 AI 饮食总结",
)
def get_daily_summary(date: date_type, db: Session = Depends(get_db)):
    result = summary_service.get_summary(db, date)
    if result is None:
        raise HTTPException(status_code=404, detail="暂无该日总结")
    return result
