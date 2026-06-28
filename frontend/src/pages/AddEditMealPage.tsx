import { MealRecordForm } from "../components/MealRecordForm";
import type { MealRecord, MealRecordInput } from "../types";

interface Props {
  initial?: MealRecord;
  defaultDate?: string;
  defaultMealType?: string;
  onSubmit: (data: MealRecordInput) => Promise<void>;
  onBack: () => void;
}

export function AddEditMealPage({ initial, defaultDate, defaultMealType, onSubmit, onBack }: Props) {
  return (
    <div className="fridge-overlay">
      <div className="page">
        <header className="page-header">
          <div className="page-header-left">
            <button className="btn btn-ghost btn-sm" onClick={onBack}>
              <span className="ic ic-chevron-left" />
              返回
            </button>
            <h1>{initial ? "编辑记录" : "记一顿饭"}</h1>
          </div>
        </header>
        <MealRecordForm
          initial={initial}
          defaultDate={defaultDate}
          defaultMealType={defaultMealType}
          onSubmit={onSubmit}
          onCancel={onBack}
        />
      </div>
    </div>
  );
}
