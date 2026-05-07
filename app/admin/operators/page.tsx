'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Avatar from '@/components/ui/Avatar';
import { MoreVertical } from 'lucide-react';
import { useToast } from '@/components/ui/ToastProvider';

const MONTHS_UZ = ['yan', 'fev', 'mar', 'apr', 'may', 'iyn', 'iyl', 'avg', 'sen', 'okt', 'noy', 'dek'];

function fmtDate(d: string) {
  const dt = new Date(d);
  return `${dt.getDate()} ${MONTHS_UZ[dt.getMonth()]} ${dt.getFullYear()}`;
}

function fmtAmount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`;
  return String(n);
}

export default function OperatorsPage() {
  const toast = useToast();
  const [operators, setOperators] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [modal, setModal] = useState<'create' | 'edit' | 'salary' | 'delete' | 'actions' | null>(null);
  const [selected, setSelected] = useState<any>(null);
  const [form, setForm] = useState({ name: '', phone: '', password: '' });
  const [percentage, setPercentage] = useState('10');
  const [fixedAmount, setFixedAmount] = useState('0');
  const [loading, setLoading] = useState(false);

  async function load() {
    const [u, l] = await Promise.all([
      api.get('/users'),
      api.get('/leads').catch(() => ({ data: { data: [] } }))
    ]);
    const users = Array.isArray(u.data) ? u.data : (u.data?.data || []);
    setOperators(users.filter((u: any) => u.role === 'OPERATOR'));
    setLeads(Array.isArray(l.data) ? l.data : (l.data?.data || []));
  }
  useEffect(() => { void load(); }, []);

  function openCreate() {
    setSelected(null);
    setForm({ name: '', phone: '', password: '' });
    setModal('create');
  }

  function openEdit(op: any) {
    setSelected(op);
    setForm({ name: op.name, phone: op.phone, password: '' });
    setModal('edit');
  }

  async function createOp() {
    if (!form.name.trim()) { toast.warning('Ism kiriting'); return; }
    if (!form.phone.trim()) { toast.warning('Telefon kiriting'); return; }
    if (!form.password.trim()) { toast.warning('Parol kiriting'); return; }
    setLoading(true);
    try {
      await api.post('/users', { ...form, role: 'OPERATOR' });
      setModal(null);
      setForm({ name: '', phone: '', password: '' });
      await load();
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg.join(' ') : msg || 'Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  }

  async function updateOp() {
    if (!selected) return;
    if (!form.name.trim()) { toast.warning('Ism kiriting'); return; }
    if (!form.phone.trim()) { toast.warning('Telefon kiriting'); return; }
    setLoading(true);
    try {
      const payload: any = { name: form.name, phone: form.phone };
      if (form.password) payload.password = form.password;
      await api.put(`/users/${selected.id}`, payload);
      setModal(null);
      await load();
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg.join(' ') : msg || 'Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  }

  async function deleteOp() {
    if (!selected) return;
    setLoading(true);
    try {
      await api.delete(`/users/${selected.id}`);
      setModal(null);
      void load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  }

  async function updateSalary() {
    if (!selected) return;
    setLoading(true);
    await api.put(`/users/${selected.id}/salary-percentage`, {
      percentage: Number(percentage),
      fixedAmount: Number(fixedAmount)
    });
    setModal(null);
    void load();
    setLoading(false);
  }

  async function toggleBlock(u: any) {
    await api.put(`/users/${u.id}`, { isActive: !u.isActive });
    void load();
  }

  function getOpStats(op: any) {
    if (!Array.isArray(leads)) return { totalLeads: 0, enrolled: 0, conv: 0 };
    const opLeads = leads.filter((l: any) => l.operatorId === op.id);
    const enrolled = opLeads.filter((l: any) => l.status === 'ENROLLED').length;
    const conv = opLeads.length ? Math.round((enrolled / opLeads.length) * 100) : 0;
    return { totalLeads: opLeads.length, enrolled, conv };
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Operatorlar</h1>
          <p className="text-sm text-gray-400 mt-0.5">Sotuv jamoasi va ularning ko&apos;rsatkichlari.</p>
        </div>
        <Button onClick={openCreate}>+ Yangi operator</Button>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden mt-5">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="px-5 py-3 text-xs font-semibold text-gray-400 tracking-wide">OPERATOR</th>
              <th className="px-5 py-3 text-xs font-semibold text-gray-400 tracking-wide">TELEFON</th>
              <th className="px-5 py-3 text-xs font-semibold text-gray-400 tracking-wide">LEADLAR</th>
              <th className="px-5 py-3 text-xs font-semibold text-gray-400 tracking-wide">MAOSH</th>
              <th className="px-5 py-3 text-xs font-semibold text-gray-400 tracking-wide">HOLAT</th>
              <th className="px-5 py-3 text-xs font-semibold text-gray-400 tracking-wide">QO&apos;SHILGAN</th>
              <th className="px-5 py-3 text-xs font-semibold text-gray-400 tracking-wide w-12"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {operators.map(op => {
              const { totalLeads } = getOpStats(op);
              return (
                <tr key={op.id} className={`hover:bg-gray-50 ${!op.isActive ? 'opacity-60' : ''}`}>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={op.name} size="sm" />
                      <span className="font-medium text-gray-900">{op.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-gray-500">{op.phone}</td>
                  <td className="px-5 py-4 font-semibold text-gray-900">{totalLeads}</td>
                  <td className="px-5 py-4">
                    <div className="text-xs">
                      <span className="text-gray-700 font-medium">{Number(op.salarySetting?.percentage ?? 10)}%</span>
                      {Number(op.salarySetting?.fixedAmount ?? 0) > 0 && (
                        <span className="text-gray-400"> + {fmtAmount(Number(op.salarySetting?.fixedAmount))}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${op.isActive ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-600'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${op.isActive ? 'bg-green-500' : 'bg-amber-500'}`} />
                      {op.isActive ? 'Faol' : 'Bloklangan'}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-gray-400 text-xs">{fmtDate(op.createdAt)}</td>
                  <td className="px-5 py-4">
                    <button
                      onClick={() => { setSelected(op); setModal('actions'); }}
                      className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400"
                    >
                      <MoreVertical size={15} />
                    </button>
                  </td>
                </tr>
              );
            })}
            {operators.length === 0 && (
              <tr><td colSpan={7} className="px-5 py-12 text-center text-gray-400">Hali operatorlar yo&apos;q</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Actions Modal */}
      <Modal open={modal === 'actions'} onClose={() => setModal(null)} title={selected?.name ?? 'Operator'} size="sm">
        <div className="space-y-3">
          <Button onClick={() => { openEdit(selected); setModal('edit'); }} variant="secondary" className="w-full">
            Tahrirlash
          </Button>
          <Button
            onClick={() => {
              setPercentage(String(selected?.salarySetting?.percentage ?? 10));
              setFixedAmount(String(selected?.salarySetting?.fixedAmount ?? 0));
              setModal('salary');
            }}
            variant="secondary"
            className="w-full"
          >
            Maosh sozlamalari
          </Button>
          <Button
            onClick={() => { toggleBlock(selected); setModal(null); }}
            variant={selected?.isActive ? 'danger' : 'secondary'}
            className="w-full"
          >
            {selected?.isActive ? 'Bloklash' : 'Yoqish'}
          </Button>
          <Button onClick={() => setModal('delete')} variant="danger" className="w-full">
            O&apos;chirish
          </Button>
        </div>
      </Modal>

      <Modal open={modal === 'create'} onClose={() => setModal(null)} title="Yangi operator">
        <div className="space-y-4">
          <Input label="Ism *" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
          <Input label="Telefon *" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="+998901234567" />
          <Input label="Parol *" type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} />
          <div className="flex gap-3 pt-2">
            <Button onClick={() => void createOp()} loading={loading} className="flex-1">Saqlash</Button>
            <Button variant="secondary" onClick={() => setModal(null)} className="flex-1">Bekor</Button>
          </div>
        </div>
      </Modal>

      <Modal open={modal === 'edit'} onClose={() => setModal(null)} title={`Operatorni tahrirlash — ${selected?.name}`}>
        <div className="space-y-4">
          <Input label="Ism *" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
          <Input label="Telefon *" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="+998901234567" />
          <Input label="Yangi parol (ixtiyoriy)" type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} placeholder="Bo'sh qoldiring agar o'zgartirmasangiz" />
          <div className="flex gap-3 pt-2">
            <Button onClick={() => void updateOp()} loading={loading} className="flex-1">Saqlash</Button>
            <Button variant="secondary" onClick={() => setModal(null)} className="flex-1">Bekor</Button>
          </div>
        </div>
      </Modal>

      <Modal open={modal === 'delete'} onClose={() => setModal(null)} title="Operatorni o'chirish">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            <span className="font-semibold text-gray-900">{selected?.name}</span> operatorini o'chirishni xohlaysizmi?
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-sm text-amber-800">
              ⚠️ Bu amal qaytarilmaydi. Operator va unga tegishli barcha ma'lumotlar o'chiriladi.
            </p>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="danger" onClick={() => void deleteOp()} loading={loading} className="flex-1">
              O'chirish
            </Button>
            <Button variant="secondary" onClick={() => setModal(null)} className="flex-1">Bekor</Button>
          </div>
        </div>
      </Modal>

      <Modal open={modal === 'salary'} onClose={() => setModal(null)} title={`Maosh sozlamalari — ${selected?.name}`}>
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sotuvdan foiz (1–50%)
            </label>
            <Input
              type="number"
              min="1"
              max="50"
              value={percentage}
              onChange={e => setPercentage(e.target.value)}
              placeholder="10"
            />
            <p className="text-xs text-gray-500 mt-1.5">
              Operator qabul qilgan to&apos;lovlardan oladigan foiz
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Oylik maosh (so&apos;m)
            </label>
            <Input
              type="number"
              min="0"
              value={fixedAmount}
              onChange={e => setFixedAmount(e.target.value)}
              placeholder="0"
            />
            <p className="text-xs text-gray-500 mt-1.5">
              Har oyda qat&apos;iy to&apos;lanadigan summa (sotuvdan qat&apos;iy nazar)
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button onClick={() => void updateSalary()} loading={loading} className="flex-1">Saqlash</Button>
            <Button variant="secondary" onClick={() => setModal(null)} className="flex-1">Bekor</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
