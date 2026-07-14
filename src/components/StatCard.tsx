import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  colorClass?: string;
}

export function StatCard({ title, value, subtitle, icon, colorClass = "text-slate-500" }: StatCardProps) {
  return (
    <div className="glass-card rounded-xl p-5 flex items-start justify-between">
      <div className="space-y-1">
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{title}</span>
        <div className="text-2xl font-bold text-slate-900 dark:text-white leading-none">
          {value}
        </div>
        {subtitle && (
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{subtitle}</p>
        )}
      </div>
      <div className={`p-2.5 rounded-lg bg-slate-100/50 dark:bg-slate-800/50 backdrop-blur-xs ${colorClass}`}>
        {icon}
      </div>
    </div>
  );
}
