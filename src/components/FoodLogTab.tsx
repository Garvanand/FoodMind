import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Flame, Zap, Droplets, ChevronRight, X, Apple } from 'lucide-react';
import { cn } from '../lib/utils';
import { AiSkeleton, ErrorToast } from './AiSkeleton';
import { predictRegret, RegretPrediction } from '../lib/gemini';
import { saveMeal, getAllMeals, getTodayMeals, getTodayMood, generateId } from '../lib/storage';
import type { MealEntry } from '../lib/storage';

const SAMPLE_FOODS = [
  { name: 'Avocado Toast', cal: 340, carbs: 28, protein: 12, fats: 22, img: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=100&h=100&fit=crop' },
  { name: 'Grilled Salmon', cal: 520, carbs: 5, protein: 46, fats: 34, img: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=100&h=100&fit=crop' },
  { name: 'Greek Salad', cal: 210, carbs: 12, protein: 8, fats: 16, img: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=100&h=100&fit=crop' },
  { name: 'Chicken Rice Bowl', cal: 480, carbs: 55, protein: 35, fats: 12, img: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=100&h=100&fit=crop' },
  { name: 'Protein Smoothie', cal: 280, carbs: 30, protein: 28, fats: 6, img: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=100&h=100&fit=crop' },
];

export default function FoodLogTab() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [customFood, setCustomFood] = useState('');
  const [todayMeals, setTodayMeals] = useState<MealEntry[]>(getTodayMeals());
  const [regretSheet, setRegretSheet] = useState<RegretPrediction | null>(null);
  const [regretLoading, setRegretLoading] = useState(false);
  const [regretError, setRegretError] = useState(false);
  const [lastLoggedFood, setLastLoggedFood] = useState('');

  const totalCal = todayMeals.reduce((s, m) => s + (m.macros?.calories || 0), 0);
  const totalCarbs = todayMeals.reduce((s, m) => s + (m.macros?.carbs || 0), 0);
  const totalProtein = todayMeals.reduce((s, m) => s + (m.macros?.protein || 0), 0);
  const totalFats = todayMeals.reduce((s, m) => s + (m.macros?.fats || 0), 0);

  const logFood = async (food: typeof SAMPLE_FOODS[0]) => {
    const meal: MealEntry = {
      id: generateId(),
      foodName: food.name,
      macros: { calories: food.cal, carbs: food.carbs, protein: food.protein, fats: food.fats },
      timestamp: Date.now(),
      moodAtTime: getTodayMood(),
    };
    saveMeal(meal);
    setTodayMeals(getTodayMeals());
    setShowAddModal(false);
    setLastLoggedFood(food.name);

    // AI Feature 4: Food Regret Predictor — trigger 2s after logging
    setTimeout(() => triggerRegretPredictor(food.name), 2000);
  };

  const logCustomFood = () => {
    if (!customFood.trim()) return;
    const meal: MealEntry = {
      id: generateId(),
      foodName: customFood.trim(),
      macros: { calories: 300, carbs: 30, protein: 15, fats: 10 },
      timestamp: Date.now(),
      moodAtTime: getTodayMood(),
    };
    saveMeal(meal);
    setTodayMeals(getTodayMeals());
    setShowAddModal(false);
    setLastLoggedFood(customFood.trim());
    setCustomFood('');
    setTimeout(() => triggerRegretPredictor(customFood.trim()), 2000);
  };

  const triggerRegretPredictor = async (foodName: string) => {
    setRegretLoading(true);
    setRegretError(false);
    try {
      const now = new Date();
      const allMeals = getAllMeals();
      const last5 = allMeals.slice(-5).map(m => `${m.foodName} at ${new Date(m.timestamp).toLocaleTimeString()}`).join(', ');
      const result = await predictRegret(
        foodName,
        now.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' }),
        now.toLocaleDateString('en', { weekday: 'long' }),
        last5 || 'No prior meals logged',
        getTodayMood()
      );
      setRegretSheet(result);
    } catch {
      setRegretError(true);
      setRegretSheet({
        regretProbability: 'Low',
        probabilityPercent: 20,
        personalReason: 'This seems like a reasonable choice for this time of day.',
        reflectionQuestion: 'Are you eating because you\'re hungry or bored?',
        betterAlternative: null,
      });
    } finally {
      setRegretLoading(false);
    }
  };

  const dismissRegret = () => {
    setRegretSheet(null);
    setRegretLoading(false);
  };

  const regretColor = (prob: string) => {
    if (prob === 'High') return 'text-accent-red';
    if (prob === 'Medium') return 'text-accent-cream';
    return 'text-accent-lime';
  };

  const regretBg = (prob: string) => {
    if (prob === 'High') return 'bg-accent-red/20';
    if (prob === 'Medium') return 'bg-accent-cream/20';
    return 'bg-accent-lime/20';
  };

  return (
    <div className="px-5 pt-3 pb-6 space-y-5 relative">
      {regretError && <ErrorToast message="AI unavailable — showing cached data" />}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Food Log</h1>
          <p className="text-[11px] text-white/40">Track what you eat today</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="w-11 h-11 rounded-full bg-accent-lime flex items-center justify-center shadow-lg shadow-accent-lime/30"
        >
          <Plus className="w-6 h-6 text-black" />
        </button>
      </div>

      {/* Flower Petal Ingredient Visualizer — 6 petals, 60° apart */}
      <div className="flex justify-center py-2">
        <div className="relative w-40 h-40">
          {/* Center circle */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-accent-lime/20 border-2 border-accent-lime/30 flex items-center justify-center z-10">
            <span className="text-[10px] font-bold text-accent-lime uppercase">
              {totalCal || 0}
            </span>
          </div>
          {/* 6 petals at 0°, 60°, 120°, 180°, 240°, 300° */}
          {[
            { angle: 0, label: 'Carbs', value: `${totalCarbs}g`, color: '#f59e0b' },
            { angle: 60, label: 'Protein', value: `${totalProtein}g`, color: '#3b82f6' },
            { angle: 120, label: 'Fats', value: `${totalFats}g`, color: '#f43f5e' },
            { angle: 180, label: 'Fiber', value: '8g', color: '#C8F069' },
            { angle: 240, label: 'Sugar', value: '12g', color: '#E8D5A3' },
            { angle: 300, label: 'Water', value: '2L', color: '#00BFFF' },
          ].map((petal, i) => {
            const rad = (petal.angle - 90) * (Math.PI / 180);
            const x = 80 + 52 * Math.cos(rad);
            const y = 80 + 52 * Math.sin(rad);
            return (
              <motion.div
                key={petal.label}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: i * 0.08, type: 'spring', stiffness: 200 }}
                className="absolute flex flex-col items-center justify-center w-12 h-12 rounded-full"
                style={{
                  left: x - 24,
                  top: y - 24,
                  backgroundColor: petal.color + '22',
                  border: `2px solid ${petal.color}40`,
                }}
              >
                <span className="text-[9px] font-black" style={{ color: petal.color }}>{petal.value}</span>
                <span className="text-[7px] font-bold text-white/40 uppercase">{petal.label}</span>
              </motion.div>
            );
          })}
          {/* Connecting lines */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 160 160">
            {[0, 60, 120, 180, 240, 300].map((angle, i) => {
              const rad = (angle - 90) * (Math.PI / 180);
              const x = 80 + 42 * Math.cos(rad);
              const y = 80 + 42 * Math.sin(rad);
              return (
                <motion.line
                  key={i}
                  x1="80" y1="80" x2={x} y2={y}
                  stroke="rgba(200,240,105,0.15)"
                  strokeWidth="1"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ delay: i * 0.08, duration: 0.4 }}
                />
              );
            })}
          </svg>
        </div>
      </div>

      {/* Daily Progress — warm card */}
      <div className="rounded-3xl p-5 space-y-4" style={{ background: '#F0EDE6' }}>
        <div className="flex justify-between items-start">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-amber-800/60 mb-1">Daily Calories</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-zinc-900">{totalCal || 0}</span>
              <span className="text-zinc-500 font-bold text-sm">/ 2,200 kcal</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
            <Apple className="text-emerald-600 w-5 h-5" />
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2.5 bg-zinc-300/30 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min((totalCal / 2200) * 100, 100)}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="h-full bg-emerald-500 rounded-full"
          />
        </div>

        {/* Macro pills */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-amber-100 rounded-2xl p-3 flex flex-col gap-1 border border-amber-200/50">
            <div className="flex items-center justify-between">
              <Zap className="w-3.5 h-3.5 text-amber-600" />
              <span className="text-[9px] font-bold uppercase text-amber-600/70">Carbs</span>
            </div>
            <span className="text-lg font-black text-amber-800">{totalCarbs}g</span>
          </div>
          <div className="bg-blue-100 rounded-2xl p-3 flex flex-col gap-1 border border-blue-200/50">
            <div className="flex items-center justify-between">
              <Droplets className="w-3.5 h-3.5 text-blue-600" />
              <span className="text-[9px] font-bold uppercase text-blue-600/70">Protein</span>
            </div>
            <span className="text-lg font-black text-blue-800">{totalProtein}g</span>
          </div>
          <div className="bg-rose-100 rounded-2xl p-3 flex flex-col gap-1 border border-rose-200/50">
            <div className="flex items-center justify-between">
              <Droplets className="w-3.5 h-3.5 text-rose-600" />
              <span className="text-[9px] font-bold uppercase text-rose-600/70">Fats</span>
            </div>
            <span className="text-lg font-black text-rose-800">{totalFats}g</span>
          </div>
        </div>
      </div>

      {/* Recent Meals */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-sm font-bold">Today's Meals</h2>
          <span className="text-[10px] text-white/40 font-bold">{todayMeals.length} logged</span>
        </div>
        {todayMeals.length === 0 ? (
          <div className="glass-card p-8 flex flex-col items-center gap-3 text-white/30">
            <span className="text-3xl">🍽️</span>
            <p className="text-xs font-medium">No meals logged yet today</p>
            <button onClick={() => setShowAddModal(true)} className="text-accent-lime text-xs font-bold">
              + Log your first meal
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {todayMeals.map(meal => (
              <div key={meal.id} className="glass-card p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent-lime/10 flex items-center justify-center text-lg">
                  🍽️
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-sm">{meal.foodName}</h3>
                  <p className="text-[10px] text-white/40">{new Date(meal.timestamp).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-accent-lime font-bold text-sm">
                    <Flame className="w-3 h-3" style={{ fill: '#C8F069' }} />
                    {meal.macros?.calories || 0}
                  </div>
                  <p className="text-[9px] text-white/40 font-bold uppercase">kcal</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Food Modal — Slide Up */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ translateY: '100%' }}
              animate={{ translateY: 0 }}
              exit={{ translateY: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-full max-w-[430px] bg-card rounded-t-3xl p-5 space-y-4 border-t border-white/10"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">Add Food</h2>
                <button onClick={() => setShowAddModal(false)} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Custom input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customFood}
                  onChange={e => setCustomFood(e.target.value)}
                  placeholder="Type food name..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder-white/30 outline-none focus:border-accent-lime/50 transition-colors"
                  onKeyDown={e => e.key === 'Enter' && logCustomFood()}
                />
                <button
                  onClick={logCustomFood}
                  className="px-5 py-3 bg-accent-lime text-black rounded-2xl font-bold text-sm"
                >
                  Log
                </button>
              </div>

              <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Quick Add</p>

              <div className="space-y-2 max-h-60 overflow-y-auto hide-scrollbar">
                {SAMPLE_FOODS.map(food => (
                  <button
                    key={food.name}
                    onClick={() => logFood(food)}
                    className="w-full flex items-center gap-3 p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors text-left"
                  >
                    <img src={food.img} alt={food.name} className="w-12 h-12 rounded-xl object-cover" referrerPolicy="no-referrer" />
                    <div className="flex-1">
                      <h3 className="font-bold text-sm">{food.name}</h3>
                      <p className="text-[10px] text-white/40">{food.carbs}c • {food.protein}p • {food.fats}f</p>
                    </div>
                    <div className="text-right">
                      <span className="text-accent-lime font-bold">{food.cal}</span>
                      <p className="text-[9px] text-white/40">kcal</p>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Feature 4: Food Regret Predictor — Bottom Sheet */}
      <AnimatePresence>
        {(regretLoading || regretSheet) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm"
            onClick={dismissRegret}
          >
            <motion.div
              initial={{ translateY: '100%' }}
              animate={{ translateY: 0 }}
              exit={{ translateY: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-full max-w-[430px] bg-card rounded-t-3xl p-5 space-y-4 border-t border-white/10"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🔮</span>
                  <h3 className="font-bold text-sm">Regret Predictor</h3>
                </div>
                <span className="text-[10px] text-white/40">for {lastLoggedFood}</span>
              </div>

              {regretLoading ? (
                <AiSkeleton lines={4} />
              ) : regretSheet ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  {/* Large Probability */}
                  <div className="text-center space-y-2">
                    <span className={cn("text-3xl font-black", regretColor(regretSheet.regretProbability))}>
                      {regretSheet.regretProbability}
                    </span>
                    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${regretSheet.probabilityPercent}%` }}
                        className={cn("h-full rounded-full", regretBg(regretSheet.regretProbability).replace('/20', ''))}
                        style={{
                          backgroundColor: regretSheet.regretProbability === 'High' ? '#E87070' :
                            regretSheet.regretProbability === 'Medium' ? '#E8D5A3' : '#C8F069'
                        }}
                      />
                    </div>
                    <p className="text-[10px] text-white/40">{regretSheet.probabilityPercent}% regret probability</p>
                  </div>

                  <p className="text-[13px] text-white/50">{regretSheet.personalReason}</p>

                  {/* Reflection question — speech bubble */}
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4 relative">
                    <p className="text-sm italic text-white/70">"{regretSheet.reflectionQuestion}"</p>
                    <div className="absolute -bottom-2 left-8 w-4 h-4 bg-white/5 border-b border-r border-white/10 rotate-45" />
                  </div>

                  {/* Better alternative if High */}
                  {regretSheet.regretProbability === 'High' && regretSheet.betterAlternative && (
                    <div className="bg-accent-lime/10 border border-accent-lime/20 rounded-2xl p-4">
                      <p className="text-[10px] text-accent-lime font-bold uppercase mb-1">Next time, try:</p>
                      <p className="text-sm font-semibold text-accent-lime">{regretSheet.betterAlternative}</p>
                    </div>
                  )}

                  <button
                    onClick={dismissRegret}
                    className="w-full py-3 bg-white/10 rounded-2xl text-sm font-bold text-white/70 hover:bg-white/15 transition-colors"
                  >
                    Got it
                  </button>
                </motion.div>
              ) : null}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
