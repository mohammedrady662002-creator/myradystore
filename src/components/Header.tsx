import React from 'react';
import { Smartphone, User as UserIcon, LogOut, Headphones, Cpu, Wrench, MonitorSmartphone, Wallet, ClipboardList, FileText } from 'lucide-react';
import { User, Category } from '../types';

interface HeaderProps {
  currentUser: User;
  onLogout: () => void;
  activeTab: Category | 'transactions' | 'reports';
  setActiveTab: (tab: any) => void;
}

export default function Header({ currentUser, onLogout, activeTab, setActiveTab }: HeaderProps) {
  const isOwner = currentUser?.role === 'owner';

  const NavButton = ({ id, icon: Icon, label, colorClass }: { id: any, icon: any, label: string, colorClass: string }) => (
    <button 
      onClick={() => setActiveTab(id)} 
      className={`flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm transition-all whitespace-nowrap outline-none
        ${activeTab === id 
          ? `${colorClass} text-white shadow-lg transform scale-105` 
          : 'bg-white text-slate-500 hover:bg-slate-100 border border-slate-200 hover:border-slate-300'
        }`}
    >
      <Icon size={18} /><span>{label}</span>
    </button>
  );

  return (
    <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/60 sticky top-0 z-30 print:hidden">
      <div className="container mx-auto px-4 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Smartphone size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Rady Store</h1>
            <p className="text-emerald-500 text-xs font-bold flex items-center gap-1 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> متصل بالسحابة
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-xl shadow-sm">
            <UserIcon size={16} className={isOwner ? "text-indigo-500" : "text-emerald-500"} />
            <span className="text-sm font-bold text-slate-700">{currentUser?.name}</span>
          </div>
          <button onClick={onLogout} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-white rounded-xl transition-all" title="تسجيل الخروج">
            <LogOut size={20} />
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-4">
        <div className="flex overflow-x-auto custom-scrollbar py-2 -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="flex gap-3 w-max min-w-full pb-2">
            <NavButton id="accessories" icon={Headphones} label="الإكسسوارات" colorClass="bg-indigo-600 shadow-indigo-500/30" />
            <NavButton id="hardware" icon={Cpu} label="قطع الغيار" colorClass="bg-orange-500 shadow-orange-500/30" />
            <NavButton id="maintenance" icon={Wrench} label="الصيانة" colorClass="bg-blue-500 shadow-blue-500/30" />
            <NavButton id="software" icon={MonitorSmartphone} label="السوفت وير" colorClass="bg-purple-500 shadow-purple-500/30" />
            <div className="w-px h-8 bg-slate-200 self-center mx-1"></div>
            <NavButton id="finance" icon={Wallet} label="الماليات" colorClass="bg-emerald-500 shadow-emerald-500/30" />
            <NavButton id="transactions" icon={ClipboardList} label="سجل المعاملات" colorClass="bg-teal-500 shadow-teal-500/30" />
            {isOwner && (
              <NavButton id="reports" icon={FileText} label="كشف حساب" colorClass="bg-rose-500 shadow-rose-500/30" />
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
