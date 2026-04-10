import React from 'react';

export function AiSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-3 py-2 animate-fade-in" style={{ animation: 'fadeIn 0.2s ease' }}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="skeleton-bar"
          style={{
            height: i === 0 ? 20 : 14,
            width: i === lines - 1 ? '60%' : i === 0 ? '80%' : '100%',
          }}
        />
      ))}
    </div>
  );
}

export function ErrorToast({ message }: { message: string }) {
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] animate-toast">
      <div className="bg-accent-red/90 backdrop-blur-md text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-lg border border-red-400/20">
        {message}
      </div>
    </div>
  );
}
