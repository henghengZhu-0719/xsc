from datetime import date as date_type

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, selectinload

from backend import models
from backend.core.database import get_db

DEEPSEEK_API_KEY = "sk-0e145e5272e147bb8e63b486ca265474"
DEEPSEEK_BASE_URL = "https://api.deepseek.com"

MEAL_LABELS = {"breakfast": "早餐", "lunch": "午餐", "dinner": "晚餐"}

router = APIRouter(prefix="/ai", tags=["AI分析"])


@router.get("/daily-summary")
async def daily_summary(date: date_type = Query(...), db: Session = Depends(get_db)):
    records = (
        db.query(models.MealRecord)
        .options(selectinload(models.MealRecord.items))
        .filter(models.MealRecord.meal_date == date)
        .all()
    )

    if not records:
        return {
            "summary": "今天还没有任何饮食记录，记得按时吃饭哦！",
            "stats": {"meal_types": [], "foods": [], "categories": []},
        }

    # 查询关联的冰箱食材以获取分类信息
    fridge_item_ids = {
        item.fridge_item_id
        for r in records
        for item in r.items
        if item.fridge_item_id is not None
    }
    fridge_map: dict[int, models.FridgeItem] = {}
    if fridge_item_ids:
        for fi in (
            db.query(models.FridgeItem)
            .filter(models.FridgeItem.id.in_(fridge_item_ids))
            .all()
        ):
            fridge_map[fi.id] = fi

    categories_covered: set[str] = set()
    all_foods: list[str] = []
    meal_lines: list[str] = []

    for record in records:
        meal_label = MEAL_LABELS.get(record.meal_type, record.meal_type)
        food_parts: list[str] = []
        for item in record.items:
            fi = fridge_map.get(item.fridge_item_id) if item.fridge_item_id else None
            if fi and fi.category:
                categories_covered.add(fi.category)
                food_parts.append(f"{item.food_name}({fi.category})×{item.portions_consumed}份")
            else:
                food_parts.append(f"{item.food_name}×{item.portions_consumed}份")
            if item.food_name not in all_foods:
                all_foods.append(item.food_name)
        if record.extra_food:
            food_parts.append(f"额外：{record.extra_food}")
        meal_lines.append(f"【{meal_label}】{'、'.join(food_parts) if food_parts else '（无详细食材）'}")
        if record.note:
            meal_lines.append(f"  备注：{record.note}")

    prompt_user = f"日期：{date}\n" + "\n".join(meal_lines) + "\n\n请分析今天的营养情况并给出建议。"

    system_prompt = (
        "你是一个亲切的营养顾问。根据用户今天的饮食记录，给出简短的营养分析和改善建议。\n"
        "要求：\n"
        "- 先用一句话总结今天饮食整体情况\n"
        "- 分析食物种类是否均衡（蛋白质/蔬菜/主食/水果/奶蛋等）\n"
        "- 指出1-2个优点和1-2个不足\n"
        "- 给出明天或下一餐的具体改善建议\n"
        "- 语气轻松友好，像朋友聊天，不要说教\n"
        "- 回复控制在180字以内"
    )

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                f"{DEEPSEEK_BASE_URL}/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "deepseek-chat",
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": prompt_user},
                    ],
                    "max_tokens": 400,
                    "temperature": 0.7,
                },
            )
            resp.raise_for_status()
            summary = resp.json()["choices"][0]["message"]["content"]
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="AI 服务响应超时，请稍后重试")
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=502, detail=f"AI 服务异常：{e.response.status_code}")

    return {
        "summary": summary,
        "stats": {
            "meal_types": [r.meal_type for r in records],
            "foods": all_foods,
            "categories": sorted(categories_covered),
        },
    }
