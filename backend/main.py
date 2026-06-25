from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.core.database import Base, SessionLocal, engine
from backend.routers import food_template, fridge, meal
from backend.services.food_template import seed_default_templates

Base.metadata.create_all(bind=engine)

with SessionLocal() as db:
    seed_default_templates(db)

app = FastAPI(
    title="每日饮食推荐",
    description="管理冰箱食材、记录三餐并智能推荐每日饮食。",
)

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1):\d+",
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(fridge.router)
app.include_router(food_template.router)
app.include_router(meal.router)
