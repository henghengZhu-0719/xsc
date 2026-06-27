import type { MealRecord, MealRecordInput } from "../types";

const BASE_URL = "";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.detail ?? `请求失败：${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const mealApi = {
  list: () => request<MealRecord[]>("/meal-records"),
  create: (data: MealRecordInput) =>
    request<MealRecord>("/meal-records", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: number, data: Partial<MealRecordInput>) =>
    request<MealRecord>(`/meal-records/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  remove: (id: number) =>
    request<void>(`/meal-records/${id}`, { method: "DELETE" }),
};
