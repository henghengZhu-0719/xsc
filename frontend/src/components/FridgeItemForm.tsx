import { useState, type FormEvent } from "react";
import { CATEGORIES } from "../constants";
import type { FridgeItemInput } from "../types";

interface Props {
  onSubmit: (data: FridgeItemInput) => Promise<void>;
  onCancel: () => void;
}

export function FridgeItemForm({ onSubmit, onCancel }: Props) {
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [category, setCategory] = useState("");
  const [unit, setUnit] = useState("");
  const [portionsTotal, setPortionsTotal] = useState("");
  const [expireDate, setExpireDate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        quantity,
        category: category || null,
        unit: unit.trim() || null,
        portions_total: portionsTotal === "" ? null : Number(portionsTotal),
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
            autoFocus
            required
          />
        </label>
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
      </div>

      <p className="form-hint">
        分类、单位、可食用次数会按常用食物模板自动推算，无需填写；同名食材会自动累加数量。
      </p>

      <details className="advanced">
        <summary>高级选项（可选，手动覆盖自动推算的值）</summary>
        <div className="form-row">
          <label>
            分类
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">自动推算</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
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
              min={0}
              value={portionsTotal}
              onChange={(e) => setPortionsTotal(e.target.value)}
              placeholder="自动推算"
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
      </details>

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
