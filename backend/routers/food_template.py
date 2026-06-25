from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend import schemas
from backend.core.database import get_db
from backend.services import food_template as template_service

router = APIRouter(prefix="/food-templates", tags=["常用食物模板"])


@router.post(
    "",
    response_model=schemas.FoodTemplateOut,
    summary="新增常用食物模板",
    description="新建一种自定义的常用食物，供以后快速添加到冰箱时使用。",
)
def create_food_template(
    template: schemas.FoodTemplateCreate, db: Session = Depends(get_db)
):
    return template_service.create_template(db, template)


@router.get(
    "",
    response_model=list[schemas.FoodTemplateOut],
    summary="获取常用食物模板列表",
)
def list_food_templates(db: Session = Depends(get_db)):
    return template_service.get_templates(db)


@router.put(
    "/{template_id}",
    response_model=schemas.FoodTemplateOut,
    summary="更新常用食物模板",
)
def update_food_template(
    template_id: int,
    template: schemas.FoodTemplateUpdate,
    db: Session = Depends(get_db),
):
    db_template = template_service.get_template(db, template_id)
    if db_template is None:
        raise HTTPException(status_code=404, detail="食物模板不存在")
    return template_service.update_template(db, db_template, template)


@router.delete(
    "/{template_id}",
    status_code=204,
    summary="删除常用食物模板",
)
def delete_food_template(template_id: int, db: Session = Depends(get_db)):
    db_template = template_service.get_template(db, template_id)
    if db_template is None:
        raise HTTPException(status_code=404, detail="食物模板不存在")
    template_service.delete_template(db, db_template)
