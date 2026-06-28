import { FoodTemplateForm } from "../components/FoodTemplateForm";
import type { FoodTemplate, FoodTemplateInput } from "../types";

interface Props {
  initial?: FoodTemplate;
  onSubmit: (data: FoodTemplateInput) => Promise<void>;
  onBack: () => void;
}

export function AddEditTemplatePage({ initial, onSubmit, onBack }: Props) {
  return (
    <div className="fridge-overlay">
      <div className="page">
        <header className="page-header">
          <div className="page-header-left">
            <button className="btn btn-ghost btn-sm" onClick={onBack}>
              <span className="ic ic-chevron-left" />
              返回
            </button>
            <h1>{initial ? "编辑模板" : "新增模板"}</h1>
          </div>
        </header>
        <FoodTemplateForm initial={initial} onSubmit={onSubmit} onCancel={onBack} />
      </div>
    </div>
  );
}
