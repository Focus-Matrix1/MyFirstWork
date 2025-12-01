
import React, { useState, useRef, useEffect } from 'react';
import { LayoutGrid, Trash2, CheckCircle2, Check, Hourglass, ChevronDown, ChevronRight } from 'lucide-react';
import { useTasks } from '../context/TaskContext';
import { useLanguage } from '../context/LanguageContext';
import { Task, CategoryId } from '../types';
import { WeeklyCalendar } from './WeeklyCalendar';
import { TaskDetailModal } from './TaskDetailModal';
import { CategorySheet } from './CategorySheet';

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
  
  const startX = useRef(0);
  const startY = useRef(0);
  const isDragging = useRef(false);
  const directionLock = useRef<'horizontal' | 'vertical' | null>(null);
  const itemRef = useRef<HTMLDivElement>(null);

  const ACTION_WIDTH = 80; // Width of the action buttons

  const isInbox = task.category === 'inbox';

  const categoryConfig = {
      q1: { bg: 'bg-rose-500', border: 'border-rose-100', text: 'text-rose-700', badgeBg: 'bg-rose-100', checkboxBorder: 'border-rose-200', checkboxBg: 'bg-rose-50', checkColor: 'text-rose-500' },
      q2: { bg: 'bg-blue-500', border: 'border-blue-100', text: 'text-blue-700', badgeBg: 'bg-blue-100', checkboxBorder: 'border-blue-200', checkboxBg: 'bg-blue-50', checkColor: 'text-blue-500' },
      q3: { bg: 'bg-amber-400', border: 'border-amber-100', text: 'text-amber-700', badgeBg: 'bg-amber-100', checkboxBorder: 'border-amber-200', checkboxBg: 'bg-amber-50', checkColor: 'text-amber-500' },
      q4: { bg: 'bg-slate-400', border: 'border-slate-100', text: 'text-slate-700', badgeBg: 'bg-slate-100', checkboxBorder: 'border-slate-200', checkboxBg: 'bg-slate-50', checkColor: 'text-slate-500' },
      inbox: { bg: 'bg-gray-400', border: 'border-gray-200', text: 'text-gray-500', badgeBg: 'bg-gray-100', checkboxBorder: 'border-gray-300', checkboxBg: 'bg-white', checkColor: 'text-gray-500' }
  };

  const config = categoryConfig[task.category] || categoryConfig.inbox;

  const priorityLabels: Record<string, string> = {
      inbox: t('matrix.inbox'),
      q1: 'Q1',
      q2: 'Q2',
      q3: 'Q3',
      q4: 'Q4'
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('.checkbox-area')) return;
    
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    isDragging.current = true;
    directionLock.current = null;
    startX.current = e.clientX;
    startY.current = e.clientY;
    
    if (itemRef.current) itemRef.current.style.transition = 'none';
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    
    const currentX = e.clientX;
    const currentY = e.clientY;
    const dx = currentX - startX.current;
    const dy = currentY - startY.current;

    // --- Direction Lock ---
    if (!directionLock.current) {
        if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
            if (Math.abs(dx) > Math.abs(dy)) {
                directionLock.current = 'horizontal';
            } else {
                directionLock.current = 'vertical';
                isDragging.current = false; 
                return; 
            }
        }
    }

    if (directionLock.current === 'horizontal') {
        // Calculate new offset based on current position relative to start
        // NOTE: If already open, we need to adjust start logic or just add to current offset state?
        // Simple approach: Always drag from 0 or current snapped state.
        // For simplicity, we assume drag starts from visually 0 (closed) or snapped. 
        // But handling drag-from-open is complex. 
        // Let's stick to: Drag modifies offset from the value at start.
        // But `offset` state isn't updated during drag start. 
        // Let's calculate `newOffset` based on `offset` (at start) + `dx`.
        // However, `offset` is state. `startX` is ref.
        // Let's assume start offset is effectively what the state is.
        // But we need to capture the offset at touch start.
        // We didn't capture it. Let's rely on `dx` added to "base".
        // Actually, simplest is:
        
        // Logic: newOffset = dx. (Assuming starting from closed).
        // If we want to support dragging from open, we need `startOffset` ref.
        // Let's implement simpler behavior: Drag always calculates absolute displacement from touch start.
        // If it was open, it snaps back immediately on touch start? 
        // Let's stick to "Drag from Closed" for robust implementation or handle `startOffset`.
        
        // Let's add startOffset ref.
        // But for now, let's assume we start from 0 for simplicity, or if open, a tap closes it.
        // We will handle "Tap to close" separately.
        
        let newOffset = dx; // Assuming start from 0
        
        // If the item was already open, this logic is flawed.
        // However, we can enforce "Tap to Close" if open. 
        // So `handlePointerDown` could check `offset !== 0` and just prepare to close on Up without dragging?
        // Or we allow dragging. Let's stick to standard behavior:
        // If open, user usually taps to close.
        // If closed, user drags.
        
        if (Math.abs(offset) > 10) {
             // If already open, don't allow drag, just let PointerUp handle the close tap.
             return;
        }

        // Apply Resistance if dragging past action width
        if (newOffset > ACTION_WIDTH) newOffset = ACTION_WIDTH + (newOffset - ACTION_WIDTH) * 0.2;
        if (newOffset < -ACTION_WIDTH) newOffset = -ACTION_WIDTH + (newOffset + ACTION_WIDTH) * 0.2;

        setOffset(newOffset);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    isDragging.current = false;
    
    if (itemRef.current) itemRef.current.style.transition = 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)';

    // Snap Logic
    if (offset > ACTION_WIDTH / 2) {
        // Snap Open Right (Reveal Left Button)
        setOffset(ACTION_WIDTH); 
    } else if (offset < -ACTION_WIDTH / 2) { 
        // Snap Open Left (Reveal Right Button)
        setOffset(-ACTION_WIDTH);
    } else {
        // Snap Close
        setOffset(0);
    }
  };

  const handleContentClick = () => {
      if (Math.abs(offset) > 5) {
          // If open, close it
          setOffset(0);
      } else {
          // If closed, open details
          onClick(task);
      }
  };

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden group select-none touch-pan-y">
        {/* Background Actions (Clickable Buttons) */}
        <div className="absolute inset-0 flex z-0">
            {/* Left Button (Categorize) - Visible when offset > 0 */}
            <div className="absolute left-0 top-0 bottom-0 flex">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onCategorize(task);
                        setOffset(0);
                    }}
                    className="h-full bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs flex flex-col items-center justify-center gap-1 transition-colors"
                    style={{ width: ACTION_WIDTH }}
                >
                    <LayoutGrid className="w-5 h-5" />
                    {t('list.action.categorize')}
                </button>
            </div>
            
            {/* Right Button (Delete) - Visible when offset < 0 */}
            <div className="absolute right-0 top-0 bottom-0 flex justify-end">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete(task.id);
                        setOffset(0);
                    }}
                    className="h-full bg-red-500 hover:bg-red-600 text-white font-bold text-xs flex flex-col items-center justify-center gap-1 transition-colors"
                    style={{ width: ACTION_WIDTH }}
                >
                    <Trash2 className="w-5 h-5" />
                    {t('list.action.delete')}
                </button>
            </div>
        </div>

        {/* Foreground Content */}
        <div 
            ref={itemRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onClick={(e) => {
                if (!(e.target as HTMLElement).closest('.checkbox-area')) {
                    handleContentClick();
                }
            }}
            style={{ transform: `translateX(${offset}px)` }}
            className={`absolute inset-0 bg-white z-10 transition-transform active:scale-[0.99] cursor-pointer 
                ${isInbox 
                    ? 'p-3 flex items-center gap-3 border border-gray-100 rounded-xl shadow-sm hover:shadow-md' 
                    : `p-4 flex items-start gap-3 border ${config.border} shadow-sm rounded-2xl hover:shadow-md`
                }
            `}
        >
            {/* Color Strip for Non-Inbox */}
            {!isInbox && <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${config.bg}`}></div>}

            {/* Checkbox */}
            <div 
                className={`checkbox-area ${isInbox ? 'w-4 h-4' : 'w-5 h-5 mt-0.5'} rounded-md border-[1.5px] flex items-center justify-center shrink-0 transition-all duration-300 cursor-pointer
                    ${isInbox 
                        ? 'border-gray-300' 
                        : `${config.checkboxBorder} ${config.checkboxBg}`
                    }
                    ${task.completed ? 'bg-green-500 !border-green-500' : ''}
                `}
                onClick={(e) => {
                    e.stopPropagation();
                    onComplete(task.id);
                }}
            >
                 {task.completed ? (
                     <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                 ) : (
                    // Show Check icon on hover for non-inbox tasks
                    !isInbox && <Check className={`w-3 h-3 stroke-[3] opacity-0 group-hover:opacity-100 transition-opacity ${config.checkColor}`} />
                 )}
            </div>

            {/* Content Area */}
            <div className={`flex flex-col flex-1 overflow-hidden ${isInbox ? 'justify-center' : ''}`}>
                <span className={`${isInbox ? 'text-[14px] font-medium text-gray-700' : 'text-[16px] font-semibold text-gray-900 leading-snug'} truncate transition-all ${task.completed ? 'text-gray-400 line-through' : ''}`}>
                    {task.title}
                </span>
                
                {/* Meta Row (Only for Non-Inbox) */}
                {!isInbox && (
                    <div className="flex items-center gap-2 mt-2">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold tracking-tight ${config.badgeBg} ${config.text}`}>
                            {priorityLabels[task.category]}
                        </span>
                        
                        {(task.duration || task.description) && <div className="h-1 w-1 rounded-full bg-gray-300"></div>}
                        
                        {task.duration && (
                            <span className={`flex items-center gap-1 text-[12px] font-medium ${config.text.replace('700', '600')}`}>
                                <Hourglass className="w-3 h-3" /> {task.duration}
                            </span>
                        )}

                        {task.description && (
                            <span className="text-[12px] text-gray-500 truncate max-w-[140px]">
                                {task.description}
                            </span>
                        )}
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};

export const ListView: React.FC = () => {
  const { tasks, completeTask, deleteTask, selectedDate, updateTask, moveTask } = useTasks();
  const { t } = useLanguage();
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [categorizingTask, setCategorizingTask] = useState<Task | null>(null);
  const [showInboxZeroAnim, setShowInboxZeroAnim] = useState(false);
  const [isCompletedExpanded, setIsCompletedExpanded] = useState(false);

  const tasksForDate = tasks.filter(task => !task.completed && task.plannedDate === selectedDate);
  const backlogTasks = tasks.filter(task => !task.completed && task.category === 'inbox' && !task.plannedDate);
  const completedTasks = tasks.filter(task => task.completed && task.plannedDate === selectedDate);

  // --- Inbox Zero Logic ---
  const prevBacklogCount = useRef(backlogTasks.length);

  useEffect(() => {
    // Check if backlog dropped to 0 from a positive number
    if (prevBacklogCount.current > 0 && backlogTasks.length === 0) {
        setShowInboxZeroAnim(true);
        const timer = setTimeout(() => setShowInboxZeroAnim(false), 2500); // Show celebration for 2.5s
        return () => clearTimeout(timer);
    }
    prevBacklogCount.current = backlogTasks.length;
  }, [backlogTasks.length]);
  // ------------------------

  const sortTasks = (taskList: Task[]) => {
      const priorityOrder: Record<CategoryId, number> = { 'inbox': 0, 'q1': 1, 'q2': 2, 'q3': 3, 'q4': 4 };
      return [...taskList].sort((a, b) => {
          const pDiff = priorityOrder[a.category] - priorityOrder[b.category];
          if (pDiff !== 0) return pDiff;
          return b.createdAt - a.createdAt;
      });
  };

  const sortedPlanned = sortTasks(tasksForDate);
  const sortedBacklog = sortTasks(backlogTasks);

  const handleCategorize = (task: Task) => {
      setCategorizingTask(task);
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#F5F7FA] relative">
      <WeeklyCalendar />

      <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-32 pt-4">
        
        {/* Inbox Zero Celebration Banner */}
        {showInboxZeroAnim && (
            <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl p-4 mb-6 shadow-lg animate-bounce">
                <p className="text-white text-center font-bold text-lg">
                    {t('list.inbox_zero.celebrate')}
                </p>
            </div>
        )}

        {/* Inbox / Backlog Section */}
        {sortedBacklog.length > 0 && (
            <div className="bg-gray-50/80 rounded-2xl p-1 border border-dashed border-gray-300 mb-6 transition-all duration-300">
                 <div className="px-3 py-2 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t('list.section.backlog')}</span>
                    </div>
                    <span className="text-[10px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-md font-bold">{sortedBacklog.length}</span>
                </div>
                 {sortedBacklog.map(task => (
                     <div key={task.id} className="relative h-[52px] mb-1 mx-1">
                        <SwipeableTask task={task} onCategorize={handleCategorize} onDelete={deleteTask} onComplete={completeTask} onClick={setEditingTask} t={t} />
                     </div>
                ))}
            </div>
        )}

        {/* Planned Tasks Section */}
        {sortedPlanned.length > 0 && (
            <div className="mb-6 animate-fade-in space-y-3">
                {sortedPlanned.map(task => (
                    <div key={task.id} className="relative h-[84px] mb-3">
                        <SwipeableTask task={task} onCategorize={handleCategorize} onDelete={deleteTask} onComplete={completeTask} onClick={setEditingTask} t={t} />
                    </div>
                ))}
            </div>
        )}

        {/* Completed Section (Collapsible) */}
        {completedTasks.length > 0 && (
            <div className="mb-6 animate-fade-in">
                <button 
                    onClick={() => setIsCompletedExpanded(!isCompletedExpanded)}
                    className="flex items-center gap-2 mb-3 ml-1 group"
                >
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest group-hover:text-gray-600 transition-colors">
                        {t('list.section.completed')} ({completedTasks.length})
                    </span>
                    {isCompletedExpanded ? <ChevronDown className="w-3 h-3 text-gray-400" /> : <ChevronRight className="w-3 h-3 text-gray-400" />}
                </button>
                
                {isCompletedExpanded && (
                    <div className="animate-slide-up space-y-3">
                        {completedTasks.map(task => (
                             <div key={task.id} className="relative h-[64px] mb-3">
                                <div className="absolute inset-0 bg-gray-50 p-4 flex items-center gap-3 border border-gray-100 shadow-sm rounded-2xl opacity-80">
                                     <div onClick={() => completeTask(task.id)} className="w-5 h-5 rounded-md bg-green-500 flex items-center justify-center shrink-0 cursor-pointer">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                                     </div>
                                     <span className="text-[15px] font-medium text-gray-400 line-through truncate">{task.title}</span>
                                </div>
                             </div>
                        ))}
                    </div>
                )}
            </div>
        )}

        {sortedPlanned.length === 0 && sortedBacklog.length === 0 && completedTasks.length === 0 && !showInboxZeroAnim && (
            <div className="flex flex-col items-center justify-center pt-20 opacity-40">
                <div className="w-16 h-16 bg-gray-200 rounded-full mb-4"></div>
                <p className="text-sm font-bold text-gray-400">{t('list.empty')}</p>
            </div>
        )}
      </div>

      {editingTask && (
        <TaskDetailModal task={editingTask} onClose={() => setEditingTask(null)} onUpdate={updateTask} onDelete={deleteTask} t={t} />
      )}

      {categorizingTask && (
        <CategorySheet 
            task={categorizingTask} 
            onClose={() => setCategorizingTask(null)} 
            onMove={moveTask} 
        />
      )}
    </div>
  );
};
