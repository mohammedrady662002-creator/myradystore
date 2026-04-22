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
    // Employee sees Inventory, Sales, Finance, and Customers
    return ['inventory', 'sales', 'finance', 'customers'].includes(item.id);
  });

  return (
    <div className="min-h-screen transition-colors duration-300">
      <div className="flex bg-slate-50 dark:bg-[#0c0c0e] text-slate-900 dark:text-slate-100 min-h-screen font-sans transition-colors duration-300" dir="rtl">
        
        {/* Sidebar - Desktop */}
        <aside className="hidden lg:flex flex-col w-72 bg-white dark:bg-slate-900/50 border-l border-slate-200 dark:border-white/5 sticky top-0 h-screen transition-all">
          <div className="p-8 flex items-center gap-4">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
              <Smartphone className="text-white" size={24} />
            </div>
            <div>
              <h1 className="font-black text-xl tracking-tight">راضي ستور</h1>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">نظام الإدارة الذكي</span>
            </div>
          </div>

          <nav className="flex-1 px-4 space-y-2 mt-4">
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={cn(
                    "flex items-center gap-4 w-full px-5 py-4 rounded-2xl font-bold text-sm transition-all group",
                    isActive 
                      ? "bg-primary text-white shadow-xl shadow-primary/20 scale-[1.02]" 
                      : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  )}
                >
                  <Icon size={20} className={cn("transition-transform group-hover:scale-110", isActive ? "text-white" : "text-slate-400")} />
                  <span>{item.label}</span>
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
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] lg:hidden"
              />
              <motion.aside 
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed inset-y-0 right-0 w-80 bg-white dark:bg-slate-900 z-[101] lg:hidden flex flex-col"
              >
                <div className="p-8 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white">
                      <Smartphone size={24} />
                    </div>
                    <h1 className="font-black text-xl">راضي ستور</h1>
                  </div>
                  <button onClick={() => setIsSidebarOpen(false)} className="p-2 text-slate-500"><X size={24} /></button>
                </div>
                <nav className="flex-1 px-4 space-y-2">
                  {filteredNavItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => { setActiveTab(item.id); setIsSidebarOpen(false); }}
                      className={cn(
                        "flex items-center gap-4 w-full px-5 py-4 rounded-2xl font-bold text-sm transition-all",
                        activeTab === item.id ? "bg-primary text-white" : "text-slate-500"
                      )}
                    >
                      <item.icon size={20} />
                      <span>{item.label}</span>
                    </button>
                  ))}
                </nav>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          
          {/* Top Header - Mobile and Desktop */}
          <header className="h-20 bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border-b border-slate-200 dark:border-white/5 sticky top-0 z-50 flex items-center justify-between px-4 lg:px-8">
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

          {/* Bottom Nav - Mobile Only */}
          <nav className="fixed bottom-0 left-0 right-0 h-20 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-slate-200 dark:border-white/5 lg:hidden flex items-center justify-around px-2 z-[60]">
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 px-2 py-2 rounded-xl transition-all",
                    isActive ? "text-primary scale-110" : "text-slate-400"
                  )}
                >
                  <Icon size={isActive ? 22 : 20} className={isActive ? "fill-primary/10" : ""} />
                  <span className="text-[9px] font-black uppercase tracking-wider">{item.label}</span>
                </button>
              );
            })}
          </nav>

        </div>
      </div>
    </div>
  );
}
