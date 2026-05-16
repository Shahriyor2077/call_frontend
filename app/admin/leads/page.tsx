'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { useToast } from '@/components/ui/ToastProvider';
import { Search, SlidersHorizontal, X } from 'lucide-react';

const COLUMNS = [
  { key: 'NEW',         label: 'Yangi',      dot: 'bg-blue-500',   statBg: 'bg-blue-500',   statActive: 'bg-blue-50 border-blue-200' },
  { key: 'IN_PROGRESS', label: "Bog'lanildi", dot: 'bg-amber-500',  statBg: 'bg-amber-500',  statActive: 'bg-amber-50 border-amber-200' },
  { key: 'ENROLLED',    label: 'Qiziqyapti', dot: 'bg-violet-500', statBg: 'bg-violet-500', statActive: 'bg-violet-50 border-violet-200' },
  { key: 'NOT_COME',    label: 'Kelmadi',    dot: 'bg-gray-400',   statBg: 'bg-gray-400',   statActive: 'bg-gray-50 border-gray-300' },
  { key: 'REJECTED',    label: 'Rad etdi',   dot: 'bg-red-500',    statBg: 'bg-red-500',    statActive: 'bg-red-50 border-red-200' },
];

const SOURCE_COLORS: Record<string, string> = {
  Instagram: 'bg-pink-50 text-pink-700',
  Telegram:  'bg-blue-50 text-blue-700',
  Tavsiya:   'bg-green-50 text-green-700',
  Sayt:      'bg-violet-50 text-violet-700',
};

const SOURCE_OPTIONS = ['Instagram', 'Telegram', 'Tavsiya', 'Sayt', 'Boshqa'];

function timeAgo(d: string) {
  const days = Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
  if (days === 0) return 'Bugun';
  if (days === 1) return 'Kecha';
  if (days < 30) return `${days} kun`;
  return `${Math.floor(days / 30)} oy`;
}

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
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setFilterOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get('/leads?page=1&limit=200');
      setLeads(data.data);
      setTotal(data.meta.total);
      setStatusCounts(data.meta.statusCounts || {});
    } catch {
      toast.error('Leadlar yuklanmadi');
    } finally {
      setLoading(false);
    }
  }

  async function loadOperators() {
    try {
      const { data } = await api.get('/users?role=OPERATOR');
      setOperators(data);
    } catch {
      toast.error('Operatorlar yuklanmadi');
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

  function normalizePhone(raw: string): string {
    const digits = raw.replace(/\D/g, '');
    if (digits.startsWith('998') && digits.length === 12) return `+${digits}`;
    if (digits.length === 9) return `+998${digits}`;
    if (digits.startsWith('0') && digits.length === 10) return `+998${digits.slice(1)}`;
    return raw.trim();
  }

  async function createLead() {
    if (!form.name || !form.phone) return;
    const phone = normalizePhone(form.phone);
    if (!/^\+998[0-9]{9}$/.test(phone)) {
      toast.error("Telefon formati noto'g'ri. Namuna: +998901234567");
      return;
    }
    setLoading(true);
    try {
      await api.post('/leads', { ...form, phone });
      toast.success("Lead muvaffaqiyatli qo'shildi");
      setCreateModal(false);
      setForm({ name: '', phone: '', interest: '', source: '', notes: '', operatorId: '' });
      void load();
    } catch {
      toast.error('Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-wide">LEADLAR</h1>
          <p className="text-sm text-gray-400 mt-0.5">Jami {total} ta lead · kartalarni sudrab status o&apos;zgartiring</p>
        </div>
        <Button onClick={() => setCreateModal(true)}>+ Yangi lead</Button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-5">
        {COLUMNS.map(col => {
          const count = statusCounts[col.key] || 0;
          return (
            <button
              key={col.key}
              onClick={() => router.push(`/admin/leads/status/${col.key}`)}
              className={`p-4 rounded-2xl border flex items-center justify-between transition-all shadow-sm hover:shadow-md cursor-pointer bg-white border-gray-100`}
            >
              <div className="text-left">
                <p className="text-2xl font-bold text-gray-900 leading-none mb-1.5">{count}</p>
                <p className="text-xs font-semibold text-gray-400 leading-tight">{col.label}</p>
              </div>
              <div className={`w-9 h-9 rounded-xl ${col.statBg} flex items-center justify-center shrink-0`}>
                <span className={`w-3 h-3 rounded-full bg-white/80`} />
              </div>
            </button>
          );
        })}
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3 mb-4 flex items-center gap-3 flex-wrap">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            placeholder="Ism yoki telefon..."
            value={filterSearch}
            onChange={e => setFilterSearch(e.target.value)}
            className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm w-52 focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
          />
        </div>

        <div className="relative" ref={filterRef}>
          <button
            onClick={() => setFilterOpen(v => !v)}
            className={`flex items-center gap-2 px-4 py-2 border rounded-xl text-sm transition-colors cursor-pointer ${filterOpen || filterSource || filterOperator ? 'border-indigo-400 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
          >
            <SlidersHorizontal size={14} />
            Filter
            {(filterSource || filterOperator) && (
              <span className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[10px] flex items-center justify-center font-bold">
                {[filterSource, filterOperator].filter(Boolean).length}
              </span>
            )}
          </button>

          {filterOpen && (
            <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-2xl shadow-2xl z-40 w-72 p-4 space-y-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Filterlar</p>
              <Select
                label="Manba"
                value={filterSource}
                onChange={e => setFilterSource(e.target.value)}
              >
                <option value="">Barcha manba</option>
                {SOURCE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </Select>
              {operators.length > 0 && (
                <Select
                  label="Operator"
                  value={filterOperator}
                  onChange={e => setFilterOperator(e.target.value)}
                >
                  <option value="">Barcha operator</option>
                  {operators.map(op => <option key={op.id} value={op.id}>{op.name}</option>)}
                </Select>
              )}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => { setFilterSource(''); setFilterOperator(''); setFilterOpen(false); }}
                  className="flex-1 flex items-center justify-center gap-2 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Tozalash
                </button>
                <button
                  onClick={() => setFilterOpen(false)}
                  className="flex-1 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors cursor-pointer"
                >
                  Qo&apos;llash
                </button>
              </div>
            </div>
          )}
        </div>

        {activeFilterCount > 0 && (
          <button
            onClick={() => { setFilterSearch(''); setFilterSource(''); setFilterOperator(''); }}
            className="flex items-center gap-1 px-3 py-2 text-xs text-red-500 hover:bg-red-50 rounded-xl border border-red-100 font-medium transition-colors cursor-pointer"
          >
            <X size={12} /> Tozalash
          </button>
        )}

        <span className="ml-auto text-sm text-gray-400 bg-gray-100 px-3 py-1.5 rounded-xl font-medium">
          {activeFilterCount > 0 ? filteredLeads.length : total} ta
        </span>
      </div>

      {/* Active filter chips */}
      {(filterSource || filterOperator) && (
        <div className="flex items-center gap-2 px-1 mb-3">
          {filterSource && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 border border-indigo-200 rounded-full text-xs font-medium text-indigo-700">
              {filterSource}
              <button onClick={() => setFilterSource('')}><X size={11} /></button>
            </span>
          )}
          {filterOperator && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 border border-indigo-200 rounded-full text-xs font-medium text-indigo-700">
              {operators.find(op => op.id === filterOperator)?.name}
              <button onClick={() => setFilterOperator('')}><X size={11} /></button>
            </span>
          )}
        </div>
      )}

      {/* Kanban board */}
      <div className="flex gap-3 overflow-x-auto pb-4 items-start">
        {COLUMNS.map(col => {
          const colLeads = filteredLeads.filter(l => l.status === col.key);
          const count = activeFilterCount > 0 ? colLeads.length : (statusCounts[col.key] || 0);
          const isOver = dragOverCol === col.key;
          return (
            <div
              key={col.key}
              className={`flex-1 min-w-55 max-w-72 rounded-2xl border flex flex-col transition-all ${isOver ? 'border-indigo-400 bg-indigo-50/60 shadow-md' : 'border-gray-100 bg-gray-50/80 shadow-sm'}`}
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
              <div className="px-3.5 py-3 flex items-center gap-2 bg-white rounded-t-2xl border-b border-gray-100">
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${col.dot}`} />
                <span className="text-sm font-semibold text-gray-700">{col.label}</span>
                <span className="ml-auto text-xs font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{count}</span>
                <button
                  onClick={() => router.push(`/admin/leads/status/${col.key}`)}
                  className="text-gray-300 hover:text-indigo-500 text-base ml-1 cursor-pointer transition-colors"
                  title="Barchasini ko'rish"
                >→</button>
              </div>

              {/* Cards */}
              <div className="p-2 space-y-2 overflow-y-auto max-h-[calc(100vh-290px)]">
                {isOver && dragLeadId && !colLeads.find(l => l.id === dragLeadId) && (
                  <div className="h-1.5 rounded-full bg-indigo-400 opacity-60 mx-1" />
                )}
                {colLeads.length === 0 && !isOver ? (
                  <div className="text-center py-10 text-gray-300 text-xs">Lead yo&apos;q</div>
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
                    className={`bg-white rounded-xl border p-3 cursor-grab active:cursor-grabbing hover:border-indigo-300 hover:shadow-md transition-all select-none ${dragLeadId === lead.id ? 'opacity-40 border-indigo-300' : 'border-gray-100 shadow-sm'}`}
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
                    {lead.createdAt && (
                      <p className="text-[10px] text-gray-300 mt-1.5">{timeAgo(lead.createdAt)}</p>
                    )}
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
          <Input label="Ism *" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Ism familiya" />
          <Input label="Telefon *" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="+998901234567" />
          <Input label="Qiziqish yo'nalishi" value={form.interest} onChange={e => setForm(p => ({ ...p, interest: e.target.value }))} />
          <Select
            label="Manba"
            value={form.source}
            onChange={e => setForm(p => ({ ...p, source: e.target.value }))}
          >
            <option value="">— Tanlang —</option>
            {SOURCE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </Select>
          {operators.length > 0 && (
            <Select
              label="Operator (ixtiyoriy)"
              value={form.operatorId}
              onChange={e => setForm(p => ({ ...p, operatorId: e.target.value }))}
            >
              <option value="">— O&apos;zim —</option>
              {operators.map(op => <option key={op.id} value={op.id}>{op.name}</option>)}
            </Select>
          )}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">Izoh</label>
            <textarea className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
              rows={3} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
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
