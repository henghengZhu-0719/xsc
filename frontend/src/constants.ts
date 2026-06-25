export const CATEGORIES = ["肉", "蛋", "奶", "蔬菜", "水果", "主食"] as const;

export const FILTER_CATEGORIES = ["全部", "肉", "蛋", "奶", "蔬菜", "水果"] as const;

export const MEAL_TYPES = [
  { value: "breakfast", label: "早餐" },
  { value: "lunch", label: "午餐" },
  { value: "dinner", label: "晚餐" },
] as const;

export function mealTypeLabel(value: string): string {
  return MEAL_TYPES.find((m) => m.value === value)?.label ?? value;
}
