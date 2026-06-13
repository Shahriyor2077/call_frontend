'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, X, Clock } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';

export default function SubscriptionBanner() {
  const { user } = useAuthStore();
  const [sub, setSub] = useState<any>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setDismissed(sessionStorage.getItem('sub_banner_dismissed') === '1');
    }
  }, []);

  useEffect(() => {
    if (!user || user.role === 'SUPERADMIN') return;
    api.get('/subscriptions/my')
      .then(r => setSub(r.data))
      .catch(() => {});
  }, [user]);

  if (!sub || dismissed) return null;

  const daysLeft = Math.ceil((new Date(sub.endDate).getTime() - Date.now()) / 86400000);

  if (daysLeft > 30) return null;

  const isCritical = daysLeft <= 7;
  const isExpired = daysLeft <= 0;

  return (
    <div className={`flex items-center gap-3 px-4 py-3 text-sm ${
      isExpired
        ? 'bg-rose-600 text-white'
        : isCritical
        ? 'bg-rose-50 border-b border-rose-200 text-rose-800'
        : 'bg-amber-50 border-b border-amber-200 text-amber-800'
    }`}>
      <div className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${
        isExpired ? 'bg-white/20' : isCritical ? 'bg-rose-100' : 'bg-amber-100'
      }`}>
        {isExpired
          ? <AlertTriangle size={14} className="text-white" />
          : <Clock size={14} className={isCritical ? 'text-rose-600' : 'text-amber-600'} />
        }
      </div>

      <p className="flex-1">
        {isExpired ? (
          <>
            <span className="font-semibold">Obuna muddati tugagan.</span>{' '}
            Tizimdan foydalanish uchun superadmin bilan bog'laning:{' '}
            <a href="tel:+998910122077" className="font-bold underline underline-offset-2">+998 91 012 20 77</a>
          </>
        ) : (
          <>
            <span className="font-semibold">
              {isCritical ? '⚠️ Diqqat!' : 'Eslatma:'}
            </span>{' '}
            <span className="font-semibold">{sub.plan?.name}</span> tarifingiz muddati{' '}
            <span className="font-bold">
              {daysLeft === 0 ? 'bugun' : `${daysLeft} kun`}
            </span>{' '}
            ichida tugaydi — {new Date(sub.endDate).toLocaleDateString('uz-UZ')}.
            Uzluksiz ishlash uchun superadmin bilan bog'laning:{' '}
            <a href="tel:+998910122077" className="font-bold underline underline-offset-2">+998 91 012 20 77</a>
          </>
        )}
      </p>

      <button
        onClick={() => {
          sessionStorage.setItem('sub_banner_dismissed', '1');
          setDismissed(true);
        }}
        className={`shrink-0 p-1 rounded-lg transition-colors ${
          isExpired ? 'hover:bg-white/20' : 'hover:bg-black/5'
        }`}
      >
        <X size={14} />
      </button>
    </div>
  );
}
