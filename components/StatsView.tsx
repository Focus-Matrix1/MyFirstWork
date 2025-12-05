
import React, { useState, forwardRef } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence, useAnimation, PanInfo } from 'framer-motion';
import { Sun, Check, Coffee, BookOpen, Dumbbell, Droplets, ArrowRight, Clock, Wind, Sparkles, Repeat, Zap } from 'lucide-react';
import { useTasks } from '../context/TaskContext';
import { useLanguage } from '../context/LanguageContext';
import { Habit } from '../types';

/**
 * ------------------------------------------------------------------
 * Configuration & Helpers
 * ------------------------------------------------------------------
 */

// Map Tailwind classes from Context to Hex for motion style interpolation
const COLOR_MAP: Record<string, string> = {
  'bg-rose-500': '#F43F5E',
  'bg-blue-500': '#3B82F6',
  'bg-amber-400': '#FBBF24',
  'bg-green-500': '#22C55E',
  'bg-purple-500': '#A855F7',
  'bg-indigo-500': '#6366F1',
};

// Map Icon strings from Context to Lucide Components
const ICON_MAP: Record<string, React.ReactNode> = {
  'Book': <BookOpen size={18} />,
  'Droplet': <Droplets size={18} />,
  'Check': <Check size={18} />,
  'Zap': <Zap size={18} />,
  'Coffee': <Coffee size={18} />,
  'Dumbbell': <Dumbbell size={18} />,
};

const getHexColor = (tailwindClass: string) => COLOR_MAP[tailwindClass] || '#6366F1';
const getIcon = (iconName: string) => ICON_MAP[iconName] || <Sparkles size={18} />;

/**
 * ------------------------------------------------------------------
 * Ambient Background Component
 * Adds breathing light effects
 * ------------------------------------------------------------------
 */
const AmbientBackground = () => (
  <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
    <motion.div 
      animate={{ 
        scale: [1, 1.2, 1],
        opacity: [0.3, 0.5, 0.3],
        rotate: [0, 90, 0]
      }}
      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      className="absolute -top-[20%] -right-[20%] w-[600px] h-[600px] rounded-full blur-[100px]"
      style={{ background: 'radial-gradient(circle, rgba(254,215,170,0.4) 0%, rgba(255,255,255,0) 70%)' }}
    />
    <motion.div 
      animate={{ 
        scale: [1, 1.1, 1],
        x: [0, 50, 0],
      }}
      transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
      className="absolute top-[40%] -left-[20%] w-[500px] h-[500px] rounded-full blur-[80px]"
      style={{ background: 'radial-gradient(circle, rgba(224,231,255,0.4) 0%, rgba(255,255,255,0) 70%)' }}
    />
  </div>
);

/**
 * ------------------------------------------------------------------
 * Habit Card Component
 * Swipe right to complete interaction
 * ------------------------------------------------------------------
 */
const HabitCard = forwardRef<HTMLDivElement, { habit: Habit; onComplete: (id: string) => void }>(({ habit, onComplete }, ref) => {
  const x = useMotionValue(0);
  const controls = useAnimation();
  const [isCompleted, setIsCompleted] = useState(false);

  const THRESHOLD = 100;
  const hexColor = getHexColor(habit.color);

  // Transformations based on drag x position
  const progressWidth = useTransform(x, [0, THRESHOLD + 50], ["0%", "100%"]);
  const checkOpacity = useTransform(x, [THRESHOLD * 0.6, THRESHOLD], [0, 1]);
  const checkScale = useTransform(x, [THRESHOLD * 0.6, THRESHOLD], [0.5, 1.2]);
  
  const contentOpacity = useTransform(x, [0, THRESHOLD], [1, 0.5]);
  const contentScale = useTransform(x, [0, THRESHOLD], [1, 0.98]);

  const triggerCompletion = async () => {
    setIsCompleted(true);
    // Animate off screen to the right
    await controls.start({ x: 500, opacity: 0, transition: { duration: 0.35, ease: "backIn" } });
    onComplete(habit.id);
  };

  const handleDragEnd = async (_: any, info: PanInfo) => {
    if (info.offset.x > THRESHOLD) {
      await triggerCompletion();
    } else {
      controls.start({ x: 0, opacity: 1, scale: 1 });
    }
  };

  return (
    <motion.div
      ref={ref}
      layout
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      className="relative w-full mb-5 group touch-pan-y"
    >
      {/* Timeline connection line */}
      <div className="absolute left-[29px] -top-6 bottom-0 w-[1px] bg-stone-200 z-0 last:hidden" />

      <motion.div
        style={{ x, scale: contentScale }}
        drag="x"
        dragConstraints={{ left: 0, right: THRESHOLD + 20 }}
        dragElastic={0.12}
        onDragEnd={handleDragEnd}
        animate={controls}
        whileTap={{ cursor: "grabbing" }}
        className="relative z-10 bg-white rounded-2xl p-1 overflow-hidden shadow-[0_4px_20px_-12px_rgba(0,0,0,0.1)] hover:shadow-[0_8px_30px_-12px_rgba(0,0,0,0.12)] transition-shadow duration-300 border border-stone-100"
      >
        {/* Progress Background Fill */}
        <motion.div 
          className="absolute inset-0 z-0"
          style={{ 
            width: progressWidth,
            backgroundColor: `${hexColor}15`, // 15 = low opacity hex
          }}
        />

        <div className="relative z-10 flex items-center p-4 bg-white/80 backdrop-blur-sm rounded-xl">
          {/* Icon / Timeline Anchor */}
          <div className="flex items-center gap-4 mr-4">
             <div 
                className="w-12 h-12 rounded-full flex items-center justify-center border border-stone-100 bg-stone-50 text-stone-600 transition-colors group-hover:border-stone-200"
                style={{ color: hexColor }}
             >
                {getIcon(habit.icon)}
             </div>
          </div>

          {/* Text Content */}
          <motion.div style={{ opacity: contentOpacity }} className="flex-1">
             <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded">
                    Daily
                </span>
                {habit.streak > 0 && (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-orange-400 bg-orange-50 px-1.5 py-0.5 rounded flex items-center gap-1">
                     <span className="text-[8px]">🔥</span> {habit.streak}
                  </span>
                )}
             </div>
             {/* Removed font-serif to match app style */}
             <h3 className="text-lg font-bold text-stone-900 leading-tight">
                {habit.title}
             </h3>
             <p className="text-xs font-medium text-stone-400 flex items-center gap-1 mt-1">
                <Repeat size={10} />
                {habit.frequency || 'Every day'}
             </p>
          </motion.div>

          {/* Action Indicators - Clickable Check Button */}
          <div 
            className="relative w-10 h-10 flex items-center justify-center cursor-pointer rounded-full hover:bg-stone-50 active:scale-95 transition-all z-20"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
                e.stopPropagation();
                triggerCompletion();
            }}
          >
             <motion.div 
                style={{ opacity: checkOpacity, scale: checkScale }}
                className="absolute text-emerald-500"
             >
                <Check size={24} strokeWidth={3} />
             </motion.div>
             
             {/* Clickable Button - Replaces Progress Ring */}
             <motion.div style={{ opacity: useTransform(x, [0, 50], [1, 0]) }}>
                <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 hover:bg-stone-200 hover:text-stone-600 transition-colors">
                    <Check size={16} strokeWidth={2.5} />
                </div>
             </motion.div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
});

HabitCard.displayName = 'HabitCard';

/**
 * ------------------------------------------------------------------
 * Completed Item (Archive Style)
 * ------------------------------------------------------------------
 */
const CompletedItem: React.FC<{ habit: Habit }> = ({ habit }) => (
  <motion.div
    layout
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    className="flex items-center gap-3 py-2 pl-2"
  >
    <div className="w-1.5 h-1.5 rounded-full bg-stone-300" />
    {/* Removed font-serif */}
    <span className="text-sm text-stone-400 italic line-through decoration-stone-200">
        {habit.title}
    </span>
  </motion.div>
);

/**
 * ------------------------------------------------------------------
 * Main Habit View
 * ------------------------------------------------------------------
 */
export const HabitView: React.FC = () => {
  const { habits, toggleHabit } = useTasks();
  const { t, language } = useLanguage();

  const todayStr = new Date().toISOString().split('T')[0];
  
  // Separate Active vs Completed based on today's date
  const activeHabits = habits.filter(h => !h.completedDates.includes(todayStr));
  const completedHabits = habits.filter(h => h.completedDates.includes(todayStr));

  const handleComplete = (id: string) => {
      toggleHabit(id, todayStr);
  };

  // Date Formatting for Header
  const date = new Date();
  const dayName = date.toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US', { weekday: 'long' });
  const dayNum = date.getDate();
  const month = date.toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US', { month: 'short' });

  return (
    <div className="min-h-full w-full bg-[#FAFAF9] text-stone-900 font-sans selection:bg-orange-100 flex justify-center overflow-hidden relative">
      <AmbientBackground />
      
      <div className="w-full max-w-md h-full flex flex-col relative z-10 px-8 pt-8 pb-32">
        
        {/* --- Header --- */}
        <header className="mb-10 mt-4 flex items-end justify-between border-b border-stone-200 pb-6 shrink-0">
            <div>
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="flex items-center gap-2 text-stone-400 font-medium text-xs tracking-[0.2em] uppercase mb-2"
                >
                    <Sun size={14} className="text-orange-400" />
                    <span>{t('habits.today')}</span>
                </motion.div>
                
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-baseline gap-3"
                >
                    {/* Removed font-serif */}
                    <span className="text-6xl font-light tracking-tighter text-stone-800">
                        {dayNum}
                    </span>
                    <div className="flex flex-col">
                        <span className="text-xl font-medium text-stone-600 leading-none">{month}</span>
                        <span className="text-sm text-stone-400 font-light leading-tight">{dayName}</span>
                    </div>
                </motion.div>
            </div>
        </header>

        {/* --- Body: Active List --- */}
        {/* Changed scrollbar-hide to no-scrollbar defined in index.html */}
        <main className="flex-1 relative no-scrollbar overflow-y-auto pr-2 -mr-2">
             {/* Timeline Line */}
             <div className="absolute left-[29px] top-0 bottom-0 w-[1px] bg-gradient-to-b from-stone-200 to-transparent z-0 opacity-50" />

             <AnimatePresence mode='popLayout'>
                {activeHabits.map(habit => (
                    <HabitCard 
                        key={habit.id} 
                        habit={habit} 
                        onComplete={handleComplete} 
                    />
                ))}
             </AnimatePresence>

             {/* Empty State / All Done */}
             {activeHabits.length === 0 && habits.length > 0 && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="py-20 flex flex-col items-center justify-center text-center opacity-60"
                >
                    <Wind size={40} className="text-stone-300 mb-4" />
                    {/* Removed font-serif */}
                    <p className="text-lg text-stone-500 italic">"The day is yours."</p>
                </motion.div>
             )}

             {/* True Empty State (No habits created yet) */}
             {habits.length === 0 && (
                <div className="py-20 flex flex-col items-center justify-center text-center opacity-40">
                    <Sparkles size={32} className="text-stone-300 mb-4" />
                    <p className="text-sm text-stone-500 font-medium">Create your first habit</p>
                </div>
             )}
        </main>

        {/* --- Footer: Completed Archive --- */}
        {completedHabits.length > 0 && (
            <footer className="mt-auto pt-6 border-t border-stone-100 shrink-0">
                <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold text-stone-300 uppercase tracking-widest">
                        Archive
                    </span>
                </div>
                <div className="min-h-[50px] space-y-1">
                    <AnimatePresence>
                        {completedHabits.map(habit => (
                            <CompletedItem key={habit.id} habit={habit} />
                        ))}
                    </AnimatePresence>
                </div>
            </footer>
        )}
      </div>
    </div>
  );
};
