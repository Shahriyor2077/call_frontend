'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import Avatar from '@/components/ui/Avatar';
import { Center } from '@/types';
import { Search, Plus, Copy, Check, Edit2, Trash2, CreditCard, Lock, Unlock } from 'lucide-react';
import { useToast } from '@/components/ui/ToastProvider';

export default function CentersPage() {
  const toast = useToast();
  const [centers, setCenters] = useState<Center[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [modal, setModal] = useState<'create' | 'edit' | 'assign' | 'credentials' | 'delete' | null>(null);
  const [selected, setSelected] = useState<Center | null>(null);
  const [form, setForm] = useState({ name: '', address: '', phone: '', adminName: '', adminPhone: '', adminPassword: '' });
  const [assignForm, setAssignForm] = useState({ planId: '', days: '' });
  const [createdCreds, setCreatedCreds] = useState<{ centerName: string; phone: string; password: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  async function load() {
    const [c, p] = await Promise.all([api.get('/centers'), api.get('/plans')]);
    setCenters(c.data);
    setPlans(p.data);
  }
  useEffect(() => { void load(); }, []);

  const filtered = centers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  function openCreate() {
    setSelected(null);
    setForm({ name: '', address: '', phone: '', adminName: '', adminPhone: '', adminPassword: '' });
    setModal('create');
  }

  function openEdit(center: Center) {
    setSelected(center);
    setForm({
      name: center.name,
      address: center.address || '',
      phone: '',
      adminName: '',
      adminPhone: '',
      adminPassword: ''
    });
    setModal('edit');
  }

  async function createCenter() {
    if (!form.name.trim()) { toast.warning('Markaz nomini kiriting'); return; }
    if (!form.adminName.trim()) { toast.warning('Admin ismini kiriting'); return; }
    if (!form.adminPhone.trim()) { toast.warning('Admin telefonini kiriting'); return; }
    if (!form.adminPassword.trim()) { toast.warning('Admin parolini kiriting'); return; }
    setLoading(true);
    try {
      const payload: any = { name: form.name, adminName: form.adminName, adminPhone: form.adminPhone, adminPassword: form.adminPassword };
      if (form.address.trim()) payload.address = form.address;
      if (form.phone.trim()) payload.phone = form.phone;
      await api.post('/centers', payload);
      setCreatedCreds({ centerName: form.name, phone: form.adminPhone, password: form.adminPassword });
      setModal('credentials');
      setForm({ name: '', address: '', phone: '', adminName: '', adminPhone: '', adminPassword: '' });
      await load();
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg.join(' ') : msg || 'Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  }

  async function updateCenter() {
    if (!selected) return;
    setLoading(true);
    await api.put(`/centers/${selected.id}`, {
      name: form.name,
      address: form.address
    });
    setModal(null);
    await load();
    setLoading(false);
  }

  async function deleteCenter() {
    if (!selected) return;
    setLoading(true);
    try {
      await api.delete(`/centers/${selected.id}`);
      setModal(null);
      await load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  }

  function copyCredentials() {
    if (!createdCreds) return;
    navigator.clipboard.writeText(`Markaz: ${createdCreds.centerName}\nLogin: ${createdCreds.phone}\nParol: ${createdCreds.password}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function toggleActive(c: Center) {
    await api.put(`/centers/${c.id}`, { isActive: !c.isActive });
    await load();
  }

  async function assignPlan() {
    setLoading(true);
    if (assignForm.days) {
      await api.post('/subscriptions/demo', { centerId: selected?.id, days: parseInt(assignForm.days) });
    } else {
      await api.post('/subscriptions/assign', { centerId: selected?.id, planId: assignForm.planId });
    }
    setModal(null);
    await load();
    setLoading(false);
  }


  return (
    <div className="space-y-5">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Markazlar</h1>
          <p className="text-sm text-gray-400 mt-0.5">{centers.length} ta markaz ro'yxatga olingan</p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={14} className="mr-1" /> Markaz qo'shish
        </Button>
      </div>

      {/* Search */}
      <div className="relative w-72">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Markaz qidirish..."
          className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 bg-white"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left text-gray-400 text-xs font-medium">
              <th className="px-5 py-3">MARKAZ</th>
              <th className="px-5 py-3">MANZIL</th>
              <th className="px-5 py-3">TELEFON</th>
              <th className="px-5 py-3">OBUNA</th>
              <th className="px-5 py-3">HOLAT</th>
              <th className="px-5 py-3">AMALLAR</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map(center => (
              <tr key={center.id} className="hover:bg-gray-50/60">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={center.name} size="sm" />
                    <span className="font-medium text-gray-900">{center.name}</span>
                  </div>
                </td>
                <td className="px-5 py-3 text-gray-500">{center.address || '—'}</td>
                <td className="px-5 py-3 text-gray-500">{center.admin?.phone || '—'}</td>
                <td className="px-5 py-3">
                  {center.subscription ? (() => {
                    const daysLeft = Math.ceil(
                      (new Date(center.subscription.endDate).getTime() - Date.now()) / 86400000
                    );
                    return (
                      <div className="space-y-1">
                        <Badge value={center.subscription.status} />
                        <p className="text-xs text-gray-400">
                          {new Date(center.subscription.endDate).toLocaleDateString('uz-UZ')}gacha
                        </p>
                        <p className={`text-xs font-semibold ${daysLeft <= 3 ? 'text-rose-600' : daysLeft <= 7 ? 'text-amber-500' : 'text-gray-500'}`}>
                          {daysLeft > 0 ? `${daysLeft} kun qoldi` : 'Tugagan'}
                        </p>
                      </div>
                    );
                  })() : <span className="text-gray-400">Yo'q</span>}
                </td>
                <td className="px-5 py-3"><Badge value={center.isActive ? 'ACTIVE' : 'CANCELLED'} /></td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    {/* Asosiy amallar guruhi */}
                    <div className="flex items-center gap-0.5 bg-gray-50 border border-gray-100 rounded-xl p-1">
                      <button
                        onClick={() => openEdit(center)}
                        title="Tahrirlash"
                        className="p-1.5 rounded-lg text-gray-400 hover:bg-white hover:text-indigo-600 hover:shadow-sm transition-all"
                      >
                        <Edit2 size={14} />
                      </button>

                      <button
                        onClick={() => { setSelected(center); setAssignForm({ planId: '', days: '' }); setModal('assign'); }}
                        title="Tarif belgilash"
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-gray-500 hover:bg-white hover:text-indigo-600 hover:shadow-sm transition-all text-xs font-medium"
                      >
                        <CreditCard size={13} />
                        Tarif
                      </button>

                      <button
                        onClick={() => void toggleActive(center)}
                        title={center.isActive ? 'Bloklash' : 'Faollashtirish'}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          center.isActive
                            ? 'text-amber-600 hover:bg-amber-50'
                            : 'text-emerald-600 hover:bg-emerald-50'
                        }`}
                      >
                        {center.isActive ? <Lock size={13} /> : <Unlock size={13} />}
                        {center.isActive ? 'Bloklash' : 'Faollashtirish'}
                      </button>
                    </div>

                    {/* O'chirish — alohida */}
                    <button
                      onClick={() => { setSelected(center); setModal('delete'); }}
                      title="O'chirish"
                      className="p-1.5 rounded-lg text-gray-300 hover:bg-rose-50 hover:text-rose-500 transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="px-5 py-10 text-center text-gray-400">Markazlar topilmadi</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create modal */}
      <Modal open={modal === 'create'} onClose={() => setModal(null)} title="Yangi markaz qo'shish">
        <div className="space-y-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Markaz ma'lumotlari</p>
          <Input label="Markaz nomi *" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
          <Input label="Manzil" value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} />

          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Admin ma'lumotlari</p>
            <div className="space-y-4">
              <Input label="Admin ismi *" value={form.adminName} onChange={e => setForm(p => ({ ...p, adminName: e.target.value }))} />
              <Input label="Admin telefoni *" value={form.adminPhone} onChange={e => setForm(p => ({ ...p, adminPhone: e.target.value }))} placeholder="+998901234567" />
              <Input label="Parol *" type="password" value={form.adminPassword} onChange={e => setForm(p => ({ ...p, adminPassword: e.target.value }))} />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button onClick={() => void createCenter()} loading={loading} className="flex-1">Saqlash</Button>
            <Button variant="secondary" onClick={() => setModal(null)} className="flex-1">Bekor</Button>
          </div>
        </div>
      </Modal>

      {/* Assign plan modal */}
      <Modal open={modal === 'assign'} onClose={() => setModal(null)} title={`Tarif belgilash — ${selected?.name}`}>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Tarif tanlang</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              value={assignForm.planId}
              onChange={e => setAssignForm(p => ({ ...p, planId: e.target.value, days: '' }))}
            >
              <option value="">— Tarif tanlang —</option>
              {plans.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} — {Number(p.price).toLocaleString()} so'm / {p.durationDays} kun
                </option>
              ))}
            </select>
          </div>
          <div className="relative flex items-center">
            <div className="flex-1 border-t border-gray-200" />
            <span className="mx-3 text-xs text-gray-400">yoki</span>
            <div className="flex-1 border-t border-gray-200" />
          </div>
          <Input
            label="Demo kun soni"
            type="number"
            value={assignForm.days}
            onChange={e => setAssignForm(p => ({ ...p, days: e.target.value, planId: '' }))}
            placeholder="14"
          />
          <div className="flex gap-3 pt-2">
            <Button
              onClick={() => void assignPlan()}
              loading={loading}
              className="flex-1"
              disabled={!assignForm.planId && !assignForm.days}
            >
              Tasdiqlash
            </Button>
            <Button variant="secondary" onClick={() => setModal(null)} className="flex-1">Bekor</Button>
          </div>
        </div>
      </Modal>

      {/* Credentials modal */}
      <Modal open={modal === 'credentials'} onClose={() => setModal(null)} title="Markaz yaratildi ✓">
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Admin quyidagi ma'lumotlar bilan tizimga kiradi. Ularni saqlab qo'ying.
          </p>
          <div className="bg-gray-50 rounded-xl p-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Markaz</span>
              <span className="font-semibold text-gray-900">{createdCreds?.centerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Login (telefon)</span>
              <span className="font-semibold text-gray-900 font-mono">{createdCreds?.phone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Parol</span>
              <span className="font-semibold text-gray-900 font-mono">{createdCreds?.password}</span>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={copyCredentials}
              className="flex-1 flex items-center justify-center gap-2"
            >
              {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
              {copied ? 'Nusxalandi!' : 'Nusxalash'}
            </Button>
            <Button onClick={() => setModal(null)} className="flex-1">Yopish</Button>
          </div>
        </div>
      </Modal>

      {/* Edit modal */}
      <Modal open={modal === 'edit'} onClose={() => setModal(null)} title={`Markazni tahrirlash — ${selected?.name}`}>
        <div className="space-y-4">
          <Input label="Markaz nomi *" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
          <Input label="Manzil" value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} />

          <div className="flex gap-3 pt-2">
            <Button onClick={() => void updateCenter()} loading={loading} className="flex-1">Saqlash</Button>
            <Button variant="secondary" onClick={() => setModal(null)} className="flex-1">Bekor</Button>
          </div>
        </div>
      </Modal>

      {/* Delete modal */}
      <Modal open={modal === 'delete'} onClose={() => setModal(null)} title="Markazni o'chirish">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            <span className="font-semibold text-gray-900">{selected?.name}</span> markazini o'chirishni xohlaysizmi?
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-sm text-amber-800">
              ⚠️ Bu amal qaytarilmaydi. Markaz va unga tegishli barcha ma'lumotlar o'chiriladi.
            </p>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="danger" onClick={() => void deleteCenter()} loading={loading} className="flex-1">
              O'chirish
            </Button>
            <Button variant="secondary" onClick={() => setModal(null)} className="flex-1">Bekor</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
