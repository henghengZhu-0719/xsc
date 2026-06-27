import json
from datetime import date as date_type, datetime

from sqlalchemy.orm import Session, selectinload

from backend import models
from backend.core.database import SessionLocal
from backend.services import ai as ai_service

MEAL_LABELS = {"breakfast": "早餐", "lunch": "午餐", "dinner": "晚餐"}

SYSTEM_PROMPT = (
    "你是一个亲切的营养顾问。根据用户今天的饮食记录，给出简短的营养分析和改善建议。\n"
    "要求：\n"
    "- 先用一句话总结今天饮食整体情况\n"
    "- 分析食物种类是否均衡（蛋白质/蔬菜/主食/水果/奶蛋等）\n"
    "- 指出优点和不足\n"
    "- 给出下一餐或明天的具体改善建议\n"
    "- 语气轻松友好，像朋友聊天，不说教\n"
    "- 回复控制在180字以内"
)


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
        meal_lines: list[str] = []

        for record in records:
            label = MEAL_LABELS.get(record.meal_type, record.meal_type)
            parts: list[str] = []
            for item in record.items:
                fi = fridge_map.get(item.fridge_item_id) if item.fridge_item_id else None
                if fi and fi.category:
                    categories_covered.add(fi.category)
                    parts.append(f"{item.food_name}({fi.category})×{item.portions_consumed}份")
                else:
                    parts.append(f"{item.food_name}×{item.portions_consumed}份")
            if record.extra_food:
                parts.append(f"额外：{record.extra_food}")
            meal_lines.append(
                f"【{label}】{'、'.join(parts) if parts else '（无详细食材）'}"
            )
            if record.note:
                meal_lines.append(f"  备注：{record.note}")

        prompt = f"日期：{date}\n" + "\n".join(meal_lines) + "\n\n请分析今天的营养情况并给出建议。"

        try:
            summary_text = await ai_service.chat(
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": prompt},
                ],
                max_tokens=400,
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
