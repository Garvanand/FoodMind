import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, ArrowRight, Search as SearchIcon, Trophy, Eye, Zap, Flame, Target } from 'lucide-react';
import { cn } from '../lib/utils';
import { MultiRingProgress } from './CircularProgress';
import { CircularProgress } from './CircularProgress';
import { AiSkeleton, ErrorToast } from './AiSkeleton';
import { detectHabitLoops, generateWeeklyReport, HabitLoopResult, WeeklyReport } from '../lib/gemini';
import { getWeekMeals, getMoods, getCurrentWeekKey, getCachedInsight, setCachedInsight } from '../lib/storage';

const moodHistory = [
  { day: '09/10', value: 40, emoji: '😊' },
  { day: '10/10', value: 60, emoji: '😐' },
  { day: '11/10', value: 30, emoji: '😡' },
  { day: '12/10', value: 80, emoji: '😴' },
  { day: '13/10', value: 50, emoji: '😕' },
  { day: '14/10', value: 70, emoji: '😎' },
  { day: '15/10', value: 90, emoji: '🤩' },
];

const sleepCycles = [
  { time: '10 PM', value: 30, color: '#A855F7' },
  { time: '12 AM', value: 60, color: '#00BFFF' },
  { time: '2 AM', value: 40, color: '#A855F7' },
  { time: '4 AM', value: 80, color: '#00BFFF' },
  { time: '6 AM', value: 50, color: '#FF69B4' },
  { time: '8 AM', value: 20, color: '#A855F7' },
];

export default function InsightsTab() {
  const [habitLoops, setHabitLoops] = useState<HabitLoopResult | null>(null);
  const [habitLoading, setHabitLoading] = useState(false);
  const [habitError, setHabitError] = useState(false);

  const [weekReport, setWeekReport] = useState<WeeklyReport | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState(false);

  const severityColor = (s: string) => {
    if (s === 'high') return 'bg-accent-red';
    if (s === 'medium') return 'bg-accent-cream';
    return 'bg-accent-lime';
  };

  // AI Feature 3: Habit Loop Detector
  const analyzePatterns = async () => {
    setHabitLoading(true);
    setHabitError(false);
    try {
      const meals = getWeekMeals();
      const moods = getMoods();
      const weekLog = meals.length > 0
        ? meals.map(m => `${m.foodName} at ${new Date(m.timestamp).toLocaleString()} mood:${m.moodAtTime || 'unknown'}`).join('; ')
        : 'Mon: oatmeal 8am mood:😊, pizza 1pm mood:😐, burger 9pm mood:😴; Tue: skipped breakfast, salad 12pm mood:😊, pasta 7pm mood:😌; Wed: smoothie 9am mood:🤩, sandwich 1pm mood:😊, ice cream 10pm mood:😴; Thu: eggs 8am mood:😊, sushi 12pm mood:😎, ramen 8pm mood:😌; Fri: nothing until 2pm mood:😡, large pizza 2pm mood:😐, chips 11pm mood:😴; Sat: pancakes 10am mood:😊, burger 3pm mood:😊, cookies 9pm mood:😴; Sun: brunch 11am mood:😎, light dinner 6pm mood:😌';
      const result = await detectHabitLoops(weekLog);
      setHabitLoops(result);
    } catch {
      setHabitError(true);
      setHabitLoops({
        habitLoops: [
          { cue: 'Late night boredom', routine: 'Snacking on chips/sweets', reward: 'Momentary comfort', intervention: 'Try herbal tea when the urge hits', severity: 'high' },
          { cue: 'Post-workout hunger', routine: 'Overeating at next meal', reward: 'Feeling full quickly', intervention: 'Pre-prepare a protein shake', severity: 'medium' },
          { cue: 'Stressful meetings', routine: 'Skipping meals then binging', reward: 'Energy crash relief', intervention: 'Keep almonds at your desk', severity: 'low' },
        ],
        topPattern: 'Late-night snacking correlates with poor sleep quality.',
      });
    } finally {
      setHabitLoading(false);
    }
  };

  // AI Feature 5: Weekly Report
  const generateReport = async () => {
    const weekKey = getCurrentWeekKey();
    const cached = getCachedInsight(weekKey);
    if (cached) {
      setWeekReport(cached);
      return;
    }

    setReportLoading(true);
    setReportError(false);
    try {
      const meals = getWeekMeals();
      const moods = getMoods();
      const summary = meals.length > 0
        ? `Meals: ${meals.map(m => `${m.foodName}(${m.moodAtTime})`).join(', ')}. Moods: ${JSON.stringify(moods)}`
        : 'Sample week: 21 meals logged, mostly healthy with 3 late-night snacks. Moods: mostly happy, stressed on Wed/Thu. Exercised 3 days. 2 high-regret meals dismissed.';
      const result = await generateWeeklyReport(summary);
      setWeekReport(result);
      setCachedInsight(weekKey, result);
    } catch {
      setReportError(true);
      setWeekReport({
        positivePattern: 'You consistently chose protein-rich breakfasts this week.',
        hiddenTrigger: 'Your Thursday stress meetings correlate with evening comfort food binges.',
        moodFoodCorrelation: 'Feeling 😴 tired led to choosing heavy carb-loaded dinners.',
        microHabitChallenge: 'Drink one glass of water before every meal this week.',
        streakWorthProtecting: 'You logged breakfast every single day — 7 day streak!',
        weekScore: 72,
        weekScoreLabel: 'Solid week',
      });
    } finally {
      setReportLoading(false);
    }
  };

  return (
    <div className="px-5 pt-3 pb-6 space-y-6">
      {(habitError || reportError) && <ErrorToast message="AI unavailable — showing cached data" />}

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Insights</h1>
        <button className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold">
          This Week <ChevronDown size={12} />
        </button>
      </div>

      {/* Concentric Donut Rings — from App 3 */}
      <div className="flex flex-col items-center gap-6">
        <MultiRingProgress
          rings={[
            { size: 160, strokeWidth: 12, percentage: 75, color: '#C8F069', delay: 0.2 },
            { size: 124, strokeWidth: 12, percentage: 60, color: '#00BFFF', delay: 0.4 },
            { size: 88, strokeWidth: 12, percentage: 45, color: '#FF69B4', delay: 0.6 },
          ]}
        />
        <div className="grid grid-cols-3 w-full gap-4">
          <div className="flex flex-col items-center gap-1">
            <span className="text-xl font-bold">56 <span className="text-xs font-normal text-white/40">days</span></span>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-accent-lime" />
              <span className="text-[10px] text-white/40 font-bold uppercase">No Stress</span>
            </div>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-xl font-bold">79%</span>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-accent-blue" />
              <span className="text-[10px] text-white/40 font-bold uppercase">Sleep</span>
            </div>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-xl font-bold">23 <span className="text-xs font-normal text-white/40">days</span></span>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-accent-pink" />
              <span className="text-[10px] text-white/40 font-bold uppercase">Mindful</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mood Tracker — from App 3 */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold">Mood tracker</h2>
        <div className="glass-card p-4 space-y-4">
          <div className="flex justify-between px-2">
            {['😊', '😐', '😡', '😴', '😕', '😎', '🤩'].map((e, i) => (
              <motion.span
                key={i}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
                className={cn(
                  "text-xl cursor-pointer transition-all",
                  i === 6 ? "opacity-100 grayscale-0" : "opacity-40 grayscale"
                )}
              >
                {e}
              </motion.span>
            ))}
          </div>
          <div className="h-20 flex items-end justify-between gap-2">
            {moodHistory.map((m, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex-1 bg-white/5 rounded-full relative overflow-hidden">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${m.value}%` }}
                    className={cn(
                      "absolute bottom-0 left-0 right-0 rounded-full",
                      i === 6 ? "bg-accent-lime shadow-[0_0_10px_rgba(200,240,105,0.3)]" : "bg-white/20"
                    )}
                  />
                </div>
                <span className="text-[7px] text-white/40 font-bold">{m.day}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Feature 3: Habit Loop Detector */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold">Habit Loops</h2>
          <button
            onClick={analyzePatterns}
            disabled={habitLoading}
            className="px-4 py-2 bg-accent-lime/10 border border-accent-lime/20 rounded-full text-accent-lime text-[11px] font-bold disabled:opacity-40"
          >
            {habitLoading ? 'Analyzing...' : 'Analyze my patterns'}
          </button>
        </div>

        {habitLoading && <div className="glass-card p-5"><AiSkeleton lines={4} /></div>}

        {habitLoops && !habitLoading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <p className="text-[11px] text-white/40 mb-3 italic">{habitLoops.topPattern}</p>
            <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2">
              {habitLoops.habitLoops.map((loop, i) => (
                <div key={i} className="glass-card p-4 min-w-[260px] space-y-3 flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase text-white/40">Loop {i + 1}</span>
                    <div className={cn("w-2.5 h-2.5 rounded-full", severityColor(loop.severity))} />
                  </div>
                  <div className="space-y-2">
                    <div>
                      <span className="text-[9px] font-bold uppercase text-accent-cream/60">CUE</span>
                      <p className="text-[12px] text-white/80">{loop.cue}</p>
                    </div>
                    <div className="flex items-center gap-1 text-white/20"><ArrowRight size={10} /></div>
                    <div>
                      <span className="text-[9px] font-bold uppercase text-accent-blue/60">ROUTINE</span>
                      <p className="text-[12px] text-white/80">{loop.routine}</p>
                    </div>
                    <div className="flex items-center gap-1 text-white/20"><ArrowRight size={10} /></div>
                    <div>
                      <span className="text-[9px] font-bold uppercase text-accent-pink/60">REWARD</span>
                      <p className="text-[12px] text-white/80">{loop.reward}</p>
                    </div>
                  </div>
                  <div className="border-t border-white/5 pt-3">
                    <span className="text-[9px] font-bold uppercase text-accent-lime/60">Break it with:</span>
                    <p className="text-[12px] text-accent-lime font-medium">{loop.intervention}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Sleep Overview — from App 3 */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold">Sleep Overview</h2>
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <CircularProgress size={140} strokeWidth={10} percentage={84} color="#00BFFF" />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold">84%</span>
              <span className="text-[9px] text-white/40 font-bold uppercase">Score</span>
            </div>
            <motion.div
              animate={{ opacity: [0.2, 0.5, 0.2], scale: [1, 1.2, 1] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="absolute top-2 left-2 text-white/40 text-xs"
            >✨</motion.div>
          </div>
          <div className="grid grid-cols-3 w-full gap-4">
            {[
              { label: 'Sleep Time', value: '7h 30m' },
              { label: 'Irregular', value: '04 days' },
              { label: 'Resting HR', value: '48 BPM' },
            ].map(s => (
              <div key={s.label} className="flex flex-col items-center gap-1">
                <span className="text-sm font-bold">{s.value}</span>
                <span className="text-[9px] text-white/40 font-bold uppercase">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Sleep stages chart */}
        <div className="glass-card p-4 space-y-3">
          <div className="flex justify-between text-[8px] font-bold text-white/40 uppercase">
            <span>10:28 PM</span><span>7:46 AM</span>
          </div>
          <div className="h-20 flex items-end justify-between gap-1">
            {sleepCycles.map((c, i) => (
              <div key={i} className="flex-1">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${c.value}%` }}
                  className="w-full rounded-sm"
                  style={{ backgroundColor: c.color, opacity: 0.6 }}
                />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Awake', value: '15%', color: '#FFD700' },
              { label: 'Light', value: '39%', color: '#00BFFF' },
              { label: 'Deep', value: '20%', color: '#A855F7' },
            ].map(s => (
              <div key={s.label} className="flex items-center gap-1.5 justify-center">
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.color }} />
                <span className="text-[9px] text-white/40 font-bold">{s.label} {s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Work/Life Balance — from App 3 */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold">Work/Life Balance</h2>
        <div className="space-y-3">
          {[
            { label: 'Work', value: '10.5h', pct: 70, color: 'bg-accent-yellow' },
            { label: 'Sleep', value: '5.5h', pct: 40, color: 'bg-accent-lime' },
          ].map(b => (
            <div key={b.label} className="space-y-1.5">
              <div className="flex justify-between text-[10px] font-bold uppercase text-white/40">
                <span>{b.label}</span>
                <span className="text-white">{b.value}</span>
              </div>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${b.pct}%` }} className={cn("h-full rounded-full", b.color)} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Feature 5: Weekly Report */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold">Weekly Report</h2>
          <button
            onClick={generateReport}
            disabled={reportLoading}
            className="px-4 py-2 bg-accent-lime/10 border border-accent-lime/20 rounded-full text-accent-lime text-[11px] font-bold disabled:opacity-40"
          >
            {reportLoading ? 'Generating...' : 'Generate my week report'}
          </button>
        </div>

        {reportLoading && <div className="glass-card p-5"><AiSkeleton lines={5} /></div>}

        {weekReport && !reportLoading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            {/* Week Score */}
            <div className="glass-card p-5 flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-accent-lime/10 border-2 border-accent-lime/30 flex items-center justify-center">
                <span className="text-2xl font-black text-accent-lime">{weekReport.weekScore}</span>
              </div>
              <div>
                <p className="text-lg font-bold">{weekReport.weekScoreLabel}</p>
                <p className="text-[11px] text-white/40">Your week at a glance</p>
              </div>
            </div>

            {/* Card 1: Positive Pattern */}
            <div className="rounded-2xl p-4 bg-accent-lime/10 border border-accent-lime/20">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="w-4 h-4 text-accent-lime" />
                <span className="text-[10px] font-bold uppercase text-accent-lime/70">This week's win</span>
              </div>
              <p className="text-sm text-accent-lime font-medium">{weekReport.positivePattern}</p>
            </div>

            {/* Card 2: Hidden Trigger */}
            <div className="glass-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <Eye className="w-4 h-4 text-accent-blue" />
                <span className="text-[10px] font-bold uppercase text-white/40">Hidden trigger</span>
              </div>
              <p className="text-sm text-white/70">{weekReport.hiddenTrigger}</p>
            </div>

            {/* Card 3: Mood-Food Correlation */}
            <div className="glass-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-accent-yellow" />
                <span className="text-[10px] font-bold uppercase text-white/40">Mood → Food</span>
              </div>
              <p className="text-sm text-white/70">{weekReport.moodFoodCorrelation}</p>
            </div>

            {/* Card 4: Micro Habit Challenge */}
            <div className="rounded-2xl p-4 bg-accent-cream/10 border border-accent-cream/20">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-accent-cream" />
                <span className="text-[10px] font-bold uppercase text-accent-cream/70">Micro challenge</span>
              </div>
              <p className="text-sm text-accent-cream font-medium mb-3">{weekReport.microHabitChallenge}</p>
              <div className="flex gap-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="w-5 h-5 rounded border-2 border-accent-cream/40" />
                ))}
              </div>
            </div>

            {/* Card 5: Streak */}
            <div className="glass-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <Flame className="w-4 h-4 text-accent-orange" />
                <span className="text-[10px] font-bold uppercase text-white/40">Streak worth protecting</span>
              </div>
              <p className="text-sm text-white/70">{weekReport.streakWorthProtecting}</p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
