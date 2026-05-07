'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import { SlidersHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';

const COLUMNS = [
  { key: 'NEW', label: 'Yangi', dot: 'bg-blue-500' },
  { key: 'IN_PROGRESS', label: "Bog'lanildi", dot: 'bg-blue-500' },
  { key: 'ENROLLED', label: 'Qiziqyapti', dot: 'bg-violet-500' },
  { key: 'NOT_COME', label: 'Kelmadi', dot: 'bg-gray-400' },
  { key: 'REJECTED', label: 'Rad etdi', dot: 'bg-red-500' },
];

const SOURCE_COLORS: Record<string, string> = {
  Instagram: 'bg-pink-50 text-pink-700',
  Telegram: 'bg-blue-50 text-blue-700',
  Tavsiya: 'bg-green-50 text-green-700',
  Sayt: 'bg-violet-50 text-violet-700',
};

const SOURCE_OPTIONS = ['Instagram', 'Telegram', 'Tavsiya', 'Sayt', 'Boshqa'];

export default function AdminLeadsPage() {
  const router = useRouter();
  const [leads, setLeads] = useState<any[]>([]);
  const [createModal, setCreateModal] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', interest: '', source: '', notes: '', operatorId: '' });
  const [operators, setOperators] = useState<any[]>([]);
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

  async function loadOperators() {
    try {
      const { data } = await api.get('/users?role=OPERATOR');
      setOperators(data);
    } catch (err) {
      console.error('Operatorlarni yuklashda xato:', err);
    }
  }

  useEffect(() => { void load(); }, [page]);
  useEffect(() => { void loadOperators(); }, []);

  async function createLead() {
    if (!form.name || !form.phone) return;
    setLoading(true);
    try {
      await api.post('/leads', form);
      setCreateModal(false);
      setForm({ name: '', phone: '', interest: '', source: '', notes: '', operatorId: '' });
      void load();
    } catch (err) {
      console.error('Lead yaratishda xato:', err);
      alert('Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leadlar</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Bosqichlarni o&apos;zgartirish uchun kartalarni sudrab tashlang. Jami: {total} ta
          </p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">
            <SlidersHorizontal size={14} /> Filter
          </button>
          <Button onClick={() => setCreateModal(true)}>+ Yangi lead</Button>
        </div>
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

      {/* Kanban */}
      <div className="flex gap-3 mt-5 overflow-x-auto pb-4">
        {COLUMNS.map(col => {
          const count = statusCounts[col.key] || 0;
          return (
            <button
              key={col.key}
              onClick={() => router.push(`/admin/leads/status/${col.key}`)}
              className="flex-1 min-w-[210px] rounded-xl border bg-white hover:shadow-md transition-all cursor-pointer"
            >
              {/* Column header */}
              <div className="px-3 py-2.5 flex items-center gap-2 border-b border-gray-100">
                <span className={`w-2 h-2 rounded-full shrink-0 ${col.dot}`} />
                <span className="text-sm font-semibold text-gray-700">{col.label}</span>
                <span className="ml-auto text-gray-400">→</span>
              </div>

              {/* Count display */}
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
      <Modal open={createModal} onClose={() => setCreateModal(false)} title="Yangi lead">
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
            label="Qiziqish yo'nalishi"
            value={form.interest}
            onChange={e => setForm(p => ({ ...p, interest: e.target.value }))}          />
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
          {operators.length > 0 && (
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Operator (ixtiyoriy)</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                value={form.operatorId}
                onChange={e => setForm(p => ({ ...p, operatorId: e.target.value }))}
              >
                <option value="">— O'zim —</option>
                {operators.map(op => <option key={op.id} value={op.id}>{op.name}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">Izoh</label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
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
