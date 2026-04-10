import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Bell, Flame, TrendingUp, Activity, Dumbbell, ChevronRight } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { cn } from '../lib/utils';
import { AiSkeleton, ErrorToast } from './AiSkeleton';
import { predictCraving, CravingPrediction } from '../lib/gemini';
import { getLastMealHoursAgo, getTodayMood, getTodayActivity, getUserProfile, saveActivity, getTodayMeals } from '../lib/storage';

const heartRateData = [
  { value: 60 }, { value: 85 }, { value: 70 }, { value: 90 }, { value: 80 },
  { value: 95 }, { value: 85 }, { value: 110 }, { value: 90 }, { value: 100 },
];

const days = [
  { day: 'Sun', date: 17 }, { day: 'Mon', date: 18 }, { day: 'Tue', date: 19 },
  { day: 'Wed', date: 20, active: true }, { day: 'Thu', date: 21 },
  { day: 'Fri', date: 22 }, { day: 'Sat', date: 23 },
];

const growthData = [40, 70, 50, 90, 60, 75, 85];

export default function HomeTab() {
  const [craving, setCraving] = useState<CravingPrediction | null>(null);
  const [cravingLoading, setCravingLoading] = useState(true);
  const [cravingError, setCravingError] = useState(false);
  const [gymToday, setGymToday] = useState(getTodayActivity().gymToday);
  const user = getUserProfile();
  const todayMeals = getTodayMeals();
  const totalCalories = todayMeals.reduce((sum, m) => sum + (m.macros?.calories || 0), 0);

  useEffect(() => {
    loadCravingPrediction();
  }, []);

  const loadCravingPrediction = async () => {
    setCravingLoading(true);
    setCravingError(false);
    try {
      const now = new Date();
      const result = await predictCraving({
        currentHour: now.getHours(),
        dayOfWeek: now.toLocaleDateString('en', { weekday: 'long' }),
        lastMealHoursAgo: getLastMealHoursAgo(),
        todayMoodEmoji: getTodayMood(),
        activityLevel: gymToday ? 'gym today' : 'sedentary',
      });
      setCraving(result);
    } catch {
      setCravingError(true);
      setCraving({
        cravingType: 'Savory + Warm',
        reason: 'Based on your usual patterns at this hour',
        healthyAlternative: 'Grilled chicken wrap',
        nudgeMessage: 'You might want something warm soon!',
        contextScore: 72,
      });
    } finally {
      setCravingLoading(false);
    }
  };

  const toggleGym = () => {
    const newVal = !gymToday;
    setGymToday(newVal);
    const today = new Date().toISOString().split('T')[0];
    saveActivity(today, { gymToday: newVal, stressLevel: getTodayActivity().stressLevel });
  };

  return (
    <div className="px-5 pt-3 pb-6 space-y-5">
      {cravingError && <ErrorToast message="AI unavailable — showing cached data" />}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-accent-lime/20 border border-accent-lime/30 flex items-center justify-center text-lg">
            🧠
          </div>
          <div>
            <p className="text-[11px] text-white/40 font-medium">Hello,</p>
            <h1 className="text-lg font-bold">{user.name}</h1>
          </div>
        </div>
        <button className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 relative">
          <Bell className="w-5 h-5" />
          <div className="absolute top-2.5 right-2.5 w-2 h-2 bg-accent-lime rounded-full" />
        </button>
      </div>

      {/* Date Strip with Mood */}
      <div className="flex justify-between items-center">
        {days.map((d) => (
          <div key={d.date} className="flex flex-col items-center gap-1.5">
            <span className="text-[9px] uppercase text-white/40 font-bold">{d.day}</span>
            <div className={cn(
              "w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all",
              d.active ? "bg-accent-lime text-black shadow-[0_0_15px_rgba(200,240,105,0.4)]" : "bg-white/5 text-white/60"
            )}>
              {d.date}
            </div>
            {d.active && <div className="w-1 h-1 rounded-full bg-accent-lime" />}
          </div>
        ))}
      </div>

      {/* Right Now — AI Craving Predictor Card */}
      <div className="glass-card p-5 space-y-4 pulse-glow">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-accent-lime animate-pulse" />
            <span className="text-[10px] font-bold uppercase text-white/50 tracking-wider">Right Now</span>
          </div>
          <span className="text-[10px] text-white/30">{new Date().toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>

        {cravingLoading ? (
          <AiSkeleton lines={4} />
        ) : craving ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="space-y-3"
          >
            <div className="flex items-center gap-3">
              <div className="relative w-16 h-16 rounded-full bg-accent-lime/10 flex items-center justify-center border-2 border-accent-lime/30">
                <span className="text-2xl font-black text-accent-lime">{craving.contextScore}</span>
              </div>
              <div className="flex-1">
                <div className="inline-block px-3 py-1 rounded-full bg-accent-lime/20 text-accent-lime text-[11px] font-bold mb-1">
                  {craving.cravingType}
                </div>
                <p className="text-[13px] text-white/70">{craving.nudgeMessage}</p>
              </div>
            </div>
            <p className="text-[11px] text-white/40 italic">{craving.reason}</p>
            <button className="w-full py-2.5 bg-accent-lime/10 border border-accent-lime/20 rounded-2xl text-accent-lime text-xs font-bold flex items-center justify-center gap-2 hover:bg-accent-lime/20 transition-colors">
              Try this instead → {craving.healthyAlternative}
            </button>
          </motion.div>
        ) : null}
      </div>

      {/* Gym Toggle */}
      <button
        onClick={toggleGym}
        className={cn(
          "w-full flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all",
          gymToday
            ? "bg-accent-lime/10 border-accent-lime/30 text-accent-lime"
            : "bg-white/5 border-white/10 text-white/50"
        )}
      >
        <Dumbbell className="w-5 h-5" />
        <span className="text-sm font-semibold">{gymToday ? 'Gym day active ✓' : 'Tap to mark gym day'}</span>
      </button>

      {/* Calories Today */}
      <div className="glass-card p-5 flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold">{totalCalories || 346}</span>
            <span className="text-white/40 text-sm">/2200</span>
          </div>
          <p className="text-[11px] text-white/40">Calories — Today</p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-accent-orange/20 flex items-center justify-center">
          <Flame className="w-6 h-6 text-accent-orange" style={{ fill: '#f97316' }} />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Food Score Dots */}
        <div className="glass-card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-accent-lime" />
            <span className="text-[10px] font-bold uppercase text-white/50">Food Score</span>
          </div>
          <h2 className="text-2xl font-bold">36<span className="text-sm text-white/40">/375</span></h2>
          <div className="grid grid-cols-5 gap-1.5">
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={i} className={cn(
                "w-2.5 h-2.5 rounded-full",
                i < 8 ? "bg-accent-lime" : "bg-white/10"
              )} />
            ))}
          </div>
        </div>

        {/* Growth Chart */}
        <div className="glass-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp size={12} className="text-accent-pink" />
              <span className="text-[10px] font-bold uppercase text-white/50">Growth</span>
            </div>
            <span className="text-[10px] font-bold text-white">8.7%</span>
          </div>
          <div className="h-14 w-full flex items-end gap-1">
            {growthData.map((h, i) => (
              <motion.div
                key={i}
                initial={{ height: 0 }}
                animate={{ height: `${h}%` }}
                transition={{ delay: i * 0.05 }}
                className="flex-1 bg-accent-pink/20 rounded-t-sm relative overflow-hidden"
              >
                <div className="absolute bottom-0 left-0 right-0 bg-accent-pink h-1/3 rounded-t-sm" />
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Heart Rate */}
      <div className="glass-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm">Heart rate analysis</h3>
          <div className="flex items-center gap-1 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
            <span className="text-[10px] text-white/60">Today</span>
            <ChevronRight className="w-3 h-3 text-white/40 rotate-90" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[{ label: 'Light', val: 149 }, { label: 'Intensive', val: 45 }, { label: 'Anaerobic', val: 82 }].map(s => (
            <div key={s.label} className="space-y-1">
              <p className="text-[10px] text-white/40">{s.label}</p>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-bold">{s.val}</span>
                <span className="text-[10px] text-white/40">bpm</span>
              </div>
            </div>
          ))}
        </div>
        <div className="h-20 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={heartRateData}>
              <Line type="monotone" dataKey="value" stroke="#C8F069" strokeWidth={3} dot={false} animationDuration={1500} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
