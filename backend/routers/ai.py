from datetime import date as date_type, datetime, timezone, timedelta

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, selectinload

from backend import models
from backend.core.database import get_db
from backend.services import ai as ai_service

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
        meal_lines.append(
            f"【{meal_label}】{'、'.join(food_parts) if food_parts else '（无详细食材）'}"
        )
        if record.note:
            meal_lines.append(f"  备注：{record.note}")

    system_prompt = """
# 角色
你是一名专业注册营养师，根据用户当日已记录的饮食，给出营养评估和后续餐次的具体建议。

# 时间感知规则（核心逻辑）
你会收到「当前时间」和「已记录餐次」，请据此判断今天还剩哪些餐未到或未吃：
- 当前早晨（6:00-10:59）：重点推荐午餐和晚餐怎么吃
- 当前中午（11:00-13:59）：重点推荐晚餐怎么吃
- 当前下午/晚上（14:00 以后）且三餐已全部记录：给出今日完整总结和明日建议
- 若某餐时间已过但未记录，可能是没吃或忘记记录，不做惩罚，仅在建议中轻提

# 输出结构
请严格按以下三段输出：

📊 **今日摄入小结**
基于已记录餐次，评估当前蛋白质、碳水、脂肪、蔬菜、维生素等覆盖情况，一段话即可。

⚠️ **当前营养缺口**
指出截至目前明显不足的 1-2 个营养点，说明原因。

💡 **接下来怎么吃**
根据当前时间，针对今天剩余餐次给出具体建议。**优先从「冰箱现有食材」中推荐**，给出具体的食物搭配方式。若今天已结束，则结合冰箱库存给出明日调整方向。

# 输出要求
- 语气像营养师朋友，专业但不说教
- 不捏造具体克数或热量数字
- 总字数控制在 280 字以内\
"""
    # 查冰箱中还有剩余的食材
    available_fridge = (
        db.query(models.FridgeItem)
        .filter(models.FridgeItem.portions_remaining > 0)
        .order_by(models.FridgeItem.category, models.FridgeItem.name)
        .all()
    )
    fridge_by_cat: dict[str, list[str]] = {}
    for fi in available_fridge:
        cat = fi.category or "其他"
        fridge_by_cat.setdefault(cat, []).append(
            f"{fi.name}(剩余{fi.portions_remaining}次)"
        )

    now_cst = datetime.now(timezone(timedelta(hours=8)))
    prompt_parts = [
        f"当前时间：{now_cst.strftime('%Y-%m-%d %H:%M')}（北京时间）",
        f"分析日期：{date}",
        "",
        "食物摄入明细：",
        *meal_lines,
    ]
    if fridge_by_cat:
        prompt_parts.append("\n冰箱现有食材（可用于推荐）：")
        for cat, items in sorted(fridge_by_cat.items()):
            prompt_parts.append(f"  · {cat}：{'、'.join(items)}")
    else:
        prompt_parts.append("\n冰箱现有食材：（暂无）")
    prompt_parts.append("\n请分析今天的营养情况并给出建议。")

    prompt_user = "\n".join(prompt_parts)

    try:
        summary = await ai_service.chat(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt_user},
            ],
        )
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
