import React, { useState } from 'react';
import { motion } from 'motion/react';
import { User, ChevronRight, LogOut, Moon, Target, Award, Shield, Heart } from 'lucide-react';
import { cn } from '../lib/utils';
import { getUserProfile, saveUserProfile, getAllMeals, getMoods } from '../lib/storage';

export default function ProfileTab() {
  const [profile, setProfile] = useState(getUserProfile());
  const [editing, setEditing] = useState(false);
  const [tempName, setTempName] = useState(profile.name);

  const totalMeals = getAllMeals().length;
  const totalMoods = Object.keys(getMoods()).length;
  const memberSince = 'April 2026';

  const saveName = () => {
    const updated = { ...profile, name: tempName };
    saveUserProfile(updated);
    setProfile(updated);
    setEditing(false);
  };

  const goalOptions = ['balanced', 'muscle gain', 'weight loss', 'mindful eating'];

  return (
    <div className="px-5 pt-3 pb-6 space-y-6">
      {/* Profile Card */}
      <div className="glass-card p-6 flex flex-col items-center gap-4">
        <div className="w-20 h-20 rounded-full bg-accent-lime/20 border-2 border-accent-lime/30 flex items-center justify-center">
          <User className="w-10 h-10 text-accent-lime" />
        </div>
        {editing ? (
          <div className="flex gap-2 w-full">
            <input
              type="text"
              value={tempName}
              onChange={e => setTempName(e.target.value)}
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-accent-lime/50"
              autoFocus
              onKeyDown={e => e.key === 'Enter' && saveName()}
            />
            <button onClick={saveName} className="px-4 py-2 bg-accent-lime text-black rounded-xl font-bold text-sm">
              Save
            </button>
          </div>
        ) : (
          <button onClick={() => setEditing(true)} className="text-center">
            <h1 className="text-xl font-bold">{profile.name}</h1>
            <p className="text-[11px] text-white/40">Tap to edit name</p>
          </button>
        )}
        <p className="text-[10px] text-white/30 uppercase font-bold tracking-wider">Member since {memberSince}</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Meals Logged', value: totalMeals, icon: '🍽️' },
          { label: 'Mood Entries', value: totalMoods, icon: '😊' },
          { label: 'Day Streak', value: 7, icon: '🔥' },
        ].map(s => (
          <div key={s.label} className="glass-card p-4 flex flex-col items-center gap-2">
            <span className="text-xl">{s.icon}</span>
            <span className="text-lg font-bold">{s.value}</span>
            <span className="text-[9px] text-white/40 font-bold uppercase text-center">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Goal Type */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold">Goal Type</h2>
        <div className="grid grid-cols-2 gap-2">
          {goalOptions.map(goal => (
            <button
              key={goal}
              onClick={() => {
                const updated = { ...profile, goalType: goal };
                saveUserProfile(updated);
                setProfile(updated);
              }}
              className={cn(
                "px-4 py-3 rounded-2xl text-sm font-medium capitalize transition-all border",
                profile.goalType === goal
                  ? "bg-accent-lime/15 border-accent-lime/30 text-accent-lime"
                  : "bg-white/5 border-white/10 text-white/50 hover:bg-white/10"
              )}
            >
              {goal}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Items */}
      <div className="space-y-2">
        {[
          { icon: Target, label: 'Daily Calorie Goal', value: '2,200 kcal' },
          { icon: Moon, label: 'Dark Mode', value: 'Always On' },
          { icon: Shield, label: 'Data Privacy', value: 'Local Only' },
          { icon: Heart, label: 'Health Connect', value: 'Not linked' },
          { icon: Award, label: 'Achievements', value: `${totalMeals > 5 ? 2 : 0} earned` },
        ].map(item => (
          <div key={item.label} className="glass-card px-4 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <item.icon className="w-4 h-4 text-white/40" />
              <span className="text-sm font-medium">{item.label}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-white/30">{item.value}</span>
              <ChevronRight className="w-3.5 h-3.5 text-white/20" />
            </div>
          </div>
        ))}
      </div>

      {/* App Info */}
      <div className="text-center space-y-2 py-4">
        <p className="text-[11px] text-white/20 font-bold">FoodMind v1.0</p>
        <p className="text-[10px] text-white/15">Powered by Google Gemini AI</p>
        <button className="flex items-center gap-1.5 mx-auto text-accent-red/60 text-[11px] font-bold mt-4">
          <LogOut className="w-3.5 h-3.5" />
          Clear All Data
        </button>
      </div>
    </div>
  );
}
