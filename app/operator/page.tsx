'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { Target, TrendingUp, GraduationCap, DollarSign } from 'lucide-react';

const MONTHS_UZ = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyn', 'Iyl', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'];
const MONTHS_FULL = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];

const STATUS_COLORS: Record<string, string> = {
  NEW: '#3b82f6',
  IN_PROGRESS: '#f59e0b',
  ENROLLED: '#10b981',
  REJECTED: '#ef4444',
};

const STATUS_LABELS: Record<string, string> = {
  NEW: 'Yangi',
  IN_PROGRESS: 'Muloqotda',
  ENROLLED: 'Yozildi',
  REJECTED: 'Rad etdi',
};

/* ── Line + Area chart ── */
function LineAreaChart({ data, color = '#3b82f6' }: { data: { x: string; y: number }[]; color?: string }) {
  if (data.length < 2) return null;
  const max = Math.max(...data.map(d => d.y), 1);
  const W = 400; const H = 110;
  const pL = 8; const pR = 8; const pT = 18; const pB = 22;
  const pts = data.map((d, i) => ({
    x: pL + (i / (data.length - 1)) * (W - pL - pR),
    y: pT + (1 - d.y / max) * (H - pT - pB),
  }));
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const area = `${line} L${pts[pts.length - 1].x},${H - pB} L${pts[0].x},${H - pB} Z`;
  const gid = `lg${color.replace('#', '')}`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 110 }}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0.01" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gid})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="4" fill={color} stroke="white" strokeWidth="2" />
          <text x={p.x} y={H - 5} textAnchor="middle" fontSize="9" fill="#9ca3af">{data[i].x}</text>
          {data[i].y > 0 && (
            <text x={p.x} y={p.y - 8} textAnchor="middle" fontSize="9" fill={color} fontWeight="700">
              {data[i].y}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}

/* ── Stat card ── */
function StatCard({ title, value, icon, from, to, onClick }: {
  title: string; value: number | string; icon: React.ReactNode; from: string; to: string; onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`relative bg-white rounded-2xl border border-gray-100 p-4 sm:p-6 shadow-sm hover:shadow-xl transition-all duration-300 group overflow-hidden ${onClick ? 'cursor-pointer hover:border-indigo-300 hover:-translate-y-1' : ''}`}
    >
      <div className={`absolute inset-0 bg-linear-to-br ${from} ${to} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
      <div className="relative">
        <div className={`w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-linear-to-br ${from} ${to} flex items-center justify-center text-white mb-3 sm:mb-4 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 [&>svg]:w-4 [&>svg]:h-4 sm:[&>svg]:w-5.5 sm:[&>svg]:h-5.5`}>
          {icon}
        </div>
        <p className="text-2xl sm:text-3xl font-bold text-gray-900 leading-none mb-1.5 sm:mb-2 group-hover:text-indigo-600 transition-colors">{value}</p>
        <p className="text-xs sm:text-sm text-gray-500 font-medium">{title}</p>
      </div>
    </div>
  );
}

export default function OperatorDashboard() {
  const { user } = useAuthStore();
  const router = useRouter();
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const [leads, setLeads] = useState<any[]>([]);
  const [salary, setSalary] = useState<any>(null);
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
  const fixedAmount = salary ? Number(salary.fixedAmount ?? 0) : 0;

  const leadFlow = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(currentYear, currentMonth - 6 + i, 1);
    const m = d.getMonth(); const y = d.getFullYear();
    const cnt = leads.filter(l => {
      const cd = new Date(l.createdAt);
      return cd.getMonth() === m && cd.getFullYear() === y;
    }).length;
    return { x: MONTHS_UZ[m], y: cnt };
  });

  const funnelData = Object.entries(STATUS_LABELS).map(([status, label]) => ({
    label,
    value: leads.filter(l => l.status === status).length,
    color: STATUS_COLORS[status],
  }));

  function fmtNum(n: number) {
    return n.toLocaleString('ru-RU').replace(/,/g, ' ');
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            Salom, {(user as any)?.name?.split(' ')[0] ?? 'Operator'}!
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">{MONTHS_FULL[currentMonth]} {currentYear}</p>
        </div>
        <span className="text-xs font-medium px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-full border border-indigo-100">
          {(user as any)?.center?.name ?? 'Operator panel'}
        </span>
      </div>

      {/* Salary gradient card */}
      <div className="relative bg-linear-to-br from-indigo-500 via-violet-600 to-purple-700 rounded-2xl shadow-2xl p-7 text-white overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative">
          <div className="flex items-start justify-between mb-5">
            <div>
              <p className="text-sm opacity-90 mb-2 font-medium">{MONTHS_FULL[currentMonth]} oyi maoshim</p>
              <p className="text-3xl sm:text-5xl font-bold tracking-tight">
                {fmtNum(salaryAmount)} <span className="text-lg sm:text-2xl opacity-75">so'm</span>
              </p>
            </div>
            <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
              <DollarSign size={20} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-5 border-t border-white/20">
            <div className="hover:bg-white/10 rounded-xl p-3 transition-all duration-200">
              <p className="text-xs opacity-75 mb-1.5 font-medium">Bonus foiz</p>
              <p className="text-lg font-bold">{pct}%</p>
            </div>
            <div className="hover:bg-white/10 rounded-xl p-3 transition-all duration-200">
              <p className="text-xs opacity-75 mb-1.5 font-medium">Olib kelgan daromad</p>
              <p className="text-lg font-bold">{fmtNum(totalPayments)} <span className="text-xs opacity-75">so'm</span></p>
            </div>
            <div className="hover:bg-white/10 rounded-xl p-3 transition-all duration-200">
              <p className="text-xs opacity-75 mb-1.5 font-medium">Asosiy maosh</p>
              <p className="text-lg font-bold">{fixedAmount > 0 ? `${fmtNum(fixedAmount)} so'm` : '—'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Jami leadlar" value={leads.length} from="from-blue-500" to="to-indigo-600"
          icon={<Target size={20} />} onClick={() => router.push('/operator/leads')} />
        <StatCard title="Yozilganlar" value={enrolled} from="from-emerald-400" to="to-teal-600"
          icon={<GraduationCap size={20} />} onClick={() => router.push('/operator/students')} />
        <StatCard title="Konversiya" value={`${conv}%`} from="from-amber-400" to="to-orange-500"
          icon={<TrendingUp size={20} />} />
        <StatCard title="Daromad" value={`${fmtNum(totalPayments)} so'm`} from="from-violet-500" to="to-purple-700"
          icon={<DollarSign size={20} />} onClick={() => router.push('/operator/payments')} />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-semibold text-gray-900">Lead oqimi</p>
              <p className="text-xs text-gray-400 mt-0.5">Oxirgi 7 oy</p>
            </div>
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
          </div>
          <LineAreaChart data={leadFlow} color="#3b82f6" />
        </div>

        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-semibold text-gray-900">Lead</p>
              <p className="text-xs text-gray-400 mt-0.5">Jami {leads.length} ta</p>
            </div>
          </div>
          <div className="space-y-3">
            {funnelData.map((d, i) => {
              const maxVal = Math.max(...funnelData.map(f => f.value), 1);
              const w = Math.max(10, (d.value / maxVal) * 100);
              return (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-20 text-right text-xs text-gray-500 shrink-0">{d.label}</span>
                  <div className="flex-1">
                    <div
                      className="h-7 rounded-lg flex items-center px-3 text-xs font-semibold text-white transition-all"
                      style={{ width: `${w}%`, backgroundColor: d.color }}
                    >
                      {d.value}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

    </div>
  );
}
