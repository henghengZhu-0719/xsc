import { useState, type FormEvent } from "react";
import { CATEGORIES } from "../constants";
import type { FoodTemplate, FoodTemplateInput } from "../types";

interface Props {
  initial?: FoodTemplate;
  onSubmit: (data: FoodTemplateInput) => Promise<void>;
  onCancel: () => void;
}

export function FoodTemplateForm({ initial, onSubmit, onCancel }: Props) {
  const [name, setName] = useState(initial?.name ?? "");
  const [category, setCategory] = useState(initial?.category ?? CATEGORIES[0]);
  const [defaultUnit, setDefaultUnit] = useState(initial?.default_unit ?? "");
  const [portionsPerUnit, setPortionsPerUnit] = useState(
    initial?.portions_per_unit ?? 1
  );
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        category,
        default_unit: defaultUnit.trim() || null,
        portions_per_unit: portionsPerUnit,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="item-form" onSubmit={handleSubmit}>
      <div className="form-row">
        <label>
          食物名称
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="如：鸡蛋"
            autoFocus
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
          默认单位
          <input
            value={defaultUnit}
            onChange={(e) => setDefaultUnit(e.target.value)}
            placeholder="如：个、份、包"
          />
        </label>
        <label>
          每单位可食用次数
          <input
            type="number"
            min={1}
            value={portionsPerUnit}
            onChange={(e) => setPortionsPerUnit(Number(e.target.value))}
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
