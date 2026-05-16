'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Headset, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import api from '@/lib/api';
import { parseLoginError } from '@/lib/parseLoginError';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Toast from '@/components/ui/Toast';

export default function OperatorLoginPage() {
  const [centers, setCenters] = useState<{ id: string; name: string }[]>([]);
  const [centerId, setCenterId] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingCenters, setLoadingCenters] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'error' } | null>(null);
  const { setUser } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    api
      .get('/centers/public')
      .then(({ data }) => setCenters(data))
      .catch(() => setToast({ message: 'Markazlar yuklanmadi', type: 'error' }))
      .finally(() => setLoadingCenters(false));
  }, []);

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!centerId) {
      setToast({ message: 'Markazni tanlang', type: 'error' });
      return;
    }
    setLoading(true);
    setToast(null);

    try {
      const { data } = await api.post('/auth/login', { phone, password, centerId });

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
          <div className="bg-linear-to-br from-emerald-500 to-emerald-700 p-3 rounded-xl shadow-md">
            <Headset size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">Operator</h1>
            <p className="text-sm text-gray-400">Operator sifatida kirish</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Markaz <span className="text-red-500">*</span>
            </label>
            {loadingCenters ? (
              <div className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-400">
                Yuklanmoqda...
              </div>
            ) : (
              <Select value={centerId} onChange={(e) => setCenterId(e.target.value)} required>
                <option value="">— Markazni tanlang —</option>
                {centers.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
            )}
          </div>

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
