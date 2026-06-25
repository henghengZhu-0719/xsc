from fastapi import FastAPI

from backend.core.database import Base, engine
from backend.routers import fridge

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="每日饮食推荐",
    description="管理冰箱食材、记录三餐并智能推荐每日饮食。",
)

app.include_router(fridge.router)
