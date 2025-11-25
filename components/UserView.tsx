import React from 'react';
import { useTasks } from '../context/TaskContext';
import { ShieldAlert, Download, ChevronRight, User, Trash2 } from 'lucide-react';

export const UserView: React.FC = () => {
  const { hardcoreMode, toggleHardcoreMode, tasks, clearAllTasks } = useTasks();

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(tasks));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "focus_matrix_data.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleClearData = () => {
    if (window.confirm('Are you sure you want to clear all tasks? This cannot be undone.')) {
        clearAllTasks();
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#F2F4F7]">
      <div className="px-6 pt-10 pb-8 shrink-0">
        <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gray-900 flex items-center justify-center text-white shadow-lg ring-4 ring-white">
                <User className="w-8 h-8" />
            </div>
            <div>
                <h1 className="text-[24px] font-bold text-gray-900">Guest User</h1>
                <span className="text-[13px] text-gray-500 bg-white px-2 py-0.5 rounded-full border border-gray-200 text-xs font-medium shadow-sm">
                    Free Tier
                </span>
            </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 space-y-4">
        {/* Hardcore Mode Toggle */}
        <div 
            className="bg-white rounded-2xl p-4 shadow-sm active:scale-[0.99] transition-transform cursor-pointer"
            onClick={toggleHardcoreMode}
        >
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-rose-50 rounded-xl"><ShieldAlert className="w-5 h-5 text-rose-500" /></div>
                    <h3 className="text-[15px] font-bold text-gray-900">Hardcore Mode</h3>
                </div>
                {/* Switch */}
                <div className={`w-11 h-6 rounded-full relative transition-colors duration-200 ${hardcoreMode ? 'bg-rose-500' : 'bg-gray-200'}`}>
                    <div className={`w-5 h-5 bg-white rounded-full shadow-sm absolute top-0.5 left-0.5 transition-transform duration-200 ${hardcoreMode ? 'translate-x-5' : ''}`}></div>
                </div>
            </div>
            <p className="text-[12px] text-gray-500 leading-relaxed pl-[52px]">
                Disables dragging to sort active tasks. Forces you to clear the list.
            </p>
        </div>

        {/* Export Data */}
        <div 
            className="bg-white rounded-2xl p-4 shadow-sm flex items-center justify-between active:scale-[0.99] transition-transform cursor-pointer group"
            onClick={handleExport}
        >
            <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-xl"><Download className="w-5 h-5 text-blue-500" /></div>
                <span className="text-[15px] font-bold text-gray-900">Export JSON</span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
        </div>

        {/* Clear Data */}
        <div 
            className="bg-white rounded-2xl p-4 shadow-sm flex items-center justify-between active:scale-[0.99] transition-transform cursor-pointer group"
            onClick={handleClearData}
        >
            <div className="flex items-center gap-3">
                <div className="p-2 bg-red-50 rounded-xl"><Trash2 className="w-5 h-5 text-red-500" /></div>
                <span className="text-[15px] font-bold text-red-600">Clear All Data</span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-red-200 transition-colors" />
        </div>

        <div className="text-center mt-12">
            <span className="text-[10px] text-gray-400 font-medium">Focus Matrix v1.0.0</span>
        </div>
      </div>
    </div>
  );
};