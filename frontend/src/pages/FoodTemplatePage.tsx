import { useEffect, useState } from "react";
import { foodTemplateApi } from "../api/foodTemplate";
import { CategoryFilter } from "../components/CategoryFilter";
import { FoodTemplateForm } from "../components/FoodTemplateForm";
import type { FoodTemplate, FoodTemplateInput } from "../types";

export function FoodTemplatePage() {
  const [templates, setTemplates] = useState<FoodTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<FoodTemplate | null>(null);
  const [category, setCategory] = useState("全部");

  const loadTemplates = async () => {
    setLoading(true);
    setError(null);
    try {
      setTemplates(await foodTemplateApi.list());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const handleCreate = async (data: FoodTemplateInput) => {
    await foodTemplateApi.create(data);
    setShowCreate(false);
    await loadTemplates();
  };

  const handleUpdate = async (data: FoodTemplateInput) => {
    if (!editing) return;
    await foodTemplateApi.update(editing.id, data);
    setEditing(null);
    await loadTemplates();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("确定删除这个食物模板吗？")) return;
    await foodTemplateApi.remove(id);
    await loadTemplates();
  };

  const visibleTemplates =
    category === "全部"
      ? templates
      : templates.filter((t) => t.category === category);

  return (
    <div className="page">
      <header className="page-header">
        <h1>常用食物模板</h1>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          + 新增模板
        </button>
      </header>

      <p className="form-hint">
        新增冰箱食材时，会按这里的分类/单位/可食用次数自动推算，无需重复填写。
      </p>

      <CategoryFilter value={category} onChange={setCategory} />

      {(showCreate || editing) && (
        <div
          className="modal-overlay"
          onClick={() => {
            setShowCreate(false);
            setEditing(null);
          }}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editing ? "编辑模板" : "新增模板"}</h2>
            <FoodTemplateForm
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
      {!loading && !error && templates.length === 0 && (
        <p className="hint">还没有模板，添加一个吧～</p>
      )}
      {!loading && !error && templates.length > 0 && visibleTemplates.length === 0 && (
        <p className="hint">这个分类下还没有模板</p>
      )}

      {!loading && !error && visibleTemplates.length > 0 && (
        <table className="template-table">
          <thead>
            <tr>
              <th>名称</th>
              <th>分类</th>
              <th>默认单位</th>
              <th>每单位可食用次数</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {visibleTemplates.map((t) => (
              <tr key={t.id}>
                <td>{t.name}</td>
                <td>{t.category ?? "-"}</td>
                <td>{t.default_unit ?? "-"}</td>
                <td>{t.portions_per_unit}</td>
                <td className="template-table-actions">
                  <button className="btn btn-sm btn-ghost" onClick={() => setEditing(t)}>
                    编辑
                  </button>
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => handleDelete(t.id)}
                  >
                    删除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
