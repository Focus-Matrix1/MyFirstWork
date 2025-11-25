import React, { useState } from 'react';
import { TaskProvider } from './context/TaskContext';
import { MatrixView } from './components/MatrixView';
import { ListView } from './components/ListView';
import { StatsView } from './components/StatsView';
import { UserView } from './components/UserView';
import { AddModal } from './components/AddModal';
import { LayoutGrid, ListTodo, BarChart2, User, Plus } from 'lucide-react';
import { ViewState } from './types';

const AppContent: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('matrix');
  const [isAddModalOpen, setAddModalOpen] = useState(false);

  const NavButton = ({ view, icon: Icon }: { view: ViewState; icon: React.ElementType }) => (
    <button 
      onClick={() => setCurrentView(view)}
      className={`flex flex-col items-center gap-1 w-12 group transition-colors duration-200 ${currentView === view ? 'text-black' : 'text-gray-400 hover:text-gray-600'}`}
    >
      <Icon className={`w-6 h-6 stroke-[2.5] transition-transform duration-200 ${currentView === view ? 'scale-110' : 'group-active:scale-90'}`} />
    </button>
  );

  return (
    <div className="w-full h-screen flex flex-col bg-[#F5F7FA] overflow-hidden text-gray-900 relative">
        
        {/* Main Content Area */}
        <div className="flex-1 overflow-hidden relative">
            <div className={`w-full h-full transition-opacity duration-300 ${currentView === 'matrix' ? 'opacity-100 z-10' : 'opacity-0 hidden'}`}>
                <MatrixView />
            </div>
            <div className={`w-full h-full transition-opacity duration-300 ${currentView === 'list' ? 'opacity-100 z-10' : 'opacity-0 hidden'}`}>
                <ListView />
            </div>
             <div className={`w-full h-full transition-opacity duration-300 ${currentView === 'stats' ? 'opacity-100 z-10' : 'opacity-0 hidden'}`}>
                <StatsView />
            </div>
            <div className={`w-full h-full transition-opacity duration-300 ${currentView === 'user' ? 'opacity-100 z-10' : 'opacity-0 hidden'}`}>
                <UserView />
            </div>
        </div>

        {/* Bottom Navigation */}
        <div className="h-[84px] bg-white/95 backdrop-blur-xl flex justify-around items-start pt-4 px-4 z-50 absolute bottom-0 left-0 right-0 border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
            <NavButton view="matrix" icon={LayoutGrid} />
            <NavButton view="list" icon={ListTodo} />
            
            {/* Add Button */}
            <button 
                onClick={() => setAddModalOpen(true)}
                className="relative -top-8 group"
            >
                <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center text-white shadow-xl shadow-black/20 transition-all duration-300 group-hover:scale-105 group-active:scale-95 border-[4px] border-white ring-1 ring-gray-100">
                    <Plus className="w-8 h-8 stroke-[3]" />
                </div>
            </button>

            <NavButton view="stats" icon={BarChart2} />
            <NavButton view="user" icon={User} />
        </div>

        <AddModal isOpen={isAddModalOpen} onClose={() => setAddModalOpen(false)} />
    </div>
  );
};

export default function App() {
  return (
    <TaskProvider>
      <AppContent />
    </TaskProvider>
  );
}