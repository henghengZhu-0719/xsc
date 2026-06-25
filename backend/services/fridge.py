from sqlalchemy.orm import Session

from backend import models, schemas


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


def create_item(db: Session, item: schemas.FridgeItemCreate) -> models.FridgeItem:
    db_item = models.FridgeItem(**item.model_dump())
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
