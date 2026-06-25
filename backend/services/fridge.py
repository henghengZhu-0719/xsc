from sqlalchemy.orm import Session

from backend import models, schemas
from backend.services.food_template import get_template_by_name


def get_item(db: Session, item_id: int) -> models.FridgeItem | None:
    return db.get(models.FridgeItem, item_id)


def get_items(db: Session, skip: int = 0, limit: int = 100) -> list[models.FridgeItem]:
    return (
        db.query(models.FridgeItem)
        .order_by(models.FridgeItem.id)
        .offset(skip)
        .limit(limit)
        .all()
    )


def get_item_by_name(db: Session, name: str) -> models.FridgeItem | None:
    return db.query(models.FridgeItem).filter(models.FridgeItem.name == name).first()


def create_item(db: Session, item: schemas.FridgeItemCreate) -> models.FridgeItem:
    """新增食材；只需传 name 和 quantity，分类/单位/可食用次数会从常用食物模板自动推算。
    如果同名食材已存在，则把数量和可食用次数累加到已有记录上，而不是新建一行。
    """
    template = get_template_by_name(db, item.name)
    portions_per_unit = template.portions_per_unit if template else 1

    resolved_category = item.category or (template.category if template else None)
    resolved_unit = item.unit or (template.default_unit if template else None)
    resolved_portions_total = (
        item.portions_total
        if item.portions_total is not None
        else round(item.quantity * portions_per_unit)
    )

    existing = get_item_by_name(db, item.name)
    if existing is not None:
        existing.quantity += item.quantity
        existing.portions_total += resolved_portions_total
        existing.portions_remaining += resolved_portions_total
        if resolved_category is not None:
            existing.category = resolved_category
        if resolved_unit is not None:
            existing.unit = resolved_unit
        if item.expire_date is not None:
            existing.expire_date = item.expire_date
        db.commit()
        db.refresh(existing)
        return existing

    db_item = models.FridgeItem(
        name=item.name,
        quantity=item.quantity,
        category=resolved_category,
        unit=resolved_unit,
        portions_total=resolved_portions_total,
        portions_remaining=resolved_portions_total,
        expire_date=item.expire_date,
    )
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item


def update_item(
    db: Session, db_item: models.FridgeItem, item: schemas.FridgeItemUpdate
) -> models.FridgeItem:
    for field, value in item.model_dump(exclude_unset=True).items():
        setattr(db_item, field, value)
    db.commit()
    db.refresh(db_item)
    return db_item


def delete_item(db: Session, db_item: models.FridgeItem) -> None:
    db.delete(db_item)
    db.commit()
