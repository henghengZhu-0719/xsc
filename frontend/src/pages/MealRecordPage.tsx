import { useEffect, useState } from "react";
import { mealApi } from "../api/meal";
import { MealRecordCard } from "../components/MealRecordCard";
import { MealRecordForm } from "../components/MealRecordForm";
import type { MealRecord, MealRecordInput } from "../types";

export function MealRecordPage() {
  const [records, setRecords] = useState<MealRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
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
    setShowCreate(false);
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

  return (
    <div className="page">
      <header className="page-header">
        <h1>三餐记录</h1>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          + 记一顿饭
        </button>
      </header>

      {(showCreate || editing) && (
        <div
          className="modal-overlay"
          onClick={() => {
            setShowCreate(false);
            setEditing(null);
          }}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editing ? "编辑记录" : "记一顿饭"}</h2>
            <MealRecordForm
              initial={editing ?? undefined}
              onSubmit={editing ? handleUpdate : handleCreate}
              onCancel={() => {
                setShowCreate(false);
                setEditing(null);
              }}
            />
          </div>
        </div>
      )}

      {loading && <p className="hint">加载中...</p>}
      {error && <p className="hint error">{error}</p>}
      {!loading && !error && records.length === 0 && (
        <p className="hint">还没有三餐记录，记一顿饭吧～</p>
      )}

      <div className="grid">
        {records.map((record) => (
          <MealRecordCard
            key={record.id}
            record={record}
            onEdit={setEditing}
            onDelete={handleDelete}
          />
        ))}
      </div>
    </div>
  );
}
