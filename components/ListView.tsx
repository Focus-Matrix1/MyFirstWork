import React, { useState, useRef, useEffect, useCallback } from 'react';
import { LayoutGrid, Trash2, CheckCircle2, Check, Hourglass, ChevronDown, ChevronRight } from 'lucide-react';
import { useTasks } from '../context/TaskContext';
import { useLanguage } from '../context/LanguageContext';
import { Task, CategoryId } from '../types';
import { WeeklyCalendar } from './WeeklyCalendar';
import { TaskDetailModal } from './TaskDetailModal';
import { CategorySheet } from './CategorySheet';
import { useSwipeable } from '../hooks/useSwipeable';

const SwipeableTask: React.FC<{ 
  task: Task; 
  onCategorize: (task: Task) => void;
  onDelete: (id: string) => void;
  onComplete: (id: string) => void;
  onClick: (task: Task) => void;
  t: (key: string) => string;
  hardcoreMode: boolean;
}> = ({ task, onCategorize, onDelete, onComplete, onClick, t, hardcoreMode }) => {
  const ACTION_WIDTH = 80;
  const isInbox = task.category === 'inbox';
  const isLocked = hardcoreMode && !isInbox;

  const { offset, handlePointerDown, handlePointerMove, handlePointerUp, reset } = useSwipeable({
    actionWidth: ACTION_WIDTH,
    disabled: isLocked
  });

  const categoryConfig = {
      q1: { bg: 'bg-rose-500', border: 'border-rose-100', text: 'text-rose-700', badgeBg: 'bg-rose-100', checkboxBorder: 'border-rose-200', checkboxBg: 'bg-rose-50', checkColor: 'text-rose-500' },
      q2: { bg: 'bg-blue-500', border: 'border-blue-100', text: 'text-blue-700', badgeBg: 'bg-blue-100', checkboxBorder: 'border-blue-200', checkboxBg: 'bg-blue-50', checkColor: 'text-blue-500' },
      q3: { bg: 'bg-amber-400', border: 'border-amber-100', text: 'text-amber-700', badgeBg: 'bg-amber-100', checkboxBorder: 'border-amber-200', checkboxBg: 'bg-amber-50', checkColor: 'text-amber-500' },
      q4: { bg: 'bg-slate-400', border: 'border-slate-100', text: 'text-slate-700', badgeBg: 'bg-slate-100', checkboxBorder: 'border-slate-200', checkboxBg: 'bg-slate-50', checkColor: 'text-slate-500' },
      inbox: { bg: 'bg-gray-400', border: 'border-gray-200', text: 'text-gray-500', badgeBg: 'bg-gray-100', checkboxBorder: 'border-gray-300', checkboxBg: 'bg-white', checkColor: 'text-gray-500' }
  };

  const config = categoryConfig[task.category] || categoryConfig.inbox;

  const handleContentClick = () => {
      if (Math.abs(offset) > 5) reset();
      else onClick(task);
  };

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden group select-none touch-pan-y">
        <div className="absolute inset-0 flex z-0">
            <div className="absolute left-0 top-0 bottom-0 bg-blue-500 z-0 flex" style={{ width: ACTION_WIDTH }}>
                <button onClick={(e) => { e.stopPropagation(); onCategorize(task); reset(); }} className="w-full h-full flex flex-col items-center justify-center text-white hover:bg-blue-600 transition-colors">
                    <LayoutGrid className="w-5 h-5 mb-1" />
                    <span className="text-[10px] font-bold">{t('list.action.categorize')}</span>
                </button>
            </div>
            <div className="absolute right-0 top-0 bottom-0 bg-red-500 z-0 flex justify-end" style={{ width: ACTION_WIDTH }}>
                <button onClick={(e) => { e.stopPropagation(); onDelete(task.id); reset(); }} className="w-full h-full flex flex-col items-center justify-center text-white hover:bg-red-600 transition-colors">
                    <Trash2 className="w-5 h-5 mb-1" />
                    <span className="text-[10px] font-bold">{t('list.action.delete')}</span>
                </button>
            </div>
        </div>

        <div 
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onClick={(e) => { if (!(e.target as HTMLElement).closest('.checkbox-area')) handleContentClick(); }}
            style={{ transform: `translateX(${offset}px)`, transition: 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)' }}
            className={`absolute inset-0 bg-white z-10 active:scale-[0.99] cursor-pointer ${isInbox ? 'p-3 flex items-center gap-3 border border-gray-100 rounded-xl shadow-sm' : `p-4 flex items-start gap-3 border ${config.border} shadow-sm rounded-2xl`}`}
        >
            {!isInbox && <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${config.bg}`}></div>}
            <div className={`checkbox-area ${isInbox ? 'w-4 h-4' : 'w-5 h-5 mt-0.5'} rounded-md border-[1.5px] flex items-center justify-center shrink-0 transition-all ${isInbox ? 'border-gray-300' : `${config.checkboxBorder} ${config.checkboxBg}`} ${task.completed ? 'bg-green-500 !border-green-500' : ''}`} onClick={(e) => { e.stopPropagation(); onComplete(task.id); }}>
                 {task.completed ? <CheckCircle2 className="w-3.5 h-3.5 text-white" /> : !isInbox && <Check className={`w-3 h-3 stroke-[3] opacity-0 group-hover:opacity-100 transition-opacity ${config.checkColor}`} />}
            </div>
            <div className={`flex flex-col flex-1 overflow-hidden ${isInbox ? 'justify-center' : ''}`}>
                <span className={`${isInbox ? 'text-[14px] font-medium text-gray-700' : 'text-[16px] font-semibold text-gray-900 leading-snug'} truncate ${task.completed ? 'text-gray-400 line-through' : ''}`}>{task.title}</span>
                {!isInbox && (
                    <div className="flex items-center gap-2 mt-2">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold tracking-tight ${config.badgeBg} ${config.text}`}>{(({inbox: t('matrix.inbox'), q1:'Q1', q2:'Q2', q3:'Q3', q4:'Q4'} as any)[task.category])}</span>
                        {(task.duration || task.description) && <div className="h-1 w-1 rounded-full bg-gray-300"></div>}
                        {task.duration && <span className={`flex items-center gap-1 text-[12px] font-medium ${config.text.replace('700', '600')}`}><Hourglass className="w-3 h-3" /> {task.duration}</span>}
                        {task.description && <span className="text-[12px] text-gray-500 truncate max-w-[140px]">{task.description}</span>}
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};

export const ListView: React.FC = () => {
  const { tasks, completeTask, deleteTask, selectedDate, updateTask, moveTask, hardcoreMode } = useTasks();
  const { t } = useLanguage();
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [categorizingTask, setCategorizingTask] = useState<Task | null>(null);
  const [showInboxZeroAnim, setShowInboxZeroAnim] = useState(false);
  const [isCompletedExpanded, setIsCompletedExpanded] = useState(false);

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const showUndatedTasks = selectedDate >= todayStr;

  const inboxTasks = tasks.filter(task => !task.completed && task.category === 'inbox');
  const activeTasks = tasks.filter(task => {
      if (task.completed || task.category === 'inbox') return false;
      return task.plannedDate === selectedDate || (!task.plannedDate && showUndatedTasks);
  });
  const completedTasks = tasks.filter(task => task.completed && task.plannedDate === selectedDate);

  const prevInboxCount = useRef(inboxTasks.length);
  useEffect(() => {
    if (prevInboxCount.current > 0 && inboxTasks.length === 0) {
        setShowInboxZeroAnim(true);
        const timer = setTimeout(() => setShowInboxZeroAnim(false), 2500);
        return () => clearTimeout(timer);
    }
    prevInboxCount.current = inboxTasks.length;
  }, [inboxTasks.length]);

  const sortTasks = (taskList: Task[]) => {
      const priorityOrder: Record<CategoryId, number> = { 'inbox': 0, 'q1': 1, 'q2': 2, 'q3': 3, 'q4': 4 };
      return [...taskList].sort((a, b) => (priorityOrder[a.category] - priorityOrder[b.category]) || (b.createdAt - a.createdAt));
  };

  const sortedActive = sortTasks(activeTasks);
  const sortedInbox = sortTasks(inboxTasks);

  return (
    <div className="w-full h-full flex flex-col bg-[#F5F7FA] relative">
      <WeeklyCalendar />
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-32 pt-4">
        {showInboxZeroAnim && (
            <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl p-4 mb-6 shadow-lg animate-bounce">
                <p className="text-white text-center font-bold text-lg">{t('list.inbox_zero.celebrate')}</p>
            </div>
        )}
        {sortedInbox.length > 0 && (
            <div className="bg-gray-50/80 rounded-2xl p-1 border border-dashed border-gray-300 mb-6 transition-all">
                 <div className="px-3 py-2 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t('matrix.inbox')}</span>
                    </div>
                    <span className="text-[10px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-md font-bold">{sortedInbox.length}</span>
                </div>
                 {sortedInbox.map(task => (
                     <div key={task.id} className="relative h-[52px] mb-1 mx-1">
                        <SwipeableTask task={task} onCategorize={setCategorizingTask} onDelete={deleteTask} onComplete={completeTask} onClick={setEditingTask} t={t} hardcoreMode={hardcoreMode} />
                     </div>
                ))}
            </div>
        )}
        {sortedActive.length > 0 && (
            <div className="mb-6 animate-fade-in space-y-3">
                <div className="px-3 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-black"></div>
                    <span className="text-xs font-bold text-gray-900 uppercase tracking-wider">{t('list.section.planned')}</span>
                </div>
                {sortedActive.map(task => (
                    <div key={task.id} className="relative h-[84px] mb-3">
                        <SwipeableTask task={task} onCategorize={setCategorizingTask} onDelete={deleteTask} onComplete={completeTask} onClick={setEditingTask} t={t} hardcoreMode={hardcoreMode} />
                    </div>
                ))}
            </div>
        )}
        {completedTasks.length > 0 && (
            <div className="mb-6 animate-fade-in">
                <button onClick={() => setIsCompletedExpanded(!isCompletedExpanded)} className="flex items-center gap-2 mb-3 ml-1 group">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest group-hover:text-gray-600 transition-colors">{t('list.section.completed')} ({completedTasks.length})</span>
                    {isCompletedExpanded ? <ChevronDown className="w-3 h-3 text-gray-400" /> : <ChevronRight className="w-3 h-3 text-gray-400" />}
                </button>
                {isCompletedExpanded && (
                    <div className="animate-slide-up space-y-3">
                        {completedTasks.map(task => (
                             <div key={task.id} className="relative h-[64px] mb-3">
                                <div className="absolute inset-0 bg-gray-50 p-4 flex items-center gap-3 border border-gray-100 shadow-sm rounded-2xl opacity-80">
                                     <div onClick={() => completeTask(task.id)} className="w-5 h-5 rounded-md bg-green-500 flex items-center justify-center shrink-0 cursor-pointer"><CheckCircle2 className="w-3.5 h-3.5 text-white" /></div>
                                     <span className="text-[15px] font-medium text-gray-400 line-through truncate">{task.title}</span>
                                </div>
                             </div>
                        ))}
                    </div>
                )}
            </div>
        )}
        {sortedActive.length === 0 && sortedInbox.length === 0 && completedTasks.length === 0 && !showInboxZeroAnim && (
            <div className="flex flex-col items-center justify-center pt-20 opacity-40">
                <div className="w-16 h-16 bg-gray-200 rounded-full mb-4"></div>
                <p className="text-sm font-bold text-gray-400">{t('list.empty')}</p>
            </div>
        )}
      </div>
      {editingTask && <TaskDetailModal task={editingTask} onClose={() => setEditingTask(null)} onUpdate={updateTask} onDelete={deleteTask} t={t} />}
      {categorizingTask && <CategorySheet task={categorizingTask} onClose={() => setCategorizingTask(null)} onMove={(id, cat) => updateTask(id, { category: cat })} />}
    </div>
  );
};