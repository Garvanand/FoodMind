import { GoogleGenAI, Type, Schema } from "@google/genai";

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "AIzaSyDCgnYU08DGj0aOIDvODHz288ARxqU1gO4";
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
const MODEL_NAME = "gemini-2.0-flash";

// ─── Shared Helper to execute structured JSON calls ───
export async function callGeminiStructured<T>(prompt: string, schema: Schema): Promise<T> {
  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    config: {
      temperature: 0.7,
      maxOutputTokens: 500,
      responseMimeType: "application/json",
      responseSchema: schema,
    },
  });

  const text = response.text;
  if (!text) throw new Error("No response from AI");
  return JSON.parse(text) as T;
}

// ─── Image Analyzer ───
export interface NutritionalInfo {
  foodName: string;
  calories: number;
  carbs: number;
  protein: number;
  fats: number;
  servingSize: string;
}

export async function analyzeFoodImage(base64Image: string): Promise<NutritionalInfo> {
  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      foodName: { type: Type.STRING },
      calories: { type: Type.NUMBER },
      carbs: { type: Type.NUMBER },
      protein: { type: Type.NUMBER },
      fats: { type: Type.NUMBER },
      servingSize: { type: Type.STRING },
    },
    required: ["foodName", "calories", "carbs", "protein", "fats", "servingSize"],
  };

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: [
      {
        role: 'user',
        parts: [
          { inlineData: { mimeType: "image/jpeg", data: base64Image.split(",")[1] } },
          { text: "Analyze this food image and provide nutritional information. Be as accurate as possible based on visual estimation." }
        ]
      }
    ],
    config: {
      temperature: 0.4,
      responseMimeType: "application/json",
      responseSchema: schema,
    },
  });

  const text = response.text;
  if (!text) throw new Error("No image analysis response");
  return JSON.parse(text) as NutritionalInfo;
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
User context: Time=${context.currentHour}:00, Day=${context.dayOfWeek}, Last meal=${context.lastMealHoursAgo}h ago, Mood=${context.todayMoodEmoji}, Activity today=${context.activityLevel}.`;

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      cravingType: { type: Type.STRING, description: "e.g. 'Savory + Warm'" },
      reason: { type: Type.STRING, description: "One sentence, personal reason based on time/mood/activity" },
      healthyAlternative: { type: Type.STRING, description: "One food suggestion" },
      nudgeMessage: { type: Type.STRING, description: "Friendly pre-emptive message, max 12 words" },
      contextScore: { type: Type.NUMBER, description: "Confidence score 0-100" }
    },
    required: ["cravingType", "reason", "healthyAlternative", "nudgeMessage", "contextScore"]
  };

  return callGeminiStructured<CravingPrediction>(prompt, schema);
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
Context: Time=${context.hour}:00, Post-workout=${context.postWorkout}, Stress level=${context.stress}/10, Sleep last night=${context.sleep}h, Next activity in 3h=${context.nextActivity}`;

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      score: { type: Type.NUMBER, description: "0-100" },
      scoreLabel: { type: Type.STRING, description: "'Great right now' | 'Decent choice' | 'Maybe later'" },
      scoreColor: { type: Type.STRING, description: "'green' | 'amber' | 'red'" },
      contextChips: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3 string factors for the score" },
      modificationTip: { type: Type.STRING, description: "One line tip" },
      smartSwap: { type: Type.STRING, description: "One healthier alternative with same craving" },
      regretProbability: { type: Type.STRING, description: "'Low' | 'Medium' | 'High'" },
      regretReason: { type: Type.STRING, description: "One sentence constraint explanation based on context" }
    },
    required: ["score", "scoreLabel", "scoreColor", "contextChips", "modificationTip", "smartSwap", "regretProbability", "regretReason"]
  };

  return callGeminiStructured<FoodScoreResult>(prompt, schema);
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
  const prompt = `You are a behavioral food psychologist. Analyze this 7-day eating log and find habit loops.
Log: ${weekLog}`;

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      habitLoops: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            cue: { type: Type.STRING },
            routine: { type: Type.STRING },
            reward: { type: Type.STRING },
            intervention: { type: Type.STRING },
            severity: { type: Type.STRING, description: "'high' | 'medium' | 'low'" }
          },
          required: ["cue", "routine", "reward", "intervention", "severity"]
        },
        description: "Exactly 3 loops"
      },
      topPattern: { type: Type.STRING, description: "One sentence summary" }
    },
    required: ["habitLoops", "topPattern"]
  };

  return callGeminiStructured<HabitLoopResult>(prompt, schema);
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
Mood right now: ${mood}`;

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      regretProbability: { type: Type.STRING, description: "'Low' | 'Medium' | 'High'" },
      probabilityPercent: { type: Type.NUMBER },
      personalReason: { type: Type.STRING, description: "Reference their actual pattern, one sentence" },
      reflectionQuestion: { type: Type.STRING, description: "A genuine question, not a lecture, max 15 words" },
      betterAlternative: { type: Type.STRING, description: "String, or null/empty if low regret" }
    },
    required: ["regretProbability", "probabilityPercent", "personalReason", "reflectionQuestion"]
  };

  const res = await callGeminiStructured<RegretPrediction>(prompt, schema);
  if (!res.betterAlternative || res.betterAlternative.trim() === "null" || res.betterAlternative.trim() === "") {
    res.betterAlternative = null;
  }
  return res;
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
Week data: ${weekSummary}`;

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      positivePattern: { type: Type.STRING, description: "Specific, not generic praise" },
      hiddenTrigger: { type: Type.STRING, description: "Something they probably don't know about themselves" },
      moodFoodCorrelation: { type: Type.STRING, description: "One emotion + the food choice it caused" },
      microHabitChallenge: { type: Type.STRING, description: "So small it feels impossible to fail" },
      streakWorthProtecting: { type: Type.STRING, description: "Good habit they built this week" },
      weekScore: { type: Type.NUMBER, description: "0-100" },
      weekScoreLabel: { type: Type.STRING }
    },
    required: ["positivePattern", "hiddenTrigger", "moodFoodCorrelation", "microHabitChallenge", "streakWorthProtecting", "weekScore", "weekScoreLabel"]
  };

  return callGeminiStructured<WeeklyReport>(prompt, schema);
}
