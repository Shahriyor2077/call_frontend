'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import { useToast } from '@/components/ui/ToastProvider';
import { CheckCircle2, FlaskConical, XCircle, AlertCircle } from 'lucide-react';

export default function SubscriptionsPage() {
  const toast = useToast();
  const [subs, setSubs] = useState<any[]>([]);
  const [filter, setFilter] = useState('all');
  const [extendModal, setExtendModal] = useState(false);
  const [cancelModal, setCancelModal] = useState(false);
  const [selectedSub, setSelectedSub] = useState<any>(null);
  const [extendDays, setExtendDays] = useState('');
  const [loading, setLoading] = useState(false);

  async function load() {
    try {
      const { data } = await api.get('/subscriptions');
      setSubs(data);
    } catch {
      toast.error('Ma\'lumotlarni yuklashda xatolik');
    }
  }
  useEffect(() => { void load(); }, []);

  function openExtend(sub: any) {
    setSelectedSub(sub);
    setExtendDays('');
    setExtendModal(true);
  }

  function openCancel(sub: any) {
    setSelectedSub(sub);
    setCancelModal(true);
  }

  async function extend() {
    if (!extendDays || isNaN(Number(extendDays)) || Number(extendDays) <= 0) {
      toast.warning('Kun sonini to\'g\'ri kiriting');
      return;
    }
    setLoading(true);
    try {
      await api.put(`/subscriptions/${selectedSub.id}/extend`, { days: parseInt(extendDays) });
      toast.success('Obuna uzaytirildi');
      setExtendModal(false);
      await load();
    } catch {
      toast.error('Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  }

  async function cancelSub() {
    setLoading(true);
    try {
      await api.put(`/subscriptions/${selectedSub.id}/cancel`);
      toast.success('Obuna bekor qilindi');
      setCancelModal(false);
      await load();
    } catch {
      toast.error('Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  }

  const activeCount = subs.filter(s => s.status === 'ACTIVE').length;
  const demoCount = subs.filter(s => s.status === 'DEMO').length;
  const expiredCount = subs.filter(s => s.status === 'EXPIRED').length;
  const urgentCount = subs.filter(s => {
    const days = Math.ceil((new Date(s.endDate).getTime() - Date.now()) / 86400000);
    return days <= 7 && days >= 0 && (s.status === 'ACTIVE' || s.status === 'DEMO');
  }).length;

  const filtered = filter === 'all'
    ? subs
    : filter === 'expiring'
      ? subs.filter(s => {
        const days = Math.ceil((new Date(s.endDate).getTime() - Date.now()) / 86400000);
        return days <= 7 && days >= 0 && (s.status === 'ACTIVE' || s.status === 'DEMO');
      })
      : subs.filter(s => s.status === filter.toUpperCase());

  const FILTERS = [
    { key: 'all', label: 'Barchasi', count: subs.length },
    { key: 'active', label: 'Faol', count: activeCount },
    { key: 'demo', label: 'Demo', count: demoCount },
    { key: 'expiring', label: 'Yaqinda tugaydi', count: urgentCount },
    { key: 'expired', label: 'Tugagan', count: expiredCount },
  ];

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-gray-900">Obuna nazorat</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SubStatCard icon={<CheckCircle2 size={18} className="text-emerald-600" />} bg="bg-emerald-50" label="Faol" value={activeCount} />
        <SubStatCard icon={<FlaskConical size={18} className="text-violet-600" />} bg="bg-violet-50" label="Sinov (Demo)" value={demoCount} />
        <SubStatCard icon={<XCircle size={18} className="text-rose-600" />} bg="bg-rose-50" label="To'xtatilgan" value={expiredCount} />
        <SubStatCard icon={<AlertCircle size={18} className="text-amber-600" />} bg="bg-amber-50" label="Yangilanish kerak" value={urgentCount} />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${filter === f.key
                ? 'bg-indigo-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
          >
            {f.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${filter === f.key ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
              {f.count}
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-gray-400 text-xs font-medium">
                <th className="px-5 py-3">MARKAZ</th>
                <th className="px-5 py-3">TARIF</th>
                <th className="px-5 py-3">STATUS</th>
                <th className="px-5 py-3">BOSHLANISH</th>
                <th className="px-5 py-3">TUGASH</th>
                <th className="px-5 py-3">QOLGAN KUN</th>
                <th className="px-5 py-3">AMALLAR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(s => {
                const daysLeft = Math.ceil((new Date(s.endDate).getTime() - Date.now()) / 86400000);
                const isActive = s.status === 'ACTIVE' || s.status === 'DEMO';
                return (
                  <tr key={s.id} className="hover:bg-gray-50/60">
                    <td className="px-5 py-3 font-medium text-gray-900">{s.center.name}</td>
                    <td className="px-5 py-3 text-gray-500">{s.plan?.name ?? '—'}</td>
                    <td className="px-5 py-3"><Badge value={s.status} /></td>
                    <td className="px-5 py-3 text-gray-500">{new Date(s.startDate).toLocaleDateString('uz-UZ')}</td>
                    <td className="px-5 py-3 text-gray-500">{new Date(s.endDate).toLocaleDateString('uz-UZ')}</td>
                    <td className="px-5 py-3">
                      <span className={`font-semibold text-sm ${daysLeft <= 3 ? 'text-rose-600' : daysLeft <= 7 ? 'text-amber-500' : 'text-gray-700'}`}>
                        {daysLeft > 0 ? `${daysLeft} kun` : 'Tugagan'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="secondary" onClick={() => openExtend(s)}>
                          Uzaytirish
                        </Button>
                        {isActive && (
                          <Button size="sm" variant="danger" onClick={() => openCancel(s)}>
                            Bekor
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="px-5 py-10 text-center text-gray-400">Ma'lumot yo'q</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Extend modal */}
      <Modal open={extendModal} onClose={() => setExtendModal(false)} title={`Obunani uzaytirish — ${selectedSub?.center?.name}`}>
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Hozirgi tugash sanasi: <span className="font-semibold text-gray-800">
              {selectedSub?.endDate ? new Date(selectedSub.endDate).toLocaleDateString('uz-UZ') : '—'}
            </span>
          </p>
          <Input
            label="Necha kun uzaytirish? *"
            type="number"
            value={extendDays}
            onChange={e => setExtendDays(e.target.value)}
            placeholder="30"
          />
          <div className="flex gap-3 pt-2">
            <Button onClick={() => void extend()} loading={loading} className="flex-1">Uzaytirish</Button>
            <Button variant="secondary" onClick={() => setExtendModal(false)} className="flex-1">Bekor</Button>
          </div>
        </div>
      </Modal>

      {/* Cancel modal */}
      <Modal open={cancelModal} onClose={() => setCancelModal(false)} title={`Obunani bekor qilish`}>
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            <span className="font-semibold text-gray-900">{selectedSub?.center?.name}</span> markazining obunasini bekor qilmoqchimisiz?
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-sm text-amber-800">
              ⚠️ Obuna bekor qilingandan so'ng markaz tizimga kira olmaydi.
            </p>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="danger" onClick={() => void cancelSub()} loading={loading} className="flex-1">
              Bekor qilish
            </Button>
            <Button variant="secondary" onClick={() => setCancelModal(false)} className="flex-1">Orqaga</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function SubStatCard({ icon, bg, label, value }: { icon: React.ReactNode; bg: string; label: string; value: number }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center mb-3`}>{icon}</div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-400 mt-1">{label}</p>
    </div>
  );
}
