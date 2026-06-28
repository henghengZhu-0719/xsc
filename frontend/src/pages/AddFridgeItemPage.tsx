import { FridgeItemForm } from "../components/FridgeItemForm";
import type { FridgeItemInput } from "../types";

interface Props {
  onSubmit: (data: FridgeItemInput) => Promise<void>;
  onBack: () => void;
}

export function AddFridgeItemPage({ onSubmit, onBack }: Props) {
  return (
    <div className="fridge-overlay">
      <div className="page">
        <header className="page-header">
          <div className="page-header-left">
            <button className="btn btn-ghost btn-sm" onClick={onBack}>
              <span className="ic ic-chevron-left" />
              返回
            </button>
            <h1>添加食材</h1>
          </div>
        </header>
        <FridgeItemForm onSubmit={onSubmit} onCancel={onBack} />
      </div>
    </div>
  );
}
