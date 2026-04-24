import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Wallet, 
  ArrowRightLeft, 
  Plus, 
  ArrowUpRight, 
  ArrowDownRight, 
  History,
  Search,
  Filter,
  Check,
  X,
  CreditCard,
  Banknote,
  Smartphone,
  ChevronRight,
  Loader2,
  Trash2,
  Edit,
  HandCoins
} from 'lucide-react';
import { useStore, BankTransaction, PaymentMethod } from '../lib/store';
import { cn, formatCurrency, generateId, formatArabicDate } from '../lib/utils';

const ACCOUNTS: { id: PaymentMethod; label: string; icon: any; color: string }[] = [
  { id: 'cash', label: 'الخزينة (نقدي)', icon: Banknote, color: 'emerald' },
  { id: 'vodafone', label: 'فودافون كاش', icon: Smartphone, color: 'rose' },
  { id: 'bank', label: 'البنك / إنستا باي', icon: CreditCard, color: 'sky' },
  { id: 'debt', label: 'الشكك / الديون', icon: HandCoins, color: 'amber' },
];

export default function Finance() {
  const { transactions, sales, addTransaction, updateTransaction, deleteTransaction, resetData, currentUser } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<BankTransaction | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  const isOwner = currentUser?.role === 'owner';

  // Lock scroll when any modal is open
  useEffect(() => {
    const isAnyModalOpen = isModalOpen || isAdjustModalOpen || editingTransaction;
    if (isAnyModalOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = 'var(--removed-body-scroll-bar-size)';
      // Smooth scroll to top when opening a "page-like" modal on mobile
      if (window.innerWidth < 1024) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, [isModalOpen, isAdjustModalOpen, editingTransaction]);

  // Calculate Balances
  const balances = useMemo(() => {
    const bals: Record<string, number> = { cash: 0, vodafone: 0, bank: 0, debt: 0 };
    
    // 1. Initial/Adjustment Transactions
    // (We treat 'external' -> 'account' as deposit and 'account' -> 'external' as withdraw)
    
    // 2. Add income from Sales
    sales.forEach(s => {
      if (bals[s.method] !== undefined) {
        bals[s.method] += s.finalPrice;
      }
    });

    // 3. Process Transactions
    transactions.forEach(t => {
      // Source account decreases
      if (t.sourceAccount !== 'external' && bals[t.sourceAccount] !== undefined) {
        bals[t.sourceAccount] -= t.amount;
      }
      
      // Destination account increases
      if (t.destinationAccount && t.destinationAccount !== 'external' && bals[t.destinationAccount] !== undefined) {
        bals[t.destinationAccount] += t.amount;
      }

      // Add Commission/Profit to the specified profitAccount (default to destination if not set)
      const pAcc = t.profitAccount || t.destinationAccount;
      if (pAcc && pAcc !== 'external' && bals[pAcc] !== undefined) {
        bals[pAcc] += t.commission;
      }
    });

    return bals;
  }, [transactions, sales]);

  const handleReset = async () => {
    if (confirm('⚠️ هل أنت متأكد من تصفير كافة البيانات؟\nسيتم حذف سجل المبيعات والعمليات المالية نهائياً ولن تتمكن من استعادتها.')) {
      setIsResetting(true);
      try {
        await resetData();
        alert('تم تصفير الأرصدة والسجلات بنجاح');
      } catch (err) {
        console.error('Reset Error:', err);
        alert('حدث خطأ أثناء تصفير البيانات');
      } finally {
        setIsResetting(false);
      }
    }
  };

  return (
    <div className="space-y-8 pb-32 lg:pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight mb-1">الماليات والدفع</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">إدارة الأرصدة والتحويلات المالية الموحدة</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto relative z-10">
          {isOwner && (
            <>
              <button 
                type="button"
                onClick={handleReset}
                disabled={isResetting}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-rose-500/10 text-rose-500 px-6 py-4 rounded-2xl font-bold border border-rose-500/20 active:scale-95 text-sm disabled:opacity-50 cursor-pointer"
              >
                {isResetting ? <Loader2 className="animate-spin" size={18} /> : <Trash2 size={18} />}
                تصفير كافة البيانات
              </button>
              <button 
                type="button"
                onClick={() => setIsAdjustModalOpen(true)}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-6 py-4 rounded-2xl font-bold border border-slate-200 dark:border-white/5 active:scale-95 text-sm cursor-pointer"
              >
                تعديل رصيد
              </button>
            </>
          )}
          <button 
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-primary text-white px-6 py-4 rounded-2xl font-black shadow-lg shadow-primary/25 active:scale-95 text-sm cursor-pointer"
          >
            <ArrowRightLeft size={20} />
            <span>تحويل / معاملة</span>
          </button>
        </div>
      </div>

      {/* Account Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {ACCOUNTS.map((acc, i) => (
          <motion.div
            key={acc.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-sm group hover:border-primary/30 transition-all relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-12 -mt-12 transition-all group-hover:bg-primary/10 pointer-events-none"></div>
            
            <div className="flex justify-between items-start mb-6 relative z-10 w-full">
              <div className={cn(
                "p-4 rounded-2xl",
                acc.color === 'emerald' ? "bg-emerald-500/10 text-emerald-500" :
                acc.color === 'rose' ? "bg-rose-500/10 text-rose-500" :
                "bg-sky-500/10 text-sky-500"
              )}>
                <acc.icon size={28} />
              </div>
              <div className="flex flex-col items-end gap-1">
                 <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-white/5">نشط</div>
                 {isOwner && (
                   <button 
                     onClick={() => {
                       const amount = prompt(`أدخل الرصيد الجديد لحساب ${acc.label}:`);
                       if (amount !== null && !isNaN(Number(amount))) {
                         const current = balances[acc.id] || 0;
                         const target = Number(amount);
                         const diff = target - current;
                         if (diff === 0) return;
                         
                         addTransaction({
                           id: generateId(),
                           type: 'adjustment',
                           sourceAccount: diff > 0 ? 'external' : acc.id,
                           destinationAccount: diff > 0 ? acc.id : 'external',
                           amount: Math.abs(diff),
                           commission: 0,
                           notes: `تغيير الرصيد كلياً إلى ${target}`,
                           date: new Date().toISOString()
                         });
                       }
                     }}
                     className="text-[9px] font-black text-primary hover:underline uppercase"
                   >
                     تغيير كلي
                   </button>
                 )}
              </div>
            </div>
            
            <p className="text-slate-400 font-bold text-xs uppercase tracking-wider mb-1">{acc.label}</p>
            <h3 className="text-4xl font-black text-slate-800 dark:text-white leading-none tracking-tighter">
               {formatCurrency(balances[acc.id] || 0)}
            </h3>
            
            <div className="mt-8 pt-6 border-t border-slate-50 dark:border-white/5 flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-400">
               <span>حالة الحساب</span>
               <span className="text-emerald-500">مكتمل المزامنة</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Transactions History */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100 dark:border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-slate-50 dark:bg-slate-800 text-slate-500 rounded-2xl"><History size={20} /></div>
            <h3 className="text-lg font-black tracking-tight">سجل العمليات المالية والعمولات</h3>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <div className="flex-1 md:w-64 relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input type="text" placeholder="بحث في السجل..." className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-3 pr-10 pl-4 text-xs font-bold outline-none" />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-right">
            <thead>
              <tr className="text-[10px] uppercase font-black text-slate-400 tracking-wider">
                <th className="px-8 py-6">النوع</th>
                <th className="px-8 py-6">المسار</th>
                <th className="px-8 py-6">المبلغ</th>
                {isOwner && <th className="px-8 py-6 text-emerald-500">العمولة</th>}
                <th className="px-8 py-6">التاريخ</th>
                {isOwner && <th className="px-8 py-6 text-left">إجراءات</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-white/5 font-medium">
              {transactions.length > 0 ? (
                transactions.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(t => (
                  <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
                    <td className="px-8 py-6">
                      <span className={cn(
                        "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase border",
                        t.type === 'transfer' ? "bg-indigo-500/10 text-indigo-500 border-indigo-500/20" :
                        t.type === 'adjustment' ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                        t.type === 'deposit' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                        "bg-rose-500/10 text-rose-500 border-rose-500/20"
                      )}>
                        {t.type === 'transfer' ? 'تحويل' : t.type === 'adjustment' ? 'تعديل رصيد' : t.type === 'deposit' ? 'إيداع' : 'سحب'}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-400 text-xs">{ACCOUNTS.find(a => a.id === t.sourceAccount)?.label || 'خارجي'}</span>
                        <ChevronRight size={12} className="text-slate-200 rotate-180" />
                        <span className="font-bold text-slate-700 dark:text-slate-200 text-xs">{ACCOUNTS.find(a => a.id === t.destinationAccount)?.label || 'خارجي'}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <p className="font-black text-sm">{formatCurrency(t.amount)}</p>
                    </td>
                    {isOwner && (
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-1.5">
                          <p className="font-black text-sm text-emerald-600">+{formatCurrency(t.commission)}</p>
                        </div>
                      </td>
                    )}
                    <td className="px-8 py-6 text-xs text-slate-400 font-bold whitespace-nowrap">
                      {formatArabicDate(t.date)}
                    </td>
                    {isOwner && (
                      <td className="px-8 py-6">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => { setEditingTransaction(t); setIsModalOpen(true); }}
                            className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-primary transition-colors"
                          >
                            <Edit size={14} />
                          </button>
                          <button 
                            onClick={async () => { 
                              if(confirm('هل تريد حذف هذه المعاملة؟')) {
                                try {
                                  await deleteTransaction(t.id);
                                } catch (err) {
                                  alert('حدث خطأ أثناء حذف المعاملة');
                                }
                              } 
                            }}
                            className="p-2 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all transform active:scale-95"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-24 text-center opacity-30 text-sm font-black uppercase tracking-widest">السجل المالي فارغ</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transaction Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <TransactionModal 
            initialData={editingTransaction}
            onClose={() => { setIsModalOpen(false); setEditingTransaction(null); }}
            onSave={(tx) => { 
                if (editingTransaction) {
                    updateTransaction(tx);
                } else {
                    addTransaction(tx); 
                }
                setIsModalOpen(false); 
                setEditingTransaction(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* Balance Adjustment Modal */}
      <AnimatePresence>
        {isAdjustModalOpen && (
          <AdjustmentModal 
            onClose={() => setIsAdjustModalOpen(false)}
            onSave={(tx) => { addTransaction(tx); setIsAdjustModalOpen(false); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function TransactionModal({ onClose, onSave, initialData }: { onClose: () => void, onSave: (tx: BankTransaction) => void, initialData?: BankTransaction | null }) {
  const [data, setData] = useState<Partial<BankTransaction>>(initialData || {
    type: 'transfer',
    sourceAccount: 'cash',
    destinationAccount: 'bank',
    profitAccount: 'cash',
    amount: 0,
    commission: 0,
    date: new Date().toISOString(),
  });

  useEffect(() => {
    if (initialData) {
        setData(initialData);
    }
  }, [initialData]);

  const isOwner = useStore(state => state.currentUser?.role === 'owner');

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-[#0a0c10]/95 backdrop-blur-md" />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 100 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 100 }}
        className="relative bg-white dark:bg-slate-900 w-full max-w-xl rounded-t-[3rem] sm:rounded-[3rem] shadow-2xl p-8 overflow-hidden"
      >
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-black">تسجيل عملية (سحب وإيداع)</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-wider text-right">حدد الحساب الذي سيتم السحب منه والحساب الذي سيتم الإيداع فيه</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-rose-500 transition-colors"><X size={24} /></button>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-rose-500 uppercase flex items-center gap-1">
                <ArrowUpRight size={12} /> سحب من (المصدر)
              </label>
              <select 
                value={data.sourceAccount}
                onChange={(e) => setData(prev => ({ ...prev, sourceAccount: e.target.value as any }))}
                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-4 font-bold outline-none ring-1 ring-slate-100 dark:ring-white/5"
              >
                {ACCOUNTS.map(a => <option key={a.id} value={a.id}>{a.label}</option>)}
                <option value="external">💸 مصدر خارجي (إيداع جديد)</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-emerald-500 uppercase flex items-center gap-1">
                <ArrowDownRight size={12} /> إيداع في (الوجهة)
              </label>
              <select 
                value={data.destinationAccount}
                onChange={(e) => setData(prev => ({ ...prev, destinationAccount: e.target.value as any }))}
                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-4 font-bold outline-none ring-1 ring-slate-100 dark:ring-white/5"
              >
                {ACCOUNTS.map(a => <option key={a.id} value={a.id}>{a.label}</option>)}
                <option value="external">🛑 جهة خارجية (مصروفات/سحب)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase">المبلغ الأساسي</label>
              <input 
                type="number" 
                value={data.amount || ''}
                onChange={(e) => setData(prev => ({ ...prev, amount: Number(e.target.value) }))}
                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-4 font-black text-xl outline-none"
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-emerald-600 uppercase">الربح / العمولة المحققة</label>
              <input 
                type="number" 
                value={data.commission || ''}
                onChange={(e) => setData(prev => ({ ...prev, commission: Number(e.target.value) }))}
                className="w-full bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-4 font-black text-xl text-emerald-600 outline-none"
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-emerald-600 uppercase">إضافة الأرباح إلى حساب:</label>
            <div className="flex gap-2">
              {ACCOUNTS.filter(a => a.id !== 'debt').map(acc => (
                <button
                  key={acc.id}
                  onClick={() => setData(prev => ({ ...prev, profitAccount: acc.id }))}
                  className={cn(
                    "flex-1 py-3 rounded-xl text-[10px] font-black transition-all border",
                    data.profitAccount === acc.id 
                      ? "bg-emerald-500 text-white border-emerald-600 shadow-lg shadow-emerald-500/20" 
                      : "bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-white/5 text-slate-400"
                  )}
                >
                  {acc.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">توضيح المعاملة (اختياري)</label>
            <textarea 
              rows={2}
              value={data.notes || ''}
              onChange={(e) => setData(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-4 font-medium outline-none resize-none text-sm"
              placeholder="مثال: تبديل رصيد ببنكنوت أو دفع عمولة..."
            />
          </div>

          <button 
            onClick={() => {
              // Standard mapping for transaction types
              let type: BankTransaction['type'] = 'transfer';
              if (data.sourceAccount === 'external') type = 'deposit';
              else if (data.destinationAccount === 'external') type = 'withdraw';
              
              onSave({ ...data, type, id: data.id || generateId() } as BankTransaction);
            }}
            className="w-full bg-primary text-white py-5 rounded-2xl font-black shadow-xl shadow-primary/20 transition-all transform active:scale-95 flex items-center justify-center gap-3 lg:text-lg"
          >
            <Check size={20} /> {initialData ? 'حفظ التعديلات' : 'تأكيد وحفظ الـسحب والإيداع'}
          </button>
        </div>
      </motion.div>
    </div>,
    document.body
  );
}

function AdjustmentModal({ onClose, onSave }: { onClose: () => void, onSave: (tx: BankTransaction) => void }) {
  const [data, setData] = useState<Partial<BankTransaction>>({
    type: 'adjustment',
    sourceAccount: 'external',
    destinationAccount: 'cash',
    amount: 0,
    commission: 0,
    notes: 'تعديل رصيد يدوي',
    date: new Date().toISOString(),
  });

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-[#0a0c10]/95 backdrop-blur-md" />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 100 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 100 }}
        className="relative bg-white dark:bg-slate-900 w-full max-w-lg rounded-t-[3rem] sm:rounded-[3rem] shadow-2xl p-10 overflow-hidden text-right"
      >
        <div className="mb-10 text-center">
            <div className="w-20 h-20 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus size={32} />
            </div>
            <h3 className="text-2xl font-black text-slate-800 dark:text-white">تعديل رصيد يدوي</h3>
            <p className="text-slate-400 font-medium text-sm mt-2">قم بإضافة رصيد "إضافي" أو "بداية المدة" لأي حساب</p>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">اختر الحساب المراد تعديله</label>
            <select 
              value={data.destinationAccount}
              onChange={(e) => setData(prev => ({ ...prev, destinationAccount: e.target.value as any }))}
              className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-5 font-black outline-none appearance-none"
            >
              {ACCOUNTS.map(a => <option key={a.id} value={a.id}>{a.label}</option>)}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">المبلغ المراد إضافته (ج.م)</label>
            <input 
              type="number" 
              value={data.amount || ''}
              onChange={(e) => setData(prev => ({ ...prev, amount: Number(e.target.value) }))}
              className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-6 font-black text-3xl outline-none text-center"
              placeholder="0.00"
            />
          </div>

          <button 
            onClick={() => onSave({ ...data, id: generateId() } as BankTransaction)}
            className="w-full bg-amber-500 text-white py-6 rounded-3xl font-black shadow-xl shadow-amber-500/20 transition-all transform active:scale-95 flex items-center justify-center gap-3 text-lg"
          >
            تعديل الرصيد الآن
          </button>
          
          <button onClick={onClose} className="w-full py-4 text-slate-400 font-bold text-sm tracking-widest">إلغاء التراجع</button>
        </div>
      </motion.div>
    </div>,
    document.body
  );
}
