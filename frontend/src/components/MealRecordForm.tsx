import { useEffect, useState, type FormEvent } from "react";
import { fridgeApi } from "../api/fridge";
import { MEAL_TYPES } from "../constants";
import type { FridgeItem, MealRecord, MealRecordInput } from "../types";

interface Props {
  initial?: MealRecord;
  onSubmit: (data: MealRecordInput) => Promise<void>;
  onCancel: () => void;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function MealRecordForm({ initial, onSubmit, onCancel }: Props) {
  const [fridgeItems, setFridgeItems] = useState<FridgeItem[]>([]);
  const [mealDate, setMealDate] = useState(initial?.meal_date ?? today());
  const [mealType, setMealType] = useState(initial?.meal_type ?? MEAL_TYPES[0].value);
  const [note, setNote] = useState(initial?.note ?? "");
  const [extraFood, setExtraFood] = useState(initial?.extra_food ?? "");
  const [selected, setSelected] = useState<Record<number, number>>(() => {
    const map: Record<number, number> = {};
    initial?.items.forEach((item) => {
      if (item.fridge_item_id != null) {
        map[item.fridge_item_id] = item.portions_consumed;
      }
    });
    return map;
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fridgeApi.list().then(setFridgeItems).catch(() => setFridgeItems([]));
  }, []);

  const toggleItem = (id: number) => {
    setSelected((prev) => {
      const next = { ...prev };
      if (id in next) {
        delete next[id];
      } else {
        next[id] = 1;
      }
      return next;
    });
  };

  const setPortions = (id: number, portions: number) => {
    setSelected((prev) => ({ ...prev, [id]: portions }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit({
        meal_date: mealDate,
        meal_type: mealType,
        note: note.trim() || null,
        extra_food: extraFood.trim() || null,
        items: Object.entries(selected).map(([fridgeItemId, portionsConsumed]) => ({
          fridge_item_id: Number(fridgeItemId),
          portions_consumed: portionsConsumed,
        })),
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="item-form" onSubmit={handleSubmit}>
      <div className="form-row">
        <label>
          日期
          <input
            type="date"
            value={mealDate}
            onChange={(e) => setMealDate(e.target.value)}
            required
          />
        </label>
        <label>
          餐次
          <select value={mealType} onChange={(e) => setMealType(e.target.value)}>
            {MEAL_TYPES.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div>
        <p className="form-hint">吃了冰箱里的哪些食材：</p>
        <div className="meal-item-list">
          {fridgeItems.length === 0 && <p className="hint">冰箱里还没有食材</p>}
          {fridgeItems.map((item) => {
            const checked = item.id in selected;
            return (
              <div key={item.id} className="meal-item-row">
                <label className="meal-item-checkbox">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleItem(item.id)}
                  />
                  {item.name}（剩 {item.portions_remaining} 次）
                </label>
                {checked && (
                  <input
                    type="number"
                    min={1}
                    className="meal-item-portions"
                    value={selected[item.id]}
                    onChange={(e) => setPortions(item.id, Number(e.target.value))}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="form-row">
        <label>
          冰箱外的食物
          <input
            value={extraFood}
            onChange={(e) => setExtraFood(e.target.value)}
            placeholder="如：点了外卖"
          />
        </label>
        <label>
          备注
          <input value={note} onChange={(e) => setNote(e.target.value)} />
        </label>
      </div>

      <div className="form-actions">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>
          取消
        </button>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? "保存中..." : "保存"}
        </button>
      </div>
    </form>
  );
}
