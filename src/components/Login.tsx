import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, ShieldAlert, ChevronRight, User as UserIcon, Key, Settings, ArrowRight, Smartphone, ShieldCheck, Loader2 } from 'lucide-react';
import { useStore, UserRole } from '../lib/store';
import { cn, sendWhatsAppOTP } from '../lib/utils';
import { auth } from '../lib/firebase';
import { signInAnonymously } from 'firebase/auth';

export default function Login() {
  const [pin, setPin] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'login' | 'change'>('login');
  const [roleToChange, setRoleToChange] = useState<UserRole>('employee');
  const [newPin, setNewPin] = useState('');
  const [masterPass, setMasterPass] = useState('');
  const [success, setSuccess] = useState('');
  
  const { setCurrentUser, ownerPin, employeePin, updatePin } = useStore();

  const handleLogin = async (pinToSubmit: string) => {
    if (pinToSubmit === ownerPin || pinToSubmit === employeePin) {
      setIsLoggingIn(true);
      try {
        await signInAnonymously(auth);
        if (pinToSubmit === ownerPin) {
          setCurrentUser({ id: '1', name: 'المدير', role: 'owner' });
        } else {
          setCurrentUser({ id: '2', name: 'الموظف', role: 'employee' });
        }
      } catch (err) {
        console.error('Firebase Auth Error:', err);
        setError('تعذر الاتصال بالخادم السحابي. تأكد من اتصال الإنترنت.');
        setTimeout(() => setError(''), 3000);
      } finally {
        setIsLoggingIn(false);
      }
    } else {
      setError('رمز الدخول غير صحيح!');
      setPin('');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleUpdatePin = () => {
    if (masterPass !== 'Zz@#112007') {
      setError('كلمة سر النظام غير صحيحة!');
      setTimeout(() => setError(''), 3000);
      return;
    }
    if (newPin.length === 4) {
      updatePin(roleToChange, newPin);
      setSuccess('تم تغيير الرمز بنجاح!');
      setNewPin('');
      setMasterPass('');
      setTimeout(() => {
        setSuccess('');
        setMode('login');
      }, 2000);
    } else {
      setError('يجب أن يتكون الرمز من 4 أرقام');
      setTimeout(() => setError(''), 3000);
    }
  };

  useEffect(() => {
    if (mode !== 'login') return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        if (pin.length < 4) {
          const nextPin = pin + e.key;
          setPin(nextPin);
          if (nextPin.length === 4) handleLogin(nextPin);
        }
      } else if (e.key === 'Backspace') {
        setPin(prev => prev.slice(0, -1));
      } else if (e.key === 'Enter' && pin.length === 4) {
        handleLogin(pin);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pin, ownerPin, employeePin, mode]);

  const handleKeyClick = (num: string) => {
    if (mode === 'login') {
      if (pin.length < 4) {
        const nextPin = pin + num;
        setPin(nextPin);
        if (nextPin.length === 4) {
          setTimeout(() => handleLogin(nextPin), 100);
        }
      }
    } else {
      if (newPin.length < 4) {
        setNewPin(prev => prev + num);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0c0c0e] flex items-center justify-center p-4 font-sans relative overflow-hidden" dir="rtl">
      {/* Decorative Background */}
      <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-primary/30 rounded-full mix-blend-multiply filter blur-[128px] opacity-40 animate-pulse-soft"></div>
      <div className="absolute bottom-[-10%] left-[-5%] w-96 h-96 bg-indigo-400/30 rounded-full mix-blend-multiply filter blur-[128px] opacity-40 animate-pulse-soft animation-delay-2000"></div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white/70 dark:bg-slate-900/40 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl border border-white/20 dark:border-white/5 overflow-hidden relative z-10"
      >
        <AnimatePresence mode="wait">
          {mode === 'login' ? (
            <motion.div 
              key="login"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-10"
            >
              <div className="text-center mb-10">
                <div className="w-20 h-20 bg-gradient-to-br from-primary to-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-primary/30 transform rotate-3">
                  <ShieldAlert size={40} className="text-white -rotate-3" />
                </div>
                <h1 className="text-3xl font-black text-slate-800 dark:text-white mb-2 tracking-tight">راضي ستور</h1>
                <p className="text-slate-500 dark:text-slate-400 font-medium">بوابة الدخول للنظام الذكي</p>
              </div>

              <div className="flex justify-center gap-4 mb-10">
                {[0, 1, 2, 3].map((i) => (
                  <div 
                    key={i}
                    className={cn(
                      "w-4 h-4 rounded-full transition-all duration-300",
                      pin.length > i ? "bg-primary scale-125 shadow-[0_0_10px_hsl(var(--primary))]" : "bg-slate-200 dark:bg-slate-800"
                    )}
                  />
                ))}
              </div>

              <div className="grid grid-cols-3 gap-4 mb-8">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'clear', '0', 'delete'].map((key, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      if (key === 'clear') setPin('');
                      else if (key === 'delete') setPin(prev => prev.slice(0, -1));
                      else handleKeyClick(key);
                    }}
                    className={cn(
                      "h-16 rounded-2xl flex items-center justify-center text-xl font-bold transition-all active:scale-95",
                      key === 'clear' ? "bg-rose-50 text-rose-500 dark:bg-rose-500/10 text-xs font-black uppercase" : 
                      key === 'delete' ? "bg-slate-50 text-slate-400 dark:bg-slate-800/50" : 
                      "bg-white dark:bg-slate-800/50 shadow-sm border border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-primary/50"
                    )}
                  >
                    {key === 'clear' ? 'مسح' : key === 'delete' ? <ArrowRight size={20} className="rotate-180" /> : key}
                  </button>
                ))}
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-rose-50 dark:bg-rose-500/10 text-rose-500 text-sm font-bold p-4 rounded-2xl text-center mb-6"
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => handleLogin(pin)}
                  className="w-full bg-slate-900 dark:bg-primary text-white font-bold py-5 rounded-2xl shadow-lg transition-all transform active:scale-95 flex justify-center items-center gap-2 text-lg disabled:opacity-50"
                  disabled={pin.length < 4 || isLoggingIn}
                >
                  {isLoggingIn ? <Loader2 className="animate-spin" /> : 'دخول النظام'} <ChevronRight size={20} />
                </button>
                <button 
                  onClick={() => setMode('change')}
                  className="text-xs font-black text-slate-400 hover:text-primary transition-colors py-2"
                >
                  نسيت رمز الدخول؟ تغيير الرمز
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="change"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="p-10"
            >
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Lock size={32} />
                </div>
                <h2 className="text-2xl font-black mb-1">تغيير رمز الدخول</h2>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">اختر الحساب وادخل الرمز الجديد</p>
              </div>

              <div className="space-y-6">
                <div className="flex gap-2 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl">
                  <button 
                    onClick={() => setRoleToChange('employee')}
                    className={cn(
                      "flex-1 py-3 rounded-xl text-xs font-black transition-all",
                      roleToChange === 'employee' ? "bg-white dark:bg-slate-700 text-primary shadow-sm" : "text-slate-400"
                    )}
                  >الموظف</button>
                  <button 
                    onClick={() => setRoleToChange('owner')}
                    className={cn(
                      "flex-1 py-3 rounded-xl text-xs font-black transition-all",
                      roleToChange === 'owner' ? "bg-white dark:bg-slate-700 text-primary shadow-sm" : "text-slate-400"
                    )}
                  >المدير</button>
                </div>

                <div className="space-y-4">
                  <div className="relative">
                    <ShieldCheck size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="password" 
                      value={masterPass}
                      onChange={(e) => setMasterPass(e.target.value)}
                      placeholder="كلمة سر النظام للتأكيد"
                      className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-2xl py-5 pr-12 pl-4 text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10 transition-all shadow-sm"
                    />
                  </div>
                  <div className="relative">
                    <Key size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="password" 
                      maxLength={4}
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                      placeholder="أدخل الرمز الجديد (4 أرقام)"
                      className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-2xl py-5 pr-12 pl-4 text-sm font-black outline-none focus:ring-4 focus:ring-primary/10 transition-all shadow-sm"
                    />
                  </div>
                </div>

                <AnimatePresence>
                  {error && <motion.div className="text-rose-500 text-[10px] font-black text-center">{error}</motion.div>}
                  {success && <motion.div className="text-emerald-500 text-[10px] font-black text-center">{success}</motion.div>}
                </AnimatePresence>

                <div className="flex gap-4">
                  <button 
                    onClick={() => setMode('login')}
                    className="flex-1 py-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-white/5 rounded-2xl font-bold text-xs shadow-sm active:scale-95 transition-all"
                  >إلغاء</button>
                  <button 
                    onClick={handleUpdatePin}
                    disabled={newPin.length !== 4 || !masterPass}
                    className="flex-[2] py-4 bg-primary text-white rounded-2xl font-black text-xs shadow-xl shadow-primary/20 active:scale-95 transition-all"
                  >حفظ وتغيير الرمز</button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
