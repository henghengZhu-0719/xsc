export interface FridgeItem {
  id: number;
  name: string;
  category: string | null;
  quantity: number;
  unit: string | null;
  portions_total: number;
  portions_remaining: number;
  expire_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface FoodTemplate {
  id: number;
  name: string;
  category: string | null;
  default_unit: string | null;
  portions_per_unit: number;
  created_at: string;
  updated_at: string;
}

export interface FoodTemplateInput {
  name: string;
  category?: string | null;
  default_unit?: string | null;
  portions_per_unit?: number;
}

export interface FridgeItemInput {
  name: string;
  quantity: number;
  category?: string | null;
  unit?: string | null;
  portions_total?: number | null;
  expire_date?: string | null;
}

export interface MealRecordItem {
  id: number;
  fridge_item_id: number | null;
  food_name: string;
  portions_consumed: number;
}

export interface MealRecordItemInput {
  fridge_item_id: number;
  portions_consumed: number;
}

export interface MealRecord {
  id: number;
  meal_date: string;
  meal_type: string;
  note: string | null;
  extra_food: string | null;
  items: MealRecordItem[];
  created_at: string;
  updated_at: string;
}

export interface MealRecordInput {
  meal_date: string;
  meal_type: string;
  note?: string | null;
  extra_food?: string | null;
  items?: MealRecordItemInput[];
}
