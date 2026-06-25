from sqlalchemy.orm import Session

from backend import models, schemas

DEFAULT_TEMPLATES = [
    {"name": "鸡蛋", "category": "蛋", "default_unit": "个", "portions_per_unit": 1},
    {"name": "牛肉", "category": "肉", "default_unit": "份", "portions_per_unit": 2},
    {"name": "猪肉", "category": "肉", "default_unit": "份", "portions_per_unit": 2},
    {"name": "虾", "category": "肉", "default_unit": "份", "portions_per_unit": 2},
    {"name": "牛奶", "category": "奶", "default_unit": "盒", "portions_per_unit": 1},
    {"name": "蔬菜", "category": "蔬菜", "default_unit": "包", "portions_per_unit": 3},
    {"name": "苹果", "category": "水果", "default_unit": "个", "portions_per_unit": 1},
    {"name": "米饭", "category": "主食", "default_unit": "份", "portions_per_unit": 1},
]


def seed_default_templates(db: Session) -> None:
    if db.query(models.FoodTemplate).count() > 0:
        return
    for data in DEFAULT_TEMPLATES:
        db.add(models.FoodTemplate(**data))
    db.commit()


def get_template(db: Session, template_id: int) -> models.FoodTemplate | None:
    return db.get(models.FoodTemplate, template_id)


def get_template_by_name(db: Session, name: str) -> models.FoodTemplate | None:
    return (
        db.query(models.FoodTemplate).filter(models.FoodTemplate.name == name).first()
    )


def get_templates(db: Session) -> list[models.FoodTemplate]:
    return db.query(models.FoodTemplate).order_by(models.FoodTemplate.id).all()


def create_template(
    db: Session, template: schemas.FoodTemplateCreate
) -> models.FoodTemplate:
    db_template = models.FoodTemplate(**template.model_dump())
    db.add(db_template)
    db.commit()
    db.refresh(db_template)
    return db_template


def update_template(
    db: Session,
    db_template: models.FoodTemplate,
    template: schemas.FoodTemplateUpdate,
) -> models.FoodTemplate:
    for field, value in template.model_dump(exclude_unset=True).items():
        setattr(db_template, field, value)
    db.commit()
    db.refresh(db_template)
    return db_template


def delete_template(db: Session, db_template: models.FoodTemplate) -> None:
    db.delete(db_template)
    db.commit()
