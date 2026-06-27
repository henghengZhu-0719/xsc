import { useEffect, useState } from "react";
import { fridgeApi } from "../api/fridge";
import { CategoryFilter } from "../components/CategoryFilter";
import { FridgeItemCard } from "../components/FridgeItemCard";
import { FridgeItemForm } from "../components/FridgeItemForm";
import { FoodTemplatePage } from "./FoodTemplatePage";
import type { FridgeItem, FridgeItemInput } from "../types";

export function FridgePage() {
  const [items, setItems] = useState<FridgeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [category, setCategory] = useState("全部");

  const loadItems = async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await fridgeApi.list());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const handleCreate = async (data: FridgeItemInput) => {
    await fridgeApi.create(data);
    setShowForm(false);
    await loadItems();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("确定删除这个食材吗？")) return;
    await fridgeApi.remove(id);
    await loadItems();
  };

  const handleConsume = async (item: FridgeItem) => {
    await fridgeApi.update(item.id, {
      portions_remaining: item.portions_remaining - 1,
    });
    await loadItems();
  };

  const visibleItems =
    category === "全部" ? items : items.filter((item) => item.category === category);

  return (
    <div className="page">
      <header className="page-header">
        <h1>我的冰箱</h1>
        <div className="header-actions">
          <button className="btn btn-ghost" onClick={() => setShowTemplates(true)}>
            <span className="ic ic-template" />
            常用食物模板
          </button>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            <span className="ic ic-plus" />
            添加食材
          </button>
        </div>
      </header>

      <CategoryFilter value={category} onChange={setCategory} />

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>添加食材</h2>
            <FridgeItemForm onSubmit={handleCreate} onCancel={() => setShowForm(false)} />
          </div>
        </div>
      )}

      {showTemplates && (
        <div className="modal-overlay" onClick={() => setShowTemplates(false)}>
          <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
            <FoodTemplatePage />
          </div>
        </div>
      )}

      {loading && <p className="hint">加载中...</p>}
      {error && <p className="hint error">{error}</p>}
      {!loading && !error && items.length === 0 && (
        <p className="hint">冰箱还是空的，添加一些食材吧～</p>
      )}
      {!loading && !error && items.length > 0 && visibleItems.length === 0 && (
        <p className="hint">这个分类下还没有食材</p>
      )}

      <div className="grid">
        {visibleItems.map((item) => (
          <FridgeItemCard
            key={item.id}
            item={item}
            onDelete={handleDelete}
            onConsume={handleConsume}
          />
        ))}
      </div>
    </div>
  );
}
