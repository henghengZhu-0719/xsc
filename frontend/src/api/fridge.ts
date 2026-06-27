import type { FridgeItem, FridgeItemInput } from "../types";

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

export const fridgeApi = {
  list: () => request<FridgeItem[]>("/fridge/items"),
  create: (data: FridgeItemInput) =>
    request<FridgeItem>("/fridge/items", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: number, data: Partial<FridgeItemInput & { portions_remaining: number }>) =>
    request<FridgeItem>(`/fridge/items/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  remove: (id: number) =>
    request<void>(`/fridge/items/${id}`, { method: "DELETE" }),
};
