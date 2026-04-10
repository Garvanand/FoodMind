// ─── Gemini API Service for FoodMind ───

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "AIzaSyDCgnYU08DGj0aOIDvODHz288ARxqU1gO4";
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

export async function callGemini(prompt: string): Promise<any> {
  const response = await fetch(GEMINI_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 500,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  return JSON.parse(data.candidates[0].content.parts[0].text);
}

// ─── Feature 1: Craving Predictor ───
export interface CravingPrediction {
  cravingType: string;
  reason: string;
  healthyAlternative: string;
  nudgeMessage: string;
  contextScore: number;
}

export async function predictCraving(context: {
  currentHour: number;
  dayOfWeek: string;
  lastMealHoursAgo: number;
  todayMoodEmoji: string;
  activityLevel: string;
}): Promise<CravingPrediction> {
  const prompt = `You are FoodMind's craving prediction AI.
User context: Time=${context.currentHour}:00, Day=${context.dayOfWeek}, Last meal=${context.lastMealHoursAgo}h ago, Mood=${context.todayMoodEmoji}, Activity today=${context.activityLevel}.
Respond ONLY in this exact JSON:
{
  "cravingType": "string (e.g. 'Savory + Warm')",
  "reason": "string (one sentence, personal)",
  "healthyAlternative": "string (one food suggestion)",
  "nudgeMessage": "string (friendly pre-emptive message, max 12 words)",
  "contextScore": "number (0-100)"
}`;
  return callGemini(prompt);
}

// ─── Feature 2: Contextual Food Scorer ───
export interface FoodScoreResult {
  score: number;
  scoreLabel: string;
  scoreColor: string;
  contextChips: string[];
  modificationTip: string;
  smartSwap: string;
  regretProbability: string;
  regretReason: string;
}

export async function scoreFoodContextually(
  foodName: string,
  context: {
    hour: number;
    postWorkout: boolean;
    stress: number;
    sleep: number;
    nextActivity: string;
  }
): Promise<FoodScoreResult> {
  const prompt = `You are a contextual food advisor. Score this food for right NOW.
Food: ${foodName}
Context: Time=${context.hour}:00, Post-workout=${context.postWorkout}, Stress level=${context.stress}/10, Sleep last night=${context.sleep}h, Next activity in 3h=${context.nextActivity}
Respond ONLY in this JSON:
{
  "score": "number (0-100)",
  "scoreLabel": "string ('Great right now' | 'Decent choice' | 'Maybe later')",
  "scoreColor": "string ('green' | 'amber' | 'red')",
  "contextChips": ["array of 3 strings"],
  "modificationTip": "string (one line)",
  "smartSwap": "string (one healthier alternative with same craving)",
  "regretProbability": "string ('Low' | 'Medium' | 'High')",
  "regretReason": "string (one sentence based on context)"
}`;
  return callGemini(prompt);
}

// ─── Feature 3: Habit Loop Detector ───
export interface HabitLoopResult {
  habitLoops: {
    cue: string;
    routine: string;
    reward: string;
    intervention: string;
    severity: 'high' | 'medium' | 'low';
  }[];
  topPattern: string;
}

export async function detectHabitLoops(weekLog: string): Promise<HabitLoopResult> {
  const prompt = `You are a behavioral food psychologist.
Analyze this 7-day eating log and find habit loops.
Log: ${weekLog}
Respond ONLY in this JSON:
{
  "habitLoops": [
    {
      "cue": "string",
      "routine": "string",
      "reward": "string",
      "intervention": "string",
      "severity": "'high' | 'medium' | 'low'"
    }
  ] (exactly 3 loops),
  "topPattern": "string (one sentence summary)"
}`;
  return callGemini(prompt);
}

// ─── Feature 4: Food Regret Predictor ───
export interface RegretPrediction {
  regretProbability: string;
  probabilityPercent: number;
  personalReason: string;
  reflectionQuestion: string;
  betterAlternative: string | null;
}

export async function predictRegret(
  foodName: string,
  currentTime: string,
  dayOfWeek: string,
  last5MealsContext: string,
  mood: string
): Promise<RegretPrediction> {
  const prompt = `User just logged: ${foodName} at ${currentTime} on ${dayOfWeek}.
Their eating profile: ${last5MealsContext}
Mood right now: ${mood}
Respond ONLY in this JSON:
{
  "regretProbability": "'Low' | 'Medium' | 'High'",
  "probabilityPercent": "number",
  "personalReason": "string (reference their actual pattern, one sentence)",
  "reflectionQuestion": "string (a genuine question, not a lecture, max 15 words)",
  "betterAlternative": "string or null (only if High regret)"
}`;
  return callGemini(prompt);
}

// ─── Feature 5: Weekly Behavior Report ───
export interface WeeklyReport {
  positivePattern: string;
  hiddenTrigger: string;
  moodFoodCorrelation: string;
  microHabitChallenge: string;
  streakWorthProtecting: string;
  weekScore: number;
  weekScoreLabel: string;
}

export async function generateWeeklyReport(weekSummary: string): Promise<WeeklyReport> {
  const prompt = `You are FoodMind's weekly behavioral coach.
Week data: ${weekSummary}
Respond ONLY in this JSON:
{
  "positivePattern": "string (specific, not generic praise)",
  "hiddenTrigger": "string (something they probably don't know about themselves)",
  "moodFoodCorrelation": "string (one emotion + the food choice it caused)",
  "microHabitChallenge": "string (so small it feels impossible to fail)",
  "streakWorthProtecting": "string (good habit they built this week)",
  "weekScore": "number (0-100)",
  "weekScoreLabel": "string"
}`;
  return callGemini(prompt);
}
