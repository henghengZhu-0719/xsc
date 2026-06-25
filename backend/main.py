from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.core.database import Base, engine
from backend.routers import fridge

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="每日饮食推荐",
    description="管理冰箱食材、记录三餐并智能推荐每日饮食。",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(fridge.router)
