from sqlalchemy.orm import Session, selectinload

from backend import models, schemas


def get_meal_record(db: Session, meal_record_id: int) -> models.MealRecord | None:
    return (
        db.query(models.MealRecord)
        .options(selectinload(models.MealRecord.items))
        .filter(models.MealRecord.id == meal_record_id)
        .first()
    )


def get_meal_records(
    db: Session, skip: int = 0, limit: int = 100
) -> list[models.MealRecord]:
    return (
        db.query(models.MealRecord)
        .options(selectinload(models.MealRecord.items))
        .order_by(models.MealRecord.meal_date.desc(), models.MealRecord.id.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


def _build_items(
    db: Session, items: list[schemas.MealRecordItemCreate]
) -> list[models.MealRecordItem]:
    """按每条消耗记录扣减对应冰箱食材的剩余可食用次数（允许扣成负数，仅作提示用途）。"""
    built: list[models.MealRecordItem] = []
    for item in items:
        fridge_item = db.get(models.FridgeItem, item.fridge_item_id)
        food_name = fridge_item.name if fridge_item else "未知食材"
        if fridge_item is not None:
            fridge_item.portions_remaining -= item.portions_consumed
        built.append(
            models.MealRecordItem(
                fridge_item_id=item.fridge_item_id,
                food_name=food_name,
                portions_consumed=item.portions_consumed,
            )
        )
    return built


def _restore_items(db: Session, meal_record: models.MealRecord) -> None:
    """把这顿饭关联的冰箱食材消耗加回去，用于删除/重新编辑前的撤销。"""
    for item in meal_record.items:
        if item.fridge_item_id is None:
            continue
        fridge_item = db.get(models.FridgeItem, item.fridge_item_id)
        if fridge_item is not None:
            fridge_item.portions_remaining += item.portions_consumed


def create_meal_record(
    db: Session, meal: schemas.MealRecordCreate
) -> models.MealRecord:
    db_meal = models.MealRecord(
        meal_date=meal.meal_date,
        meal_type=meal.meal_type,
        note=meal.note,
        extra_food=meal.extra_food,
        items=_build_items(db, meal.items),
    )
    db.add(db_meal)
    db.commit()
    db.refresh(db_meal)
    return db_meal


def update_meal_record(
    db: Session, db_meal: models.MealRecord, meal: schemas.MealRecordUpdate
) -> models.MealRecord:
    data = meal.model_dump(exclude_unset=True, exclude={"items"})
    for field, value in data.items():
        setattr(db_meal, field, value)

    if meal.items is not None:
        _restore_items(db, db_meal)
        db_meal.items = _build_items(db, meal.items)

    db.commit()
    db.refresh(db_meal)
    return db_meal


def delete_meal_record(db: Session, db_meal: models.MealRecord) -> None:
    _restore_items(db, db_meal)
    db.delete(db_meal)
    db.commit()
