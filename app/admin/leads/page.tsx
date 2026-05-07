'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import { useToast } from '@/components/ui/ToastProvider';

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
  const toast = useToast();
  const [leads, setLeads] = useState<any[]>([]);
  const [createModal, setCreateModal] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', interest: '', source: '', notes: '', operatorId: '' });
  const [operators, setOperators] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [dragLeadId, setDragLeadId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);
  const dragCounters = useRef<Record<string, number>>({});
  const [filterSearch, setFilterSearch] = useState('');
  const [filterSource, setFilterSource] = useState('');
  const [filterOperator, setFilterOperator] = useState('');

  const activeFilterCount = [filterSearch, filterSource, filterOperator].filter(Boolean).length;

  const filteredLeads = leads.filter(l => {
    if (filterSearch) {
      const q = filterSearch.toLowerCase();
      if (!l.name?.toLowerCase().includes(q) && !l.phone?.includes(q)) return false;
    }
    if (filterSource && l.source !== filterSource) return false;
    if (filterOperator && l.operator?.id !== filterOperator) return false;
    return true;
  });

  function clearFilters() {
    setFilterSearch('');
    setFilterSource('');
    setFilterOperator('');
  }

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get('/leads?page=1&limit=200');
      setLeads(data.data);
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

  useEffect(() => { void load(); }, []);
  useEffect(() => { void loadOperators(); }, []);

  async function moveLead(leadId: string, newStatus: string) {
    const lead = leads.find(l => l.id === leadId);
    if (!lead || lead.status === newStatus) return;
    const oldStatus = lead.status;
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l));
    setStatusCounts(prev => ({
      ...prev,
      [oldStatus]: Math.max(0, (prev[oldStatus] || 0) - 1),
      [newStatus]: (prev[newStatus] || 0) + 1,
    }));
    try {
      await api.put(`/leads/${leadId}`, { status: newStatus });
    } catch {
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: oldStatus } : l));
      setStatusCounts(prev => ({
        ...prev,
        [oldStatus]: (prev[oldStatus] || 0) + 1,
        [newStatus]: Math.max(0, (prev[newStatus] || 0) - 1),
      }));
      toast.error('Status yangilashda xatolik');
    }
  }

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
      toast.error('Xatolik yuz berdi');
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
        <Button onClick={() => setCreateModal(true)}>+ Yangi lead</Button>
      </div>

      {/* Filter panel */}
      <div className="mt-3 p-4 bg-white border border-gray-200 rounded-xl flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-44">
          <label className="text-xs font-medium text-gray-500 block mb-1">Ism yoki telefon</label>
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input
              value={filterSearch}
              onChange={e => setFilterSearch(e.target.value)}
              placeholder="Qidirish..."
              className="pl-8 pr-3 py-2 w-full border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
            />
          </div>
        </div>
        <div className="min-w-36">
          <label className="text-xs font-medium text-gray-500 block mb-1">Manba</label>
          <select
            value={filterSource}
            onChange={e => setFilterSource(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
          >
            <option value="">Barcha manba</option>
            {SOURCE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        {operators.length > 0 && (
          <div className="min-w-36">
            <label className="text-xs font-medium text-gray-500 block mb-1">Operator</label>
            <select
              value={filterOperator}
              onChange={e => setFilterOperator(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
            >
              <option value="">Barcha operator</option>
              {operators.map(op => <option key={op.id} value={op.id}>{op.name}</option>)}
            </select>
          </div>
        )}
        {activeFilterCount > 0 && (
          <button
            onClick={clearFilters}
            className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 border border-red-200 rounded-lg transition-colors"
          >
            Tozalash
          </button>
        )}
      </div>

      {/* Kanban */}
      <div className="flex gap-3 mt-5 overflow-x-auto pb-4 items-start">
        {COLUMNS.map(col => {
          const colLeads = filteredLeads.filter(l => l.status === col.key);
          const count = activeFilterCount > 0 ? colLeads.length : (statusCounts[col.key] || 0);
          const isOver = dragOverCol === col.key;
          return (
            <div
              key={col.key}
              className={`flex-1 min-w-55 max-w-70 rounded-xl border flex flex-col transition-colors ${isOver ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200 bg-gray-50'}`}
              onDragEnter={e => {
                e.preventDefault();
                dragCounters.current[col.key] = (dragCounters.current[col.key] || 0) + 1;
                setDragOverCol(col.key);
              }}
              onDragLeave={() => {
                dragCounters.current[col.key] = (dragCounters.current[col.key] || 0) - 1;
                if (dragCounters.current[col.key] <= 0) {
                  dragCounters.current[col.key] = 0;
                  setDragOverCol(prev => prev === col.key ? null : prev);
                }
              }}
              onDragOver={e => e.preventDefault()}
              onDrop={e => {
                e.preventDefault();
                dragCounters.current[col.key] = 0;
                const id = e.dataTransfer.getData('text/plain');
                setDragOverCol(null);
                setDragLeadId(null);
                if (id) void moveLead(id, col.key);
              }}
            >
              {/* Column header */}
              <div className="px-3 py-2.5 flex items-center gap-2 bg-white rounded-t-xl border-b">
                <span className={`w-2 h-2 rounded-full shrink-0 ${col.dot}`} />
                <span className="text-sm font-semibold text-gray-700">{col.label}</span>
                <span className="ml-auto text-xs font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{count}</span>
                <button
                  onClick={() => router.push(`/admin/leads/status/${col.key}`)}
                  className="text-gray-300 hover:text-gray-500 text-sm ml-1"
                  title="Barchasini ko'rish"
                >→</button>
              </div>

              {/* Lead cards */}
              <div className="p-2 space-y-2 overflow-y-auto max-h-[calc(100vh-260px)]">
                {isOver && dragLeadId && !colLeads.find(l => l.id === dragLeadId) && (
                  <div className="h-1.5 rounded-full bg-indigo-400 opacity-60 mx-1" />
                )}
                {colLeads.length === 0 && !isOver ? (
                  <div className="text-center py-10 text-gray-400 text-xs">Lead yo&apos;q</div>
                ) : colLeads.map(lead => (
                  <div
                    key={lead.id}
                    draggable
                    onDragStart={e => {
                      setDragLeadId(lead.id);
                      e.dataTransfer.effectAllowed = 'move';
                      e.dataTransfer.setData('text/plain', lead.id);
                    }}
                    onDragEnd={() => { setDragLeadId(null); setDragOverCol(null); }}
                    onClick={() => router.push(`/admin/leads/${lead.id}`)}
                    className={`bg-white rounded-lg border p-3 cursor-grab active:cursor-grabbing hover:border-indigo-300 hover:shadow-sm transition-all select-none ${dragLeadId === lead.id ? 'opacity-40 border-indigo-300' : 'border-gray-100'}`}
                  >
                    <p className="font-semibold text-gray-900 text-sm leading-tight">{lead.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{lead.phone}</p>
                    {lead.interest && (
                      <p className="text-xs text-gray-500 mt-1.5 truncate">{lead.interest}</p>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      {lead.source ? (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${SOURCE_COLORS[lead.source] || 'bg-gray-100 text-gray-600'}`}>
                          {lead.source}
                        </span>
                      ) : <span />}
                      {lead.operator && (
                        <span className="text-xs text-gray-400">{lead.operator.name}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
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
