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

export interface FridgeItemInput {
  name: string;
  category?: string | null;
  quantity: number;
  unit?: string | null;
  portions_total: number;
  expire_date?: string | null;
}
