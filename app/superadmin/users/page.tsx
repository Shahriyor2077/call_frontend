'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Badge from '@/components/ui/Badge';
import Avatar from '@/components/ui/Avatar';
import { useToast } from '@/components/ui/ToastProvider';
import { Search, Plus, Edit2, Trash2, Lock, Unlock, Users, UserCog, Headset } from 'lucide-react';

export default function SuperadminUsersPage() {
  const toast = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [centers, setCenters] = useState<any[]>([]);
  const [modal, setModal] = useState<'create' | 'edit' | 'delete' | null>(null);
  const [selected, setSelected] = useState<any>(null);
  const [form, setForm] = useState({ name: '', phone: '', password: '', centerId: '' });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'ALL' | 'ADMIN' | 'OPERATOR'>('ALL');
  const [search, setSearch] = useState('');

  async function load() {
    try {
      const [u, c] = await Promise.all([api.get('/users'), api.get('/centers')]);
      setUsers(u.data);
      setCenters(c.data);
    } catch {
      toast.error('Ma\'lumotlarni yuklashda xatolik');
    }
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
      toast.success('Admin yaratildi');
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
      toast.success('Foydalanuvchi yangilandi');
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
      toast.success("Foydalanuvchi o'chirildi");
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

  async function toggleBlock(u: any) {
    try {
      await api.put(`/users/${u.id}`, { isActive: !u.isActive });
      await load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Xatolik yuz berdi');
    }
  }

  const filteredUsers = users.filter(u => {
    if (u.role === 'SUPERADMIN') return false;
    if (activeTab !== 'ALL' && u.role !== activeTab) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return u.name.toLowerCase().includes(q) || u.phone.includes(q) || (u.center?.name ?? '').toLowerCase().includes(q);
    }
    return true;
  });

  const counts = {
    ALL: users.filter(u => u.role !== 'SUPERADMIN').length,
    ADMIN: users.filter(u => u.role === 'ADMIN').length,
    OPERATOR: users.filter(u => u.role === 'OPERATOR').length,
  };

  const tabs = [
    { key: 'ALL', label: 'Barchasi', count: counts.ALL, icon: Users, color: 'text-indigo-600' },
    { key: 'ADMIN', label: 'Adminlar', count: counts.ADMIN, icon: UserCog, color: 'text-blue-600' },
    { key: 'OPERATOR', label: 'Operatorlar', count: counts.OPERATOR, icon: Headset, color: 'text-emerald-600' },
  ] as const;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Foydalanuvchilar</h1>
          <p className="text-sm text-gray-400 mt-0.5">{counts.ALL} ta foydalanuvchi ro'yxatda</p>
        </div>
        <Button onClick={() => { setSelected(null); setForm({ name: '', phone: '', password: '', centerId: '' }); setModal('create'); }}>
          <Plus size={14} className="mr-1.5" /> Admin qo'shish
        </Button>
      </div>

      {/* Stat + Tabs */}
      <div className="grid grid-cols-3 gap-3">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-3 p-4 rounded-2xl border-2 text-left transition-all duration-200 ${
                active
                  ? 'border-indigo-500 bg-indigo-50 shadow-sm shadow-indigo-100'
                  : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${active ? 'bg-indigo-100' : 'bg-gray-100'}`}>
                <Icon size={18} className={active ? 'text-indigo-600' : 'text-gray-400'} />
              </div>
              <div>
                <p className={`text-xl font-bold ${active ? 'text-indigo-700' : 'text-gray-900'}`}>{tab.count}</p>
                <p className={`text-xs ${active ? 'text-indigo-500' : 'text-gray-400'}`}>{tab.label}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative w-72">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Ism, telefon yoki markaz..."
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 bg-white transition-colors"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-gray-400 text-xs font-semibold uppercase tracking-wider">
                <th className="px-5 py-3.5">Foydalanuvchi</th>
                <th className="px-5 py-3.5">Telefon</th>
                <th className="px-5 py-3.5">Rol</th>
                <th className="px-5 py-3.5">Markaz</th>
                <th className="px-5 py-3.5">Holat</th>
                <th className="px-5 py-3.5 text-right">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredUsers.map(u => (
                <tr key={u.id} className="hover:bg-gray-50/70 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <Avatar name={u.name} size="sm" />
                      <div>
                        <p className="font-semibold text-gray-900">{u.name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-gray-500 font-mono text-xs">{u.phone}</td>
                  <td className="px-5 py-3.5"><Badge value={u.role} /></td>
                  <td className="px-5 py-3.5">
                    <span className="text-gray-600 bg-gray-100 px-2.5 py-1 rounded-lg text-xs font-medium">
                      {u.center?.name ?? '—'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5"><Badge value={u.isActive ? 'ACTIVE' : 'CANCELLED'} /></td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(u)}
                        title="Tahrirlash"
                        className="p-2 rounded-lg text-gray-400 hover:bg-indigo-50 hover:text-indigo-600 transition-all"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        onClick={() => void toggleBlock(u)}
                        title={u.isActive ? 'Bloklash' : 'Faollashtirish'}
                        className={`p-2 rounded-lg transition-all ${
                          u.isActive
                            ? 'text-gray-400 hover:bg-amber-50 hover:text-amber-600'
                            : 'text-emerald-500 hover:bg-emerald-50 hover:text-emerald-600'
                        }`}
                      >
                        {u.isActive ? <Lock size={15} /> : <Unlock size={15} />}
                      </button>
                      <button
                        onClick={() => { setSelected(u); setModal('delete'); }}
                        title="O'chirish"
                        className="p-2 rounded-lg text-gray-400 hover:bg-rose-50 hover:text-rose-500 transition-all"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-14 text-center text-gray-400">
                    <Users size={28} className="mx-auto mb-2 text-gray-200" />
                    Foydalanuvchilar topilmadi
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create modal */}
      <Modal open={modal === 'create'} onClose={() => setModal(null)} title="Admin yaratish">
        <div className="space-y-4">
          <Input label="Ism *" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
          <Input label="Telefon *" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="+998901234567" />
          <Input label="Parol *" type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} />
          <Select label="Markaz" value={form.centerId} onChange={e => setForm(p => ({ ...p, centerId: e.target.value }))}>
            <option value="">— Markaz tanlang —</option>
            {centers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
          <div className="flex gap-3 pt-2">
            <Button onClick={() => void createAdmin()} loading={loading} className="flex-1">Saqlash</Button>
            <Button variant="secondary" onClick={() => setModal(null)} className="flex-1">Bekor</Button>
          </div>
        </div>
      </Modal>

      {/* Edit modal */}
      <Modal open={modal === 'edit'} onClose={() => setModal(null)} title={`Tahrirlash — ${selected?.name}`}>
        <div className="space-y-4">
          <Input label="Ism *" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
          <Input label="Telefon *" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="+998901234567" />
          <Input label="Yangi parol (ixtiyoriy)" type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} placeholder="Bo'sh qoldiring agar o'zgartirmasangiz" />
          <Select label="Markaz" value={form.centerId} onChange={e => setForm(p => ({ ...p, centerId: e.target.value }))}>
            <option value="">— Markaz tanlang —</option>
            {centers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
          <div className="flex gap-3 pt-2">
            <Button onClick={() => void updateUser()} loading={loading} className="flex-1">Saqlash</Button>
            <Button variant="secondary" onClick={() => setModal(null)} className="flex-1">Bekor</Button>
          </div>
        </div>
      </Modal>

      {/* Delete modal */}
      <Modal open={modal === 'delete'} onClose={() => setModal(null)} title="Foydalanuvchini o'chirish">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            <span className="font-semibold text-gray-900">{selected?.name}</span> foydalanuvchisini o'chirishni xohlaysizmi?
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5">
            <p className="text-sm text-amber-800">
              ⚠️ Bu amal qaytarilmaydi. Foydalanuvchi va unga tegishli barcha ma'lumotlar o'chiriladi.
            </p>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="danger" onClick={() => void deleteUser()} loading={loading} className="flex-1">O'chirish</Button>
            <Button variant="secondary" onClick={() => setModal(null)} className="flex-1">Bekor</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
