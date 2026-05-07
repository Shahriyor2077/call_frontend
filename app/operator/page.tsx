'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { Phone, TrendingUp, GraduationCap, Target } from 'lucide-react';

const MONTHS_UZ = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];

function fmtM(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

function FunnelChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="space-y-3">
      {data.map((d, i) => {
        const pct = Math.max(15, (d.value / max) * 100);
        return (
          <div key={i} className="flex items-center gap-4">
            <span className="w-24 text-right text-xs text-gray-500 shrink-0">{d.label}</span>
            <div className="flex-1 flex items-center gap-3">
              <div
                className="h-8 rounded-lg flex items-center px-3 text-xs font-semibold text-white transition-all"
                style={{ width: `${pct}%`, backgroundColor: d.color }}
              >
                {d.value}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function OperatorDashboard() {
  const { user } = useAuthStore();
  const [leads, setLeads] = useState<any[]>([]);
  const [salary, setSalary] = useState<any>(null);
  const [checked, setChecked] = useState<Set<string>>(new Set());

  const now = new Date();
  const monthName = MONTHS_UZ[now.getMonth()];

  useEffect(() => {
    async function load() {
      const [leadsRes, salaryRes] = await Promise.all([
        api.get('/leads').catch(() => ({ data: { data: [] } })),
        api.get('/salary/me').catch(() => ({ data: null })),
      ]);
      const leadsData = Array.isArray(leadsRes.data) ? leadsRes.data : (leadsRes.data?.data || []);
      setLeads(leadsData);
      setSalary(salaryRes.data);
    }
    void load();
  }, []);

  const enrolled = leads.filter(l => l.status === 'ENROLLED').length;
  const conv = leads.length ? Math.round((enrolled / leads.length) * 100) : 0;
  const totalPayments = salary ? Number(salary.totalPayments) : 0;
  const salaryAmount = salary ? Number(salary.salary) : 0;
  const pct = salary ? Number(salary.percentage ?? 10) : 10;
  const fixed = salary ? Number(salary.fixedAmount ?? 0) : 0;

  const tasks = leads.filter(l => l.status === 'NEW' || l.status === 'IN_PROGRESS').slice(0, 5);

  const funnelData = [
    { label: 'Yangi', value: leads.filter(l => l.status === 'NEW').length, color: '#3b82f6' },
    { label: 'Muloqotda', value: leads.filter(l => l.status === 'IN_PROGRESS').length, color: '#f59e0b' },
    { label: 'Yozildi', value: leads.filter(l => l.status === 'ENROLLED').length, color: '#10b981' },
    { label: 'Rad etdi', value: leads.filter(l => l.status === 'REJECTED').length, color: '#ef4444' },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Salom, {(user as any)?.name?.split(' ')[0] ?? 'Operator'}! 👋
        </h1>
        <p className="text-sm text-gray-400 mt-0.5">{now.getFullYear()} yil · {monthName} oyi</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="bg-white rounded-xl border p-5">
          <div className="flex items-center gap-2 text-gray-400 text-sm mb-3">
            <Target size={16} />
            <span>Mening leadlarim</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{leads.length}</p>
          <p className="text-xs text-gray-400 mt-1">{enrolled} ta yozildi</p>
        </div>
        <div className="bg-white rounded-xl border p-5">
          <div className="flex items-center gap-2 text-gray-400 text-sm mb-3">
            <TrendingUp size={16} />
            <span>Konversiya</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{conv}%</p>
          <p className="text-xs text-gray-400 mt-1">{enrolled}/{leads.length} lead</p>
        </div>
        <div className="bg-white rounded-xl border p-5">
          <div className="flex items-center gap-2 text-gray-400 text-sm mb-3">
            <GraduationCap size={16} />
            <span>Olib kelgan daromad</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{fmtM(totalPayments)}</p>
          <p className="text-xs text-gray-400 mt-1">so&apos;m · bu oy</p>
        </div>
      </div>

      {/* Maosh card + Vazifalar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <div className="bg-indigo-600 rounded-xl p-5 text-white">
          <p className="text-sm text-indigo-200 mb-1">{monthName} oyi maoshim</p>
          <p className="text-4xl font-bold mb-1">{fmtM(salaryAmount)}</p>
          <p className="text-indigo-200 text-sm">so&apos;m</p>
          <div className="mt-4 pt-4 border-t border-indigo-500 space-y-1.5">
            <div className="flex justify-between text-sm text-indigo-200">
              <span>Sotuvdan ({pct}%)</span>
              <span className="font-medium">{fmtM((totalPayments * pct) / 100)} so&apos;m</span>
            </div>
            {fixed > 0 && (
              <div className="flex justify-between text-sm text-indigo-200">
                <span>Oylik maosh</span>
                <span className="font-medium">{fmtM(fixed)} so&apos;m</span>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-xl border p-5">
          <div className="flex items-center justify-between mb-4">
            <span className="font-semibold text-gray-900">Bugungi vazifalar</span>
            <span className="text-sm text-gray-400">{tasks.length} ta</span>
          </div>
          <div className="space-y-1">
            {tasks.map(lead => (
              <div key={lead.id} className="flex items-center gap-3 py-2.5 border-b last:border-0">
                <input
                  type="checkbox"
                  checked={checked.has(lead.id)}
                  onChange={() => setChecked(prev => {
                    const next = new Set(prev);
                    if (next.has(lead.id)) next.delete(lead.id); else next.add(lead.id);
                    return next;
                  })}
                  className="w-4 h-4 accent-indigo-600 rounded shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${checked.has(lead.id) ? 'line-through text-gray-400' : 'text-gray-800'}`}>{lead.name}</p>
                  <p className="text-xs text-gray-400">{lead.phone}</p>
                </div>
                <a
                  href={`tel:${lead.phone}`}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-green-50 text-green-600 hover:bg-green-100 shrink-0"
                >
                  <Phone size={14} />
                </a>
              </div>
            ))}
            {tasks.length === 0 && <p className="text-sm text-gray-400 py-4 text-center">Bugungi vazifalar yo&apos;q</p>}
          </div>
        </div>
      </div>

      {/* Funnel */}
      <div className="bg-white rounded-xl border p-5">
        <div className="flex items-baseline gap-2 mb-5">
          <span className="font-semibold text-gray-900">Lead voronkasi</span>
          <span className="text-sm text-gray-400">jami {leads.length} ta</span>
        </div>
        <FunnelChart data={funnelData} />
      </div>
    </div>
  );
}
