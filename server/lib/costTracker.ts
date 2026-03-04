const COSTS = {
  free_generate: 0.08,
  pro_generate: 0.22,
  edit: 0.06,
} as const;

let dailySpend = 0;
let lastReset = new Date().toDateString();

export function trackCost(type: keyof typeof COSTS) {
  const today = new Date().toDateString();
  if (today !== lastReset) {
    dailySpend = 0;
    lastReset = today;
  }
  dailySpend += COSTS[type];
  if (dailySpend > 50) {
    console.warn(`[cost] ALERT: daily Gemini spend $${dailySpend.toFixed(2)} exceeds $50 — check for abuse`);
  }
}

export const getDailySpend = () => +dailySpend.toFixed(4);
