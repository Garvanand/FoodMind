# FoodMind

FoodMind is a consolidated, unified mobile-first React application that integrates health tracking, food logging, and AI-powered insights. It merges features from three prior applications (Nutriscan, Vitaltrack, and Vitality Health Dashboard) into a seamless, dark-themed interface with dynamic micro-animations.

## 🚀 Features

- **Home Dashboard**: View daily calories, activity status, heart rate analysis, and real-time AI craving predictions.
- **AI Food Log**: Log your meals and instantly see a Contextual Regret Predictor bottom sheet. Includes a beautiful flower petal macronutrient visualizer.
- **Contextual Food Scorer**: Search for any food to receive an AI-generated score, suitability analysis, and smart swaps based on your current physical and emotional state.
- **Insights & Habit Loops**: Track sleep, mood, and work/life balance metrics. Generate AI weekly reports and detect hidden habit loops over time.
- **Profile Management**: Manage goals, daily caloric targets, and view overall app statistics.

## 🛠️ Technology Stack

- **Framework**: React 19 + Vite
- **Styling**: Tailwind CSS v4
- **Animations**: Framer Motion
- **Charts**: Recharts
- **Icons**: Lucide React
- **AI Integration**: Google Gemini 2.0 Flash API

## 📦 Installation & Setup

1. **Install Dependencies**
   \`\`\`bash
   npm install
   \`\`\`

2. **Configure Environment Variables**
   Ensure your `.env` file contains your Gemini API key:
   \`\`\`env
   VITE_GEMINI_API_KEY=your_google_gemini_api_key
   \`\`\`

3. **Run Development Server**
   \`\`\`bash
   npm run dev
   \`\`\`
   The app will typically run on \`http://localhost:3000\` (or \`3001\`).

## 🧠 AI Features Powered by Gemini

FoodMind integrates 5 specific AI use-cases:
1. **Craving Predictor**: Evaluates time, mood, and activity to anticipate your next craving and suggest healthy alternatives.
2. **Contextual Food Scorer**: Scores any potential food based on your real-time physiological state (post-workout, stress, etc.).
3. **Habit Loop Detector**: Analyzes your weekly food logs to uncover behavioral cues, routines, and rewards.
4. **Food Regret Predictor**: Upon logging a meal, predicts the likelihood of subsequent regret and offers a mindful reflection prompt.
5. **Weekly Behavior Report**: Summarizes your week with an overall score, positive patterns, mood-food correlations, and micro-challenges.
