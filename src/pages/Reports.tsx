import React, { useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, 
  Printer, 
  Download, 
  Table, 
  PieChart as PieChartIcon, 
  ChevronRight,
  TrendingUp,
  History,
  Calendar,
  Loader2,
  FileSpreadsheet,
  Wallet,
  FileDown,
  LayoutDashboard,
  ArrowDownCircle,
  ArrowUpCircle,
  ChevronDown,
  BarChart3,
  Box
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { useStore, Category } from '../lib/store';
import { formatCurrency, cn, formatArabicDate } from '../lib/utils';

const CATEGORY_LABELS: Record<Category, string> = {
  accessories: 'إكسسوارات',
  hardware: 'هاتف محمول',
  maintenance: 'صيانة',
  software: 'سوفت وير',
  spare_parts: 'قطع غيار',
  finance: 'خدمات مالية'
};

const CATEGORY_COLORS: Record<string, string> = {
  accessories: '#6366f1',
  hardware: '#f43f5e',
  maintenance: '#eab308',
  software: '#8b5cf6',
  spare_parts: '#06b6d4',
  finance: '#10b981'
};

export default function Reports() {
  const { sales, transactions, isDarkMode, currentUser } = useStore();
  const reportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const isOwner = currentUser?.role === 'owner';

  const reportData = useMemo(() => {
    const totalSales = sales.reduce((acc, s) => acc + s.finalPrice, 0);
    const totalCost = sales.reduce((acc, s) => acc + s.wholesaleTotalCost, 0);
    const salesProfit = sales.reduce((acc, s) => acc + s.profit, 0);
    const totalCommissions = transactions.reduce((acc, t) => acc + t.commission, 0);
    const netProfit = salesProfit + totalCommissions;
    const profitMargin = totalSales > 0 ? (netProfit / totalSales) * 100 : 0;

    // Breakdown by Type
    const typeBreakdown = {
      product: { sales: 0, profit: 0, count: 0 },
      service: { sales: 0, profit: 0, count: 0 }
    };
    sales.forEach(s => {
      const type = s.type || 'product';
      if (typeBreakdown[type]) {
        typeBreakdown[type].sales += s.finalPrice;
        typeBreakdown[type].profit += s.profit;
        typeBreakdown[type].count += 1;
      }
    });

    // Grouping by Category for Bar Chart
    const categories: Record<string, { name: string, profit: number, sales: number, count: number }> = {};
    
    // Process Sales
    sales.forEach(s => {
      if (!categories[s.category]) {
        categories[s.category] = { name: CATEGORY_LABELS[s.category] || s.category, profit: 0, sales: 0, count: 0 };
      }
      categories[s.category].profit += s.profit;
      categories[s.category].sales += s.finalPrice;
      categories[s.category].count += 1;
    });

    // Add Finance category for commissions
    if (totalCommissions > 0) {
      if (!categories['finance']) {
        categories['finance'] = { name: CATEGORY_LABELS['finance'], profit: 0, sales: 0, count: 0 };
      }
      categories['finance'].profit += totalCommissions;
      categories['finance'].count += transactions.length;
    }

    const chartData = Object.entries(categories).map(([key, val]) => ({
      key,
      ...val
    })).sort((a,b) => b.profit - a.profit);

    return {
      totalSales,
      totalCost,
      salesProfit,
      totalCommissions,
      netProfit,
      salesCount: sales.length,
      txCount: transactions.length,
      profitMargin,
      chartData,
      categories,
      typeBreakdown
    };
  }, [sales, transactions]);

  const handleExport = async (type: 'png' | 'pdf') => {
    if (!reportRef.current) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        backgroundColor: isDarkMode ? '#0c0c0e' : '#f8fafc',
        useCORS: true,
        allowTaint: true,
        logging: false,
        onclone: (clonedDoc) => {
          const styles = clonedDoc.getElementsByTagName('style');
          for (let i = 0; i < styles.length; i++) {
            const style = styles[i];
            // Aggressively remove oklch which breaks html2canvas
            if (style.innerHTML.includes('oklch')) {
              style.innerHTML = style.innerHTML.replace(/oklch\([^)]+\)/g, '#6366f1'); 
            }
          }
          // Handle elements with inline oklch styles
          const everyElement = clonedDoc.getElementsByTagName('*');
          for (let i = 0; i < everyElement.length; i++) {
            const el = everyElement[i] as HTMLElement;
            if (el.style && el.style.color && el.style.color.includes('oklch')) el.style.color = '#6366f1';
            if (el.style && el.style.backgroundColor && el.style.backgroundColor.includes('oklch')) el.style.backgroundColor = '#6366f1';
          }
          // Ensure the cloned report is visible for capture
          const reportEl = clonedDoc.querySelector('[ref="report-container"]') as HTMLElement;
          if (reportEl) reportEl.style.display = 'block';
        }
      });

      if (type === 'png') {
        const link = document.createElement('a');
        link.download = `RadyStore_Report_${new Date().toISOString().split('T')[0]}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      } else {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'px',
          format: [canvas.width / 2, canvas.height / 2]
        });
        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
        pdf.save(`RadyStore_Report_${new Date().toISOString().split('T')[0]}.pdf`);
      }
    } catch (err) {
      console.error('Export Error:', err);
      alert('حدث خطأ أثناء التصدير. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!isOwner) {
    return (
      <div className="flex flex-col items-center justify-center py-40 opacity-40">
        <div className="w-20 h-20 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
          <FileText size={32} />
        </div>
        <h3 className="text-xl font-black">عذراً، التقارير متاحة للمدير فقط</h3>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-32 lg:pb-12">
      {/* Actions Header */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 print:hidden">
        <div>
          <h2 className="text-2xl font-black tracking-tight mb-1">التقارير التحليلية</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">كشف حساب مجمع وتوزيع الأرباح حسب الأقسام</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button 
            onClick={handlePrint}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 px-6 py-4 rounded-2xl font-bold transition-all shadow-sm hover:bg-slate-50 active:scale-95 text-sm"
          >
            <Printer size={20} /> طباعة
          </button>
          
          <div className="flex items-center gap-2 flex-1 md:flex-none">
            <button 
              onClick={() => handleExport('pdf')}
              disabled={isExporting}
              className="flex-1 flex items-center justify-center gap-2 bg-slate-900 dark:bg-primary text-white px-6 py-4 rounded-2xl font-black shadow-lg shadow-primary/20 transition-all active:scale-95 text-sm disabled:opacity-50"
              title="تصدير ملف PDF"
            >
              {isExporting ? <Loader2 size={18} className="animate-spin" /> : <FileDown size={20} />} 
              <span>PDF</span>
            </button>
            <button 
              onClick={() => handleExport('png')}
              disabled={isExporting}
              className="flex-1 flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-6 py-4 rounded-2xl font-black shadow-lg shadow-rose-500/25 transition-all active:scale-95 text-sm disabled:opacity-50"
              title="تصدير كصورة PNG"
            >
              {isExporting ? <Loader2 size={18} className="animate-spin" /> : <Download size={20} />} 
              <span>صورة</span>
            </button>
          </div>
        </div>
      </div>

      {/* Report Container for Export */}
      <div 
        ref={reportRef} 
        id="report-container"
        className="p-4 lg:p-8 rounded-[3rem] bg-transparent print:p-0 print:bg-white print:text-slate-900"
      >
        
        {/* Print Only Header */}
        <div className="hidden print:flex flex-col items-center mb-10 pb-6 border-b-2 border-slate-900">
          <h1 className="text-4xl font-black mb-2">راضي ستور</h1>
          <p className="text-lg font-bold">تقرير النشاط المالي وكشف الأرباح الشامل</p>
          <p className="text-sm opacity-60 mt-2">{formatArabicDate(new Date().toISOString())}</p>
        </div>

        {/* Summary Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-10">
          {[
            { label: 'إجمالي المبيعات', value: reportData.totalSales, highlight: false },
            { label: 'تكلفة البضائع', value: reportData.totalCost, highlight: false },
            { label: 'صافي الربح الكلي', value: reportData.netProfit, highlight: true },
            { label: 'هامش الربح', value: `${reportData.profitMargin.toFixed(1)}%`, highlight: false, isString: true },
            { label: 'ربح المنتجات', value: reportData.salesProfit, highlight: false },
            { label: 'عمولات الخدمات', value: reportData.totalCommissions, highlight: false },
          ].map((stat, i) => (
            <div key={i} className={cn(
              "p-6 rounded-3xl border shadow-sm transition-all flex flex-col justify-between",
              stat.highlight 
                ? "bg-slate-900 dark:bg-primary text-white border-transparent shadow-xl" 
                : "bg-white dark:bg-slate-900 border-slate-100 dark:border-white/5"
            )}>
              <div>
                <p className={cn("text-[8px] font-black uppercase tracking-[0.2em] mb-2", stat.highlight ? "text-white/60" : "text-slate-400")}>{stat.label}</p>
                <h3 className="text-xl font-black tracking-tighter">
                  {stat.isString ? stat.value : formatCurrency(stat.value as number)}
                </h3>
              </div>
            </div>
          ))}
        </div>
        
        {/* Product vs Service Quick View */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <div className="bg-primary/5 border border-primary/10 p-8 rounded-[2.5rem] relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-10">
               <TrendingUp size={80} />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                 <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center text-primary"><Box size={20} /></div>
                 <h4 className="font-black text-xl">مبيعات المنتجات</h4>
              </div>
              <div className="flex justify-between items-end">
                 <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">صافي الربح</p>
                    <h3 className="text-3xl font-black text-primary tracking-tighter">{formatCurrency(reportData.typeBreakdown.product.profit)}</h3>
                 </div>
                 <div className="text-left">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 text-left">قيمة المبيعات</p>
                    <p className="font-black text-xl">{formatCurrency(reportData.typeBreakdown.product.sales)}</p>
                 </div>
              </div>
            </div>
          </div>

          <div className="bg-emerald-500/5 border border-emerald-500/10 p-8 rounded-[2.5rem] relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-10">
               <TrendingUp size={80} />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                 <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-500"><History size={20} /></div>
                 <h4 className="font-black text-xl">أرباح الخدمات (Maintenance/Software)</h4>
              </div>
              <div className="flex justify-between items-end">
                 <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">صافي الربح</p>
                    <h3 className="text-3xl font-black text-emerald-500 tracking-tighter">{formatCurrency(reportData.typeBreakdown.service.profit)}</h3>
                 </div>
                 <div className="text-left">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 text-left">قيمة الخدمات</p>
                    <p className="font-black text-xl">{formatCurrency(reportData.typeBreakdown.service.sales)}</p>
                 </div>
              </div>
            </div>
          </div>
        </div>

        {/* Analytics Visualization Section */}
        <div className="bg-white dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-100 dark:border-white/5 mb-10 shadow-sm">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h3 className="text-xl font-black">توزيع الأرباح حسب القسم</h3>
              <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-wider">مقارنة أداء الأقسام المختلفة من حيث الربحية</p>
            </div>
            <div className="bg-primary/10 text-primary p-3 rounded-2xl">
              <BarChart3 size={24} />
            </div>
          </div>

          <div className="h-[350px] w-full min-h-[350px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <BarChart data={reportData.chartData} layout="vertical" margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} tickFormatter={(val) => val.toLocaleString('en-US')} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: '#64748b' }} width={100} orientation="right" />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                  formatter={(val: number) => [val.toLocaleString('en-US'), 'صافي الربح']}
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    border: 'none', 
                    borderRadius: '16px',
                    color: '#fff',
                    textAlign: 'right'
                  }}
                  itemStyle={{ fontSize: '12px', fontWeight: 700 }}
                  labelStyle={{ fontSize: '10px', color: '#94a3b8', marginBottom: '4px' }}
                />
                <Bar dataKey="profit" radius={[4, 4, 4, 4]} barSize={24} name="صافي الربح">
                  {reportData.chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.key] || '#6366f1'} fillOpacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Detailed Breakdown with Collapsibles */}
        <div className="space-y-6">
          <h3 className="text-xl font-black flex items-center gap-3 mb-2 px-2">
            <LayoutDashboard size={24} className="text-primary" /> تفاصيل الأرباح حسب التصنيف
          </h3>
          
          {reportData.chartData.map((cat) => (
            <div key={cat.key} className="bg-white dark:bg-slate-900/50 rounded-[2rem] border border-slate-100 dark:border-white/5 shadow-sm overflow-hidden transition-all">
              <button 
                onClick={() => setExpandedCategory(expandedCategory === cat.key ? null : cat.key)}
                className="w-full p-6 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg" style={{ backgroundColor: CATEGORY_COLORS[cat.key] || '#6366f1' }}>
                    {cat.key === 'finance' ? <Wallet size={24} /> : <Box size={24} />}
                  </div>
                  <div className="text-right">
                    <h4 className="font-black text-lg">{cat.name}</h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">{cat.count} عمليات مسجلة</p>
                  </div>
                </div>
                <div className="flex items-center gap-8">
                  <div className="text-left hidden sm:block">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">إجمالي المبيعات</p>
                    <p className="font-black text-sm">{formatCurrency(cat.sales)}</p>
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] font-black text-emerald-500 uppercase mb-1">صافي الربح</p>
                    <p className="font-black text-lg text-emerald-600">{formatCurrency(cat.profit)}</p>
                  </div>
                  <div className={cn("p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 transition-transform", expandedCategory === cat.key ? "rotate-180" : "")}>
                    <ChevronDown size={20} />
                  </div>
                </div>
              </button>

              <AnimatePresence>
                {expandedCategory === cat.key && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                  >
                    <div className="p-6 pt-0 border-t border-slate-100 dark:border-white/5">
                      <div className="overflow-x-auto mt-4">
                        <table className="w-full text-right text-sm">
                          <thead>
                            <tr className="text-[10px] font-black text-slate-400 border-b border-slate-100 dark:border-white/5">
                              <th className="pb-3 px-2">العملية / المنتج</th>
                              <th className="pb-3 px-2">التاريخ</th>
                              <th className="pb-3 px-2">القيمة</th>
                              <th className="pb-3 px-2 text-left">الربح</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                            {cat.key === 'finance' ? (
                              transactions.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(t => (
                                <tr key={t.id} className="group">
                                  <td className="py-4 px-2">
                                    <p className="font-bold">{t.type === 'transfer' ? 'تحويل رصيد' : 'معاملة بنكية'}</p>
                                    <p className="text-[10px] text-slate-400">{t.notes || 'خدمة مالية'}</p>
                                  </td>
                                  <td className="py-4 px-2 text-xs font-medium text-slate-500">{formatArabicDate(t.date)}</td>
                                  <td className="py-4 px-2 font-bold">{formatCurrency(t.amount)}</td>
                                  <td className="py-4 px-2 font-black text-emerald-600 text-left">+{formatCurrency(t.commission)}</td>
                                </tr>
                              ))
                            ) : (
                              sales.filter(s => s.category === cat.key).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(s => (
                                <tr key={s.id} className="group">
                                  <td className="py-4 px-2">
                                    <p className="font-bold">{s.productName}</p>
                                    <p className="text-[10px] text-slate-400">{s.quantity} قطعة • {formatCurrency(s.unitPrice)}</p>
                                  </td>
                                  <td className="py-4 px-2 text-xs font-medium text-slate-500">{formatArabicDate(s.date)}</td>
                                  <td className="py-4 px-2 font-bold">{formatCurrency(s.finalPrice)}</td>
                                  <td className="py-4 px-2 font-black text-emerald-600 text-left">+{formatCurrency(s.profit)}</td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>

        {/* Footer for PDF/Image */}
        <div className="mt-12 text-center text-slate-400 font-bold text-[10px] uppercase tracking-widest hidden print:block">
          تم إنشاء هذا التقرير آلياً بواسطة نظام Rady Store - حقوق النشر 2026
        </div>
      </div>
    </div>
  );
}
