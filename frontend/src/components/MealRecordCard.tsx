import type { MealRecord } from "../types";

interface Props {
  record: MealRecord;
  onEdit: (record: MealRecord) => void;
  onDelete: (id: number) => void;
}

export function MealRecordCard({ record, onEdit, onDelete }: Props) {
  return (
    <div className="meal-food-card">
      <div className="meal-food-header">
        <span>食物 {record.items.length} 种</span>
      </div>

      {record.items.length === 0 && !record.extra_food && (
        <p className="card-line">没有记录具体食物</p>
      )}

      {record.items.length > 0 && (
        <ul className="meal-food-list">
          {record.items.map((item) => (
            <li key={item.id} className="meal-food-row">
              <span>{item.food_name}</span>
              <span className="meal-food-qty">×{item.portions_consumed}</span>
            </li>
          ))}
        </ul>
      )}

      {record.extra_food && <p className="card-line">{record.extra_food}</p>}
      {record.note && <p className="card-line">备注：{record.note}</p>}

      <div className="card-actions">
        <button className="btn btn-sm btn-ghost" onClick={() => onEdit(record)}>
          <span className="ic ic-edit" />
          编辑
        </button>
        <button className="btn btn-sm btn-ghost" onClick={() => onEdit(record)}>
          <span className="ic ic-plus" />
          继续添加
        </button>
        <button className="btn btn-sm btn-danger" onClick={() => onDelete(record.id)}>
          <span className="ic ic-trash" />
          删除
        </button>
      </div>
    </div>
  );
}
