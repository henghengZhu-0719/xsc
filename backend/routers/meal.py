from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend import schemas
from backend.core.database import get_db
from backend.services import meal as meal_service

router = APIRouter(prefix="/meal-records", tags=["三餐记录"])


@router.post(
    "",
    response_model=schemas.MealRecordOut,
    summary="新增三餐记录",
    description="记录一顿饭吃了什么；如果关联了冰箱食材，会自动扣减对应的可食用次数。",
)
def create_meal_record(meal: schemas.MealRecordCreate, db: Session = Depends(get_db)):
    return meal_service.create_meal_record(db, meal)


@router.get(
    "",
    response_model=list[schemas.MealRecordOut],
    summary="获取三餐记录列表",
)
def list_meal_records(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return meal_service.get_meal_records(db, skip=skip, limit=limit)


@router.get(
    "/{meal_record_id}",
    response_model=schemas.MealRecordOut,
    summary="获取单条三餐记录详情",
)
def get_meal_record(meal_record_id: int, db: Session = Depends(get_db)):
    db_meal = meal_service.get_meal_record(db, meal_record_id)
    if db_meal is None:
        raise HTTPException(status_code=404, detail="记录不存在")
    return db_meal


@router.put(
    "/{meal_record_id}",
    response_model=schemas.MealRecordOut,
    summary="更新三餐记录",
    description="如果传了 items，会先把原来消耗的可食用次数加回冰箱，再按新的 items 重新扣减。",
)
def update_meal_record(
    meal_record_id: int, meal: schemas.MealRecordUpdate, db: Session = Depends(get_db)
):
    db_meal = meal_service.get_meal_record(db, meal_record_id)
    if db_meal is None:
        raise HTTPException(status_code=404, detail="记录不存在")
    return meal_service.update_meal_record(db, db_meal, meal)


@router.delete(
    "/{meal_record_id}",
    status_code=204,
    summary="删除三餐记录",
    description="删除时会把扣减的可食用次数加回冰箱。",
)
def delete_meal_record(meal_record_id: int, db: Session = Depends(get_db)):
    db_meal = meal_service.get_meal_record(db, meal_record_id)
    if db_meal is None:
        raise HTTPException(status_code=404, detail="记录不存在")
    meal_service.delete_meal_record(db, db_meal)
