import { useState, type FormEvent } from "react";
import type { FridgeItemInput } from "../types";

const CATEGORIES = ["肉类", "蛋类", "蔬菜", "海鲜", "主食", "其他"];

interface Props {
  onSubmit: (data: FridgeItemInput) => Promise<void>;
  onCancel: () => void;
}

export function FridgeItemForm({ onSubmit, onCancel }: Props) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState("");
  const [portionsTotal, setPortionsTotal] = useState(1);
  const [expireDate, setExpireDate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        category,
        quantity,
        unit: unit.trim() || null,
        portions_total: portionsTotal,
        expire_date: expireDate || null,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="item-form" onSubmit={handleSubmit}>
      <div className="form-row">
        <label>
          食材名称
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="如：鸡蛋"
            required
          />
        </label>
        <label>
          分类
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="form-row">
        <label>
          数量
          <input
            type="number"
            min={0}
            step="any"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
          />
        </label>
        <label>
          单位
          <input
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            placeholder="如：个、包、份"
          />
        </label>
      </div>

      <div className="form-row">
        <label>
          可食用次数
          <input
            type="number"
            min={1}
            value={portionsTotal}
            onChange={(e) => setPortionsTotal(Number(e.target.value))}
          />
        </label>
        <label>
          保质期
          <input
            type="date"
            value={expireDate}
            onChange={(e) => setExpireDate(e.target.value)}
          />
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
