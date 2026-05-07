'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { CheckCircle2, FlaskConical, XCircle, AlertCircle } from 'lucide-react';

export default function SubscriptionsPage() {
  const [subs, setSubs] = useState<any[]>([]);
  const [filter, setFilter] = useState('all');

  async function load() {
    const { data } = await api.get('/subscriptions');
    setSubs(data);
  }
  useEffect(() => { void load(); }, []);

  async function extend(id: string) {
    const days = prompt('Necha kun uzaytirish?');
    if (!days) return;
    await api.put(`/subscriptions/${id}/extend`, { days: parseInt(days) });
    await load();
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
      <div className="flex gap-2">
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
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left text-gray-400 text-xs font-medium">
              <th className="px-5 py-3">MARKAZ</th>
              <th className="px-5 py-3">TARIF</th>
              <th className="px-5 py-3">STATUS</th>
              <th className="px-5 py-3">BOSHLANISH</th>
              <th className="px-5 py-3">TUGASH</th>
              <th className="px-5 py-3">QOLGAN KUN</th>
              <th className="px-5 py-3">AMAL</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map(s => {
              const daysLeft = Math.ceil((new Date(s.endDate).getTime() - Date.now()) / 86400000);
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
                    <Button size="sm" variant="secondary" onClick={() => void extend(s.id)}>Uzaytirish</Button>
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
