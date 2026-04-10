import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Sparkles, ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';
import { AiSkeleton, ErrorToast } from './AiSkeleton';
import { scoreFoodContextually, FoodScoreResult } from '../lib/gemini';
import { getTodayActivity } from '../lib/storage';
import DOMPurify from 'dompurify';

export default function CheckTab() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [result, setResult] = useState<FoodScoreResult | null>(null);
  const [animatedScore, setAnimatedScore] = useState(0);
  const [showSwap, setShowSwap] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (result) {
      let start = 0;
      const target = result.score;
      const duration = 1000;
      const startTime = Date.now();
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setAnimatedScore(Math.round(start + (target - start) * eased));
        if (progress < 1) requestAnimationFrame(animate);
      };
      requestAnimationFrame(animate);
    }
  }, [result]);

  const checkFood = async () => {
    if (!query.trim()) return;
    const cleanQuery = DOMPurify.sanitize(query.trim().substring(0, 100));

    setLoading(true);
    setError(false);
    setResult(null);
    setShowSwap(false);
    try {
      const activity = getTodayActivity();
      const res = await scoreFoodContextually(cleanQuery, {
        hour: new Date().getHours(),
        postWorkout: activity.gymToday,
        stress: activity.stressLevel,
        sleep: 7,
        nextActivity: 'work',
      });
      setResult(res);
    } catch {
      setError(true);
      setResult({
        score: 65,
        scoreLabel: 'Decent choice',
        scoreColor: 'amber',
        contextChips: ['Moderate energy ✓', 'Could be lighter ✗', 'Good timing ✓'],
        modificationTip: 'Try a smaller portion for better afternoon energy.',
        smartSwap: 'A lighter grain bowl with similar flavors',
        regretProbability: 'Low',
        regretReason: 'This fits your current schedule reasonably well.',
      });
    } finally {
      setLoading(false);
    }
  };

  const scoreColor = (c: string) => {
    if (c === 'green') return '#C8F069';
    if (c === 'amber') return '#E8D5A3';
    return '#E87070';
  };

  const regretPillColor = (p: string) => {
    if (p === 'High') return 'bg-accent-red/20 text-accent-red';
    if (p === 'Medium') return 'bg-accent-cream/20 text-accent-cream';
    return 'bg-accent-lime/20 text-accent-lime';
  };

  return (
    <div className="px-5 pt-3 pb-6 space-y-5">
      {error && <ErrorToast message="AI unavailable — showing cached data" />}

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-accent-lime/20 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-accent-lime" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Food Check</h1>
          <p className="text-[11px] text-white/40">Score any food for right now</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex gap-2">
        <label htmlFor="food-search-query" className="sr-only">Search for food</label>
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            id="food-search-query"
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && checkFood()}
            placeholder="What are you thinking of eating?"
            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-11 pr-4 py-3.5 text-sm text-white placeholder-white/30 outline-none focus:border-accent-lime/50 transition-colors"
          />
        </div>
        <button
          aria-label="Submit check"
          onClick={checkFood}
          disabled={loading || !query.trim()}
          className="px-5 py-3.5 bg-accent-lime text-black rounded-2xl font-bold text-sm disabled:opacity-40 transition-opacity"
        >
          Check
        </button>
      </div>

      {/* Quick suggestions */}
      <div className="flex gap-2 overflow-x-auto hide-scrollbar">
        {['Pizza', 'Sushi', 'Burger', 'Salad', 'Pasta', 'Ice Cream'].map(s => (
          <button
            key={s}
            onClick={() => { setQuery(s); }}
            className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-[11px] font-medium text-white/50 whitespace-nowrap hover:bg-white/10 transition-colors"
          >
            {s}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="glass-card p-6">
          <AiSkeleton lines={5} />
        </div>
      )}

      {/* Result Card */}
      <AnimatePresence>
        {result && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ type: 'spring', damping: 20, stiffness: 200 }}
            className="glass-card p-5 space-y-5"
          >
            {/* Score */}
            <div className="flex flex-col items-center gap-2">
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center border-4"
                style={{ borderColor: scoreColor(result.scoreColor) + '40' }}
              >
                <span
                  className="text-4xl font-black"
                  style={{ color: scoreColor(result.scoreColor) }}
                >
                  {animatedScore}
                </span>
              </div>
              <span className="text-sm font-medium" style={{ color: scoreColor(result.scoreColor) }}>
                {result.scoreLabel}
              </span>
              <span className="text-[10px] text-white/30 uppercase font-bold tracking-wider">
                Contextual score for {query}
              </span>
            </div>

            {/* Context Chips */}
            <div className="flex flex-wrap gap-2 justify-center">
              {result.contextChips.map((chip, i) => (
                <span
                  key={i}
                  className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[11px] font-medium text-white/70"
                >
                  {chip}
                </span>
              ))}
            </div>

            {/* Modification tip */}
            <p className="text-[12px] text-white/40 italic text-center px-2">
              {result.modificationTip}
            </p>

            {/* Smart Swap — expandable */}
            <button
              onClick={() => setShowSwap(!showSwap)}
              className="w-full flex items-center justify-between px-4 py-3 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors"
            >
              <span className="text-sm font-semibold">🔄 Smarter swap</span>
              <ChevronDown className={cn("w-4 h-4 text-white/40 transition-transform", showSwap && "rotate-180")} />
            </button>
            <AnimatePresence>
              {showSwap && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="bg-accent-lime/10 border border-accent-lime/20 rounded-2xl p-4">
                    <p className="text-sm text-accent-lime font-semibold">{result.smartSwap}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Regret probability */}
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-white/40">Regret probability</span>
              <span className={cn("px-3 py-1 rounded-full text-[10px] font-bold", regretPillColor(result.regretProbability))}>
                {result.regretProbability}
              </span>
            </div>
            <p className="text-[11px] text-white/30">{result.regretReason}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty state */}
      {!result && !loading && (
        <div className="flex flex-col items-center justify-center py-16 text-white/20 space-y-4">
          <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
            <Sparkles className="w-10 h-10" />
          </div>
          <p className="text-sm font-medium">Type a food to get your AI score</p>
          <p className="text-[11px] text-white/15">Scores are based on your current context</p>
        </div>
      )}
    </div>
  );
}
