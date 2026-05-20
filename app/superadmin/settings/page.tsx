'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useAuthStore } from '@/store/auth.store';
import { useToast } from '@/components/ui/ToastProvider';
import { User, Lock } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';

export default function SuperadminSettingsPage() {
  const toast = useToast();
  const { user, setUser } = useAuthStore();

  const [profileForm, setProfileForm] = useState({ name: '', phone: '' });
  const [passwordForm, setPasswordForm] = useState({ password: '', confirm: '' });
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileForm({ name: user.name, phone: user.phone });
    }
  }, [user]);

  async function saveProfile() {
    if (!profileForm.name.trim()) { toast.warning('Ism kiriting'); return; }
    if (!profileForm.phone.trim()) { toast.warning('Telefon kiriting'); return; }
    setProfileLoading(true);
    try {
      const { data } = await api.put(`/users/${user!.id}`, {
        name: profileForm.name,
        phone: profileForm.phone,
      });
      setUser({ ...user!, name: data.name, phone: data.phone });
      toast.success('Profil yangilandi');
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg.join(' ') : msg || 'Xatolik yuz berdi');
    } finally {
      setProfileLoading(false);
    }
  }

  async function savePassword() {
    if (!passwordForm.password.trim()) { toast.warning('Yangi parol kiriting'); return; }
    if (passwordForm.password.length < 6) { toast.warning('Parol kamida 6 ta belgidan iborat bo\'lishi kerak'); return; }
    if (passwordForm.password !== passwordForm.confirm) { toast.warning('Parollar mos kelmaydi'); return; }
    setPasswordLoading(true);
    try {
      await api.put(`/users/${user!.id}`, { password: passwordForm.password });
      setPasswordForm({ password: '', confirm: '' });
      toast.success('Parol muvaffaqiyatli o\'zgartirildi');
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg.join(' ') : msg || 'Xatolik yuz berdi');
    } finally {
      setPasswordLoading(false);
    }
  }

  if (!user) return null;

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Sozlamalar</h1>
        <p className="text-sm text-gray-400 mt-0.5">Profil va xavfsizlik sozlamalari</p>
      </div>

      {/* Profile card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
        <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
          <Avatar name={user.name} size="lg" />
          <div>
            <p className="font-semibold text-gray-900">{user.name}</p>
            <p className="text-sm text-gray-400">{user.phone}</p>
            <span className="inline-block mt-1 text-xs font-medium bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
              Superadmin
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          <User size={15} className="text-gray-400" />
          Profil ma'lumotlari
        </div>

        <div className="space-y-4">
          <Input
            label="Ism *"
            value={profileForm.name}
            onChange={e => setProfileForm(p => ({ ...p, name: e.target.value }))}
          />
          <Input
            label="Telefon *"
            value={profileForm.phone}
            onChange={e => setProfileForm(p => ({ ...p, phone: e.target.value }))}
            placeholder="+998901234567"
          />
        </div>
        <Button onClick={() => void saveProfile()} loading={profileLoading}>
          Saqlash
        </Button>
      </div>

      {/* Password card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          <Lock size={15} className="text-gray-400" />
          Parolni o'zgartirish
        </div>

        <div className="space-y-4">
          <Input
            label="Yangi parol *"
            type="password"
            value={passwordForm.password}
            onChange={e => setPasswordForm(p => ({ ...p, password: e.target.value }))}
            placeholder="Kamida 6 ta belgi"
          />
          <Input
            label="Parolni tasdiqlang *"
            type="password"
            value={passwordForm.confirm}
            onChange={e => setPasswordForm(p => ({ ...p, confirm: e.target.value }))}
          />
        </div>
        <Button onClick={() => void savePassword()} loading={passwordLoading}>
          Parolni yangilash
        </Button>
      </div>
    </div>
  );
}
