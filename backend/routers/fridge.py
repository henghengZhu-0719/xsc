from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend import schemas
from backend.core.database import get_db
from backend.services import fridge as fridge_service

router = APIRouter(prefix="/fridge/items", tags=["冰箱食材"])


@router.post(
    "",
    response_model=schemas.FridgeItemOut,
    summary="新增食材",
    description="向冰箱中添加一种新的食材。",
)
def create_fridge_item(item: schemas.FridgeItemCreate, db: Session = Depends(get_db)):
    return fridge_service.create_item(db, item)


@router.get(
    "",
    response_model=list[schemas.FridgeItemOut],
    summary="获取食材列表",
    description="分页获取冰箱中当前的所有食材。",
)
def list_fridge_items(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return fridge_service.get_items(db, skip=skip, limit=limit)


@router.get(
    "/{item_id}",
    response_model=schemas.FridgeItemOut,
    summary="获取单个食材详情",
)
def get_fridge_item(item_id: int, db: Session = Depends(get_db)):
    db_item = fridge_service.get_item(db, item_id)
    if db_item is None:
        raise HTTPException(status_code=404, detail="食材不存在")
    return db_item


@router.put(
    "/{item_id}",
    response_model=schemas.FridgeItemOut,
    summary="更新食材信息",
    description="支持部分字段更新，例如只修改数量或保质期。",
)
def update_fridge_item(
    item_id: int, item: schemas.FridgeItemUpdate, db: Session = Depends(get_db)
):
    db_item = fridge_service.get_item(db, item_id)
    if db_item is None:
        raise HTTPException(status_code=404, detail="食材不存在")
    return fridge_service.update_item(db, db_item, item)


@router.delete(
    "/{item_id}",
    status_code=204,
    summary="删除食材",
)
def delete_fridge_item(item_id: int, db: Session = Depends(get_db)):
    db_item = fridge_service.get_item(db, item_id)
    if db_item is None:
        raise HTTPException(status_code=404, detail="食材不存在")
    fridge_service.delete_item(db, db_item)
