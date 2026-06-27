from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.core.database import Base, SessionLocal, engine
from backend.routers import ai, daily_summary, food_template, fridge, meal
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
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(fridge.router)
app.include_router(food_template.router)
app.include_router(meal.router)
app.include_router(ai.router)
app.include_router(daily_summary.router)

# 托管前端静态文件（需先 npm run build）
_dist = Path(__file__).resolve().parent.parent / "frontend" / "dist"
if _dist.exists():
    app.mount("/", StaticFiles(directory=_dist, html=True), name="static")
