import React, { useState } from 'react';
import { ShieldAlert, Lock, ChevronRight } from 'lucide-react';
import { User } from '../types';

interface LoginScreenProps {
  onLogin: (user: User) => void;
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const [loginPin, setLoginPin] = useState('');
  const [loginError, setLoginError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginPin === '1234') {
      onLogin({ role: 'owner', name: 'المدير' });
      setLoginPin('');
    } else if (loginPin === '0000') {
      onLogin({ role: 'employee', name: 'المبيعات' });
      setLoginPin('');
    } else {
      setLoginError('رمز الدخول غير صحيح!');
      setTimeout(() => setLoginError(''), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans relative overflow-hidden" dir="rtl">
      {/* Decorative Background */}
      <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-indigo-400 rounded-full mix-blend-multiply filter blur-[128px] opacity-40 animate-blob"></div>
      <div className="absolute bottom-[-10%] left-[-5%] w-96 h-96 bg-emerald-400 rounded-full mix-blend-multiply filter blur-[128px] opacity-40 animate-blob animation-delay-2000"></div>
      <div className="absolute top-[20%] left-[20%] w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-[128px] opacity-40 animate-blob animation-delay-4000"></div>

      <div className="bg-white/70 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white w-full max-w-md overflow-hidden relative z-10">
        <div className="p-10 text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-indigo-500/30 transform rotate-3">
            <ShieldAlert size={48} className="text-white -rotate-3" />
          </div>
          <h1 className="text-4xl font-black text-slate-800 mb-2 tracking-tight">Rady Store</h1>
          <p className="text-slate-500 font-medium">بوابة الدخول للنظام الذكي</p>
        </div>
        <div className="px-10 pb-10">
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <div className="relative group">
                <input 
                  type="password" 
                  value={loginPin} 
                  onChange={(e) => setLoginPin(e.target.value)} 
                  placeholder="••••"
                  className="w-full p-5 text-center text-4xl tracking-[1em] bg-white border-2 border-slate-100 rounded-2xl focus:bg-white outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 text-slate-800 font-mono transition-all shadow-sm" 
                  autoFocus
                />
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={24} />
              </div>
              {loginError && <p className="text-rose-500 text-sm mt-3 font-semibold animate-pulse text-center bg-rose-50 py-2 rounded-lg">{loginError}</p>}
            </div>
            <button type="submit" className="w-full bg-slate-900 hover:bg-indigo-600 text-white font-bold py-5 rounded-2xl shadow-lg hover:shadow-indigo-500/25 transition-all transform active:scale-[0.98] flex justify-center items-center gap-2 text-lg">
              دخول النظام <ChevronRight size={20} />
            </button>
          </form>
          
          <div className="mt-8 pt-6 border-t border-slate-100 text-sm text-slate-500 text-center">
            <p className="font-semibold mb-2 text-slate-400">رموز الدخول المتاحة للتجربة:</p>
            <div className="flex justify-center gap-4">
              <span className="bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100 font-mono font-bold text-indigo-600">المدير: 1234</span>
              <span className="bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100 font-mono font-bold text-slate-600">المبيعات: 0000</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
