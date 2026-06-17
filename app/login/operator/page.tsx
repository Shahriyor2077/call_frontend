'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Headset, ArrowLeft, Phone, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import api from '@/lib/api';
import { parseLoginError } from '@/lib/parseLoginError';
import Toast from '@/components/ui/Toast';
import ClientOnly from '@/components/layout/ClientOnly';

const inputCls = "w-full py-2.5 rounded-xl border border-slate-600/60 bg-slate-700/50 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:bg-slate-700 focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20 transition-all";

export default function OperatorLoginPage() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'error' } | null>(null);
  const { setUser } = useAuthStore();
  const router = useRouter();

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setToast(null);
    try {
      const { data } = await api.post('/auth/login', { phone, password });
      if (data.user.role !== 'OPERATOR') {
        setToast({ message: "Bu sahifa faqat operator uchun", type: 'error' });
        setLoading(false);
        return;
      }
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      setUser(data.user);
      router.replace('/operator');
    } catch (err) {
      setLoading(false);
      setToast({ message: parseLoginError(err), type: 'error' });
    }
  }

  return (
    <ClientOnly fallback={<div className="min-h-screen" style={{ background: 'linear-gradient(160deg, #1e2433 0%, #141824 100%)' }} suppressHydrationWarning />}>
      <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{ background: 'linear-gradient(160deg, #1e2433 0%, #141824 100%)' }}>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

        <div className="w-full max-w-sm">
          <Link href="/login" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 mb-8 transition-colors">
            <ArrowLeft size={14} /> Orqaga
          </Link>

          <div className="rounded-3xl border border-slate-700/60 p-8" style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(12px)' }}>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-900/40" style={{ background: 'linear-gradient(135deg, #059669, #047857)' }}>
                <Headset size={20} className="text-white" />
              </div>
              <div>
                <h2 className="font-bold text-white text-lg leading-tight">Operator</h2>
                <p className="text-xs text-slate-400">Operator sifatida kirish</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Telefon</label>
                <div className="relative">
                  <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input type="text" placeholder="+998 90 123 45 67" value={phone} onChange={e => setPhone(e.target.value)} required className={`${inputCls} pl-10 pr-4`} />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Parol</label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required className={`${inputCls} pl-10 pr-11`} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl text-white text-sm font-semibold transition-all duration-200 hover:shadow-lg hover:shadow-emerald-900/50 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                style={{ background: 'linear-gradient(135deg, #059669, #047857)' }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Kirilmoqda...
                  </span>
                ) : 'Kirish'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </ClientOnly>
  );
}
