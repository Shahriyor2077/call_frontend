'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import api from '@/lib/api';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    async function init() {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setLoading(false);
        router.replace('/login');
        return;
      }
      try {
        const { data } = await api.get('/auth/me');
        setUser(data);
      } catch {
        router.replace('/login');
      } finally {
        setLoading(false);
      }
    }
    void init();
  }, []);

  return <>{children}</>;
}
