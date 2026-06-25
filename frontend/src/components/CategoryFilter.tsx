import { FILTER_CATEGORIES } from "../constants";

interface Props {
  value: string;
  onChange: (value: string) => void;
}

export function CategoryFilter({ value, onChange }: Props) {
  return (
    <div className="filter-bar">
      {FILTER_CATEGORIES.map((c) => (
        <button
          key={c}
          className={`filter-btn ${value === c ? "filter-btn-active" : ""}`}
          onClick={() => onChange(c)}
        >
          {c}
        </button>
      ))}
    </div>
  );
}
