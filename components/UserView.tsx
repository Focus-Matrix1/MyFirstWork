
import React, { useState, useEffect } from 'react';
import { useTasks } from '../context/TaskContext';
import { useLanguage } from '../context/LanguageContext';
import { ShieldAlert, ChevronRight, User, Trash2, Languages, Share, Download as InstallIcon, X, Cloud, LogOut, Smartphone, Lock, RefreshCw, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { User as SupabaseUser } from '@supabase/supabase-js';

// --- Analytics Helper ---
const trackEvent = (name: string, data?: object) => {
    console.log(`[Analytics] ${name}`, data);
    // In a real app, send to Mixpanel/Amplitude/GA here
};

export const UserView: React.FC = () => {
  const { hardcoreMode, toggleHardcoreMode, tasks, clearAllTasks, restoreTasks } = useTasks();
  const { language, setLanguage, t } = useLanguage();
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  // Auth State
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  
  // Sync State
  const [syncing, setSyncing] = useState(false);

  // Check User Session on Mount
  useEffect(() => {
      supabase.auth.getSession().then(({ data: { session } }) => {
          setUser(session?.user ?? null);
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
          setUser(session?.user ?? null);
      });

      return () => subscription.unsubscribe();
  }, []);

  // --- Auth Handlers ---
  const handleAuth = async (e: React.FormEvent) => {
      e.preventDefault();
      setAuthLoading(true);
      setAuthError('');

      // Fake Email Logic: phone + @focus.app
      const email = `${phone}@focus.app`;

      try {
          let error;
          if (isLoginMode) {
              const res = await supabase.auth.signInWithPassword({ email, password });
              error = res.error;
              if (!error) trackEvent('login_success', { userId: res.data.user.id });
          } else {
              const res = await supabase.auth.signUp({ email, password });
              error = res.error;
              if (!error) trackEvent('signup_success', { userId: res.data.user?.id });
          }

          if (error) throw error;
          
          setShowAuthModal(false);
          // Auto-sync after login? Optional.
          handleSync(true); // Restore from cloud on login

      } catch (err: any) {
          console.error(err);
          // Show the actual error message from Supabase (e.g., "Email signups are disabled")
          // instead of a generic one, so the user/developer knows what to fix.
          setAuthError(err.message || t('auth.error'));
          trackEvent('auth_fail', { error: err.message });
      } finally {
          setAuthLoading(false);
      }
  };

  const handleLogout = async () => {
      await supabase.auth.signOut();
      setUser(null);
      trackEvent('logout');
  };

  // --- Sync Handlers ---
  const handleSync = async (restoreMode = false) => {
      if (!user) return;
      setSyncing(true);

      try {
          if (restoreMode) {
              // Restore: Cloud -> Local
              const { data, error } = await supabase.from('backups').select('data').eq('user_id', user.id).single();
              
              if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "Row not found" (no backup yet)

              if (data && data.data) {
                  restoreTasks(data.data);
                  alert(t('cloud.restore_success'));
                  trackEvent('restore_success');
              }
          } else {
              // Backup: Local -> Cloud
              const { error } = await supabase.from('backups').upsert({
                  user_id: user.id,
                  data: tasks,
                  updated_at: new Date().toISOString()
              });
              if (error) throw error;
              alert(t('cloud.upload_success'));
              trackEvent('backup_success', { taskCount: tasks.length });
          }
      } catch (err: any) {
          console.error("Sync Error", err);
          alert("Sync Failed: " + err.message);
      } finally {
          setSyncing(false);
      }
  };

  // Format Phone for Display (e.g. 13800001234 -> 138****1234)
  const displayPhone = user?.email?.split('@')[0].replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') || 'User';

  const handleClearData = () => {
    if (window.confirm(t('user.clear.confirm'))) {
        clearAllTasks();
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'zh' : 'en');
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#F2F4F7] relative">
      <div className="px-6 pt-10 pb-8 shrink-0">
        <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gray-900 flex items-center justify-center text-white shadow-lg ring-4 ring-white relative overflow-hidden">
                {user ? (
                    <span className="text-xl font-bold">{displayPhone.slice(0, 3)}</span>
                ) : (
                    <User className="w-8 h-8" />
                )}
            </div>
            <div>
                <h1 className="text-[24px] font-bold text-gray-900">
                    {user ? displayPhone : t('user.guest')}
                </h1>
                <span className={`text-[13px] px-2 py-0.5 rounded-full border text-xs font-medium shadow-sm ${user ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-white text-gray-500 border-gray-200'}`}>
                    {user ? 'Pro Account' : t('user.tier')}
                </span>
            </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 space-y-4 pb-32">
        
        {/* Cloud Backup Card */}
        {!user ? (
            <div 
                className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-5 shadow-lg text-white active:scale-[0.99] transition-transform cursor-pointer relative overflow-hidden group"
                onClick={() => setShowAuthModal(true)}
            >
                <Cloud className="w-24 h-24 text-white opacity-10 absolute -right-4 -bottom-4 group-hover:scale-110 transition-transform duration-500" />
                <div className="relative z-10 flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold mb-1">{t('cloud.title')}</h3>
                        <p className="text-sm opacity-90">{t('cloud.desc')}</p>
                    </div>
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                        <ChevronRight className="w-6 h-6" />
                    </div>
                </div>
            </div>
        ) : (
            <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 rounded-xl"><Cloud className="w-5 h-5 text-indigo-500" /></div>
                        <h3 className="text-[15px] font-bold text-gray-900">{t('cloud.title')}</h3>
                    </div>
                    {syncing ? (
                        <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                    ) : (
                        <span className="text-xs text-green-500 font-bold">Active</span>
                    )}
                 </div>
                 
                 <div className="grid grid-cols-2 gap-3 pt-1">
                     <button 
                        onClick={() => handleSync(false)}
                        disabled={syncing}
                        className="flex items-center justify-center gap-2 py-2.5 bg-gray-50 rounded-xl text-sm font-bold text-gray-700 active:bg-gray-100"
                    >
                        <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                        {t('cloud.sync')}
                    </button>
                    <button 
                        onClick={handleLogout}
                        className="flex items-center justify-center gap-2 py-2.5 bg-red-50 rounded-xl text-sm font-bold text-red-600 active:bg-red-100"
                    >
                        <LogOut className="w-4 h-4" />
                        {t('auth.logout')}
                    </button>
                 </div>
            </div>
        )}

        {/* Language Toggle */}
        <div 
            className="bg-white rounded-2xl p-4 shadow-sm active:scale-[0.99] transition-transform cursor-pointer"
            onClick={toggleLanguage}
        >
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-50 rounded-xl"><Languages className="w-5 h-5 text-indigo-500" /></div>
                    <h3 className="text-[15px] font-bold text-gray-900">{t('user.language')}</h3>
                </div>
                <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
                    <span className={`text-xs font-bold px-2 py-1 rounded-md transition-all ${language === 'en' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400'}`}>EN</span>
                    <span className={`text-xs font-bold px-2 py-1 rounded-md transition-all ${language === 'zh' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400'}`}>中</span>
                </div>
            </div>
        </div>

        {/* Hardcore Mode Toggle */}
        <div 
            className="bg-white rounded-2xl p-4 shadow-sm active:scale-[0.99] transition-transform cursor-pointer"
            onClick={toggleHardcoreMode}
        >
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-rose-50 rounded-xl"><ShieldAlert className="w-5 h-5 text-rose-500" /></div>
                    <h3 className="text-[15px] font-bold text-gray-900">{t('user.hardcore')}</h3>
                </div>
                {/* Switch */}
                <div className={`w-11 h-6 rounded-full relative transition-colors duration-200 ${hardcoreMode ? 'bg-rose-500' : 'bg-gray-200'}`}>
                    <div className={`w-5 h-5 bg-white rounded-full shadow-sm absolute top-0.5 left-0.5 transition-transform duration-200 ${hardcoreMode ? 'translate-x-5' : ''}`}></div>
                </div>
            </div>
            <p className="text-[12px] text-gray-500 leading-relaxed pl-[52px]">
                {t('user.hardcore.desc')}
            </p>
        </div>

        {/* Install / Add to Home Screen */}
        <div 
            className="bg-white rounded-2xl p-4 shadow-sm active:scale-[0.99] transition-transform cursor-pointer"
            onClick={() => setShowInstallModal(true)}
        >
             <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-900 rounded-xl"><InstallIcon className="w-5 h-5 text-white" /></div>
                    <h3 className="text-[15px] font-bold text-gray-900">{t('user.install')}</h3>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300" />
            </div>
             <p className="text-[12px] text-gray-500 leading-relaxed pl-[52px]">
                {t('user.install.desc')}
            </p>
        </div>

        {/* Clear Data */}
        <div 
            className="bg-white rounded-2xl p-4 shadow-sm flex items-center justify-between active:scale-[0.99] transition-transform cursor-pointer group"
            onClick={handleClearData}
        >
            <div className="flex items-center gap-3">
                <div className="p-2 bg-red-50 rounded-xl"><Trash2 className="w-5 h-5 text-red-500" /></div>
                <span className="text-[15px] font-bold text-red-600">{t('user.clear')}</span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-red-200 transition-colors" />
        </div>

        <div className="text-center mt-12 mb-8">
            <span className="text-[10px] text-gray-400 font-medium">{t('user.version')}</span>
        </div>
      </div>

        {/* Install Guide Modal */}
        {showInstallModal && (
            <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-end sm:items-center sm:justify-center p-4" onClick={() => setShowInstallModal(false)}>
                <div className="bg-white w-full max-w-sm rounded-[32px] p-6 shadow-2xl animate-slide-up sm:animate-fade-in" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-gray-900">{t('install.title')}</h3>
                        <button onClick={() => setShowInstallModal(false)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200">
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>
                    
                    <div className="space-y-6">
                        {/* iOS Guide */}
                        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="px-2 py-0.5 bg-black text-white text-[10px] font-bold rounded">iOS</span>
                                <span className="text-xs font-semibold text-gray-400">Safari</span>
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 text-sm text-gray-700">
                                    <Share className="w-5 h-5 text-blue-500 shrink-0" />
                                    <span>{t('install.ios.step1')}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-gray-700">
                                    <div className="w-5 h-5 flex items-center justify-center bg-gray-200 rounded text-gray-600 font-bold text-[10px]">+</div>
                                    <span>{t('install.ios.step2')}</span>
                                </div>
                            </div>
                        </div>

                         {/* Android Guide */}
                         <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="px-2 py-0.5 bg-green-600 text-white text-[10px] font-bold rounded">Android</span>
                                <span className="text-xs font-semibold text-gray-400">Chrome</span>
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 text-sm text-gray-700">
                                    <span className="font-bold text-lg leading-none text-gray-400">⋮</span>
                                    <span>{t('install.android.step1')}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-gray-700">
                                    <InstallIcon className="w-4 h-4 text-gray-600 shrink-0" />
                                    <span>{t('install.android.step2')}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <button 
                        onClick={() => setShowInstallModal(false)}
                        className="w-full mt-6 bg-black text-white font-bold py-3.5 rounded-xl active:scale-95 transition-transform"
                    >
                        {t('install.button.close')}
                    </button>
                </div>
            </div>
        )}

        {/* Auth Modal */}
        {showAuthModal && (
            <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-end sm:items-center sm:justify-center p-4 animate-fade-in" onClick={() => setShowAuthModal(false)}>
                <div className="bg-white w-full max-w-sm rounded-[32px] p-8 shadow-2xl slide-up" onClick={e => e.stopPropagation()}>
                     <div className="flex justify-between items-center mb-8">
                        <div>
                            <h3 className="text-2xl font-bold text-gray-900">{isLoginMode ? t('auth.login') : t('auth.signup')}</h3>
                            <p className="text-sm text-gray-400 mt-1">Focus Matrix Cloud</p>
                        </div>
                        <button onClick={() => setShowAuthModal(false)} className="p-2 bg-gray-50 rounded-full hover:bg-gray-100">
                            <X className="w-6 h-6 text-gray-400" />
                        </button>
                    </div>

                    <form onSubmit={handleAuth} className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase ml-1">{t('auth.phone')}</label>
                            <div className="relative">
                                <div className="absolute left-4 top-3.5 text-gray-400"><Smartphone className="w-5 h-5" /></div>
                                <input 
                                    type="tel" 
                                    value={phone}
                                    onChange={e => setPhone(e.target.value)}
                                    placeholder={t('auth.placeholder.phone')}
                                    className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 pl-12 pr-4 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium text-gray-900"
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase ml-1">{t('auth.password')}</label>
                            <div className="relative">
                                <div className="absolute left-4 top-3.5 text-gray-400"><Lock className="w-5 h-5" /></div>
                                <input 
                                    type="password" 
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder={t('auth.placeholder.pass')}
                                    className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 pl-12 pr-4 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium text-gray-900"
                                    required
                                    minLength={6}
                                />
                            </div>
                        </div>

                        {authError && (
                            <div className="p-3 bg-red-50 text-red-600 text-xs rounded-lg font-medium break-words">
                                {authError}
                            </div>
                        )}

                        <button 
                            type="submit" 
                            disabled={authLoading}
                            className="w-full bg-indigo-600 text-white font-bold py-3.5 rounded-xl active:scale-95 transition-transform flex items-center justify-center gap-2 mt-4 disabled:opacity-70 disabled:scale-100"
                        >
                            {authLoading && <Loader2 className="w-5 h-5 animate-spin" />}
                            {isLoginMode ? t('auth.login') : t('auth.signup')}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <button 
                            onClick={() => setIsLoginMode(!isLoginMode)}
                            className="text-sm font-semibold text-gray-500 hover:text-indigo-600 transition-colors"
                        >
                            {isLoginMode ? t('auth.switch.signup') : t('auth.switch.login')}
                        </button>
                    </div>
                </div>
            </div>
        )}

    </div>
  );
};
