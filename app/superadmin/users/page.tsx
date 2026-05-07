'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import { useToast } from '@/components/ui/ToastProvider';

export default function SuperadminUsersPage() {
  const toast = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [centers, setCenters] = useState<any[]>([]);
  const [modal, setModal] = useState<'create' | 'edit' | 'delete' | null>(null);
  const [selected, setSelected] = useState<any>(null);
  const [form, setForm] = useState({ name: '', phone: '', password: '', centerId: '' });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'ALL' | 'ADMIN' | 'OPERATOR'>('ALL');

  async function load() {
    const [u, c] = await Promise.all([api.get('/users'), api.get('/centers')]);
    setUsers(u.data);
    setCenters(c.data);
  }
  useEffect(() => { void load(); }, []);

  async function createAdmin() {
    if (!form.name.trim()) { toast.warning('Ism kiriting'); return; }
    if (!form.phone.trim()) { toast.warning('Telefon kiriting'); return; }
    if (!form.password.trim()) { toast.warning('Parol kiriting'); return; }
    setLoading(true);
    try {
      const payload: any = { name: form.name, phone: form.phone, password: form.password, role: 'ADMIN' };
      if (form.centerId) payload.centerId = form.centerId;
      await api.post('/users', payload);
      setModal(null);
      setForm({ name: '', phone: '', password: '', centerId: '' });
      await load();
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg.join(' ') : msg || 'Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  }

  async function updateUser() {
    if (!selected) return;
    setLoading(true);
    try {
      const payload: any = { name: form.name, phone: form.phone, centerId: form.centerId };
      if (form.password) payload.password = form.password;
      await api.put(`/users/${selected.id}`, payload);
      setModal(null);
      setSelected(null);
      setForm({ name: '', phone: '', password: '', centerId: '' });
      await load();
    } finally {
      setLoading(false);
    }
  }

  async function deleteUser() {
    if (!selected) return;
    setLoading(true);
    try {
      await api.delete(`/users/${selected.id}`);
      setModal(null);
      setSelected(null);
      await load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  }

  function openEdit(user: any) {
    setSelected(user);
    setForm({ name: user.name, phone: user.phone, password: '', centerId: user.centerId || '' });
    setModal('edit');
  }

  function openDelete(user: any) {
    setSelected(user);
    setModal('delete');
  }

  async function toggleBlock(u: any) {
    await api.put(`/users/${u.id}`, { isActive: !u.isActive });
    await load();
  }

  const filteredUsers = users.filter(u => {
    if (u.role === 'SUPERADMIN') return false;
    if (activeTab === 'ALL') return true;
    return u.role === activeTab;
  });

  const counts = {
    ALL: users.filter(u => u.role !== 'SUPERADMIN').length,
    ADMIN: users.filter(u => u.role === 'ADMIN').length,
    OPERATOR: users.filter(u => u.role === 'OPERATOR').length,
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Foydalanuvchilar</h1>
        <Button onClick={() => { setSelected(null); setForm({ name: '', phone: '', password: '', centerId: '' }); setModal('create'); }}>+ Admin qo'shish</Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        <button
          onClick={() => setActiveTab('ALL')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'ALL'
            ? 'bg-indigo-600 text-white'
            : 'bg-white text-gray-600 border hover:bg-gray-50'
            }`}
        >
          Barchasi ({counts.ALL})
        </button>
        <button
          onClick={() => setActiveTab('ADMIN')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'ADMIN'
            ? 'bg-indigo-600 text-white'
            : 'bg-white text-gray-600 border hover:bg-gray-50'
            }`}
        >
          Adminlar ({counts.ADMIN})
        </button>
        <button
          onClick={() => setActiveTab('OPERATOR')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'OPERATOR'
            ? 'bg-indigo-600 text-white'
            : 'bg-white text-gray-600 border hover:bg-gray-50'
            }`}
        >
          Operatorlar ({counts.OPERATOR})
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr className="text-left text-gray-500">
              <th className="px-4 py-3">Ism</th>
              <th className="px-4 py-3">Telefon</th>
              <th className="px-4 py-3">Rol</th>
              <th className="px-4 py-3">Markaz</th>
              <th className="px-4 py-3">Holat</th>
              <th className="px-4 py-3">Amal</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredUsers.map(u => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{u.name}</td>
                <td className="px-4 py-3">{u.phone}</td>
                <td className="px-4 py-3"><Badge value={u.role} /></td>
                <td className="px-4 py-3">{u.center?.name ?? '—'}</td>
                <td className="px-4 py-3"><Badge value={u.isActive ? 'ACTIVE' : 'CANCELLED'} /></td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <Button size="sm" variant="secondary" onClick={() => openEdit(u)}>
                      Tahrirlash
                    </Button>
                    <Button size="sm" variant={u.isActive ? 'danger' : 'secondary'} onClick={() => void toggleBlock(u)}>
                      {u.isActive ? 'Bloklash' : 'Faollashtirish'}
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => openDelete(u)}>
                      O&apos;chirish
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredUsers.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                  Foydalanuvchilar topilmadi
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal open={modal === 'create'} onClose={() => setModal(null)} title="Admin yaratish">
        <div className="space-y-4">
          <Input label="Ism *" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
          <Input label="Telefon *" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="+998901234567" />
          <Input label="Parol *" type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} />
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Markaz *</label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" value={form.centerId}
              onChange={e => setForm(p => ({ ...p, centerId: e.target.value }))}>
              <option value="">— Markaz tanlang —</option>
              {centers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <Button onClick={() => void createAdmin()} loading={loading} className="flex-1">Saqlash</Button>
            <Button variant="secondary" onClick={() => setModal(null)} className="flex-1">Bekor</Button>
          </div>
        </div>
      </Modal>

      <Modal open={modal === 'edit'} onClose={() => setModal(null)} title={`Tahrirlash — ${selected?.name}`}>
        <div className="space-y-4">
          <Input label="Ism *" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
          <Input label="Telefon *" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="+998901234567" />
          <Input label="Yangi parol (ixtiyoriy)" type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} placeholder="Bo'sh qoldiring agar o'zgartirmasangiz" />
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Markaz *</label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" value={form.centerId}
              onChange={e => setForm(p => ({ ...p, centerId: e.target.value }))}>
              <option value="">— Markaz tanlang —</option>
              {centers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <Button onClick={() => void updateUser()} loading={loading} className="flex-1">Saqlash</Button>
            <Button variant="secondary" onClick={() => setModal(null)} className="flex-1">Bekor</Button>
          </div>
        </div>
      </Modal>

      <Modal open={modal === 'delete'} onClose={() => setModal(null)} title="Foydalanuvchini o'chirish">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            <span className="font-semibold text-gray-900">{selected?.name}</span> foydalanuvchisini o'chirishni xohlaysizmi?
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-sm text-amber-800">
              ⚠️ Bu amal qaytarilmaydi. Foydalanuvchi va unga tegishli barcha ma'lumotlar o'chiriladi.
            </p>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="danger" onClick={() => void deleteUser()} loading={loading} className="flex-1">
              O'chirish
            </Button>
            <Button variant="secondary" onClick={() => setModal(null)} className="flex-1">Bekor</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
