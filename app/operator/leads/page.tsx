'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import { Phone, Plus, ChevronLeft, ChevronRight } from 'lucide-react';

const COLUMNS = [
  { value: 'NEW', label: 'Yangi', dot: 'bg-blue-500', bg: 'bg-blue-50 border-blue-100' },
  { value: 'IN_PROGRESS', label: 'Muloqotda', dot: 'bg-amber-500', bg: 'bg-amber-50 border-amber-100' },
  { value: 'ENROLLED', label: 'Yozildi', dot: 'bg-green-500', bg: 'bg-green-50 border-green-100' },
  { value: 'NOT_COME', label: 'Kelmadi', dot: 'bg-gray-400', bg: 'bg-gray-50 border-gray-100' },
  { value: 'REJECTED', label: 'Rad etdi', dot: 'bg-red-500', bg: 'bg-red-50 border-red-100' },
];

const SOURCE_OPTIONS = ['Instagram', 'Telegram', 'Tavsiya', 'Sayt', 'Boshqa'];

export default function OperatorLeadsPage() {
  const router = useRouter();
  const [leads, setLeads] = useState<any[]>([]);
  const [createModal, setCreateModal] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', interest: '', source: '', notes: '' });
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const limit = 50;

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get(`/leads?page=${page}&limit=${limit}`);
      setLeads(data.data);
      setTotalPages(data.meta.totalPages);
      setTotal(data.meta.total);
      setStatusCounts(data.meta.statusCounts || {});
    } catch (err) {
      console.error('Leadlarni yuklashda xato:', err);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { void load(); }, [page]);

  async function createLead() {
    if (!form.name || !form.phone) {
      alert('Ism va telefon majburiy!');
      return;
    }
    setLoading(true);
    try {
      await api.post('/leads', form);
      setCreateModal(false);
      setForm({ name: '', phone: '', interest: '', source: '', notes: '' });
      void load();
    } catch (err: any) {
      console.error('Lead yaratishda xato:', err);
      const message = err?.response?.data?.message || err?.message || 'Xatolik yuz berdi';
      alert(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leadlar</h1>
          <p className="text-sm text-gray-400 mt-0.5">CRM voronkasi · Jami: {total} ta</p>
        </div>
        <Button onClick={() => setCreateModal(true)}><Plus size={14} className="mr-1" />Yangi lead</Button>
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

      <div className="flex gap-3 overflow-x-auto pb-4">
        {COLUMNS.map(col => {
          const count = statusCounts[col.value] || 0;
          return (
            <button
              key={col.value}
              onClick={() => router.push(`/operator/leads/status/${col.value}`)}
              className={`flex-1 min-w-[210px] rounded-xl border ${col.bg} hover:shadow-md transition-all cursor-pointer`}
            >
              <div className="px-3 py-2.5 flex items-center gap-2 border-b border-current border-opacity-10">
                <span className={`w-2 h-2 rounded-full shrink-0 ${col.dot}`} />
                <span className="text-sm font-semibold text-gray-700">{col.label}</span>
                <span className="ml-auto text-gray-400">→</span>
              </div>

              <div className="flex flex-col items-center justify-center py-12">
                <div className={`w-16 h-16 rounded-full ${col.dot} bg-opacity-10 flex items-center justify-center mb-2`}>
                  <span className={`text-2xl font-bold ${col.dot.replace('bg-', 'text-')}`}>
                    {count}
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  {count === 0 ? 'Lead yo\'q' : `${count} ta`}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Create modal */}
      <Modal open={createModal} onClose={() => setCreateModal(false)} title="Yangi lead" size="sm">
        <div className="space-y-4">
          <Input
            label="Ism *"
            value={form.name}
            onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
            placeholder="Ism familiya"
          />
          <Input
            label="Telefon *"
            value={form.phone}
            onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
            placeholder="+998901234567"
          />
          <Input
            label="Yo'nalish"
            value={form.interest}
            onChange={e => setForm(p => ({ ...p, interest: e.target.value }))}
            placeholder="Qiziqish..."
          />
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">Manba</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              value={form.source}
              onChange={e => setForm(p => ({ ...p, source: e.target.value }))}
            >
              <option value="">— Tanlang —</option>
              {SOURCE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">Izoh</label>
            <textarea
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
              rows={3}
              value={form.notes}
              onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button onClick={() => void createLead()} loading={loading} className="flex-1">Saqlash</Button>
            <Button variant="secondary" onClick={() => setCreateModal(false)} className="flex-1">Bekor</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
