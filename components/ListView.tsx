import React, { useState, useRef, useEffect } from 'react';
import { LayoutGrid, Trash2, X, Zap, Calendar, Users, Coffee, Clock } from 'lucide-react';
import { useTasks } from '../context/TaskContext';
import { useLanguage } from '../context/LanguageContext';
import { Task, CategoryId, QuadrantId } from '../types';

// --- Task Detail Modal ---
const TaskDetailModal: React.FC<{
  task: Task | null;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<Task>) => void;
  onDelete: (id: string) => void;
  t: (key: string) => string;
}> = ({ task, onClose, onUpdate, onDelete, t }) => {
  const [title, setTitle] = useState(task?.title || '');
  const [category, setCategory] = useState<CategoryId>(task?.category || 'inbox');

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setCategory(task.category);
    }
  }, [task]);

  if (!task) return null;

  const handleSave = () => {
    onUpdate(task.id, { title, category });
    onClose();
  };

  const handleDelete = () => {
    onDelete(task.id);
    onClose();
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div 
        className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-end sm:items-center sm:justify-center animate-fade-in"
        onClick={onClose}
    >
        <div 
            className="w-full sm:max-w-md bg-white rounded-t-[32px] sm:rounded-[32px] p-6 pb-safe shadow-2xl slide-up"
            onClick={(e) => e.stopPropagation()}
        >
            <div className="flex justify-between items-center mb-6">
                <span className="text-[18px] font-bold text-gray-900">{t('detail.title')}</span>
                <button onClick={onClose} className="p-2 bg-gray-100 rounded-full active:scale-95">
                    <X className="w-5 h-5 text-gray-500" />
                </button>
            </div>

            <div className="space-y-6">
                {/* Title Input */}
                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                    <input 
                        type="text" 
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full bg-transparent text-lg font-medium outline-none text-gray-900 placeholder-gray-400"
                    />
                </div>

                {/* Category Selection */}
                <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 block px-1">{t('detail.category')}</label>
                    <div className="grid grid-cols-2 gap-3">
                        <button 
                            onClick={() => setCategory('inbox')}
                            className={`p-3 rounded-xl border flex items-center gap-2 transition-all active:scale-95 ${category === 'inbox' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white border-gray-200 text-gray-600'}`}
                        >
                           <div className={`w-3 h-3 rounded-full ${category === 'inbox' ? 'bg-white' : 'bg-gray-300'}`}></div>
                           <span className="text-sm font-bold">{t('matrix.inbox')}</span>
                        </button>
                        <button 
                            onClick={() => setCategory('q1')}
                            className={`p-3 rounded-xl border flex items-center gap-2 transition-all active:scale-95 ${category === 'q1' ? 'bg-rose-500 text-white border-rose-500' : 'bg-white border-gray-200 text-gray-600'}`}
                        >
                           <Zap className="w-4 h-4" />
                           <span className="text-sm font-bold">{t('q1.title')}</span>
                        </button>
                        <button 
                            onClick={() => setCategory('q2')}
                            className={`p-3 rounded-xl border flex items-center gap-2 transition-all active:scale-95 ${category === 'q2' ? 'bg-blue-500 text-white border-blue-500' : 'bg-white border-gray-200 text-gray-600'}`}
                        >
                           <Calendar className="w-4 h-4" />
                           <span className="text-sm font-bold">{t('q2.title')}</span>
                        </button>
                        <button 
                            onClick={() => setCategory('q3')}
                            className={`p-3 rounded-xl border flex items-center gap-2 transition-all active:scale-95 ${category === 'q3' ? 'bg-amber-500 text-white border-amber-500' : 'bg-white border-gray-200 text-gray-600'}`}
                        >
                           <Users className="w-4 h-4" />
                           <span className="text-sm font-bold">{t('q3.title')}</span>
                        </button>
                         <button 
                            onClick={() => setCategory('q4')}
                            className={`p-3 rounded-xl border flex items-center gap-2 transition-all active:scale-95 ${category === 'q4' ? 'bg-slate-500 text-white border-slate-500' : 'bg-white border-gray-200 text-gray-600'}`}
                        >
                           <Coffee className="w-4 h-4" />
                           <span className="text-sm font-bold">{t('q4.title')}</span>
                        </button>
                    </div>
                </div>
                
                {/* Meta Info */}
                 <div className="flex items-center gap-2 text-xs text-gray-400 px-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{t('detail.created')}: {formatDate(task.createdAt)}</span>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                     <button 
                        onClick={handleDelete}
                        className="flex-1 py-4 rounded-xl bg-red-50 text-red-600 font-bold active:scale-95 transition-transform flex items-center justify-center gap-2"
                    >
                        <Trash2 className="w-5 h-5" />
                        {t('detail.delete')}
                    </button>
                    <button 
                        onClick={handleSave}
                        className="flex-[2] py-4 rounded-xl bg-black text-white font-bold active:scale-95 transition-transform"
                    >
                        {t('detail.save')}
                    </button>
                </div>
            </div>
        </div>
    </div>
  );
};

// --- Swipeable Task Item ---
const SwipeableTask: React.FC<{ 
  task: Task; 
  onCategorize: (task: Task) => void;
  onDelete: (id: string) => void;
  onComplete: (id: string) => void;
  onClick: (task: Task) => void;
  t: (key: string) => string;
}> = ({ task, onCategorize, onDelete, onComplete, onClick, t }) => {
  const [offset, setOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const itemRef = useRef<HTMLDivElement>(null);

  const handlePointerDown = (e: React.PointerEvent) => {
    // Checkbox click is handled separately via stopPropagation
    if ((e.target as HTMLElement).closest('.checkbox-area')) return;
    
    // Explicitly set capture to ensure we get events even if finger moves off element
    (e.currentTarget as Element).setPointerCapture(e.pointerId);

    setIsDragging(true);
    startX.current = e.clientX;
    startY.current = e.clientY;
    
    if (itemRef.current) itemRef.current.style.transition = 'none';
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    
    const dx = e.clientX - startX.current;
    
    // Resistance logic
    let newOffset = dx;
    if (newOffset > 100) newOffset = 100 + (newOffset - 100) * 0.2;
    if (newOffset < -100) newOffset = -100 + (newOffset + 100) * 0.2;
    
    setOffset(newOffset);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return;
    
    setIsDragging(false);
    (e.currentTarget as Element).releasePointerCapture(e.pointerId);

    const totalMove = Math.abs(e.clientX - startX.current);
    const totalY = Math.abs(e.clientY - startY.current);

    // If movement is very small, treat as a Click/Tap
    // Also check Y movement to prevent scrolling triggers
    if (totalMove < 5 && totalY < 5) {
        if (itemRef.current) itemRef.current.style.transition = 'transform 0.2s ease-out';
        setOffset(0);
        onClick(task);
        return;
    }

    if (itemRef.current) itemRef.current.style.transition = 'transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)';
    
    if (offset > 80) {
      setOffset(80); // Keep open partially to show action taken
      setTimeout(() => {
          onCategorize(task);
          setOffset(0); 
      }, 100);
    } else if (offset < -80) {
      setOffset(-window.innerWidth); // Fly off screen
      setTimeout(() => onDelete(task.id), 200);
    } else {
      setOffset(0); // Snap back
    }
  };

  return (
    <div 
      className="relative h-[68px] rounded-xl overflow-hidden group select-none w-full touch-pan-y" 
      // touch-pan-y allows vertical scroll but lets JS handle horizontal
    >
      {/* Background Actions */}
      <div className="absolute inset-0 flex z-0 rounded-xl overflow-hidden">
        <div className="w-full h-full bg-blue-500 flex items-center justify-start pl-6 text-white font-bold text-sm">
           <LayoutGrid className="w-5 h-5 mr-1" /> {t('list.action.categorize')}
        </div>
        <div className="absolute right-0 w-full h-full bg-rose-500 flex items-center justify-end pr-6 text-white font-bold text-sm">
           {t('list.action.delete')} <Trash2 className="w-5 h-5 ml-1" />
        </div>
      </div>

      {/* Foreground Content */}
      <div 
        ref={itemRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{ transform: `translateX(${offset}px)` }}
        className="absolute inset-0 bg-white p-4 flex items-center justify-between border border-gray-100 shadow-sm z-10 active:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3 overflow-hidden pointer-events-none">
            {/* Checkbox needs pointer-events-auto to receive clicks through the parent capture */}
          <div 
            className="checkbox-area pointer-events-auto w-6 h-6 rounded-md border-2 border-gray-300 flex items-center justify-center cursor-pointer hover:border-green-500 active:bg-green-50 transition-colors shrink-0"
            onClick={(e) => { 
                e.stopPropagation(); // Stop bubbling to swipe handler
                onComplete(task.id); 
            }}
          ></div>
          <div className="flex flex-col min-w-0">
             <span className="text-[15px] font-medium text-gray-800 truncate">{task.title}</span>
          </div>
        </div>
        <div className="shrink-0 ml-2 pointer-events-none">
            <span className={`text-[10px] px-2 py-1 rounded font-medium ${
                task.category === 'inbox' ? 'bg-gray-100 text-gray-500' :
                task.category === 'q1' ? 'bg-rose-100 text-rose-600' :
                task.category === 'q2' ? 'bg-blue-100 text-blue-600' :
                task.category === 'q3' ? 'bg-amber-100 text-amber-600' :
                'bg-slate-100 text-slate-600'
            }`}>
                {task.category === 'inbox' ? t('matrix.inbox') :
                 task.category === 'q1' ? 'Q1' :
                 task.category === 'q2' ? 'Q2' :
                 task.category === 'q3' ? 'Q3' : 'Q4'}
            </span>
        </div>
      </div>
    </div>
  );
};

export const ListView: React.FC = () => {
  const { tasks, completeTask, deleteTask, moveTask, updateTask, hardcoreMode } = useTasks();
  const { t } = useLanguage();
  const [categorizingTask, setCategorizingTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Filter out completed tasks for the list
  const activeTasks = tasks.filter(t => !t.completed);

  const handleCategorySelect = (category: CategoryId) => {
    if (categorizingTask) {
        moveTask(categorizingTask.id, category);
        setCategorizingTask(null);
    }
  };

  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-[#F5F7FA] relative">
      <div className="bg-white z-40 relative pt-6 pb-4 px-6 shadow-sm rounded-b-[32px] shrink-0 mb-4">
        <div className="flex justify-between items-center px-1">
          <div>
            <h1 className="text-[26px] font-bold text-gray-900 tracking-tight">{t('list.title')}</h1>
            <span className="text-[12px] font-medium text-gray-400 font-['Inter']">
              {hardcoreMode ? t('list.hint.hardcore') : t('list.hint.normal')}
            </span>
          </div>
          <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-sm font-bold text-gray-500">
            {activeTasks.length}
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 overflow-y-auto no-scrollbar pb-32 space-y-3">
        {activeTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 mt-10 text-gray-400">
                <span className="text-sm">{t('list.empty')}</span>
            </div>
        ) : (
            activeTasks.map(task => (
            <SwipeableTask 
                key={task.id} 
                task={task} 
                onCategorize={(t) => !hardcoreMode && setCategorizingTask(t)} 
                onDelete={(id) => !hardcoreMode && deleteTask(id)}
                onComplete={completeTask}
                onClick={(t) => setEditingTask(t)}
                t={t}
            />
            ))
        )}
      </div>

      {/* Task Detail Modal */}
      {editingTask && (
        <TaskDetailModal 
            task={editingTask}
            onClose={() => setEditingTask(null)}
            onUpdate={updateTask}
            onDelete={deleteTask}
            t={t}
        />
      )}

      {/* Category Sheet (triggered by swipe) */}
      {categorizingTask && (
        <div 
            className="absolute inset-0 z-[60] bg-black/30 backdrop-blur-sm flex items-end animate-fade-in"
            onClick={() => setCategorizingTask(null)}
        >
            <div 
                className="w-full bg-white rounded-t-[32px] p-6 pb-24 slide-up shadow-2xl" 
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-6">
                    <span className="text-[16px] font-bold text-gray-900">{t('list.move_to').replace('{title}', categorizingTask.title)}</span>
                    <button onClick={() => setCategorizingTask(null)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"><X className="w-4 h-4 text-gray-500" /></button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => handleCategorySelect('q1')} className="p-4 bg-rose-50 border border-rose-100 rounded-xl flex flex-col items-center gap-2 active:scale-95 transition-transform hover:bg-rose-100">
                        <Zap className="w-6 h-6 text-rose-500" />
                        <span className="text-xs font-bold text-rose-700">{t('q1.title')} (Q1)</span>
                    </button>
                    <button onClick={() => handleCategorySelect('q2')} className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex flex-col items-center gap-2 active:scale-95 transition-transform hover:bg-blue-100">
                        <Calendar className="w-6 h-6 text-blue-500" />
                        <span className="text-xs font-bold text-blue-700">{t('q2.title')} (Q2)</span>
                    </button>
                    <button onClick={() => handleCategorySelect('q3')} className="p-4 bg-amber-50 border border-amber-100 rounded-xl flex flex-col items-center gap-2 active:scale-95 transition-transform hover:bg-amber-100">
                        <Users className="w-6 h-6 text-amber-500" />
                        <span className="text-xs font-bold text-amber-700">{t('q3.title')} (Q3)</span>
                    </button>
                    <button onClick={() => handleCategorySelect('q4')} className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex flex-col items-center gap-2 active:scale-95 transition-transform hover:bg-slate-100">
                        <Coffee className="w-6 h-6 text-slate-500" />
                        <span className="text-xs font-bold text-slate-700">{t('q4.title')} (Q4)</span>
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};