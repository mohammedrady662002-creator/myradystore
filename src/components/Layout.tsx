import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Wallet, 
  BarChart3, 
  LogOut, 
  Moon, 
  Sun, 
  Smartphone,
  User as UserIcon,
  Search,
  Bell,
  Menu,
  X,
  Calculator,
  CloudCheck,
  CloudOff,
  CloudUpload,
  RotateCcw
} from 'lucide-react';
import { useStore } from '../lib/store';
import { cn } from '../lib/utils';

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'الرئيسية', icon: LayoutDashboard },
  { id: 'inventory', label: 'المخزون', icon: Package },
  { id: 'sales', label: 'المبيعات', icon: ShoppingCart },
  { id: 'finance', label: 'الماليات', icon: Wallet },
  { id: 'customers', label: 'العملاء والديون', icon: UserIcon },
  { id: 'audit', label: 'الجرد والتصفية', icon: Calculator },
  { id: 'reports', label: 'التقارير', icon: BarChart3 },
];

export default function Layout({ children, activeTab, setActiveTab }: { 
  children: React.ReactNode, 
  activeTab: string, 
  setActiveTab: (tab: string) => void 
}) {
  const { currentUser, setCurrentUser, isDarkMode, toggleDarkMode, syncStatus, syncError, initializeStore } = useStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const allSynced = Object.values(syncStatus).every(v => v);

  const handleLogout = () => setCurrentUser(null);

  const filteredNavItems = NAV_ITEMS.filter(item => {
    if (currentUser?.role === 'owner') return true;
    // Employee sees Sales, Finance, and Customers (Inventory removed)
    return ['sales', 'finance', 'customers'].includes(item.id);
  });

  return (
    <div className="min-h-screen transition-colors duration-300">
      <div className="flex bg-slate-50 dark:bg-[#060608] text-slate-900 dark:text-slate-100 h-screen font-sans transition-colors duration-300 overflow-hidden" dir="rtl">
        
        {/* Sidebar - Desktop */}
        <aside className="hidden lg:flex flex-col w-72 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-white/5 h-full transition-all luxury-shadow z-50 flex-shrink-0">
          <div className="p-10 flex flex-col items-center text-center flex-shrink-0">
            <div className="w-20 h-20 bg-slate-900 dark:bg-primary rounded-[2rem] flex items-center justify-center shadow-2xl mb-4 group cursor-pointer animate-[float_6s_infinite_ease-in-out]">
              <Smartphone className="text-white group-hover:scale-110 transition-transform duration-500" size={40} />
            </div>
            <h1 className="font-display font-black text-2xl tracking-tighter text-luxury">راضي ستور</h1>
            <div className="flex items-center gap-2 mt-1">
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
               <span className="text-[9px] uppercase font-bold text-slate-400 tracking-[0.2em]">نظام راضي الذكي</span>
            </div>
          </div>

          <nav className="flex-1 px-6 space-y-3 mt-4 overflow-y-auto custom-scrollbar pb-8">
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={cn(
                    "flex items-center gap-4 w-full px-6 py-4 rounded-2xl font-black text-xs transition-all group relative",
                    isActive 
                      ? "bg-slate-900 dark:bg-primary text-white shadow-xl shadow-primary/20 scale-[1.05]" 
                      : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5"
                  )}
                >
                  <Icon size={18} className={cn("transition-transform group-hover:scale-110", isActive ? "text-white" : "text-slate-400")} />
                  <span className="uppercase tracking-widest">{item.label}</span>
                  {isActive && (
                    <motion.div 
                      layoutId="activeTab" 
                      className="absolute right-0 w-1 h-6 bg-white rounded-l-full"
                    />
                  )}
                </button>
              );
            })}
          </nav>

          <div className="p-4 mt-auto">
            <div className="bg-slate-100 dark:bg-slate-800/50 rounded-2xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-700 flex items-center justify-center text-primary border border-slate-200 dark:border-white/10">
                <UserIcon size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm truncate">{currentUser?.name}</p>
                <p className="text-[10px] font-bold text-primary uppercase">{currentUser?.role === 'owner' ? 'المدير' : 'موظف'}</p>
              </div>
              <button 
                onClick={handleLogout}
                className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
                title="تسجيل الخروج"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </aside>

        {/* Mobile Drawer Overlay */}
        <AnimatePresence>
          {isSidebarOpen && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsSidebarOpen(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] lg:hidden"
              />
              <motion.aside 
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 300, mass: 0.8 }}
                className="fixed inset-y-0 right-0 w-80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl z-[101] lg:hidden flex flex-col shadow-[-20px_0_50px_rgba(0,0,0,0.2)]"
              >
                <div className="p-8 flex items-center justify-between border-b border-white/10">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-900 dark:bg-primary rounded-2xl flex items-center justify-center text-white shadow-xl">
                      <Smartphone size={28} />
                    </div>
                    <h1 className="font-display font-black text-2xl tracking-tighter text-luxury">راضي ستور</h1>
                  </div>
                  <button onClick={() => setIsSidebarOpen(false)} className="p-2 text-slate-500 bg-slate-100 dark:bg-white/5 rounded-xl transition-all active:scale-90"><X size={24} /></button>
                </div>
                <nav className="flex-1 px-6 space-y-3 py-6 overflow-y-auto custom-scrollbar">
                  {filteredNavItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => { 
                        if (window.navigator.vibrate) window.navigator.vibrate(5);
                        setActiveTab(item.id); 
                        setIsSidebarOpen(false); 
                      }}
                      className={cn(
                        "flex items-center gap-4 w-full px-6 py-4 rounded-2xl font-black text-sm transition-all relative group",
                        activeTab === item.id 
                          ? "bg-slate-900 dark:bg-primary text-white shadow-lg" 
                          : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5"
                      )}
                    >
                      <item.icon size={20} className={activeTab === item.id ? "text-white" : "text-slate-400"} />
                      <span className="uppercase tracking-widest">{item.label}</span>
                      {activeTab === item.id && (
                        <div className="absolute right-0 w-1 h-6 bg-white rounded-l-full" />
                      )}
                    </button>
                  ))}
                </nav>

                <div className="p-6 border-t border-white/10 bg-slate-50 dark:bg-black/20">
                  <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl flex items-center gap-4 shadow-sm">
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black">
                      {currentUser?.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-xs truncate">{currentUser?.name}</p>
                      <p className="text-[10px] font-bold text-emerald-500 uppercase">نشط الآن</p>
                    </div>
                  </div>
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
          
          {/* Top Header - Mobile and Desktop */}
          <header className="h-20 bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border-b border-slate-200 dark:border-white/5 flex-shrink-0 z-50 flex items-center justify-between px-4 lg:px-8">
            <div className="flex items-center gap-4">
              <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 text-slate-500">
                <Menu size={24} />
              </button>
              <div className="hidden lg:flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-4 py-2.5 rounded-2xl w-96 border border-slate-200 dark:border-white/5">
                <Search size={18} className="text-slate-400" />
                <input 
                  type="text" 
                  placeholder="بحث سريع في كل النظام..." 
                  className="bg-transparent border-none outline-none text-sm w-full font-medium"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
            <button 
              onClick={() => (syncError || !allSynced) && initializeStore()}
              className={cn(
                "hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all group",
                syncError 
                  ? "bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500 hover:text-white" 
                  : allSynced 
                    ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" 
                    : "bg-amber-500/10 text-amber-500 border border-amber-500/20 animate-pulse"
              )}
            >
              {syncError ? (
                <>
                  <CloudOff size={14} />
                  <span>خطأ في الاتصال - اضغط لإعادة المحاولة</span>
                  <RotateCcw size={12} className="group-hover:rotate-180 transition-transform" />
                </>
              ) : allSynced ? (
                <>
                  <CloudCheck size={14} />
                  <span>سحابي متصل</span>
                </>
              ) : (
                <>
                  <CloudUpload size={14} />
                  <span>جاري المزامنة...</span>
                </>
              )}
            </button>

              <button 
                onClick={toggleDarkMode}
                className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-primary transition-all shadow-sm"
                title={isDarkMode ? "الوضع المضيء" : "الوضع المظلم"}
              >
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              
              <button 
                onClick={handleLogout}
                className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-sm group"
                title="تسجيل الخروج"
              >
                <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
              </button>

              <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block"></div>
              
              <div className="flex items-center gap-3">
                <div className="text-left hidden sm:block">
                  <p className="font-bold text-sm leading-none">{currentUser?.name}</p>
                  <p className="text-[10px] font-bold text-emerald-500 uppercase mt-1">متصل الآن</p>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold shadow-sm">
                  {currentUser?.name[0]}
                </div>
              </div>
            </div>
          </header>

          {/* Tab Content */}
          <main className="flex-1 p-4 lg:p-8 overflow-y-auto custom-scrollbar pb-24 lg:pb-8">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {children}
            </motion.div>
          </main>

          {/* Bottom Nav - Mobile Only - Native Feel */}
          <nav className="fixed bottom-6 left-4 right-4 h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl lg:hidden flex items-center justify-around px-2 z-[100] rounded-3xl border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.3)] transition-transform duration-300">
            {filteredNavItems.slice(0, 5).map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (window.navigator.vibrate) window.navigator.vibrate(5);
                    setActiveTab(item.id);
                  }}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 w-14 h-14 rounded-2xl transition-all duration-300 relative",
                    isActive ? "text-primary bg-primary/5 scale-110" : "text-slate-400 hover:text-slate-200"
                  )}
                >
                  <Icon size={isActive ? 22 : 20} className={cn("transition-transform", isActive ? "animate-pulse" : "")} />
                  <span className="text-[8px] font-black uppercase tracking-tighter opacity-80">{item.label}</span>
                  {isActive && (
                    <motion.div 
                      layoutId="activeDotMobile" 
                      className="absolute -bottom-1 w-1 h-1 bg-primary rounded-full"
                    />
                  )}
                </button>
              );
            })}
          </nav>

        </div>
      </div>
    </div>
  );
}
