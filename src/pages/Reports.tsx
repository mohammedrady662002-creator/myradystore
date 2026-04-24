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
  Box,
  Zap,
  TrendingDown,
  Activity,
  X
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
  const { sales, transactions, customers, expenses, isDarkMode, currentUser } = useStore();
  const reportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [showDailyReport, setShowDailyReport] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const isOwner = currentUser?.role === 'owner';

  // Filters
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [customerFilter, setCustomerFilter] = useState<string>('all');

  const filteredSales = useMemo(() => {
    return sales.filter(s => {
      const matchPayment = paymentFilter === 'all' || s.method === paymentFilter;
      const matchCustomer = customerFilter === 'all' || s.customerId === customerFilter;
      return matchPayment && matchCustomer;
    });
  }, [sales, paymentFilter, customerFilter]);

  const reportData = useMemo(() => {
    const totalSales = filteredSales.reduce((acc, s) => acc + s.finalPrice, 0);
    const totalCost = filteredSales.reduce((acc, s) => acc + s.wholesaleTotalCost, 0);
    const salesProfit = filteredSales.reduce((acc, s) => acc + s.profit, 0);
    const totalCommissions = transactions.reduce((acc, t) => acc + t.commission, 0);
    const netProfit = salesProfit + totalCommissions;
    const profitMargin = totalSales > 0 ? (netProfit / totalSales) * 100 : 0;

    // Sales by Payment Method
    const methodCounts: Record<string, number> = {};
    filteredSales.forEach(s => {
      methodCounts[s.method] = (methodCounts[s.method] || 0) + s.finalPrice;
    });
    const methodChartData = Object.entries(methodCounts).map(([name, value]) => ({ name, value }));

    // Breakdown by Type
    const typeBreakdown = {
      product: { sales: 0, profit: 0, count: 0 },
      service: { sales: 0, profit: 0, count: 0 }
    };
    filteredSales.forEach(s => {
      const type = s.type || 'product';
      if (typeBreakdown[type]) {
        typeBreakdown[type].sales += s.finalPrice;
        typeBreakdown[type].profit += s.profit;
        typeBreakdown[type].count += 1;
      }
    });

    // Monthly Analytics (Last 6 months)
    const monthlyData: Record<string, { label: string, sales: number, profit: number }> = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = d.toLocaleString('ar-EG', { month: 'short' });
      monthlyData[monthKey] = { label: monthLabel, sales: 0, profit: 0 };
    }

    filteredSales.forEach(s => {
      const date = new Date(s.date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (monthlyData[key]) {
        monthlyData[key].sales += s.finalPrice;
        monthlyData[key].profit += s.profit;
      }
    });

    const monthlyChartData = Object.values(monthlyData);

    // Grouping by Category for Bar Chart
    const categories: Record<string, { name: string, profit: number, sales: number, count: number }> = {};
    
    // Process Sales
    filteredSales.forEach(s => {
      if (!categories[s.category]) {
        categories[s.category] = { name: CATEGORY_LABELS[s.category] || s.category, profit: 0, sales: 0, count: 0 };
      }
      categories[s.category].profit += s.profit;
      categories[s.category].sales += s.finalPrice;
      categories[s.category].count += 1;
    });

    // Add Finance category for commissions
    if (totalCommissions > 0 && customerFilter === 'all') { // Only show commissions if no customer filter (transactions don't always have one)
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
      salesCount: filteredSales.length,
      txCount: transactions.length,
      profitMargin,
      chartData,
      monthlyChartData,
      methodChartData,
      categories,
      typeBreakdown
    };
  }, [filteredSales, transactions, customerFilter]);

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
            onClick={() => setShowDailyReport(true)}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-amber-500 text-white px-6 py-4 rounded-2xl font-black shadow-lg shadow-amber-500/20 active:scale-95 text-sm"
          >
            <Zap size={20} /> تحليل اليوم
          </button>
          
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
          <p className="text-lg font-bold text-luxury">تقرير النشاط المالي وكشف الأرباح الشامل</p>
          <p className="text-sm opacity-60 mt-2">{formatArabicDate(new Date().toISOString())}</p>
        </div>

        {/* Filters Bar */}
      <div className="flex flex-col md:flex-row gap-4 print:hidden">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400">
            <Wallet size={18} />
          </div>
          <select 
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl py-4 pr-12 pl-4 font-bold text-xs outline-none focus:ring-4 focus:ring-primary/10 transition-all appearance-none cursor-pointer"
          >
            <option value="all">كل طرق الدفع</option>
            <option value="cash">نقدي (Cash)</option>
            <option value="vodafone">فودافون كاش</option>
            <option value="bank">تحويل بنكي</option>
            <option value="debt">مديونية</option>
          </select>
          <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
            <ChevronDown size={18} />
          </div>
        </div>

        <div className="flex-1 relative">
          <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400">
            <FileText size={18} />
          </div>
          <select 
            value={customerFilter}
            onChange={(e) => setCustomerFilter(e.target.value)}
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl py-4 pr-12 pl-4 font-bold text-xs outline-none focus:ring-4 focus:ring-primary/10 transition-all appearance-none cursor-pointer"
          >
            <option value="all">كل العملاء</option>
            {customers.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
            <ChevronDown size={18} />
          </div>
        </div>
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
            <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
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
            <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
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

        {/* Monthly Trend Area Chart */}
        <div className="bg-white dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-sm mb-10">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h3 className="text-xl font-black text-luxury">اتجاه المبيعات والأرباح (آخر 6 أشهر)</h3>
              <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-wider">رصد النمو الشهري وتدفق السيولة</p>
            </div>
            <div className="bg-indigo-500/10 text-indigo-500 p-3 rounded-2xl">
              <Calendar size={24} />
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reportData.monthlyChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '16px', textAlign: 'right' }}
                />
                <Bar dataKey="sales" name="المبيعات" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="profit" name="الأرباح" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Analytics Visualization Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
          <div className="bg-white dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-sm">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h3 className="text-xl font-black text-luxury">توزيع الأرباح حسب القسم</h3>
                <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-wider">مقارنة أداء الأقسام المختلفة من حيث الربحية</p>
              </div>
              <div className="bg-primary/10 text-primary p-3 rounded-2xl animate-[float_4s_infinite_ease-in-out]">
                <BarChart3 size={24} />
              </div>
            </div>

            <div className="h-[350px] w-full min-h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={reportData.chartData} layout="vertical" margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: '#64748b' }} width={100} orientation="right" />
                  <Tooltip 
                    cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '16px', color: '#fff', textAlign: 'right' }}
                  />
                  <Bar dataKey="profit" radius={[4, 4, 4, 4]} barSize={20}>
                    {reportData.chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.key] || '#6366f1'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-sm">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h3 className="text-xl font-black text-luxury">المبيعات حسب طريقة الدفع</h3>
                <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-wider">توزيع السيولة المالية في المبيعات</p>
              </div>
              <div className="bg-emerald-500/10 text-emerald-500 p-3 rounded-2xl animate-[float_4.5s_infinite_ease-in-out]">
                <PieChartIcon size={24} />
              </div>
            </div>

            <div className="h-[350px] w-full min-h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={reportData.methodChartData} layout="vertical" margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: '#64748b' }} width={100} orientation="right" />
                  <Tooltip 
                    cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '16px', color: '#fff', textAlign: 'right' }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 4, 4]} barSize={20} fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
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

function DailyReportModal({ onClose, sales, transactions, expenses }: { onClose: () => void, sales: any[], transactions: any[], expenses: any[] }) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  
  const today = new Date().toISOString().split('T')[0];
  const todaySales = sales.filter(s => s.date.startsWith(today));
  const todayTransactions = transactions.filter(t => t.date.startsWith(today));
  const todayExpenses = expenses.filter(e => e.date.startsWith(today));

  const stats = useMemo(() => {
    const totalSales = todaySales.reduce((acc, s) => acc + s.finalPrice, 0);
    const totalProfit = todaySales.reduce((acc, s) => acc + s.profit, 0);
    const totalCommissions = todayTransactions.reduce((acc, t) => acc + t.commission, 0);
    const totalExpenseAmount = todayExpenses.reduce((acc, e) => acc + e.amount, 0);
    
    // Top Selling Product
    const productCounts: Record<string, { count: number, name: string }> = {};
    todaySales.forEach(s => {
      if (!productCounts[s.productId]) productCounts[s.productId] = { count: 0, name: s.productName };
      productCounts[s.productId].count += s.quantity;
    });
    const topProduct = Object.values(productCounts).sort((a,b) => b.count - a.count)[0];

    return {
      totalSales,
      netProfit: totalProfit + totalCommissions - totalExpenseAmount,
      totalCommissions,
      totalExpenses: totalExpenseAmount,
      salesCount: todaySales.length,
      topProduct
    };
  }, [todaySales, todayTransactions, todayExpenses]);

  const handleExport = async () => {
    if (!modalRef.current) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(modalRef.current, { 
        scale: 3, 
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width / 3, canvas.height / 3]
      });
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 3, canvas.height / 3);
      pdf.save(`Daily_Analysis_${today}.pdf`);
    } catch (err) {
      console.error(err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="px-10 py-8 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
             <div className="w-12 h-12 bg-amber-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20"><Zap size={24} /></div>
             <div className="text-right">
                <h3 className="text-xl font-black">التقرير التحليلي لليوم</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{formatArabicDate(new Date().toISOString())}</p>
             </div>
          </div>
          <button onClick={onClose} className="p-3 text-slate-400 hover:text-rose-500 transition-colors"><X size={24} /></button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-10" ref={modalRef} style={{ backgroundColor: 'white' }}>
          <div className="text-slate-900 text-right" dir="rtl">
            <div className="text-center mb-10">
               <h1 className="text-2xl font-black mb-1">ملخص أداة اليوم</h1>
               <div className="w-20 h-1 bg-amber-500 mx-auto rounded-full"></div>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-10">
               <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-2">إجمالي المبيعات</p>
                  <h2 className="text-3xl font-black tracking-tighter">{formatCurrency(stats.totalSales)}</h2>
               </div>
               <div className="p-8 bg-emerald-500/5 rounded-[2.5rem] border border-emerald-500/10">
                  <p className="text-[10px] font-black text-emerald-500 uppercase mb-2">صافي الربح اليومي</p>
                  <h2 className="text-3xl font-black text-emerald-600 tracking-tighter">{formatCurrency(stats.netProfit)}</h2>
               </div>
            </div>

            <div className="space-y-4 mb-10">
               <div className="flex justify-between items-center p-6 bg-white border border-slate-100 rounded-2xl">
                  <div className="flex items-center gap-4">
                     <div className="w-10 h-10 bg-indigo-500/10 text-indigo-500 rounded-xl flex items-center justify-center"><Activity size={20} /></div>
                     <span className="font-bold text-slate-600">عدد مبيعات اليوم</span>
                  </div>
                  <span className="font-black text-lg">{stats.salesCount} عملية</span>
               </div>
               <div className="flex justify-between items-center p-6 bg-white border border-slate-100 rounded-2xl">
                  <div className="flex items-center gap-4">
                     <div className="w-10 h-10 bg-rose-500/10 text-rose-500 rounded-xl flex items-center justify-center"><TrendingDown size={20} /></div>
                     <span className="font-bold text-slate-600">إجمالي المصروفات</span>
                  </div>
                  <span className="font-black text-lg text-rose-500">{formatCurrency(stats.totalExpenses)}</span>
               </div>
               <div className="flex justify-between items-center p-6 bg-white border border-slate-100 rounded-2xl">
                  <div className="flex items-center gap-4">
                     <div className="w-10 h-10 bg-sky-500/10 text-sky-500 rounded-xl flex items-center justify-center"><Wallet size={20} /></div>
                     <span className="font-bold text-slate-600">عمولات الخدمات المالية</span>
                  </div>
                  <span className="font-black text-lg text-sky-600">+{formatCurrency(stats.totalCommissions)}</span>
               </div>
            </div>

            {stats.topProduct && (
               <div className="p-8 bg-slate-900 text-white rounded-[2.5rem] mb-10 shadow-xl relative overflow-hidden text-right">
                  <div className="absolute top-0 left-0 p-8 opacity-10"><BarChart3 size={100} /></div>
                  <div className="relative z-10 text-right">
                     <p className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-2">المنتج الأكثر مبيعاً اليوم</p>
                     <h3 className="text-2xl font-black">{stats.topProduct.name}</h3>
                     <p className="mt-2 font-bold text-amber-400">تم بيع {stats.topProduct.count} قطعة اليوم</p>
                  </div>
               </div>
            )}

            <div className="text-[10px] text-slate-300 font-bold text-center uppercase tracking-widest">
               نهاية التقرير التحليلي • راضي ستور
            </div>
          </div>
        </div>

        <div className="p-10 border-t border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-slate-800/50 flex gap-4">
           <button 
             onClick={handleExport}
             disabled={isExporting}
             className="flex-1 bg-primary text-white py-5 rounded-2xl font-black shadow-xl shadow-primary/20 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
           >
              {isExporting ? <Loader2 className="animate-spin" /> : <Download size={20} />}
              استخراج التقرير PDF
           </button>
           <button 
             onClick={() => {
                const content = modalRef.current?.innerHTML;
                const win = window.open('', '', 'height=700,width=700');
                if (win) {
                  win.document.write('<html dir="rtl"><head><title>تقرير اليوم</title>');
                  win.document.write('<style>body{font-family: Arial, sans-serif; padding: 40px; direction:rtl; text-align:right;} .bg-slate-50{background:#f8fafc; padding:20px; border-radius:20px;} .text-3xl{font-size: 30px; font-weight:900;} .text-2xl{font-size: 24px; font-weight:900;}</style>');
                  win.document.write('</head><body >');
                  win.document.write(content || '');
                  win.document.write('</body></html>');
                  win.document.close();
                  win.print();
                }
             }}
             className="flex-1 bg-slate-900 text-white py-5 rounded-2xl font-black shadow-xl shadow-slate-900/20 flex items-center justify-center gap-3 active:scale-95"
           >
              <Printer size={20} /> طباعة التقرير
           </button>
        </div>
      </motion.div>
    </div>
  );
}
