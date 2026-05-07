'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import api from '@/lib/api';

export default function AdminSettingsPage() {
  const { user, setUser } = useAuthStore();
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
      // Refresh user data
      const { data } = await api.get('/auth/me');
      setUser(data);
      setModal(false);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  }

  async function changePassword() {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('Yangi parollar mos kelmadi');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      alert('Parol kamida 6 ta belgidan iborat bo\'lishi kerak');
      return;
    }
    setLoading(true);
    try {
      await api.put(`/users/${user?.id}`, {
        password: passwordForm.newPassword
      });
      setPasswordModal(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      alert('Parol muvaffaqiyatli o\'zgartirildi');
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Sozlamalar</h1>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setPasswordModal(true)}>
            Parolni o'zgartirish
          </Button>
          <Button onClick={openEdit}>
            Tahrirlash
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Markaz ma'lumotlari */}
        <div className="bg-white rounded-xl p-6 border shadow-sm">
          <h2 className="font-semibold mb-4">Markaz ma'lumotlari</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-500">Markaz nomi</span>
              <span className="font-medium">{user?.center?.name ?? '—'}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-500">Manzil</span>
              <span>{user?.center?.address ?? '—'}</span>
            </div>
          </div>
        </div>

        {/* Admin ma'lumotlari */}
        <div className="bg-white rounded-xl p-6 border shadow-sm">
          <h2 className="font-semibold mb-4">Admin ma'lumotlari</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-500">Ism</span>
              <span className="font-medium">{user?.name}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-500">Telefon</span>
              <span>{user?.phone}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-500">Rol</span>
              <span className="font-medium">Admin</span>
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
              O'zgartirish
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
