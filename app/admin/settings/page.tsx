'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import api from '@/lib/api';
import { useToast } from '@/components/ui/ToastProvider';
import { Phone, MapPin, Building2, ShieldCheck, KeyRound, Pencil } from 'lucide-react';

export default function AdminSettingsPage() {
  const { user, setUser } = useAuthStore();
  const toast = useToast();
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ name: '', address: '', phone: '' });
  const [loading, setLoading] = useState(false);
  const [passwordModal, setPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  function openEdit() {
    setForm({
      name: user?.center?.name || '',
      address: user?.center?.address || '',
      phone: user?.phone || ''
    });
    setModal(true);
  }

  async function updateCenter() {
    if (!user?.centerId) return;
    setLoading(true);
    try {
      await api.put(`/centers/${user.centerId}`, {
        name: form.name,
        address: form.address
      });
      const { data } = await api.get('/auth/me');
      setUser(data);
      setModal(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  }

  async function changePassword() {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.warning('Yangi parollar mos kelmadi');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast.warning("Parol kamida 6 ta belgidan iborat bo'lishi kerak");
      return;
    }
    setLoading(true);
    try {
      await api.put(`/users/${user?.id}`, {
        password: passwordForm.newPassword
      });
      setPasswordModal(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast.success("Parol muvaffaqiyatli o'zgartirildi");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  }

  const initials = user?.name
    ? user.name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
    : 'A';

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Sozlamalar</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Profile card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-5">Profil</h2>

          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-20 h-20 rounded-2xl bg-linear-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-2xl font-bold shadow-md mb-4 select-none">
              {initials}
            </div>
            <p className="text-xl font-bold text-gray-900 leading-tight">{user?.name}</p>
            <div className="flex items-center gap-1.5 mt-1 text-gray-500 text-sm">
              <Phone size={13} className="text-gray-400" />
              <span>{user?.phone}</span>
            </div>
            <span className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold border border-indigo-100">
              <ShieldCheck size={13} />
              Admin
            </span>
          </div>

          <div className="mt-auto">
            <button
              onClick={() => setPasswordModal(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <KeyRound size={15} className="text-gray-400" />
              Parolni o&apos;zgartirish
            </button>
          </div>
        </div>

        {/* Center card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Markaz ma&apos;lumotlari</h2>
            <button
              onClick={openEdit}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <Pencil size={12} />
              Tahrirlash
            </button>
          </div>

          <div className="flex-1 space-y-4">
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-gray-50 border border-gray-100">
              <div className="w-9 h-9 rounded-xl bg-linear-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white shrink-0 shadow-sm">
                <Building2 size={16} />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium mb-0.5">Markaz nomi</p>
                <p className="text-sm font-semibold text-gray-900">{user?.center?.name ?? '—'}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-gray-50 border border-gray-100">
              <div className="w-9 h-9 rounded-xl bg-linear-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white shrink-0 shadow-sm">
                <MapPin size={16} />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium mb-0.5">Manzil</p>
                <p className="text-sm font-semibold text-gray-900">{user?.center?.address ?? '—'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit modal */}
      <Modal open={modal} onClose={() => setModal(false)} title="Markaz ma'lumotlarini tahrirlash">
        <div className="space-y-4">
          <Input
            label="Markaz nomi *"
            value={form.name}
            onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
          />
          <Input
            label="Manzil"
            value={form.address}
            onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
          />
          <div className="flex gap-3 pt-2">
            <Button onClick={() => void updateCenter()} loading={loading} className="flex-1">
              Saqlash
            </Button>
            <Button variant="secondary" onClick={() => setModal(false)} className="flex-1">
              Bekor
            </Button>
          </div>
        </div>
      </Modal>

      {/* Password modal */}
      <Modal open={passwordModal} onClose={() => setPasswordModal(false)} title="Parolni o'zgartirish">
        <div className="space-y-4">
          <Input
            label="Yangi parol *"
            type="password"
            value={passwordForm.newPassword}
            onChange={e => setPasswordForm(p => ({ ...p, newPassword: e.target.value }))}
            placeholder="Kamida 6 ta belgi"
          />
          <Input
            label="Parolni tasdiqlang *"
            type="password"
            value={passwordForm.confirmPassword}
            onChange={e => setPasswordForm(p => ({ ...p, confirmPassword: e.target.value }))}
            placeholder="Parolni qayta kiriting"
          />
          <div className="flex gap-3 pt-2">
            <Button onClick={() => void changePassword()} loading={loading} className="flex-1">
              O&apos;zgartirish
            </Button>
            <Button variant="secondary" onClick={() => setPasswordModal(false)} className="flex-1">
              Bekor
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
