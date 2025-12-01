
import React, { useMemo } from 'react';
import { useTasks } from '../context/TaskContext';
import { useLanguage } from '../context/LanguageContext';
import { TrendingUp, Zap, Calendar, Users, Coffee } from 'lucide-react';
import { Task, CategoryId } from '../types';

// Helper to parse duration string to hours (e.g., "30m" -> 0.5)
const parseDuration = (durationStr?: string): number => {
  if (!durationStr) return 0;
  // Updated regex to allow decimals (e.g., "1.5h")
  const match = durationStr.match(/^([\d.]+)([smhd])$/);
  if (!match) return 0;
  
  const val = parseFloat(match[1]);
  const unit = match[2];
  
  switch (unit) {
    case 's': return val / 3600;
    case 'm': return val / 60;
    case 'h': return val;
    case 'd': return val * 24; // Assuming 24h day for simple calc
    default: return 0;
  }
};

// Helper to get formatted date key YYYY-MM-DD
const getDateKey = (timestamp: number) => {
    const d = new Date(timestamp);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const StatsView: React.FC = () => {
  const { tasks } = useTasks();
  const { t, language } = useLanguage();
  
  const completedTasks = useMemo(() => tasks.filter(t => t.completed), [tasks]);
  
  // 1. Total Completed Count
  const totalCompleted = completedTasks.length;

  // 2. Focus Score: (Q1 + Q2) / Total Completed
  const q1Count = completedTasks.filter(t => t.category === 'q1').length;
  const q2Count = completedTasks.filter(t => t.category === 'q2').length;
  const focusScore = totalCompleted > 0 
    ? Math.round(((q1Count + q2Count) / totalCompleted) * 100) 
    : 0;

  // 3. Total Duration Calculation
  const totalHours = useMemo(() => {
    return completedTasks.reduce((acc, task) => acc + parseDuration(task.duration), 0);
  }, [completedTasks]);

  const displayTime = totalHours < 1 
    ? `${Math.round(totalHours * 60)}m` 
    : `${totalHours.toFixed(1)}h`;

  // 4. Quadrant Distribution
  const distribution = useMemo(() => {
    const counts = { q1: 0, q2: 0, q3: 0, q4: 0, inbox: 0 };
    completedTasks.forEach(t => {
      if (counts[t.category as CategoryId] !== undefined) {
        counts[t.category as CategoryId]++;
      }
    });
    return counts;
  }, [completedTasks]);

  // 5. 7-Day Trend
  const trendData = useMemo(() => {
    const last7Days = Array.from({length: 7}, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return {
        dateObj: d,
        key: getDateKey(d.getTime()),
        label: d.toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US', { weekday: 'narrow' })
      };
    }).reverse();

    const data = last7Days.map(day => {
      const count = completedTasks.filter(t => {
        // Fallback to createdAt if completedAt is missing (legacy data)
        const time = t.completedAt || t.createdAt; 
        return getDateKey(time) === day.key;
      }).length;
      return { ...day, count };
    });

    const maxCount = Math.max(...data.map(d => d.count), 1); // Avoid div by zero
    return data.map(d => ({ ...d, heightPercent: (d.count / maxCount) * 100 }));
  }, [completedTasks, language]);


  return (
    <div className="w-full h-full flex flex-col bg-[#F2F4F7]">
      <div className="px-6 pt-8 pb-4 shrink-0">
        <h1 className="text-[28px] font-bold text-gray-900 tracking-tight">{t('stats.title')}</h1>
      </div>
      
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 space-y-5 pb-32">
        
        {/* Main Insight Card */}
        <div className="bg-white rounded-[24px] p-6 shadow-sm border border-blue-50 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full blur-3xl -mr-8 -mt-8 opacity-60"></div>
            
            <div className="relative z-10 grid grid-cols-2 gap-6">
                <div>
                     <div className="flex items-baseline gap-2 mb-1">
                        <span className="text-4xl font-bold text-gray-900 font-['Inter']">{focusScore}</span>
                        <span className="text-xl font-bold text-gray-300">/100</span>
                    </div>
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wide">{t('stats.focus_score')}</div>
                    <div className="text-[10px] text-gray-300 mt-0.5">{t('stats.focus_score_desc')}</div>
                </div>

                <div className="flex flex-col items-start justify-center pl-4 border-l border-gray-100">
                     <div className="flex items-baseline gap-1 mb-1">
                        <span className="text-2xl font-bold text-gray-900 font-['Inter']">{displayTime}</span>
                    </div>
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wide">{t('stats.total_time')}</div>
                </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between items-center">
                 <div className="flex flex-col">
                    <span className="text-[20px] font-bold text-gray-900 leading-none">{totalCompleted}</span>
                    <span className="text-[10px] text-gray-400 font-medium mt-1">{t('stats.tasks_completed')}</span>
                 </div>
                 {/* Mini Trend Sparkline visual (simple placeholder) */}
                 <div className="flex items-center gap-1">
                     <div className="w-1 h-3 bg-blue-200 rounded-full"></div>
                     <div className="w-1 h-5 bg-blue-300 rounded-full"></div>
                     <div className="w-1 h-4 bg-blue-400 rounded-full"></div>
                     <div className="w-1 h-7 bg-blue-600 rounded-full"></div>
                 </div>
            </div>
        </div>

        {/* 7-Day Trend Chart */}
        <div className="bg-white rounded-[24px] p-5 shadow-sm">
            <h3 className="text-[13px] font-bold text-gray-900 mb-6 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-gray-400" />
                {t('stats.trend')}
            </h3>
            <div className="flex justify-between items-end h-[100px] px-2">
                {trendData.map((day, i) => (
                    <div key={i} className="flex flex-col items-center gap-2 group">
                        <div className="relative w-2 sm:w-3 bg-gray-100 rounded-full h-[80px] flex items-end overflow-hidden">
                             <div 
                                className={`w-full rounded-full transition-all duration-500 ${day.dateObj.getDay() === new Date().getDay() ? 'bg-black' : 'bg-blue-500'}`}
                                style={{ height: `${day.heightPercent}%`, minHeight: day.count > 0 ? '4px' : '0' }}
                             ></div>
                        </div>
                        <span className={`text-[10px] font-bold ${day.dateObj.getDay() === new Date().getDay() ? 'text-black' : 'text-gray-300'}`}>
                            {day.label}
                        </span>
                    </div>
                ))}
            </div>
        </div>

        {/* Quadrant Distribution */}
        <div className="bg-white rounded-[24px] p-5 shadow-sm space-y-4">
             <h3 className="text-[13px] font-bold text-gray-900 mb-2 flex items-center gap-2">
                <Zap className="w-4 h-4 text-gray-400" />
                {t('stats.distribution')}
            </h3>
            
            {/* Q1 */}
            <div className="space-y-1">
                 <div className="flex justify-between text-xs font-bold text-rose-700 mb-1">
                    <span>Q1</span>
                    <span>{distribution.q1}</span>
                 </div>
                 <div className="h-2 w-full bg-rose-50 rounded-full overflow-hidden">
                     <div className="h-full bg-rose-500 rounded-full transition-all duration-500" style={{ width: `${(distribution.q1 / totalCompleted) * 100 || 0}%` }}></div>
                 </div>
            </div>
            
            {/* Q2 */}
            <div className="space-y-1">
                 <div className="flex justify-between text-xs font-bold text-blue-700 mb-1">
                    <span>Q2</span>
                    <span>{distribution.q2}</span>
                 </div>
                 <div className="h-2 w-full bg-blue-50 rounded-full overflow-hidden">
                     <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${(distribution.q2 / totalCompleted) * 100 || 0}%` }}></div>
                 </div>
            </div>

            {/* Q3 */}
            <div className="space-y-1">
                 <div className="flex justify-between text-xs font-bold text-amber-700 mb-1">
                    <span>Q3</span>
                    <span>{distribution.q3}</span>
                 </div>
                 <div className="h-2 w-full bg-amber-50 rounded-full overflow-hidden">
                     <div className="h-full bg-amber-500 rounded-full transition-all duration-500" style={{ width: `${(distribution.q3 / totalCompleted) * 100 || 0}%` }}></div>
                 </div>
            </div>

             {/* Q4 */}
             <div className="space-y-1">
                 <div className="flex justify-between text-xs font-bold text-slate-600 mb-1">
                    <span>Q4</span>
                    <span>{distribution.q4}</span>
                 </div>
                 <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                     <div className="h-full bg-slate-400 rounded-full transition-all duration-500" style={{ width: `${(distribution.q4 / totalCompleted) * 100 || 0}%` }}></div>
                 </div>
            </div>
        </div>

        {/* Quote */}
        <div className="pt-4 px-2 pb-6">
            <p className="text-[13px] font-medium text-gray-500 leading-relaxed text-center italic">
                {t('stats.quote')}
            </p>
        </div>

      </div>
    </div>
  );
};
