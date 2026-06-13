'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Avatar from '@/components/ui/Avatar';
import { Pencil, DollarSign, Ban, CheckCircle2, Trash2, Search, Users, UserCheck, UserX, MoreVertical } from 'lucide-react';
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

type ModalType = 'create' | 'edit' | 'salary' | 'delete' | 'block' | 'unblock' | null;

export default function OperatorsPage() {
  const toast = useToast();
  const [operators, setOperators] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [modal, setModal] = useState<ModalType>(null);
  const [selected, setSelected] = useState<any>(null);
  const [form, setForm] = useState({ name: '', phone: '', password: '' });
  const [percentage, setPercentage] = useState('10');
  const [fixedAmount, setFixedAmount] = useState('0');
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 15;

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
    setMenuOpen(null);
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

  async function blockOp() {
    if (!selected) return;
    setLoading(true);
    try {
      await api.put(`/users/${selected.id}/block`);
      setModal(null);
      toast.success(`${selected.name} bloklandi`);
      void load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Xatolik yuz berdi');
    } finally { setLoading(false); }
  }

  async function unblockOp() {
    if (!selected) return;
    setLoading(true);
    try {
      await api.put(`/users/${selected.id}/unblock`);
      setModal(null);
      toast.success(`${selected.name} faollashtirildi`);
      void load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Xatolik yuz berdi');
    } finally { setLoading(false); }
  }

  async function deleteOp() {
    if (!selected) return;
    setLoading(true);
    try {
      await api.delete(`/users/${selected.id}`);
      setModal(null);
      toast.success(`${selected.name} o'chirildi`);
      void load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Xatolik yuz berdi');
    } finally { setLoading(false); }
  }

  async function updateSalary() {
    if (!selected) return;
    setLoading(true);
    try {
      await api.put(`/users/${selected.id}/salary-percentage`, {
        percentage: Number(percentage),
        fixedAmount: Number(fixedAmount),
      });
      setModal(null);
      toast.success('Maosh sozlamalari saqlandi');
      void load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  }

  function getOpStats(op: any) {
    if (!Array.isArray(leads)) return { totalLeads: 0, enrolled: 0, conv: 0 };
    const opLeads = leads.filter((l: any) => l.operatorId === op.id);
    const enrolled = opLeads.filter((l: any) => l.status === 'ENROLLED').length;
    const conv = opLeads.length ? Math.round((enrolled / opLeads.length) * 100) : 0;
    return { totalLeads: opLeads.length, enrolled, conv };
  }

  const total = operators.length;
  const activeCount = operators.filter(o => o.isActive).length;
  const blockedCount = operators.filter(o => !o.isActive).length;

  const filtered = search
    ? operators.filter(o => o.name?.toLowerCase().includes(search.toLowerCase()) || o.phone?.includes(search))
    : operators;

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const gradients = [
    ['from-indigo-500', 'to-violet-600'],
    ['from-emerald-400', 'to-teal-600'],
    ['from-rose-400', 'to-pink-600'],
    ['from-amber-400', 'to-orange-500'],
    ['from-sky-400', 'to-blue-600'],
    ['from-violet-500', 'to-purple-700'],
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Operatorlar</h1>
          <p className="text-sm text-gray-400 mt-0.5">Sotuv jamoasi va ularning ko&apos;rsatkichlari.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
              placeholder="Qidirish..."
              className="pl-8 pr-3 py-2 border border-gray-200 rounded-xl text-sm w-full sm:w-48 focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
            />
          </div>
          <Button onClick={openCreate}>+ Yangi operator</Button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="w-10 h-10 rounded-xl bg-linear-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white mb-3 shadow-sm">
            <Users size={18} />
          </div>
          <p className="text-2xl font-bold text-gray-900 leading-none mb-1">{total}</p>
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Jami operatorlar</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="w-10 h-10 rounded-xl bg-linear-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white mb-3 shadow-sm">
            <UserCheck size={18} />
          </div>
          <p className="text-2xl font-bold text-gray-900 leading-none mb-1">{activeCount}</p>
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Faol</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="w-10 h-10 rounded-xl bg-linear-to-br from-rose-400 to-red-600 flex items-center justify-center text-white mb-3 shadow-sm">
            <UserX size={18} />
          </div>
          <p className="text-2xl font-bold text-gray-900 leading-none mb-1">{blockedCount}</p>
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Bloklangan</p>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mb-4 bg-white rounded-xl border border-gray-100 px-4 py-2.5 shadow-sm">
          <p className="text-sm text-gray-500">Sahifa {currentPage} / {totalPages} · Jami {filtered.length} ta</p>
          <div className="flex gap-2">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">
              ← Oldingi
            </button>
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">
              Keyingi →
            </button>
          </div>
        </div>
      )}

      {/* Card grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {paginated.map((op, idx) => {
          const { totalLeads, enrolled, conv } = getOpStats(op);
          const [gFrom, gTo] = gradients[idx % gradients.length];
          return (
            <div
              key={op.id}
              className={`bg-white rounded-2xl border p-5 shadow-sm hover:shadow-md transition-all group relative ${
                !op.isActive ? 'border-amber-100 bg-amber-50/30' : 'border-gray-100 hover:border-indigo-200'
              }`}
            >
              {/* Card header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl bg-linear-to-br ${gFrom} ${gTo} flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform shrink-0 text-base font-bold ${!op.isActive ? 'opacity-60 grayscale' : ''}`}>
                    {op.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-gray-900 truncate">{op.name}</p>
                    <p className="text-xs text-gray-400 truncate">{op.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${op.isActive ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-600'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${op.isActive ? 'bg-green-500' : 'bg-amber-500'}`} />
                    {op.isActive ? 'Faol' : 'Bloklangan'}
                  </span>
                  <div className="relative">
                    <button
                      onClick={e => { e.stopPropagation(); setMenuOpen(menuOpen === op.id ? null : op.id); }}
                      className="w-7 h-7 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-400 transition-colors cursor-pointer"
                    >
                      <MoreVertical size={14} />
                    </button>
                    {menuOpen === op.id && (
                      <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-xl shadow-lg py-1.5 z-20 w-44">
                        <button onClick={() => openEdit(op)} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 text-gray-700 cursor-pointer">
                          Tahrirlash
                        </button>
                        <button
                          onClick={() => { setSelected(op); setPercentage(String(op.salarySetting?.percentage ?? 10)); setFixedAmount(String(op.salarySetting?.fixedAmount ?? 0)); setModal('salary'); setMenuOpen(null); }}
                          className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 text-gray-700 cursor-pointer"
                        >
                          Maosh sozlamalari
                        </button>
                        {op.isActive ? (
                          <button onClick={() => { setSelected(op); setModal('block'); setMenuOpen(null); }} className="w-full text-left px-4 py-2 text-sm hover:bg-amber-50 text-amber-600 cursor-pointer">
                            Bloklash
                          </button>
                        ) : (
                          <button onClick={() => { setSelected(op); setModal('unblock'); setMenuOpen(null); }} className="w-full text-left px-4 py-2 text-sm hover:bg-green-50 text-green-600 cursor-pointer">
                            Blokdan chiqarish
                          </button>
                        )}
                        <div className="border-t mx-2 my-1" />
                        <button onClick={() => { setSelected(op); setModal('delete'); setMenuOpen(null); }} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer">
                          O&apos;chirish
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Conversion */}
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-gray-400 w-20 shrink-0">Konversiya</span>
                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${conv >= 60 ? 'bg-emerald-500' : conv >= 30 ? 'bg-amber-400' : 'bg-rose-400'}`}
                    style={{ width: `${conv}%` }}
                  />
                </div>
                <span className="text-xs font-semibold text-gray-700 w-8 text-right">{conv}%</span>
              </div>

              {/* Salary + date */}
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs text-gray-400">
                  Maosh: <span className="font-medium text-gray-700">{Number(op.salarySetting?.percentage ?? 10)}%</span>
                  {Number(op.salarySetting?.fixedAmount ?? 0) > 0 && (
                    <span className="text-gray-400"> + {fmtAmount(Number(op.salarySetting?.fixedAmount))}</span>
                  )}
                </p>
                <p className="text-xs text-gray-400">{fmtDate(op.createdAt)}</p>
              </div>

              <div className="border-t border-gray-50 mb-4" />

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="text-center p-2 bg-gray-50 rounded-xl">
                  <p className="text-lg font-bold text-gray-900 leading-none">{totalLeads}</p>
                  <p className="text-[10px] text-gray-400 mt-1 font-medium">Leadlar</p>
                </div>
                <div className="text-center p-2 bg-gray-50 rounded-xl">
                  <p className="text-lg font-bold text-gray-900 leading-none">{enrolled}</p>
                  <p className="text-[10px] text-gray-400 mt-1 font-medium">Yozildi</p>
                </div>
                <div className="text-center p-2 bg-gray-50 rounded-xl">
                  <p className="text-lg font-bold text-gray-900 leading-none">{conv}%</p>
                  <p className="text-[10px] text-gray-400 mt-1 font-medium">Konv.</p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-1.5">
                {/* Tahrirlash */}
                <ActionBtn label="Tahrirlash" icon={<Pencil size={14} />} cls="bg-amber-500 hover:bg-amber-600" onClick={() => openEdit(op)} />
                {/* Maosh */}
                <ActionBtn label="Maosh" icon={<DollarSign size={14} />} cls="bg-indigo-500 hover:bg-indigo-600"
                  onClick={() => { setSelected(op); setPercentage(String(op.salarySetting?.percentage ?? 10)); setFixedAmount(String(op.salarySetting?.fixedAmount ?? 0)); setModal('salary'); }} />
                {/* Bloklash / Faollashtirish */}
                {op.isActive ? (
                  <ActionBtn label="Bloklash" icon={<Ban size={14} />} cls="bg-rose-500 hover:bg-rose-600"
                    onClick={() => { setSelected(op); setModal('block'); }} />
                ) : (
                  <ActionBtn label="Faollashtirish" icon={<CheckCircle2 size={14} />} cls="bg-emerald-500 hover:bg-emerald-600"
                    onClick={() => { setSelected(op); setModal('unblock'); }} />
                )}
                {/* O'chirish */}
                <ActionBtn label="O'chirish" icon={<Trash2 size={14} />} cls="bg-red-600 hover:bg-red-700"
                  onClick={() => { setSelected(op); setModal('delete'); }} />
              </div>
            </div>
          );
        })}
        {paginated.length === 0 && (
          <div className="col-span-3 text-center py-16 text-gray-400">
            <Users size={36} className="mx-auto mb-3 text-gray-300" />
            <p className="font-medium">Hali operatorlar yo&apos;q</p>
          </div>
        )}
      </div>

      {/* Create modal */}
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

      {/* Edit modal */}
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

      {/* Block modal */}
      <Modal open={modal === 'block'} onClose={() => setModal(null)} title="Operatorni bloklash" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            <span className="font-semibold text-gray-900">{selected?.name}</span> operatorini bloklashni xohlaysizmi?
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
            <p className="text-sm text-amber-800">
              ⚠️ Bloklangan operator tizimga kira olmaydi. Istalgan vaqt blokdan chiqarish mumkin.
            </p>
          </div>
          <div className="flex gap-3 pt-1">
            <Button
              onClick={() => void blockOp()}
              loading={loading}
              className="flex-1 bg-amber-500 hover:bg-amber-600"
            >
              <Ban size={15} className="mr-1.5" /> Bloklash
            </Button>
            <Button variant="secondary" onClick={() => setModal(null)} className="flex-1">Bekor</Button>
          </div>
        </div>
      </Modal>

      {/* Unblock modal */}
      <Modal open={modal === 'unblock'} onClose={() => setModal(null)} title="Operatorni faollashtirish" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            <span className="font-semibold text-gray-900">{selected?.name}</span> operatorini blokdan chiqarishni xohlaysizmi?
          </p>
          <div className="bg-green-50 border border-green-200 rounded-xl p-3">
            <p className="text-sm text-green-800">
              ✓ Operator yana tizimga kira oladi va ishlashni davom ettiradi.
            </p>
          </div>
          <div className="flex gap-3 pt-1">
            <Button
              onClick={() => void unblockOp()}
              loading={loading}
              className="flex-1 bg-emerald-500 hover:bg-emerald-600"
            >
              <CheckCircle2 size={15} className="mr-1.5" /> Faollashtirish
            </Button>
            <Button variant="secondary" onClick={() => setModal(null)} className="flex-1">Bekor</Button>
          </div>
        </div>
      </Modal>

      {/* Delete modal */}
      <Modal open={modal === 'delete'} onClose={() => setModal(null)} title="Operatorni o'chirish" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            <span className="font-semibold text-gray-900">{selected?.name}</span> operatorini o&apos;chirishni xohlaysizmi?
          </p>
          <div className="bg-red-50 border border-red-200 rounded-xl p-3">
            <p className="text-sm text-red-800">
              ⚠️ Bu amal qaytarilmaydi. Operator tizimdan butunlay o&apos;chiriladi.
              Faqat bloklash kerak bo&apos;lsa — o&apos;chirish o&apos;rniga &ldquo;Bloklash&rdquo; tugmasini ishlating.
            </p>
          </div>
          <div className="flex gap-3 pt-1">
            <Button variant="danger" onClick={() => void deleteOp()} loading={loading} className="flex-1">
              <Trash2 size={15} className="mr-1.5" /> O&apos;chirish
            </Button>
            <Button variant="secondary" onClick={() => setModal(null)} className="flex-1">Bekor</Button>
          </div>
        </div>
      </Modal>

      {/* Salary modal */}
      <Modal open={modal === 'salary'} onClose={() => setModal(null)} title={`Maosh sozlamalari — ${selected?.name}`}>
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sotuvdan foiz (1–50%)</label>
            <Input type="number" min="1" max="50" value={percentage} onChange={e => setPercentage(e.target.value)} placeholder="10" />
            <p className="text-xs text-gray-500 mt-1.5">Operator qabul qilgan to&apos;lovlardan oladigan foiz</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Oylik maosh (so&apos;m)</label>
            <Input type="number" min="0" value={fixedAmount} onChange={e => setFixedAmount(e.target.value)} placeholder="0" />
            <p className="text-xs text-gray-500 mt-1.5">Har oyda qat&apos;iy to&apos;lanadigan summa (sotuvdan qat&apos;iy nazar)</p>
          </div>
          <div className="flex gap-3 pt-2">
            <Button onClick={() => void updateSalary()} loading={loading} className="flex-1">Saqlash</Button>
            <Button variant="secondary" onClick={() => setModal(null)} className="flex-1">Bekor</Button>
          </div>
        </div>
      </Modal>

      {menuOpen && <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(null)} />}
    </div>
  );
}

function ActionBtn({ label, icon, cls, onClick }: { label: string; icon: React.ReactNode; cls: string; onClick: () => void }) {
  return (
    <div className="relative group/tip flex-1">
      <button
        onClick={onClick}
        className={`w-full h-9 flex items-center justify-center rounded-xl text-white transition-colors shadow-sm cursor-pointer ${cls}`}
      >
        {icon}
      </button>
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-[11px] rounded-lg whitespace-nowrap opacity-0 group-hover/tip:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg">
        {label}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
      </div>
    </div>
  );
}
