'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import { Plan } from '@/types';
import { Check, Plus } from 'lucide-react';
import { useToast } from '@/components/ui/ToastProvider';

export default function PlansPage() {
  const toast = useToast();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Plan | null>(null);
  const [form, setForm] = useState({ name: '', price: '', operatorLimit: '', durationDays: '' });
  const [loading, setLoading] = useState(false);

  async function load() {
    try {
      const { data } = await api.get('/plans');
      setPlans(data);
    } catch {
      toast.error('Tariflarni yuklashda xatolik');
    }
  }
  useEffect(() => { void load(); }, []);

  function openCreate() {
    setEditing(null);
    setForm({ name: '', price: '', operatorLimit: '', durationDays: '' });
    setModal(true);
  }

  function openEdit(p: Plan) {
    setEditing(p);
    setForm({ name: p.name, price: String(p.price), operatorLimit: String(p.operatorLimit), durationDays: String(p.durationDays) });
    setModal(true);
  }

  async function save() {
    if (!form.name.trim()) { toast.warning('Tarif nomini kiriting'); return; }
    if (!form.price || Number(form.price) <= 0) { toast.warning('Narxni kiriting'); return; }
    if (!form.operatorLimit || Number(form.operatorLimit) <= 0) { toast.warning('Operator limitini kiriting'); return; }
    if (!form.durationDays || Number(form.durationDays) <= 0) { toast.warning('Davomiylikni kiriting'); return; }
    setLoading(true);
    try {
      const data = { name: form.name, price: Number(form.price), operatorLimit: Number(form.operatorLimit), durationDays: Number(form.durationDays) };
      if (editing) await api.put(`/plans/${editing.id}`, data);
      else await api.post('/plans', data);
      toast.success(editing ? 'Tarif yangilandi' : 'Yangi tarif yaratildi');
      setModal(false);
      await load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  }

  async function toggle(p: Plan) {
    try {
      await api.put(`/plans/${p.id}`, { isActive: !p.isActive });
      await load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Xatolik yuz berdi');
    }
  }

  const CARD_STYLES = [
    { accent: 'border-gray-200', badge: '', highlight: false },
    { accent: 'border-gray-200', badge: '', highlight: false },
    { accent: 'border-gray-200', badge: '', highlight: false },
    { accent: 'border-gray-200', badge: '', highlight: false },
  ];

  function getFeatures(p: Plan) {
    return [
      `${p.operatorLimit} ta operator`,
      `${p.durationDays} kunlik obuna`,
      'Cheksiz talabalar',
      'CRM leadlar',
      "To'lov hisoboti",
      p.operatorLimit >= 10 ? 'Maosh hisoboti' : null,
      p.operatorLimit >= 20 ? 'API integratsiya' : null,
    ].filter(Boolean) as string[];
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Tarif paketlari</h1>
          <p className="text-sm text-gray-400 mt-0.5">{plans.filter(p => p.isActive).length} ta faol tarif</p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={14} className="mr-1" /> Yangi tarif
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {plans.map((plan, i) => {
          const style = CARD_STYLES[i % CARD_STYLES.length];
          const features = getFeatures(plan);
          return (
            <div
              key={plan.id}
              className={`relative bg-white rounded-2xl border-2 p-5 shadow-sm flex flex-col ${style.accent} ${!plan.isActive ? 'opacity-50' : ''}`}
            >

              <div className="mb-4">
                <h3 className="font-bold text-gray-900 text-base">{plan.name}</h3>
                <div className="mt-2">
                  <span className="text-3xl font-extrabold text-gray-900">
                    {Number(plan.price).toLocaleString()}
                  </span>
                  <span className="text-sm text-gray-400 ml-1">so'm / {plan.durationDays} kun</span>
                </div>
              </div>

              <ul className="space-y-2.5 flex-1 mb-5">
                {features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                    <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 bg-gray-100">
                      <Check size={10} className="text-gray-500" />
                    </div>
                    {f}
                  </li>
                ))}
              </ul>

              <div className="space-y-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => openEdit(plan)}
                  className="w-full"
                >
                  Tahrirlash
                </Button>
                <Button
                  size="sm"
                  variant={plan.isActive ? 'danger' : 'secondary'}
                  onClick={() => void toggle(plan)}
                  className="w-full"
                >
                  {plan.isActive ? "O'chirish" : 'Yoqish'}
                </Button>
              </div>
            </div>
          );
        })}

        {plans.length === 0 && (
          <div className="col-span-4 py-16 text-center text-gray-400">
            <p>Tarif paketlari yo'q</p>
          </div>
        )}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Tarifni tahrirlash' : 'Yangi tarif'}>
        <div className="space-y-4">
          <Input label="Tarif nomi *" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
          <Input label="Narxi (so'm) *" type="number" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} />
          <Input label="Operator limiti *" type="number" value={form.operatorLimit} onChange={e => setForm(p => ({ ...p, operatorLimit: e.target.value }))} />
          <Input label="Davomiyligi (kun) *" type="number" value={form.durationDays} onChange={e => setForm(p => ({ ...p, durationDays: e.target.value }))} />
          <div className="flex gap-3 pt-2">
            <Button onClick={() => void save()} loading={loading} className="flex-1">Saqlash</Button>
            <Button variant="secondary" onClick={() => setModal(false)} className="flex-1">Bekor</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
