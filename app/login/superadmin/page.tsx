'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Shield, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import api from '@/lib/api';
import { parseLoginError } from '@/lib/parseLoginError';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Toast from '@/components/ui/Toast';

export default function SuperadminLoginPage() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
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

      if (data.user.role !== 'SUPERADMIN') {
        setToast({ message: "Bu sahifa faqat superadmin uchun", type: 'error' });
        setLoading(false);
        return;
      }

      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      setUser(data.user);
      router.replace('/superadmin');
    } catch (err) {
      setLoading(false);
      setToast({ message: parseLoginError(err), type: 'error' });
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-900 to-blue-900 p-4">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 mb-6 transition-colors"
        >
          <ArrowLeft size={15} /> Orqaga
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="bg-linear-to-br from-purple-500 to-purple-700 p-3 rounded-xl shadow-md">
            <Shield size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">Superadmin</h1>
            <p className="text-sm text-gray-400">Tizimga kirish</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Telefon raqam"
            type="text"
            placeholder="+998901234567"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
          <Input
            label="Parol"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Button type="submit" loading={loading} className="w-full" size="lg">
            Kirish
          </Button>
        </form>
      </div>
    </div>
  );
}
