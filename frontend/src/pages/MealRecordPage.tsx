import { useEffect, useState } from "react";
import { mealApi } from "../api/meal";
import { MealRecordCard } from "../components/MealRecordCard";
import { MealRecordForm } from "../components/MealRecordForm";
import { MEAL_TYPES } from "../constants";
import type { MealRecord, MealRecordInput } from "../types";

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function shiftDate(date: string, days: number): string {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function MealRecordPage() {
  const [records, setRecords] = useState<MealRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [date, setDate] = useState(todayStr());
  const [createMealType, setCreateMealType] = useState<string | null>(null);
  const [editing, setEditing] = useState<MealRecord | null>(null);

  const loadRecords = async () => {
    setLoading(true);
    setError(null);
    try {
      setRecords(await mealApi.list());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, []);

  const handleCreate = async (data: MealRecordInput) => {
    await mealApi.create(data);
    setCreateMealType(null);
    await loadRecords();
  };

  const handleUpdate = async (data: MealRecordInput) => {
    if (!editing) return;
    await mealApi.update(editing.id, data);
    setEditing(null);
    await loadRecords();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("确定删除这条三餐记录吗？（关联消耗的可食用次数会加回冰箱）")) return;
    await mealApi.remove(id);
    await loadRecords();
  };

  const recordsOfDate = records.filter((r) => r.meal_date === date);

  return (
    <div className="page">
      <header className="page-header">
        <h1>三餐记录</h1>
      </header>

      <div className="date-nav">
        <button className="btn btn-sm btn-ghost" onClick={() => setDate(shiftDate(date, -1))}>
          ‹ 前一天
        </button>
        <input
          type="date"
          className="date-nav-input"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <button className="btn btn-sm btn-ghost" onClick={() => setDate(shiftDate(date, 1))}>
          后一天 ›
        </button>
        {date !== todayStr() && (
          <button className="btn btn-sm btn-ghost" onClick={() => setDate(todayStr())}>
            回到今天
          </button>
        )}
      </div>

      {(createMealType || editing) && (
        <div
          className="modal-overlay"
          onClick={() => {
            setCreateMealType(null);
            setEditing(null);
          }}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editing ? "编辑记录" : "记一顿饭"}</h2>
            <MealRecordForm
              initial={editing ?? undefined}
              defaultDate={date}
              defaultMealType={createMealType ?? undefined}
              onSubmit={editing ? handleUpdate : handleCreate}
              onCancel={() => {
                setCreateMealType(null);
                setEditing(null);
              }}
            />
          </div>
        </div>
      )}

      {loading && <p className="hint">加载中...</p>}
      {error && <p className="hint error">{error}</p>}

      {!loading && !error && (
        <div className="meal-day-columns">
          {MEAL_TYPES.map((mt) => {
            const items = recordsOfDate.filter((r) => r.meal_type === mt.value);
            return (
              <div key={mt.value} className="meal-day-column">
                <div className="meal-day-column-header">
                  <h3>{mt.label}</h3>
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={() => setCreateMealType(mt.value)}
                  >
                    + 添加
                  </button>
                </div>
                {items.length === 0 && <p className="hint">还没有记录</p>}
                {items.length > 0 && (
                  <div className="grid">
                    {items.map((record) => (
                      <MealRecordCard
                        key={record.id}
                        record={record}
                        onEdit={setEditing}
                        onDelete={handleDelete}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
