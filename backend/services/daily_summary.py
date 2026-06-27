import json
from datetime import date as date_type, datetime, timedelta, timezone

from sqlalchemy.orm import Session, selectinload

from backend import models
from backend.core.database import SessionLocal
from backend.services import ai as ai_service

MEAL_LABELS = {"breakfast": "早餐", "lunch": "午餐", "dinner": "晚餐"}

# 食物分类对应的主要营养素，用于在 user prompt 中补充营养上下文
CATEGORY_NUTRIENTS = {
    "肉":  "优质蛋白质、铁、B族维生素",
    "蛋":  "优质蛋白质、卵磷脂、维生素A/D",
    "奶":  "钙、优质蛋白质、维生素B2",
    "蔬菜": "膳食纤维、维生素C/K、叶酸、矿物质",
    "水果": "维生素C、天然糖分、抗氧化物",
    "主食": "碳水化合物、B族维生素、膳食纤维（全谷物）",
}

SYSTEM_PROMPT = """\
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
根据当前时间，针对今天剩余餐次给出具体建议（推荐具体食物/搭配方式）。若今天已结束，则给出明日调整方向。

# 输出要求
- 语气像营养师朋友，专业但不说教
- 不捏造具体克数或热量数字
- 总字数控制在 280 字以内\
"""


def get_summary(db: Session, date: date_type) -> models.DailySummary | None:
    return (
        db.query(models.DailySummary)
        .filter(models.DailySummary.summary_date == date)
        .first()
    )


async def regenerate_summary(date: date_type) -> None:
    """Background task: fetch meals for date, call DeepSeek, upsert daily_summaries."""
    with SessionLocal() as db:
        records = (
            db.query(models.MealRecord)
            .options(selectinload(models.MealRecord.items))
            .filter(models.MealRecord.meal_date == date)
            .all()
        )

        # No records left → remove summary if any
        if not records:
            existing = get_summary(db, date)
            if existing:
                db.delete(existing)
                db.commit()
            return

        # Fetch fridge items to get categories
        fridge_ids = {
            item.fridge_item_id
            for r in records
            for item in r.items
            if item.fridge_item_id is not None
        }
        fridge_map: dict[int, models.FridgeItem] = {}
        if fridge_ids:
            for fi in (
                db.query(models.FridgeItem)
                .filter(models.FridgeItem.id.in_(fridge_ids))
                .all()
            ):
                fridge_map[fi.id] = fi

        categories_covered: set[str] = set()
        # category -> list of (food_name, portions)
        category_foods: dict[str, list[str]] = {}
        meal_lines: list[str] = []
        recorded_labels: list[str] = []
        all_meal_types = set(MEAL_LABELS.keys())

        for record in records:
            label = MEAL_LABELS.get(record.meal_type, record.meal_type)
            recorded_labels.append(label)
            parts: list[str] = []
            for item in record.items:
                fi = fridge_map.get(item.fridge_item_id) if item.fridge_item_id else None
                if fi and fi.category:
                    cat = fi.category
                    categories_covered.add(cat)
                    parts.append(f"{item.food_name}({cat})×{item.portions_consumed}份")
                    category_foods.setdefault(cat, []).append(
                        f"{item.food_name}×{item.portions_consumed}份"
                    )
                else:
                    parts.append(f"{item.food_name}×{item.portions_consumed}份")
            if record.extra_food:
                parts.append(f"额外食物：{record.extra_food}")
            meal_lines.append(
                f"【{label}】{'、'.join(parts) if parts else '（无详细食材）'}"
            )
            if record.note:
                meal_lines.append(f"  备注：{record.note}")

        missing_meals = [
            MEAL_LABELS[t] for t in all_meal_types if t not in {r.meal_type for r in records}
        ]

        # 分类摄入汇总，附主要营养素说明
        category_summary_lines = []
        for cat, foods in sorted(category_foods.items()):
            nutrients = CATEGORY_NUTRIENTS.get(cat, "")
            nutrient_note = f"（主要提供：{nutrients}）" if nutrients else ""
            category_summary_lines.append(f"  · {cat}类{nutrient_note}：{'、'.join(foods)}")
        missing_cats = [c for c in CATEGORY_NUTRIENTS if c not in categories_covered]

        now_cst = datetime.now(timezone(timedelta(hours=8)))
        prompt_parts = [
            f"当前时间：{now_cst.strftime('%Y-%m-%d %H:%M')}（北京时间）",
            f"分析日期：{date}",
            f"已记录餐次：{'、'.join(recorded_labels)}",
        ]
        if missing_meals:
            prompt_parts.append(f"未记录餐次：{'、'.join(missing_meals)}")
        prompt_parts.append("\n食物摄入明细：")
        prompt_parts.extend(meal_lines)
        if category_summary_lines:
            prompt_parts.append("\n分类摄入汇总：")
            prompt_parts.extend(category_summary_lines)
        if missing_cats:
            prompt_parts.append(f"\n今日未涉及的食物类别：{'、'.join(missing_cats)}")
        prompt_parts.append("\n请根据以上信息撰写今日饮食分析报告。")

        prompt = "\n".join(prompt_parts)

        try:
            summary_text = await ai_service.chat(
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": prompt},
                ],
            )
        except Exception:
            return  # Fail silently; don't break meal recording

        categories_json = json.dumps(sorted(categories_covered), ensure_ascii=False)
        existing = get_summary(db, date)
        if existing:
            existing.summary_text = summary_text
            existing.categories = categories_json
            existing.updated_at = datetime.now()
        else:
            db.add(
                models.DailySummary(
                    summary_date=date,
                    summary_text=summary_text,
                    categories=categories_json,
                )
            )
        db.commit()
