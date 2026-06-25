import { mealTypeLabel } from "../constants";
import type { MealRecord } from "../types";

interface Props {
  record: MealRecord;
  onEdit: (record: MealRecord) => void;
  onDelete: (id: number) => void;
}

export function MealRecordCard({ record, onEdit, onDelete }: Props) {
  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">
          {record.meal_date} · {mealTypeLabel(record.meal_type)}
        </span>
      </div>

      <div className="card-body">
        {record.items.length === 0 && !record.extra_food && (
          <p className="card-line">没有记录具体食物</p>
        )}
        {record.items.map((item) => (
          <p className="card-line" key={item.id}>
            {item.food_name} x {item.portions_consumed}
          </p>
        ))}
        {record.extra_food && <p className="card-line">{record.extra_food}</p>}
        {record.note && <p className="card-line">备注：{record.note}</p>}
      </div>

      <div className="card-actions">
        <button className="btn btn-sm btn-ghost" onClick={() => onEdit(record)}>
          编辑
        </button>
        <button className="btn btn-sm btn-danger" onClick={() => onDelete(record.id)}>
          删除
        </button>
      </div>
    </div>
  );
}
