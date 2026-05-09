'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import Avatar from '@/components/ui/Avatar';
import {
  Download, ChevronLeft, ChevronRight, Filter, X, ChevronDown,
  Eye, MessageSquare, Pencil, RotateCcw, DollarSign,
} from 'lucide-react';
import { useToast } from '@/components/ui/ToastProvider';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';

const METHOD_LABEL: Record<string, string> = {
  CASH: 'Naqd', PAYME: 'Payme', CLICK: 'Click', BANK_TRANSFER: 'Bank',
};
const METHOD_COLOR: Record<string, string> = {
  CASH: 'text-green-600', PAYME: 'text-cyan-600', CLICK: 'text-orange-500', BANK_TRANSFER: 'text-purple-600',
};
const METHOD_CARD_COLOR: Record<string, string> = {
  CASH: 'bg-green-50 border-green-200', PAYME: 'bg-cyan-50 border-cyan-200',
  CLICK: 'bg-orange-50 border-orange-200', BANK_TRANSFER: 'bg-purple-50 border-purple-200',
};
const METHOD_ICON_COLOR: Record<string, string> = {
  CASH: 'from-green-400 to-emerald-500', PAYME: 'from-cyan-400 to-teal-500',
  CLICK: 'from-orange-400 to-amber-500', BANK_TRANSFER: 'from-purple-400 to-violet-500',
};

function fmtDateTime(d: string) {
  const dt = new Date(d);
  return `${dt.getFullYear()}.${String(dt.getMonth() + 1).padStart(2, '0')}.${String(dt.getDate()).padStart(2, '0')} ${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`;
}
function fmtShortDate(d: string | null | undefined) {
  if (!d) return '';
  const dt = new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
}
function toInputDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function fmtAmount(n: number) {
  return n.toLocaleString('ru-RU').replace(/,/g, ' ');
}

const PERIODS = [
  { label: 'Bugun', getValue: () => { const d = new Date(); return { from: toInputDate(d), to: toInputDate(d) }; } },
  { label: 'Bu hafta', getValue: () => { const n = new Date(); const m = new Date(n); m.setDate(n.getDate() - n.getDay() + 1); return { from: toInputDate(m), to: toInputDate(n) }; } },
  { label: 'Bu oy', getValue: () => { const n = new Date(); return { from: toInputDate(new Date(n.getFullYear(), n.getMonth(), 1)), to: toInputDate(n) }; } },
  { label: "O'tgan oy", getValue: () => { const n = new Date(); return { from: toInputDate(new Date(n.getFullYear(), n.getMonth() - 1, 1)), to: toInputDate(new Date(n.getFullYear(), n.getMonth(), 0)) }; } },
  { label: 'Yil boshidan', getValue: () => { const n = new Date(); return { from: toInputDate(new Date(n.getFullYear(), 0, 1)), to: toInputDate(n) }; } },
];

export default function AdminPaymentsPage() {
  const toast = useToast();
  const [payments, setPayments] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [operators, setOperators] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  const [periodOpen, setPeriodOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('');

  const [search, setSearch] = useState('');
  const [filterTeacher, setFilterTeacher] = useState('');
  const [filterGroup, setFilterGroup] = useState('');
  const [filterOperator, setFilterOperator] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterMethod, setFilterMethod] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  /* modals */
  const [viewModal, setViewModal] = useState<{ payment: any; rowNum: number } | null>(null);
  const [editModal, setEditModal] = useState<any>(null);
  const [notesModal, setNotesModal] = useState<any>(null);
  const [refundModal, setRefundModal] = useState<any>(null);
  const [editForm, setEditForm] = useState({ amount: '', notes: '' });
  const [notesText, setNotesText] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const limit = 50;

  async function load() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (filterMethod) params.append('method', filterMethod);
      if (filterType) params.append('type', filterType);
      if (filterTeacher) params.append('teacherId', filterTeacher);
      if (filterGroup) params.append('groupId', filterGroup);
      if (filterOperator) params.append('operatorId', filterOperator);
      if (dateFrom) params.append('from', dateFrom);
      if (dateTo) params.append('to', dateTo);
      const { data } = await api.get(`/payments?${params}`);
      setPayments(data.data || []);
      setTotalPages(data.meta?.totalPages || 1);
      setTotal(data.meta?.total || 0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    Promise.all([api.get('/teachers'), api.get('/groups'), api.get('/users')])
      .then(([t, g, u]) => {
        setTeachers(t.data);
        setGroups(g.data);
        setOperators(u.data.filter((user: any) => user.role === 'OPERATOR' || user.role === 'ADMIN'));
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filterMethod, filterType, filterTeacher, filterGroup, filterOperator, dateFrom, dateTo]);

  function applyPeriod(p: typeof PERIODS[0]) {
    const { from, to } = p.getValue();
    setDateFrom(from); setDateTo(to);
    setSelectedPeriod(p.label); setPeriodOpen(false); setPage(1);
  }
  function clearPeriod() { setDateFrom(''); setDateTo(''); setSelectedPeriod(''); setPage(1); }
  function clearAll() {
    setFilterTeacher(''); setFilterGroup(''); setFilterType('');
    setFilterMethod(''); setFilterOperator(''); setDateFrom(''); setDateTo('');
    setSelectedPeriod(''); setSearch(''); setPage(1);
  }

  /* summary cards */
  const activePayments = payments.filter(p => !p.isRefunded);
  const refundedPayments = payments.filter(p => p.isRefunded);
  const totalSum = activePayments.reduce((s, p) => s + Number(p.amount), 0);
  const totalRefunded = refundedPayments.reduce((s, p) => s + Number(p.amount), 0);

  const methodSums: Record<string, { sum: number; refunded: number }> = {};
  payments.forEach(p => {
    if (!methodSums[p.method]) methodSums[p.method] = { sum: 0, refunded: 0 };
    if (p.isRefunded) methodSums[p.method].refunded += Number(p.amount);
    else methodSums[p.method].sum += Number(p.amount);
  });

  const hasFilters = filterTeacher || filterGroup || filterType || filterMethod || filterOperator || dateFrom || dateTo;

  const filtered = search
    ? payments.filter(p =>
      p.student?.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.student?.phone?.includes(search)
    )
    : payments;

  async function handleRefund() {
    if (!refundModal) return;
    setActionLoading(true);
    try {
      await api.put(`/payments/${refundModal.id}/refund`);
      setRefundModal(null);
      void load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Xatolik yuz berdi');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleEdit() {
    if (!editModal) return;
    setActionLoading(true);
    try {
      await api.put(`/payments/${editModal.id}`, {
        amount: Number(editForm.amount),
        notes: editForm.notes,
      });
      setEditModal(null);
      void load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Xatolik yuz berdi');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleSaveNotes() {
    if (!notesModal) return;
    setActionLoading(true);
    try {
      await api.put(`/payments/${notesModal.id}`, { notes: notesText });
      setNotesModal(null);
      void load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Xatolik yuz berdi');
    } finally {
      setActionLoading(false);
    }
  }

  const dateRangeLabel = dateFrom && dateTo
    ? `${dateFrom.replace(/-/g, '.')} - ${dateTo.replace(/-/g, '.')}`
    : dateFrom ? `${dateFrom.replace(/-/g, '.')} -`
      : dateTo ? `- ${dateTo.replace(/-/g, '.')}`
        : '';

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">To&apos;lovlar</h1>
          <p className="text-sm text-gray-400 mt-0.5">Barcha kassa harakatlari.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(v => !v)}
            className={`flex items-center gap-1.5 px-4 py-2 border rounded-xl text-sm font-medium transition-colors ${showFilters ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
          >
            <Filter size={14} /> {showFilters ? 'Yashirish' : 'Filter'}
          </button>
          <button className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
            <Download size={14} /> Eksport
          </button>
        </div>
      </div>

      {/* Filter bar */}
      {showFilters && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4 space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
              <input placeholder="Ism yoki telefon..." value={search} onChange={e => setSearch(e.target.value)}
                className="pl-8 pr-4 py-2 border border-gray-200 rounded-xl text-sm w-48 focus:outline-none focus:ring-2 focus:ring-indigo-400/30" />
            </div>
            {hasFilters && (
              <button onClick={clearAll} className="flex items-center gap-1 px-3 py-2 text-xs text-red-500 hover:bg-red-50 rounded-xl border border-red-100 font-medium transition-colors">
                <X size={12} /> Tozalash
              </button>
            )}
            <span className="ml-auto text-sm text-gray-400 bg-gray-100 px-3 py-1.5 rounded-xl">{total} ta</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <select value={filterTeacher} onChange={e => { setFilterTeacher(e.target.value); setPage(1); }}
              className="px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 min-w-44">
              <option value="">Barcha o&apos;qituvchilar</option>
              {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>

            <select value={filterGroup} onChange={e => { setFilterGroup(e.target.value); setPage(1); }}
              className="px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 min-w-40">
              <option value="">Barcha guruhlar</option>
              {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>

            <select value={filterType} onChange={e => { setFilterType(e.target.value); setPage(1); }}
              className="px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-400/30">
              <option value="">To&apos;lov turi</option>
              <option value="MONTHLY">Oylik</option>
              <option value="ADVANCE">Avans</option>
            </select>

            <select value={filterOperator} onChange={e => { setFilterOperator(e.target.value); setPage(1); }}
              className="px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 min-w-44">
              <option value="">To&apos;lovni olgan</option>
              {operators.map(op => <option key={op.id} value={op.id}>{op.name}</option>)}
            </select>

            <select value={filterMethod} onChange={e => { setFilterMethod(e.target.value); setPage(1); }}
              className="px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-400/30">
              <option value="">Barcha usullar</option>
              <option value="CASH">Naqd</option>
              <option value="PAYME">Payme</option>
              <option value="CLICK">Click</option>
              <option value="BANK_TRANSFER">Bank</option>
            </select>

            <div className="flex items-center gap-1 border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400 shrink-0"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
              <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setSelectedPeriod(''); setPage(1); }}
                className="text-sm border-none outline-none w-28 bg-transparent" />
              <span className="text-gray-300 mx-0.5">—</span>
              <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setSelectedPeriod(''); setPage(1); }}
                className="text-sm border-none outline-none w-28 bg-transparent" />
              {dateRangeLabel && <span className="text-xs text-gray-400 ml-1">{dateRangeLabel}</span>}
            </div>

            <div className="relative">
              <button onClick={() => setPeriodOpen(v => !v)}
                className={`flex items-center gap-1.5 px-3 py-2 border rounded-xl text-sm transition-colors ${selectedPeriod ? 'border-indigo-200 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                {selectedPeriod || 'Davrni tanlang'}
                {selectedPeriod
                  ? <X size={13} onClick={e => { e.stopPropagation(); clearPeriod(); }} className="hover:text-red-500" />
                  : <ChevronDown size={13} />}
              </button>
              {periodOpen && (
                <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl py-1.5 z-30 min-w-36">
                  {PERIODS.map(p => (
                    <button key={p.label} onClick={() => applyPeriod(p)}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-indigo-50 transition-colors ${selectedPeriod === p.label ? 'text-indigo-700 font-semibold' : 'text-gray-700'}`}>
                      {p.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Info text */}
      <p className="text-xs text-gray-500 mb-3 flex items-center gap-1.5">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-400 shrink-0"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>
        Ko&apos;rsatilayotgan summalar qaytarib berilgan summadan tashqari qolgan summalardir.
      </p>

      {/* Summary cards */}
      <div className="flex gap-3 mb-5 flex-wrap">
        {/* JAMI */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 min-w-52">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Jami</p>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-linear-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white shrink-0">
              <DollarSign size={16} />
            </div>
            <p className="text-xl font-bold text-teal-600">{fmtAmount(totalSum)} <span className="text-sm font-semibold text-gray-400">UZS</span></p>
          </div>
          <p className="text-xs text-gray-400"><span className="font-semibold text-gray-600">{fmtAmount(totalRefunded)} UZS</span> Qaytarib berildi</p>
          {hasFilters && (
            <button onClick={clearAll} className="mt-2 text-xs text-indigo-500 hover:text-indigo-700 font-medium flex items-center gap-1">
              Filterni tozalash <X size={11} />
            </button>
          )}
        </div>

        {/* Per method */}
        {Object.entries(methodSums).map(([method, sums]) => (
          <div
            key={method}
            onClick={() => { setFilterMethod(filterMethod === method ? '' : method); setPage(1); }}
            className={`bg-white rounded-2xl border shadow-sm p-4 min-w-52 cursor-pointer transition-all hover:shadow-md ${filterMethod === method ? METHOD_CARD_COLOR[method] ?? 'border-gray-200' : 'border-gray-100'}`}
          >
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">{METHOD_LABEL[method] ?? method}</p>
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-9 h-9 rounded-xl bg-linear-to-br ${METHOD_ICON_COLOR[method] ?? 'from-gray-400 to-gray-500'} flex items-center justify-center text-white shrink-0`}>
                <DollarSign size={16} />
              </div>
              <p className={`text-xl font-bold ${METHOD_COLOR[method] ?? 'text-gray-800'}`}>
                {fmtAmount(sums.sum)} <span className="text-sm font-semibold text-gray-400">UZS</span>
              </p>
            </div>
            <p className="text-xs text-gray-400"><span className="font-semibold text-gray-600">{fmtAmount(sums.refunded)} UZS</span> Qaytarib berildi</p>
            <p className="mt-1.5 text-[11px] text-indigo-400 font-medium flex items-center gap-1">
              Filtrlash uchun bosing <ChevronDown size={10} />
            </p>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mb-3 bg-white rounded-xl border px-4 py-2.5">
          <p className="text-sm text-gray-500">Sahifa {page} / {totalPages}</p>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40">
              <ChevronLeft size={15} /> Oldingi
            </button>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40">
              Keyingi <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/60 text-left">
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 w-10">#</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-500">To&apos;liq ismi</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-500">Telefon raqami</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-500">Guruh</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-500">To&apos;lov turi</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-500">Summa</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-500">Chegirma</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-500">To&apos;lov sanasi</th>
              <th className="px-4 py-3 w-28"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading && (
              <tr><td colSpan={9} className="px-4 py-12 text-center text-gray-400 text-sm">Yuklanmoqda...</td></tr>
            )}
            {!loading && filtered.map((p, idx) => {
              const enrollment = p.student?.enrollments?.[0];
              const group = enrollment?.group;
              const startD = fmtShortDate(group?.startDate);
              const endD = fmtShortDate(group?.endDate);
              const dateRange = startD && endD ? `${startD}/${endD}` : startD || '';
              const skip = (page - 1) * limit;
              return (
                <tr key={p.id} className={`hover:bg-gray-50/70 transition-colors ${p.isRefunded ? 'opacity-60' : ''}`}>
                  <td className="px-4 py-3.5 text-gray-400 text-xs font-mono">{skip + idx + 1}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={p.student?.name ?? '?'} size="sm" />
                      <span className="font-medium text-gray-900 text-sm">{p.student?.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-gray-500 text-sm">{p.student?.phone}</td>
                  <td className="px-4 py-3.5">
                    {group ? (
                      <div>
                        <p className="text-sm font-medium text-gray-800">{group.name}</p>
                        {dateRange && <p className="text-[11px] text-gray-400 mt-0.5">{dateRange}</p>}
                      </div>
                    ) : <span className="text-gray-300 text-sm">—</span>}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`text-sm font-semibold ${METHOD_COLOR[p.method] ?? 'text-gray-600'}`}>
                      {METHOD_LABEL[p.method] ?? p.method}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`text-sm font-bold ${p.isRefunded ? 'line-through text-gray-400' : 'text-teal-600'}`}>
                      {fmtAmount(Number(p.amount))} UZS
                    </span>
                    {p.isRefunded && <span className="ml-1 text-[10px] text-red-400 font-medium">qaytarilgan</span>}
                  </td>
                  <td className="px-4 py-3.5 text-sm text-gray-400">0 UZS</td>
                  <td className="px-4 py-3.5">
                    <p className="text-sm font-semibold text-gray-800">{fmtDateTime(p.paidAt)}</p>
                    {p.operator?.name && (
                      <p className="text-[11px] text-gray-400 mt-0.5">Qabul qiluvchi: {p.operator.name}</p>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1 justify-end">
                      {/* Ko'rish - har doim ishlaydi */}
                      <button
                        onClick={() => setViewModal({ payment: p, rowNum: skip + idx + 1 })}
                        title="Ko'rish"
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                      >
                        <Eye size={15} />
                      </button>
                      {/* Izoh - har doim ishlaydi */}
                      <button
                        onClick={() => { setNotesModal(p); setNotesText(p.notes || ''); }}
                        title="Izoh"
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                      >
                        <MessageSquare size={15} />
                      </button>
                      {/* Tahrirlash - har doim ishlaydi */}
                      <button
                        onClick={() => { setEditModal(p); setEditForm({ amount: String(p.amount), notes: p.notes || '' }); }}
                        title="Tahrirlash"
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                      >
                        <Pencil size={14} />
                      </button>
                      {/* Qaytarish - faqat qaytarilgan to'lovlar uchun disabled */}
                      <button
                        onClick={() => setRefundModal(p)}
                        title="Qaytarish"
                        disabled={p.isRefunded}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <RotateCcw size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={9} className="px-4 py-14 text-center text-gray-400">To&apos;lovlar topilmadi</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* View Modal */}
      <Modal open={!!viewModal} onClose={() => setViewModal(null)} title="Transaksiya" size="sm">
        {viewModal && (() => {
          const p = viewModal.payment;
          const enrollment = p.student?.enrollments?.[0];
          const group = enrollment?.group;
          const payDate = new Date(p.paidAt);
          const payDateStr = `${String(payDate.getDate()).padStart(2, '0')}.${String(payDate.getMonth() + 1).padStart(2, '0')}.${payDate.getFullYear()}`;

          const rows: [string, string][] = [
            ['ID', String(viewModal.rowNum)],
            ["O'quvchi", p.student?.name ?? '—'],
            ["To'lov turi", p.type === 'MONTHLY' ? 'Oylik to\'lov' : 'Avans'],
            ["To'lov shakli", METHOD_LABEL[p.method] ?? p.method],
            ["To'lovni olgan", p.operator?.name ?? '—', 'blue'],
            ["To'lov miqdori", `${fmtAmount(Number(p.amount))} UZS`],
            ['Izoh', p.notes || '—'],
            ["To'lov sanasi", payDateStr],
          ];

          return (
            <div>
              <div className="space-y-0 mb-6">
                {rows.map(([label, value], idx) => (
                  <div key={label} className={`flex items-start justify-between py-3.5 ${idx !== rows.length - 1 ? 'border-b border-gray-100' : ''}`}>
                    <span className="text-sm font-medium text-gray-900">{label}</span>
                    <span className={`text-sm font-semibold text-right ${label === "To'lovni olgan" ? 'text-blue-600'
                      : label === "To'lov miqdori" ? 'text-gray-900'
                        : label === 'ID' ? 'text-gray-900'
                          : 'text-gray-900'
                      }`}>
                      {value}
                    </span>
                  </div>
                ))}
              </div>
              {p.isRefunded && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 text-sm text-red-600 font-medium">
                  ⚠️ Bu to&apos;lov qaytarilgan
                </div>
              )}
              <div className="flex gap-3">
                <Button variant="secondary" onClick={() => setViewModal(null)} className="flex-1">Yopish</Button>
                <Button onClick={() => window.print()} className="flex-1 flex items-center justify-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6 9 6 2 18 2 18 9" />
                    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                    <rect x="6" y="14" width="12" height="8" />
                  </svg>
                  Print
                </Button>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* Notes Modal */}
      <Modal open={!!notesModal} onClose={() => setNotesModal(null)} title="Izoh" size="sm">
        <div className="space-y-4">
          <textarea
            value={notesText}
            onChange={e => setNotesText(e.target.value)}
            placeholder="Izoh yozing..."
            rows={4}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/30 resize-none"
          />
          <div className="flex gap-3">
            <Button onClick={() => void handleSaveNotes()} loading={actionLoading} className="flex-1">Saqlash</Button>
            <Button variant="secondary" onClick={() => setNotesModal(null)} className="flex-1">Bekor</Button>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal open={!!editModal} onClose={() => setEditModal(null)} title="To'lovni tahrirlash" size="sm">
        <div className="space-y-4">
          <Input label="Summa (UZS) *" type="number" value={editForm.amount}
            onChange={e => setEditForm(p => ({ ...p, amount: e.target.value }))} />
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">Izoh</label>
            <textarea className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/30" rows={2}
              value={editForm.notes} onChange={e => setEditForm(p => ({ ...p, notes: e.target.value }))} />
          </div>
          <div className="flex gap-3 pt-2">
            <Button onClick={() => void handleEdit()} loading={actionLoading} className="flex-1">Saqlash</Button>
            <Button variant="secondary" onClick={() => setEditModal(null)} className="flex-1">Bekor</Button>
          </div>
        </div>
      </Modal>

      {/* Refund Modal */}
      <Modal open={!!refundModal} onClose={() => setRefundModal(null)} title="To'lovni qaytarish" size="sm">
        {refundModal && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              <span className="font-semibold text-gray-900">{fmtAmount(Number(refundModal.amount))} UZS</span> to&apos;lovni qaytarishni tasdiqlaysizmi?
            </p>
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 space-y-1">
              <p className="text-sm text-red-700 font-medium">Talaba: {refundModal.student?.name}</p>
              <p className="text-xs text-red-500">Sana: {fmtDateTime(refundModal.paidAt)}</p>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-sm text-amber-800">⚠️ Bu amal qaytarilmaydi.</p>
            </div>
            <div className="flex gap-3 pt-1">
              <Button variant="danger" onClick={() => void handleRefund()} loading={actionLoading} className="flex-1">
                Ha, qaytarish
              </Button>
              <Button variant="secondary" onClick={() => setRefundModal(null)} className="flex-1">Bekor</Button>
            </div>
          </div>
        )}
      </Modal>

      {periodOpen && <div className="fixed inset-0 z-20" onClick={() => setPeriodOpen(false)} />}
    </div>
  );
}
