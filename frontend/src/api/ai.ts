const BASE_URL = "";

export interface DailySummaryData {
  summary_date: string;
  summary_text: string;
  categories: string[];
  updated_at: string;
}

export const aiApi = {
  getSavedSummary: async (date: string): Promise<DailySummaryData | null> => {
    const res = await fetch(`${BASE_URL}/daily-summaries/${date}`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`请求失败：${res.status}`);
    return res.json();
  },
};
