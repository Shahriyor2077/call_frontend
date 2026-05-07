'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import Avatar from '@/components/ui/Avatar';
import Link from 'next/link';
import { Download, TrendingUp, ChevronLeft, ChevronRight, MoreVertical } from 'lucide-react';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';

const METHOD_LABEL: Record<string, string> = { CASH: 'Naqd', PAYME: 'Payme', CLICK: 'Click', BANK_TRANSFER: 'Bank' };
const METHOD_COLOR: Record<string, string> = {
  CASH: 'bg-green-50 text-green-700',
  PAYME: 'bg-cyan-50 text-cyan-700',
  CLICK: 'bg-orange-50 text-orange-700',
  BANK_TRANSFER: 'bg-purple-50 text-purple-700',
};

function fmtM(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

const MONTHS_UZ = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyn', 'Iyl', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'];

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({
    today: { sum: 0, count: 0 },
    week: { sum: 0, count: 0 },
    month: { sum: 0, count: 0 }
  });
  const [search, setSearch] = useState('');
  const [filterMethod, setFilterMethod] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState<'edit' | 'delete' | 'actions' | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [editForm, setEditForm] = useState({ amount: '', notes: '' });
  const limit = 50;

  async function loadStats() {
    try {
      const { data } = await api.get('/payments/stats');
      setStats(data);
    } catch (err) {
      console.error('Statistika yuklashda xato:', err);
    }
  }

  async function load() {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      if (filterMethod) params.append('method', filterMethod);

      const { data } = await api.get(`/payments?${params}`);
      setPayments(data.data || []);
      setTotalPages(data.meta?.totalPages || 1);
      setTotal(data.meta?.total || 0);
    } catch (err) {
      console.error('To\'lovlarni yuklashda xato:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadStats(); }, []);
  useEffect(() => { void load(); }, [page, filterMethod]);

  async function updatePayment() {
    if (!selectedPayment) return;
    setLoading(true);
    try {
      await api.put(`/payments/${selectedPayment.id}`, {
        amount: Number(editForm.amount),
        notes: editForm.notes,
      });
      setModal(null);
      void load();
      void loadStats();
    } catch (err) {
      console.error('Tahrirlashda xato:', err);
      alert('Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  }

  async function deletePayment() {
    if (!selectedPayment) return;
    setLoading(true);
    try {
      await api.delete(`/payments/${selectedPayment.id}`);
      setModal(null);
      void load();
      void loadStats();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  }

  const now = new Date();

  const filtered = search
    ? payments.filter(p => p.student?.name?.toLowerCase().includes(search.toLowerCase()))
    : payments;

  function fmtDate(d: string) {
    const dt = new Date(d);
    return `${dt.getDate()} ${MONTHS_UZ[dt.getMonth()]} ${dt.getFullYear()}`;
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">To&apos;lovlar</h1>
          <p className="text-sm text-gray-400 mt-0.5">Barcha kassa harakatlari.</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">
            <Download size={14} /> Eksport
          </button>
          <Link href="/admin/payments/new" className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 rounded-xl text-sm font-medium text-white hover:bg-gray-800">
            + To&apos;lov kiritish
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-5 mb-5">
        {[
          { label: 'Bugun', value: fmtM(stats.today.sum), sub: `${stats.today.count} ta to'lov` },
          { label: 'Bu hafta', value: fmtM(stats.week.sum), sub: `${stats.week.count} ta to'lov` },
          { label: `${MONTHS_UZ[now.getMonth()]}`, value: fmtM(stats.month.sum), sub: `${stats.month.count} ta to'lov` },
          { label: 'Qarzdorlik', value: '—', sub: '0 ta talaba' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border p-5">
            <p className="text-sm text-gray-400 mb-2">{s.label}</p>
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp size={11} className="text-green-600" />
              <span className="text-xs text-gray-400">{s.sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            placeholder="Talaba ismi..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm w-52 focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
          />
        </div>
        <select value={filterMethod} onChange={e => setFilterMethod(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 focus:outline-none">
          <option value="">Barcha usullar</option>
          <option value="CASH">Naqd</option>
          <option value="PAYME">Payme</option>
          <option value="CLICK">Click</option>
          <option value="BANK_TRANSFER">Bank</option>
        </select>
        <span className="ml-auto text-sm text-gray-400 bg-gray-100 px-3 py-1.5 rounded-xl">{total} ta</span>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mb-4 bg-white rounded-xl border px-4 py-3">
          <p className="text-sm text-gray-600">
            Sahifa {page} / {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={16} />
              Oldingi
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Keyingi
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="px-5 py-3 text-xs font-semibold text-gray-400 tracking-wide">SANA</th>
              <th className="px-5 py-3 text-xs font-semibold text-gray-400 tracking-wide">TALABA</th>
              <th className="px-5 py-3 text-xs font-semibold text-gray-400 tracking-wide">KURS</th>
              <th className="px-5 py-3 text-xs font-semibold text-gray-400 tracking-wide">USUL</th>
              <th className="px-5 py-3 text-xs font-semibold text-gray-400 tracking-wide">OPERATOR</th>
              <th className="px-5 py-3 text-xs font-semibold text-gray-400 tracking-wide text-right">SUMMA</th>
              <th className="px-5 py-3 text-xs font-semibold text-gray-400 tracking-wide w-12"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map(p => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-5 py-4 text-gray-400 text-xs">{fmtDate(p.paidAt)}</td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <Avatar name={p.student?.name ?? '?'} size="sm" />
                    <span className="font-medium text-gray-900">{p.student?.name}</span>
                  </div>
                </td>
                <td className="px-5 py-4 text-gray-600">{p.student?.enrollments?.[0]?.group?.course?.name ?? '—'}</td>
                <td className="px-5 py-4">
                  <span className={`text-xs px-2.5 py-1 rounded-lg font-medium ${METHOD_COLOR[p.method] ?? 'bg-gray-100 text-gray-600'}`}>
                    {METHOD_LABEL[p.method] ?? p.method}
                  </span>
                </td>
                <td className="px-5 py-4 text-gray-600">{p.operator?.name}</td>
                <td className="px-5 py-4 text-right font-semibold text-green-700">
                  +{Number(p.amount).toLocaleString()} so&apos;m
                </td>
                <td className="px-5 py-4">
                  <button
                    onClick={() => {
                      setSelectedPayment(p);
                      setModal('actions');
                    }}
                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400"
                  >
                    <MoreVertical size={15} />
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="px-5 py-12 text-center text-gray-400">To&apos;lovlar topilmadi</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Actions Modal */}
      <Modal open={modal === 'actions'} onClose={() => setModal(null)} title="To'lov amallar" size="sm">
        <div className="space-y-3">
          <Button
            onClick={() => {
              setEditForm({
                amount: String(selectedPayment?.amount || ''),
                notes: selectedPayment?.notes || '',
              });
              setModal('edit');
            }}
            variant="secondary"
            className="w-full"
          >
            Tahrirlash
          </Button>
          <Button onClick={() => setModal('delete')} variant="danger" className="w-full">
            O'chirish
          </Button>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal open={modal === 'edit'} onClose={() => setModal(null)} title="To'lovni tahrirlash" size="sm">
        <div className="space-y-4">
          <Input
            label="Summa (so'm) *"
            type="number"
            value={editForm.amount}
            onChange={e => setEditForm(p => ({ ...p, amount: e.target.value }))}
          />
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">Izoh</label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              rows={3}
              value={editForm.notes}
              onChange={e => setEditForm(p => ({ ...p, notes: e.target.value }))}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button onClick={() => void updatePayment()} loading={loading} className="flex-1">
              Saqlash
            </Button>
            <Button variant="secondary" onClick={() => setModal(null)} className="flex-1">
              Bekor
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal open={modal === 'delete'} onClose={() => setModal(null)} title="To'lovni o'chirish" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            <span className="font-semibold text-gray-900">{Number(selectedPayment?.amount).toLocaleString()} so'm</span> to'lovni o'chirishni xohlaysizmi?
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-sm text-amber-800">
              ⚠️ Bu amal qaytarilmaydi. To'lov ma'lumotlari butunlay o'chiriladi.
            </p>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="danger" onClick={() => void deletePayment()} loading={loading} className="flex-1">
              O'chirish
            </Button>
            <Button variant="secondary" onClick={() => setModal(null)} className="flex-1">
              Bekor
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
