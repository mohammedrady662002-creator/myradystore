import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useStore, UserRole } from './lib/store';
import { cn, sendWhatsAppOTP } from './lib/utils';
import Layout from './components/Layout';
import Login from './components/Login';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Sales from './pages/Sales';
import Finance from './pages/Finance';
import Reports from './pages/Reports';
import StockAudit from './pages/StockAudit';
import Customers from './pages/Customers';
import Expenses from './pages/Expenses';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Download, 
  Upload, 
  RotateCcw, 
  Save, 
  Settings,
  X,
  FileJson,
  TriangleAlert,
  CheckCircle2,
  Lock,
  Key,
  ShieldCheck,
  Smartphone,
  Loader2
} from 'lucide-react';

export default function App() {
  const { 
    currentUser, 
    isDarkMode, 
    updatePin, 
    initializeStore, 
    isInitialized,
    products,
    sales,
    transactions,
    customers,
    expenses,
    addProduct,
    addSale,
    addTransaction,
    importBulkData,
    migrateExistingProductsToProduct
  } = useStore();
  const [activeTab, setActiveTab] = useState(currentUser?.role === 'owner' ? 'dashboard' : 'sales');
  const [showSettings, setShowSettings] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Lock scroll when settings modal is open
  useEffect(() => {
    if (showSettings) {
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = 'var(--removed-body-scroll-bar-size)';
    } else {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, [showSettings]);

  useEffect(() => {
    // If an employee somehow ends up on a restricted tab, move them
    // Land on 'sales' by default for employee
    if (currentUser?.role === 'employee' && ['dashboard', 'inventory', 'reports', 'audit', 'expenses'].includes(activeTab)) {
      setActiveTab('sales');
    }
  }, [currentUser, activeTab]);

  // PIN Change State
  const [roleToChange, setRoleToChange] = useState<UserRole>('employee');
  const [newPin, setNewPin] = useState('');
  const [masterPass, setMasterPass] = useState('');

  const handleConfirmPinChange = () => {
    if (masterPass !== 'Zz@#112007') {
      showToast('كلمة سر النظام غير صحيحة!', 'error');
      return;
    }
    if (newPin.length === 4) {
      updatePin(roleToChange, newPin);
      showToast(`تم تغيير رمز دخول ${roleToChange === 'owner' ? 'المدير' : 'الموظف'} بنجاح`);
      setNewPin('');
      setMasterPass('');
      setShowSettings(false);
    } else {
      showToast('يجب أن يتكون الرمز من 4 أرقام', 'error');
    }
  };

  // Auto Save indicator logic
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const unsub = initializeStore();
    return () => unsub();
  }, [initializeStore]);

  useEffect(() => {
    // Force set the theme based ONly on the app's internal state
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
      root.style.backgroundColor = '#060608'; // Ensure background changes even if tailwind is late
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
      root.style.backgroundColor = '#f8fafc'; // slate-50
    }
  }, [isDarkMode]);

  // Show Toast
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Backup System
  const exportBackup = () => {
    const backupData = {
      version: '2.0-cloud',
      timestamp: new Date().toISOString(),
      data: {
        products,
        sales,
        transactions,
        customers,
        expenses
      }
    };
    
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `نسخة_احتياطية_راضي_ستور_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    showToast('تم تصدير نسخة احتياطية سحابية بنجاح');
  };

  const importBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const confirmImport = confirm('سيتم دمج البيانات المستوردة مع البيانات الحالية في السحابة. هل تريد الاستمرار؟');
    if (!confirmImport) return;

    setIsRestoring(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = event.target?.result as string;
        const backup = JSON.parse(json);
        
        let importData;
        // Handle different backup formats
        if (backup.version?.startsWith('2.0')) {
          importData = backup.data;
        } else if (backup.state && backup.version === 0) { // Old Zustand persist format
          importData = backup.state;
        } else if (backup.products || backup.sales) { // Flat format
          importData = backup;
        } else {
          throw new Error('تنسيق ملف غير مدعوم');
        }

        await importBulkData({
          products: importData.products,
          sales: importData.sales,
          transactions: importData.transactions,
          customers: importData.customers,
          expenses: importData.expenses
        });

        showToast('تمت عملية الاستعادة بنجاح إلى السحابة!', 'success');
        setShowSettings(false);
      } catch (err: any) {
        console.error('Import Error:', err);
        showToast(`خطأ في الاستيراد: ${err.message || 'تنسيق غير مدعوم'}`, 'error');
      } finally {
        setIsRestoring(false);
      }
    };
    reader.readAsText(file);
    // Reset input
    e.target.value = '';
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'f') { e.preventDefault(); (document.querySelector('header input') as HTMLInputElement)?.focus(); }
        if (e.key === 's') { e.preventDefault(); setActiveTab('sales'); }
        if (e.key === 'i' && currentUser?.role === 'owner') { e.preventDefault(); setActiveTab('inventory'); }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0c0c0e] flex flex-col items-center justify-center p-4">
        <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
        <p className="text-slate-500 font-bold">جاري الاتصال بقاعدة البيانات السحابية...</p>
      </div>
    );
  }

  if (!currentUser) return <Login />;

  const renderContent = () => {
    // Role based access restriction
    if (currentUser?.role === 'employee' && ['dashboard', 'inventory', 'audit', 'reports', 'expenses'].includes(activeTab)) {
      return <Sales />;
    }

    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'inventory': return <Inventory />;
      case 'sales': return <Sales />;
      case 'finance': return <Finance />;
      case 'audit': return <StockAudit />;
      case 'reports': return <Reports />;
      case 'customers': return <Customers />;
      case 'expenses': return <Expenses />;
      default: return <Dashboard />;
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      <div className="relative">
        
        {/* Undo / Redo / Quick Actions (Optional extension point) */}
        <div className="fixed bottom-32 lg:bottom-10 left-6 sm:left-10 z-[80] flex flex-col gap-3 print:hidden">
          <button 
            onClick={() => setShowSettings(true)}
            className="p-3 sm:p-4 bg-white dark:bg-slate-900 rounded-full shadow-2xl border border-slate-100 dark:border-white/5 text-slate-400 hover:text-primary transition-all hover:rotate-90"
          >
            <Settings size={20} className="sm:w-6 sm:h-6" />
          </button>
        </div>

        {renderContent()}

        {/* Global Modal Overlay for Settings/Backup */}
        <AnimatePresence>
          {showSettings && createPortal(
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowSettings(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 30 }}
                className="relative bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2.5rem] shadow-2xl p-10 overflow-hidden z-50 border border-white/10"
              >
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h3 className="text-2xl font-black">إعدادات النظام</h3>
                    <p className="text-xs text-slate-400 font-bold uppercase mt-1">التحكم في البيانات والنسخ الاحتياطي</p>
                  </div>
                  <button onClick={() => setShowSettings(false)} className="p-2 text-slate-400 hover:text-rose-500 transition-colors"><X size={24} /></button>
                </div>

                <div className="space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
                  {/* Change PIN Section */}
                  <div className="bg-primary/5 p-6 rounded-3xl border border-primary/20">
                    <h4 className="font-bold text-sm mb-4 flex items-center gap-2"><Lock size={18} className="text-primary" /> تغيير رموز الدخول</h4>
                    
                    <div className="space-y-4">
                      <div className="flex gap-2 p-1 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-white/5">
                        <button 
                          onClick={() => setRoleToChange('employee')}
                          className={cn("flex-1 py-2 rounded-xl text-xs font-bold transition-all", roleToChange === 'employee' ? "bg-primary text-white" : "text-slate-400")}
                        >الموظف</button>
                        <button 
                          onClick={() => setRoleToChange('owner')}
                          className={cn("flex-1 py-2 rounded-xl text-xs font-bold transition-all", roleToChange === 'owner' ? "bg-primary text-white" : "text-slate-400")}
                        >المدير</button>
                      </div>

                      <div className="space-y-4">
                        <div className="relative">
                          <ShieldCheck size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input 
                            type="password" 
                            value={masterPass}
                            onChange={(e) => setMasterPass(e.target.value)}
                            placeholder="كلمة سر النظام للتأكيد"
                            className="w-full bg-white dark:bg-slate-800 border-none rounded-2xl py-4 pr-12 pl-4 text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20 transition-all border border-slate-100 dark:border-white/5"
                          />
                        </div>
                        <div className="relative">
                          <Key size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input 
                            type="password" 
                            maxLength={4}
                            value={newPin}
                            onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                            placeholder="الرمز السري الجديد (4 أرقام)"
                            className="w-full bg-white dark:bg-slate-800 border-none rounded-2xl py-4 pr-12 pl-4 text-sm font-black outline-none focus:ring-2 focus:ring-primary/20 transition-all border border-slate-100 dark:border-white/5"
                          />
                        </div>
                        <button 
                          onClick={handleConfirmPinChange}
                          disabled={newPin.length !== 4 || !masterPass}
                          className="w-full py-4 bg-primary text-white rounded-2xl font-black text-xs shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                        >
                          <CheckCircle2 size={16} />
                          تأكيد تغيير الرمز
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-dotted border-slate-200 dark:border-white/10">
                    <h4 className="font-bold text-sm mb-4 flex items-center gap-2"><FileJson size={18} className="text-primary" /> النسخة الاحتياطية والبيانات</h4>
                    <div className="flex flex-col gap-3">
                      <button 
                        onClick={async () => {
                           if(confirm('هل تريد فعلاً تحويل كافة المنتجات المضافة مسبقاً إلى نظام "بكمية ومخزون"؟')) {
                              try {
                                await migrateExistingProductsToProduct();
                                alert('تم التحديث بنجاح! كافة المنتجات الآن تتبع نظام المخزون.');
                              } catch(e) {
                                alert('فشل التحديث');
                              }
                           }
                        }}
                        className="w-full flex items-center justify-between p-4 bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 rounded-2xl hover:bg-emerald-500/20 transition-all font-black text-xs text-emerald-500 group"
                      >
                        <span>تحديث كافة المنتجات لتتبع "نظام المخزون"</span>
                        <RotateCcw size={18} className="group-hover:rotate-180 transition-transform duration-500" />
                      </button>
                      <button 
                        onClick={exportBackup} 
                        className="w-full flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-all font-bold text-xs shadow-sm"
                      >
                        <span>تصدير البيانات (Backup JSON)</span>
                        <Download size={18} />
                      </button>
                      <label 
                        className={cn(
                          "w-full flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-all font-bold text-xs shadow-sm cursor-pointer",
                          isRestoring && "opacity-50 pointer-events-none"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          {isRestoring && <Loader2 className="animate-spin text-primary" size={14} />}
                          <span>{isRestoring ? 'جاري استعادة البيانات...' : 'استيراد بيانات (Restore JSON)'}</span>
                        </div>
                        <Upload size={18} />
                        <input type="file" className="hidden" accept=".json" onChange={importBackup} disabled={isRestoring} />
                      </label>
                    </div>
                  </div>

                  <div className="bg-rose-500/5 p-6 rounded-3xl border border-rose-500/20">
                    <h4 className="font-bold text-sm mb-2 text-rose-500 flex items-center gap-2"><TriangleAlert size={18} /> منطقة الخطر</h4>
                    <p className="text-[10px] font-medium text-rose-500/70 mb-4 uppercase">حذف كافة البيانات سيمسح المخزون والماليات تماماً ولا يمكن التراجع</p>
                    <button 
                      onClick={() => { 
                        if(confirm('سيتم تسجيل الخروج ومسح الجلسة الحالية. هل أنت متأكد؟ للمسح الشامل للبيانات السحابية يجب حذفها من لوحة تحكم Firebase مباشرة للأمان.')) { 
                          localStorage.clear(); 
                          window.location.reload(); 
                        } 
                      }}
                      className="w-full py-4 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white rounded-2xl font-black text-xs transition-all"
                    >
                      مسح جلسة النظام الحالية
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>,
            document.body
          )}
        </AnimatePresence>

        {/* Global Toast */}
        <AnimatePresence>
          {toast && createPortal(
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className={cn(
                "fixed top-24 left-6 z-[20000] px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border backdrop-blur-xl",
                toast.type === 'success' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" :
                toast.type === 'error' ? "bg-rose-500/10 border-rose-500/20 text-rose-500" :
                "bg-blue-500/10 border-blue-500/20 text-blue-500"
              )}
            >
              <CheckCircle2 size={20} />
              <span className="font-bold text-sm">{toast.message}</span>
            </motion.div>,
            document.body
          )}
        </AnimatePresence>

      </div>
    </Layout>
  );
}
