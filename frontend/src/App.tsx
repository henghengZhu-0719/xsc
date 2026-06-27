import { useState } from "react";
import { FridgePage } from "./pages/FridgePage";
import { MealRecordPage } from "./pages/MealRecordPage";
import "./App.css";

function App() {
  const [showFridge, setShowFridge] = useState(false);

  return (
    <div>
      <div className="app-bar">
        <span className="app-bar-title">
          <span className="ic ic-plate" />
          今日饮食
        </span>
        <button className="btn btn-ghost" onClick={() => setShowFridge(true)}>
          <span className="ic ic-fridge" />
          我的冰箱
        </button>
      </div>

      <MealRecordPage />

      {showFridge && (
        <div className="fridge-overlay">
          <FridgePage onClose={() => setShowFridge(false)} />
        </div>
      )}
    </div>
  );
}

export default App;
