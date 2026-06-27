import { useState } from "react";
import { FridgePage } from "./pages/FridgePage";
import { MealRecordPage } from "./pages/MealRecordPage";
import "./App.css";

const TABS = [
  { key: "fridge", label: "我的冰箱", icon: "ic-fridge" },
  { key: "meals", label: "三餐记录", icon: "ic-plate" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

function App() {
  const [tab, setTab] = useState<TabKey>("fridge");

  return (
    <div>
      <nav className="tab-bar">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`tab-btn ${tab === t.key ? "tab-btn-active" : ""}`}
            onClick={() => setTab(t.key)}
          >
            <span className={`ic ${t.icon}`} />
            {t.label}
          </button>
        ))}
      </nav>

      {tab === "fridge" ? <FridgePage /> : <MealRecordPage />}
    </div>
  );
}

export default App;
