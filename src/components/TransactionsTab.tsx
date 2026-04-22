import React from 'react';
import { ClipboardList, Plus, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import { Transaction } from '../types';

interface TransactionsTabProps {
  transactions: Transaction[];
  transactionFilter: string;
  setTransactionFilter: (filter: string) => void;
  onOpenFinanceModal: () => void;
  getMethodName: (method: string) => string;
  formatDateTime: (date: string) => string;
}

export default function TransactionsTab({ 
  transactions, transactionFilter, setTransactionFilter, onOpenFinanceModal, 
  getMethodName, formatDateTime 
}: TransactionsTabProps) {
  const filtered = transactionFilter === 'all' 
    ? transactions 
    : transactions.filter(tx => tx.method === transactionFilter);

  return (
    <div className="animate-fade-in print:hidden">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3"><div className="p-2 bg-teal-50 text-teal-600 rounded-xl"><ClipboardList size={24} /></div> سجل المعاملات المالية</h2>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <select value={transactionFilter} onChange={(e) => setTransactionFilter(e.target.value)} className="w-full sm:w-auto p-3 border border-slate-200 rounded-2xl bg-white outline-none focus:ring-4 focus:ring-teal-500/10 font-bold text-slate-700 shadow-sm cursor-pointer">
            <option value="all">كل المعاملات</option><option value="vodafone">فودافون كاش</option><option value="instapay">انستا باي</option><option value="bank">تحويل بنكي</option><option value="cash">نقدي (الدرج)</option>
          </select>
          <button onClick={onOpenFinanceModal} className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-2xl font-bold flex items-center justify-center w-full sm:w-auto gap-2 shadow-lg shadow-teal-500/25 transition-all active:scale-95">
            <Plus size={20} /> <span className="hidden sm:inline">معاملة جديدة</span>
          </button>
        </div>
      </div>
      <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200/80 text-slate-500 text-xs uppercase tracking-wider font-black">
                <th className="p-5">العملية</th>
                <th className="p-5">الجهة</th>
                <th className="p-5">المبلغ</th>
                <th className="p-5">العمولة</th>
                <th className="p-5 text-center">التاريخ</th>
                <th className="p-5">ملاحظات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-5">
                    {tx.type === 'receive' ? <div className="flex items-center gap-2 text-rose-600 bg-rose-50 border border-rose-100 w-fit px-3 py-1.5 rounded-xl font-bold text-sm"><ArrowDownCircle size={16} /> سحب (استلام)</div> : <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 border border-emerald-100 w-fit px-3 py-1.5 rounded-xl font-bold text-sm"><ArrowUpCircle size={16} /> إيداع (تحويل)</div>}
                  </td>
                  <td className="p-5 font-bold text-slate-700 text-sm">{getMethodName(tx.method)}</td>
                  <td className="p-5 font-black text-slate-800">{tx.amount}</td>
                  <td className="p-5 font-black text-indigo-600 bg-indigo-50/30">{tx.commission > 0 ? `+${tx.commission}` : '-'}</td>
                  <td className="p-5 text-slate-400 text-xs font-bold whitespace-nowrap text-center" dir="ltr">{formatDateTime(tx.date)}</td>
                  <td className="p-5 text-slate-500 text-xs font-medium max-w-[200px] truncate">{tx.notes || '-'}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="p-16 text-center text-slate-400 font-semibold text-lg">لا توجد معاملات مسجلة.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
