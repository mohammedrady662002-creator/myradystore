import React from 'react';
import { Wallet, CreditCard, History, Plus, Settings, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import { Balances, User } from '../types';

interface FinanceTabProps {
  balances: Balances;
  isOwner: boolean;
  onOpenFinanceModal: () => void;
  onOpenBalanceEditModal: () => void;
}

export default function FinanceTab({ balances, isOwner, onOpenFinanceModal, onOpenBalanceEditModal }: FinanceTabProps) {
  return (
    <div className="animate-fade-in print:hidden">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 relative overflow-hidden group hover:shadow-lg transition-all">
          <div className="absolute -left-8 -bottom-8 bg-emerald-50 w-40 h-40 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-500"><Wallet size={80} className="text-emerald-500/20" /></div>
          <div className="relative z-10">
            <p className="text-slate-500 font-bold mb-2">السيولة النقدية (الدرج)</p>
            <h2 className="text-4xl font-black text-slate-800 tracking-tight">{balances.cash.toLocaleString()} <span className="text-lg text-slate-400 font-bold">ج.م</span></h2>
          </div>
        </div>
        <div className="bg-white rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 relative overflow-hidden group hover:shadow-lg transition-all">
          <div className="absolute -left-8 -bottom-8 bg-blue-50 w-40 h-40 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-500"><CreditCard size={80} className="text-blue-500/20" /></div>
          <div className="relative z-10">
            <div className="flex justify-between items-start">
              <p className="text-slate-500 font-bold mb-2">المحافظ والبنوك</p>
              {isOwner && <button onClick={onOpenBalanceEditModal} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"><Settings size={18} /></button>}
            </div>
            <h2 className="text-4xl font-black text-slate-800 tracking-tight">{balances.digital.toLocaleString()} <span className="text-lg text-slate-400 font-bold">ج.م</span></h2>
          </div>
        </div>
        <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-3xl p-8 shadow-xl shadow-indigo-900/20 relative overflow-hidden group">
          <div className="absolute -left-4 -bottom-4 bg-white/5 w-40 h-40 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-500"><History size={80} className="text-white/10" /></div>
          <div className="relative z-10">
            <p className="text-indigo-200 font-bold mb-2">إجمالي الأرباح المستقلة</p>
            <h2 className="text-4xl font-black tracking-tight">{balances.commission.toLocaleString()} <span className="text-lg text-indigo-300 font-bold">ج.م</span></h2>
          </div>
        </div>
      </div>
      <div className="flex justify-center mb-8">
        <button onClick={onOpenFinanceModal} className="bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-5 rounded-3xl font-black text-xl flex items-center justify-center gap-3 shadow-xl shadow-indigo-600/30 transition-all transform active:scale-95 w-full md:w-auto">
          <Plus size={28} className="bg-white/20 rounded-full p-1" /> تسجيل معاملة مالية جديدة
        </button>
      </div>
    </div>
  );
}
