import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Home, Plus, Sparkles, BarChart2, User } from 'lucide-react';
import { cn } from './lib/utils';
import HomeTab from './components/HomeTab';
import FoodLogTab from './components/FoodLogTab';
import CheckTab from './components/CheckTab';
import InsightsTab from './components/InsightsTab';
import ProfileTab from './components/ProfileTab';

type Tab = 'home' | 'log' | 'check' | 'insights' | 'profile';

const tabs: { id: Tab; icon: typeof Home; label: string }[] = [
  { id: 'home', icon: Home, label: 'Home' },
  { id: 'log', icon: Plus, label: 'Log' },
  { id: 'check', icon: Sparkles, label: 'Check' },
  { id: 'insights', icon: BarChart2, label: 'Insights' },
  { id: 'profile', icon: User, label: 'Profile' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('home');

  const renderContent = () => {
    switch (activeTab) {
      case 'home': return <HomeTab />;
      case 'log': return <FoodLogTab />;
      case 'check': return <CheckTab />;
      case 'insights': return <InsightsTab />;
      case 'profile': return <ProfileTab />;
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-0 sm:p-4 text-white">
      {/* Mobile Container */}
      <div className="relative w-full max-w-[430px] h-screen sm:h-[932px] bg-background atmosphere rounded-none sm:rounded-[55px] sm:border-[8px] sm:border-[#1a1f1c] shadow-2xl overflow-hidden flex flex-col">
        {/* Status Bar */}
        <div className="h-12 flex items-center justify-between px-8 pt-4 z-50 shrink-0">
          <span className="text-sm font-semibold">
            {new Date().toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit', hour12: false })}
          </span>
          <div className="flex items-center gap-1.5">
            <div className="flex gap-0.5">
              {[1,2,3,4].map(i => (
                <div key={i} className={cn("w-1 h-3 rounded-full", i <= 3 ? "bg-white" : "bg-white/20")} />
              ))}
            </div>
            <div className="w-6 h-3 border border-white/30 rounded-sm relative ml-1">
              <div className="absolute inset-[1px] bg-accent-lime rounded-[1px]" style={{ width: '70%' }} />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto hide-scrollbar relative pb-24">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="min-h-full"
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Bottom Navigation */}
        <nav className="absolute bottom-0 left-0 right-0 h-24 bg-background/90 backdrop-blur-2xl border-t border-white/5 px-6 flex items-center justify-between pb-6 z-50">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const isCheck = tab.id === 'check';

            return (
              <button
                key={tab.id}
                id={`nav-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex flex-col items-center gap-1 transition-all duration-300 relative",
                  isCheck ? "" : (isActive ? "text-accent-lime scale-110" : "text-white/40 hover:text-white/60")
                )}
              >
                {isCheck ? (
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center -mt-4 transition-all shadow-lg",
                    isActive
                      ? "bg-accent-lime text-black shadow-accent-lime/30"
                      : "bg-white/10 text-white/60 hover:bg-white/15"
                  )}>
                    <Icon className="w-6 h-6" strokeWidth={isActive ? 2.5 : 2} />
                  </div>
                ) : (
                  <Icon className="w-6 h-6" strokeWidth={isActive ? 2.5 : 2} />
                )}

                <span className={cn(
                  "text-[9px] font-bold uppercase tracking-wider",
                  isCheck && isActive ? "text-accent-lime" : ""
                )}>
                  {tab.label}
                </span>

                {isActive && !isCheck && (
                  <motion.div
                    layoutId="nav-dot"
                    className="w-1 h-1 rounded-full bg-accent-lime"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Home Indicator bar */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-white/15 rounded-full z-50" />
      </div>
    </div>
  );
}
