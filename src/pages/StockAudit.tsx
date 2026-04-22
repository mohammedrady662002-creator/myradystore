import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { 
  ClipboardCheck, 
  TrendingUp, 
  Package, 
  DollarSign, 
  Calculator,
  ArrowRightLeft,
  AlertTriangle,
  Search,
  Filter,
  ArrowDownToLine,
  ChevronRight
} from 'lucide-react';
import { useStore, Category } from '../lib/store';
import { formatCurrency, cn } from '../lib/utils';

export default function StockAudit() {
  const { products, currentUser } = useStore();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<Category | 'all'>('all');
  const isOwner = currentUser?.role === 'owner';

  const CATEGORY_LABELS: Record<string, string> = {
    accessories: 'إكسسوارات',
    hardware: 'قطع غيار / شاشات',
    maintenance: 'صيانة',
    software: 'سوفت وير / برامج',
    finance: 'خدمات مالية'
  };

  const auditData = useMemo(() => {
    let totalCapital = 0;
    let expectedRevenue = 0;
    let totalItems = 0;
    const categoryStats: Record<string, { capital: number; items: number }> = {};

    products.forEach(p => {
      const totalQty = (p.quantity || 0) + (p.backroomQuantity || 0);
      const itemCapital = p.wholesalePrice * totalQty;
      const itemRevenue = p.sellingPrice * totalQty;
      
      totalCapital += itemCapital;
      expectedRevenue += itemRevenue;
      totalItems += totalQty;

      if (!categoryStats[p.category]) {
        categoryStats[p.category] = { capital: 0, items: 0 };
      }
      categoryStats[p.category].capital += itemCapital;
      categoryStats[p.category].items += totalQty;
    });

    return {
      totalCapital,
      expectedRevenue,
      expectedProfit: expectedRevenue - totalCapital,
      totalItems,
      categoryStats
    };
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.code.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = activeCategory === 'all' || p.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, search, activeCategory]);

  if (!isOwner) {
    return (
      <div className="flex flex-col items-center justify-center py-40 opacity-40">
        <div className="w-20 h-20 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
          <Calculator size={32} />
        </div>
        <h3 className="text-xl font-black">عذراً، ميزة الجرد تقتصر على المدير فقط</h3>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-32 lg:pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight mb-1">جرد المخزون ورأس المال</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">مراقبة دقيقة للأصول المالية والكميات المتوفرة</p>
        </div>
      </div>

      {/* Audit Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900 border border-white/5 p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
          <div className="relative">
            <div className="p-3 bg-white/10 w-fit rounded-2xl mb-4 sm:mb-6 text-primary"><DollarSign size={24} /></div>
            <p className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">إجمالي رأس المال المركون</p>
            <h3 className="text-3xl sm:text-4xl font-black text-white tracking-tighter">{formatCurrency(auditData.totalCapital)}</h3>
            <p className="text-[10px] font-bold text-slate-500 mt-2">القيمة الإجمالية للمخزون بسعر الجملة</p>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] shadow-sm relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full -mr-12 -mt-12 group-hover:bg-emerald-500/10 transition-all"></div>
          <div className="relative">
            <div className="p-3 bg-emerald-500/10 w-fit rounded-2xl mb-4 sm:mb-6 text-emerald-500"><TrendingUp size={24} /></div>
            <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">الربح المتوقع عند التصفية</p>
            <h3 className="text-3xl sm:text-4xl font-black text-emerald-600 dark:text-emerald-500 tracking-tighter">{formatCurrency(auditData.expectedProfit)}</h3>
            <p className="text-[10px] font-bold text-slate-400 mt-2">في حال تم بيع كافة المخزون بالسعر الحالي</p>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] shadow-sm relative overflow-hidden group col-span-1 sm:col-span-2 lg:col-span-1"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full -mr-12 -mt-12 group-hover:bg-indigo-500/10 transition-all"></div>
          <div className="relative">
            <div className="p-3 bg-indigo-500/10 w-fit rounded-2xl mb-4 sm:mb-6 text-indigo-500"><Package size={24} /></div>
            <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">عدد القطع الإجمالية</p>
            <h3 className="text-3xl sm:text-4xl font-black text-slate-800 dark:text-white tracking-tighter">{auditData.totalItems} <span className="text-lg opacity-40">قطعة</span></h3>
            <p className="text-[10px] font-bold text-slate-400 mt-2">إجمالي الكميات المسجلة في كافة الأقسام</p>
          </div>
        </motion.div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-white/5 flex flex-col xl:flex-row gap-4 items-center justify-between">
        <div className="relative w-full xl:w-96 group">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="بحث في الجرد..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800/50 border-none rounded-xl py-3.5 pr-12 pl-4 text-xs font-bold focus:ring-4 focus:ring-primary/10 transition-all outline-none"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar w-full xl:w-auto">
          {['all', ...Object.keys(CATEGORY_LABELS)].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat as any)}
              className={cn(
                "px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap",
                activeCategory === cat 
                  ? "bg-slate-900 dark:bg-primary text-white shadow-lg shadow-primary/20" 
                  : "bg-slate-50 dark:bg-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
              )}
            >
              {cat === 'all' ? 'الكل' : CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>
      </div>

      {/* Detailed Inventory Audit Table */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 dark:border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-500 rounded-xl"><Calculator size={20} /></div>
                <h3 className="text-lg font-black tracking-tight">تفاصيل رأس المال حسب المنتج</h3>
            </div>
            <div className="text-[10px] font-black uppercase text-slate-400 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-white/5">
                تحديث لحظي للسعر
            </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="text-[10px] uppercase font-black text-slate-400 tracking-wider">
                <th className="px-8 py-6 border-b border-slate-50 dark:border-white/5">المنتج / الكود</th>
                <th className="px-8 py-6 border-b border-slate-50 dark:border-white/5">الكمية</th>
                <th className="px-8 py-6 border-b border-slate-50 dark:border-white/5">سعر الجملة</th>
                <th className="px-8 py-6 border-b border-slate-50 dark:border-white/5">رأس المال المستثمر</th>
                <th className="px-8 py-6 border-b border-slate-50 dark:border-white/5">الربح المتوقع</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-white/5">
              {filteredProducts.length > 0 ? filteredProducts.map(p => (
                <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-400 text-xs">
                             {p.name[0]}
                         </div>
                         <div>
                            <p className="font-black text-sm text-slate-700 dark:text-slate-200">{p.name}</p>
                            <p className="text-[10px] font-bold text-slate-400">#{p.code}</p>
                         </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col gap-1.5">
                        <div className={cn(
                            "inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black",
                            p.quantity === 0 ? "bg-rose-500/10 text-rose-500" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                        )}>
                            العرض: {p.quantity} قطعة
                        </div>
                        {p.backroomQuantity > 0 && (
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black bg-indigo-500/10 text-indigo-500">
                                استوك: {p.backroomQuantity} قطعة
                            </div>
                        )}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <p className="font-bold text-sm text-slate-500">{formatCurrency(p.wholesalePrice)}</p>
                  </td>
                  <td className="px-8 py-6">
                    <p className="font-black text-sm text-primary">{formatCurrency(p.wholesalePrice * (p.quantity + (p.backroomQuantity || 0)))}</p>
                  </td>
                  <td className="px-8 py-6">
                    <p className="font-black text-emerald-500 text-sm">+{formatCurrency((p.sellingPrice - p.wholesalePrice) * (p.quantity + (p.backroomQuantity || 0)))}</p>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="py-24 text-center opacity-30 text-sm font-black uppercase tracking-widest italic">لا توجد بيانات مطابقة لعملية الجرد</td>
                </tr>
              )}
            </tbody>
            {filteredProducts.length > 0 && (
                <tfoot className="bg-slate-50 dark:bg-slate-900/80">
                    <tr className="font-black text-sm">
                        <td className="px-8 py-6 text-slate-500">إجمالي الجرد الحالي</td>
                        <td className="px-8 py-6 text-slate-700 dark:text-slate-200 text-lg">
                            {filteredProducts.reduce((acc, p) => acc + p.quantity + (p.backroomQuantity || 0), 0)} <span className="text-[10px] opacity-60">قطعة</span>
                        </td>
                        <td className="px-8 py-6"></td>
                        <td className="px-8 py-6 text-primary text-lg">
                            {formatCurrency(filteredProducts.reduce((acc, p) => acc + p.wholesalePrice * (p.quantity + (p.backroomQuantity || 0)), 0))}
                        </td>
                        <td className="px-8 py-6 text-emerald-500 text-lg">
                            +{formatCurrency(filteredProducts.reduce((acc, p) => acc + (p.sellingPrice - p.wholesalePrice) * (p.quantity + (p.backroomQuantity || 0)), 0))}
                        </td>
                    </tr>
                </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
