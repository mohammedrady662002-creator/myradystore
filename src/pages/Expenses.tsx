import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Banknote, 
  Plus, 
  Search, 
  Trash2, 
  Calendar, 
  Filter,
  TrendingDown,
  AlertTriangle,
  Receipt,
  Download,
  FileSpreadsheet,
  X,
  PieChart
} from 'lucide-react';
import { useStore, Expense, ExpenseCategory } from '../lib/store';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '../lib/utils';

const CATEGORIES: { value: ExpenseCategory; label: string; icon: any; color: string }[] = [
  { value: 'rent', label: 'إيجار', icon: Receipt, color: 'bg-blue-500' },
  { value: 'electricity', label: 'كهرباء ومرافق', icon: Receipt, color: 'bg-amber-500' },
  { value: 'salary', label: 'رواتب', icon: Receipt, color: 'bg-purple-500' },
  { value: 'internet', label: 'إنترنت واتصالات', icon: Receipt, color: 'bg-cyan-500' },
  { value: 'maintenance', label: 'صيانة ومعدات', icon: Receipt, color: 'bg-indigo-500' },
  { value: 'waste', label: 'هالك وتالف', icon: AlertTriangle, color: 'bg-rose-500' },
  { value: 'other', label: 'أخرى', icon: Receipt, color: 'bg-slate-500' },
];

export default function Expenses() {
  const { expenses, addExpense, deleteExpense, currentUser } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<ExpenseCategory | 'all'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Lock scroll when modal is open
  useEffect(() => {
    if (showAddModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showAddModal]);

  // Stats
  const totalExpenses = useMemo(() => 
    expenses.filter(e => e.type === 'expense').reduce((sum, e) => sum + e.amount, 0),
  [expenses]);

  const totalWaste = useMemo(() => 
    expenses.filter(e => e.type === 'waste').reduce((sum, e) => sum + e.amount, 0),
  [expenses]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      const matchesSearch = e.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           (e.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
      const matchesCategory = filterCategory === 'all' || e.category === filterCategory;
      return matchesSearch && matchesCategory;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [expenses, searchTerm, filterCategory]);

  const handleDelete = async (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا السجل؟')) {
      await deleteExpense(id);
    }
  };

  const exportToCSV = () => {
    const headers = ['التاريخ', 'العنوان', 'النوع', 'الفئة', 'المبلغ', 'ملاحظات'];
    const rows = filteredExpenses.map(e => [
      format(new Date(e.date), 'yyyy-MM-dd'),
      e.title,
      e.type === 'expense' ? 'مصروفات' : 'هالك',
      CATEGORIES.find(c => c.value === e.category)?.label || e.category,
      e.amount,
      e.notes || ''
    ]);

    const csvContent = "\uFEFF" + [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `المصروفات_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  // Add Expense State
  const [newExpense, setNewExpense] = useState<Partial<Expense>>({
    title: '',
    amount: 0,
    category: 'other',
    type: 'expense',
    notes: '',
    date: new Date().toISOString()
  });

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpense.title || !newExpense.amount) return;

    await addExpense({
      ...newExpense,
      id: crypto.randomUUID(),
      date: new Date().toISOString()
    } as Expense);

    setShowAddModal(false);
    setNewExpense({ title: '', amount: 0, category: 'other', type: 'expense', notes: '' });
  };

  return (
    <div className="space-y-8" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-white/5">
        <div>
          <h2 className="text-3xl font-black tracking-tight mb-2">إدارة المصروفات والهالك</h2>
          <p className="text-slate-500 font-bold flex items-center gap-2">
            <Receipt size={16} className="text-primary" />
            تتبع كافة المصروفات التشغيلية والبضاعة التالفة بدقة
          </p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={exportToCSV}
            className="flex items-center gap-2 px-6 py-4 bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 rounded-2xl font-black text-xs hover:bg-slate-200 dark:hover:bg-white/10 transition-all border border-slate-200 dark:border-white/10"
          >
            <FileSpreadsheet size={18} />
            تصدير الملف
          </button>
          
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-8 py-4 bg-slate-900 dark:bg-primary text-white rounded-2xl font-black text-xs shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
          >
            <Plus size={18} />
            إضافة مصروف / هالك
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-white/5 relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 transition-all group-hover:scale-110" />
          <div className="relative flex items-center gap-4">
            <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500">
              <TrendingDown size={32} />
            </div>
            <div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">إجمالي المصروفات</p>
              <h3 className="text-3xl font-black text-blue-500 tabular-nums">
                {totalExpenses.toLocaleString()} <span className="text-sm font-bold opacity-70">ج.م</span>
              </h3>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-white/5 relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full -mr-16 -mt-16 transition-all group-hover:scale-110" />
          <div className="relative flex items-center gap-4">
            <div className="w-16 h-16 bg-rose-500/10 rounded-2xl flex items-center justify-center text-rose-500">
              <AlertTriangle size={32} />
            </div>
            <div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">إجمالي الهالك</p>
              <h3 className="text-3xl font-black text-rose-500 tabular-nums">
                {totalWaste.toLocaleString()} <span className="text-sm font-bold opacity-70">ج.م</span>
              </h3>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-1 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-white/5 relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-16 -mt-16 transition-all group-hover:scale-110" />
          <div className="relative flex items-center gap-4">
            <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500">
              <PieChart size={32} />
            </div>
            <div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">إجمالي المنصرف</p>
              <h3 className="text-3xl font-black text-emerald-500 tabular-nums">
                {(totalExpenses + totalWaste).toLocaleString()} <span className="text-sm font-bold opacity-70">ج.م</span>
              </h3>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="بحث في المصروفات أو الملاحظات..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white dark:bg-slate-900 border-none rounded-3xl py-6 pr-14 pl-6 text-sm font-bold shadow-sm focus:ring-2 focus:ring-primary/20 transition-all border border-slate-100 dark:border-white/5 shadow-luxury"
          />
        </div>
        
        <div className="flex gap-2 p-1.5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-white/5 shadow-sm scroll-x-mobile">
          <button 
            onClick={() => setFilterCategory('all')}
            className={cn(
              "px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shrink-0",
              filterCategory === 'all' ? "bg-primary text-white" : "text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5"
            )}
          >الكل</button>
          {CATEGORIES.map(cat => (
            <button 
              key={cat.value}
              onClick={() => setFilterCategory(cat.value)}
              className={cn(
                "px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shrink-0",
                filterCategory === cat.value ? "bg-primary text-white" : "text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5"
              )}
            >{cat.label}</button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-black/20">
                <th className="px-8 py-6 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">التاريخ</th>
                <th className="px-8 py-6 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">البيان</th>
                <th className="px-8 py-6 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">الفئة</th>
                <th className="px-8 py-6 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">النوع</th>
                <th className="px-8 py-6 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest tabular-nums">المبلغ</th>
                <th className="px-8 py-6 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">ملاحظات</th>
                <th className="px-8 py-6 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">إجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              <AnimatePresence mode="popLayout">
                {filteredExpenses.map((e) => (
                  <motion.tr 
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    key={e.id}
                    className="group hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="font-bold text-xs">{format(new Date(e.date), 'dd MMMM yyyy', { locale: ar })}</span>
                        <span className="text-[10px] text-slate-400 font-bold">{format(new Date(e.date), 'hh:mm a', { locale: ar })}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 font-black text-sm">{e.title}</td>
                    <td className="px-8 py-6">
                      <span className={cn(
                        "px-3 py-1.5 rounded-full text-[10px] font-black text-white",
                        CATEGORIES.find(c => c.value === e.category)?.color || 'bg-slate-500'
                      )}>
                        {CATEGORIES.find(c => c.value === e.category)?.label || e.category}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <span className={cn(
                        "text-[10px] font-black px-3 py-1.5 rounded-full border",
                        e.type === 'expense' 
                          ? "bg-blue-500/10 text-blue-500 border-blue-500/20" 
                          : "bg-rose-500/10 text-rose-500 border-rose-500/20"
                      )}>
                        {e.type === 'expense' ? 'مصروفات' : 'هالك وتالف'}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <span className={cn(
                        "text-sm font-black tabular-nums",
                        e.type === 'expense' ? "text-slate-900 dark:text-white" : "text-rose-500"
                      )}>
                        {e.amount.toLocaleString()} <span className="text-[10px] opacity-60">ج.م</span>
                      </span>
                    </td>
                    <td className="px-8 py-6 max-w-xs">
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{e.notes || '—'}</p>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                        <button 
                          onClick={() => handleDelete(e.id)}
                          className="p-3 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
          {filteredExpenses.length === 0 && (
            <div className="p-20 text-center">
              <div className="w-20 h-20 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                <Receipt size={40} />
              </div>
              <p className="text-slate-400 font-bold">لا توجد سجلات حالياً</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {showAddModal && createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setShowAddModal(false)} 
              className="absolute inset-0 bg-black/80 backdrop-blur-md" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              className="relative bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2.5rem] shadow-2xl p-10 overflow-hidden text-right z-50 border border-white/10"
            >
              <div className="flex justify-between items-center mb-8">
                <button onClick={() => setShowAddModal(false)} className="p-2 text-slate-400 hover:text-rose-500 transition-colors order-first"><X size={24} /></button>
                <div className="text-right">
                  <h3 className="text-2xl font-black text-slate-800 dark:text-white">إضافة جديـد</h3>
                  <p className="text-xs text-slate-400 font-bold uppercase mt-1 tracking-widest">تسجيل مصروفات أو تالف بضاعة</p>
                </div>
              </div>

              <form onSubmit={handleAddSubmit} className="space-y-6">
                <div className="flex gap-2 p-1 bg-slate-50 dark:bg-black/20 rounded-2xl border border-slate-100 dark:border-white/5 group">
                  <button 
                    type="button"
                    onClick={() => setNewExpense(p => ({ ...p, type: 'expense' }))}
                    className={cn(
                      "flex-1 py-3 rounded-xl text-xs font-black transition-all",
                      newExpense.type === 'expense' ? "bg-primary text-white shadow-lg" : "text-slate-400"
                    )}
                  >مصروفات تشغيل</button>
                  <button 
                    type="button"
                    onClick={() => setNewExpense(p => ({ ...p, type: 'waste' }))}
                    className={cn(
                      "flex-1 py-3 rounded-xl text-xs font-black transition-all",
                      newExpense.type === 'waste' ? "bg-rose-500 text-white shadow-lg" : "text-slate-400"
                    )}
                  >هالك / تالف</button>
                </div>

                <div className="space-y-4">
                  <div className="relative">
                    <Receipt size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="text" 
                      required
                      value={newExpense.title}
                      onChange={(e) => setNewExpense(p => ({ ...p, title: e.target.value }))}
                      placeholder="عنوان المصروف (مثال: فاتورة كهرباء)"
                      className="w-full bg-slate-50 dark:bg-white/5 border-none rounded-2xl py-4 pr-12 pl-4 text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20 transition-all border border-slate-100 dark:border-white/5"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative">
                      <Banknote size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="number" 
                        required
                        value={newExpense.amount || ''}
                        onChange={(e) => setNewExpense(p => ({ ...p, amount: Number(e.target.value) }))}
                        placeholder="المبلغ"
                        className="w-full bg-slate-50 dark:bg-white/5 border-none rounded-2xl py-4 pr-12 pl-4 text-sm font-black tabular-nums outline-none focus:ring-2 focus:ring-primary/20 transition-all border border-slate-100 dark:border-white/5"
                      />
                    </div>
                    <select 
                      value={newExpense.category}
                      onChange={(e) => setNewExpense(p => ({ ...p, category: e.target.value as ExpenseCategory }))}
                      className="w-full h-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-4 px-4 text-xs font-black outline-none focus:ring-2 focus:ring-primary/20 transition-all border border-slate-100 dark:border-white/5 text-slate-800 dark:text-white"
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat.value} value={cat.value} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="relative">
                    <Calendar size={16} className="absolute right-4 top-4 text-slate-400" />
                    <textarea 
                      value={newExpense.notes}
                      onChange={(e) => setNewExpense(p => ({ ...p, notes: e.target.value }))}
                      placeholder="ملاحظات إضافية..."
                      rows={3}
                      className="w-full bg-slate-50 dark:bg-white/5 border-none rounded-2xl py-4 pr-12 pl-4 text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20 transition-all border border-slate-100 dark:border-white/5 resize-none"
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full py-5 bg-slate-900 dark:bg-primary text-white rounded-2xl font-black text-sm shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                >
                  حفظ البيانات
                </button>
              </form>
            </motion.div>
          </div>,
          document.body
        )}
      </AnimatePresence>
    </div>
  );
}
