// ─── FoodMind localStorage Data Model ───

export interface MealEntry {
  id: string;
  foodName: string;
  weight?: number;
  ingredients?: string[];
  macros?: { carbs: number; protein: number; fats: number; calories: number };
  timestamp: number;
  moodAtTime?: string;
  contextScore?: number;
  regretResponse?: {
    regretProbability: string;
    probabilityPercent: number;
    personalReason: string;
    reflectionQuestion: string;
    betterAlternative: string | null;
  } | null;
}

export interface ActivityEntry {
  gymToday: boolean;
  stressLevel: number;
}

export interface UserProfile {
  name: string;
  goalType: string;
}

const KEYS = {
  meals: 'foodmind_meals',
  moods: 'foodmind_moods',
  activity: 'foodmind_activity',
  insightsCache: 'foodmind_insights_cache',
  user: 'foodmind_user',
};

// ─── Meals ───
export function saveMeal(meal: MealEntry): void {
  const meals = getAllMeals();
  meals.push(meal);
  localStorage.setItem(KEYS.meals, JSON.stringify(meals));
}

export function getAllMeals(): MealEntry[] {
  try {
    return JSON.parse(localStorage.getItem(KEYS.meals) || '[]');
  } catch { return []; }
}

export function getTodayMeals(): MealEntry[] {
  const today = new Date().toDateString();
  return getAllMeals().filter(m => new Date(m.timestamp).toDateString() === today);
}

export function getWeekMeals(weekOffset = 0): MealEntry[] {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay() - weekOffset * 7);
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);
  return getAllMeals().filter(m => m.timestamp >= startOfWeek.getTime() && m.timestamp < endOfWeek.getTime());
}

export function getLastMealHoursAgo(): number {
  const meals = getAllMeals();
  if (meals.length === 0) return 99;
  const last = Math.max(...meals.map(m => m.timestamp));
  return Math.round((Date.now() - last) / (1000 * 60 * 60));
}

// ─── Moods ───
export function saveMood(date: string, emoji: string): void {
  const moods = getMoods();
  moods[date] = emoji;
  localStorage.setItem(KEYS.moods, JSON.stringify(moods));
}

export function getMoods(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(KEYS.moods) || '{}');
  } catch { return {}; }
}

export function getTodayMood(): string {
  const today = new Date().toISOString().split('T')[0];
  return getMoods()[today] || '😊';
}

// ─── Activity ───
export function saveActivity(date: string, activity: ActivityEntry): void {
  const all = getActivities();
  all[date] = activity;
  localStorage.setItem(KEYS.activity, JSON.stringify(all));
}

export function getActivities(): Record<string, ActivityEntry> {
  try {
    return JSON.parse(localStorage.getItem(KEYS.activity) || '{}');
  } catch { return {}; }
}

export function getTodayActivity(): ActivityEntry {
  const today = new Date().toISOString().split('T')[0];
  return getActivities()[today] || { gymToday: false, stressLevel: 3 };
}

// ─── Insights Cache ───
export function getCachedInsight(weekKey: string): any | null {
  try {
    const cache = JSON.parse(localStorage.getItem(KEYS.insightsCache) || '{}');
    return cache[weekKey] || null;
  } catch { return null; }
}

export function setCachedInsight(weekKey: string, data: any): void {
  try {
    const cache = JSON.parse(localStorage.getItem(KEYS.insightsCache) || '{}');
    cache[weekKey] = data;
    localStorage.setItem(KEYS.insightsCache, JSON.stringify(cache));
  } catch { /* ignore */ }
}

export function getCurrentWeekKey(): string {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const weekNo = Math.ceil(((now.getTime() - start.getTime()) / 86400000 + start.getDay() + 1) / 7);
  return `${now.getFullYear()}-W${weekNo}`;
}

// ─── User Profile ───
export function getUserProfile(): UserProfile {
  try {
    return JSON.parse(localStorage.getItem(KEYS.user) || '{"name":"Garv","goalType":"balanced"}');
  } catch { return { name: 'Garv', goalType: 'balanced' }; }
}

export function saveUserProfile(profile: UserProfile): void {
  localStorage.setItem(KEYS.user, JSON.stringify(profile));
}

// ─── ID Generator ───
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
