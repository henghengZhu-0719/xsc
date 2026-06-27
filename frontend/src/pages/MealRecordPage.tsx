import { useCallback, useEffect, useRef, useState } from "react";
import { aiApi, type DailySummaryData } from "../api/ai";
import { mealApi } from "../api/meal";
import { MealRecordCard } from "../components/MealRecordCard";
import { MealRecordForm } from "../components/MealRecordForm";
import { CATEGORY_EMOJI, MEAL_TYPES } from "../constants";
import type { MealRecord, MealRecordInput } from "../types";

const MEAL_ICONS: Record<string, string> = {
  breakfast: "ic-cup",
  lunch: "ic-sun",
  dinner: "ic-moon",
};

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function shiftDate(date: string, days: number): string {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function formatDateDisplay(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const days = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
  return `${d.getMonth() + 1}月${d.getDate()}日 ${days[d.getDay()]}`;
}

function formatUpdatedAt(iso: string): string {
  const d = new Date(iso);
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")} 更新`;
}

export function MealRecordPage() {
  const [records, setRecords] = useState<MealRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [date, setDate] = useState(todayStr());
  const [createMealType, setCreateMealType] = useState<string | null>(null);
  const [editing, setEditing] = useState<MealRecord | null>(null);
  const [showMealTypeChooser, setShowMealTypeChooser] = useState(false);

  const [summary, setSummary] = useState<DailySummaryData | null>(null);
  const [summaryUpdating, setSummaryUpdating] = useState(false);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const loadSummary = useCallback(async (d: string) => {
    const result = await aiApi.getSavedSummary(d).catch(() => null);
    setSummary(result);
  }, []);

  // After meal CRUD: poll until summary.updated_at is newer than triggerTime
  const pollUntilRefreshed = useCallback(
    (d: string, triggerTime: number, attempts = 0) => {
      if (attempts >= 12) {
        setSummaryUpdating(false);
        return;
      }
      pollTimerRef.current = setTimeout(async () => {
        const result = await aiApi.getSavedSummary(d).catch(() => null);
        if (result && new Date(result.updated_at).getTime() > triggerTime) {
          setSummary(result);
          setSummaryUpdating(false);
        } else {
          pollUntilRefreshed(d, triggerTime, attempts + 1);
        }
      }, 3000);
    },
    []
  );

  useEffect(() => {
    loadRecords();
  }, []);

  useEffect(() => {
    setSummary(null);
    setSummaryUpdating(false);
    if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    loadSummary(date);
  }, [date, loadSummary]);

  const afterMealOp = (opDate: string) => {
    const triggerTime = Date.now();
    setSummaryUpdating(true);
    if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    pollUntilRefreshed(opDate, triggerTime);
  };

  const handleCreate = async (data: MealRecordInput) => {
    await mealApi.create(data);
    setCreateMealType(null);
    await loadRecords();
    afterMealOp(data.meal_date);
  };

  const handleUpdate = async (data: MealRecordInput) => {
    if (!editing) return;
    await mealApi.update(editing.id, data);
    setEditing(null);
    await loadRecords();
    afterMealOp(data.meal_date);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("确定删除这条三餐记录吗？（关联消耗的可食用次数会加回冰箱）")) return;
    const record = records.find((r) => r.id === id);
    await mealApi.remove(id);
    await loadRecords();
    if (record) afterMealOp(record.meal_date);
  };

  const recordsOfDate = records.filter((r) => r.meal_date === date);
  const recordedTypes = MEAL_TYPES.filter((mt) =>
    recordsOfDate.some((r) => r.meal_type === mt.value)
  );
  const missingTypes = MEAL_TYPES.filter((mt) => !recordedTypes.includes(mt));

  const foodTotals = new Map<string, number>();
  recordsOfDate.forEach((r) =>
    r.items.forEach((item) => {
      foodTotals.set(
        item.food_name,
        (foodTotals.get(item.food_name) ?? 0) + item.portions_consumed
      );
    })
  );

  return (
    <div className="page">
      <div className="date-nav">
        <button
          className="date-nav-btn"
          aria-label="前一天"
          onClick={() => setDate(shiftDate(date, -1))}
        >
          <span className="ic ic-chevron-left" />
        </button>
        <div className="date-nav-center">
          <span className="date-nav-label">{formatDateDisplay(date)}</span>
          <input
            type="date"
            className="date-nav-input"
            value={date}
            max={todayStr()}
            onChange={(e) => {
              if (e.target.value <= todayStr()) setDate(e.target.value);
            }}
          />
        </div>
        <button
          className="date-nav-btn"
          aria-label="后一天"
          disabled={date >= todayStr()}
          onClick={() => setDate(shiftDate(date, 1))}
        >
          <span className="ic ic-chevron-right" />
        </button>
        {date !== todayStr() && (
          <button className="date-nav-today" onClick={() => setDate(todayStr())}>
            <span className="ic ic-today" />
            今天
          </button>
        )}
      </div>

      {!loading && !error && (
        <div className="day-summary">
          <div className="day-summary-text">
            <p className="day-summary-line">
              已记录：{recordedTypes.length}/3 餐
              {recordedTypes.length > 0 &&
                `（${recordedTypes.map((m) => m.label).join("、")}）`}
            </p>
            {missingTypes.length > 0 && (
              <p className="day-summary-line warning">
                未记录：{missingTypes.map((m) => m.label).join("、")}
              </p>
            )}
            {foodTotals.size > 0 && (
              <div className="day-summary-tags">
                {[...foodTotals.entries()].map(([name, qty]) => (
                  <span key={name} className="tag">
                    {name} ×{qty}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="day-summary-action">
            <button className="btn btn-primary" onClick={() => setShowMealTypeChooser(true)}>
              <span className="ic ic-plus" />
              记录一餐
            </button>
            {showMealTypeChooser && (
              <div className="meal-type-chooser">
                {MEAL_TYPES.map((mt) => (
                  <button
                    key={mt.value}
                    className="btn btn-sm btn-ghost"
                    onClick={() => {
                      setCreateMealType(mt.value);
                      setShowMealTypeChooser(false);
                    }}
                  >
                    <span className={`ic ${MEAL_ICONS[mt.value]}`} />
                    {mt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* AI 营养分析面板：有记录时始终展示 */}
      {!loading && !error && recordsOfDate.length > 0 && (
        <div className="ai-panel">
          <div className="ai-panel-header">
            <span className="ai-panel-title">
              <span className="ic ic-sparkle" />
              AI 营养分析
            </span>
            {summary && !summaryUpdating && (
              <span className="ai-panel-time">{formatUpdatedAt(summary.updated_at)}</span>
            )}
          </div>

          {summary && summary.categories.length > 0 && (
            <div className="ai-categories">
              <span className="ai-categories-label">今日摄入：</span>
              {summary.categories.map((cat) => (
                <span key={cat} className="tag ai-category-tag">
                  {CATEGORY_EMOJI[cat] ?? ""} {cat}
                </span>
              ))}
            </div>
          )}

          {summaryUpdating && (
            <div className="ai-loading">
              <span className="ic ic-sparkle ai-loading-icon" />
              AI 正在分析，稍等片刻…
            </div>
          )}

          {!summaryUpdating && summary && (
            <div className="ai-summary-text">
              {summary.summary_text.split("\n").filter(Boolean).map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>
          )}

          {!summaryUpdating && !summary && (
            <p className="ai-hint">记录完餐后 AI 将自动生成今日饮食分析</p>
          )}
        </div>
      )}

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
        <div className="meal-day-list">
          {MEAL_TYPES.map((mt) => {
            const record = recordsOfDate.find((r) => r.meal_type === mt.value);
            return (
              <div key={mt.value} className="meal-day-row">
                <div className="meal-day-row-header">
                  <h3>
                    <span className={`ic ${MEAL_ICONS[mt.value]}`} />
                    {mt.label}
                  </h3>
                  {!record && (
                    <button
                      className="btn btn-sm btn-ghost"
                      onClick={() => setCreateMealType(mt.value)}
                    >
                      <span className="ic ic-plus" />
                      添加{mt.label}
                    </button>
                  )}
                </div>

                {!record && (
                  <p className="meal-day-empty-text">
                    还没记录{mt.label}，添加今天吃的食物吧
                  </p>
                )}

                {record && (
                  <MealRecordCard
                    record={record}
                    onEdit={setEditing}
                    onDelete={handleDelete}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
