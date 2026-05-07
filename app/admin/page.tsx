'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import Avatar from '@/components/ui/Avatar';
import { useAuthStore } from '@/store/auth.store';
import { TrendingUp, GraduationCap, Filter, CreditCard, ArrowRight } from 'lucide-react';

const MONTHS_UZ = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyn', 'Iyl', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'];

function fmtM(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

function DonutChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  let cumulative = 0;
  const r = 36;
  const cx = 50; const cy = 50;
  const circum = 2 * Math.PI * r;

  const slices = data.map(d => {
    const pct = d.value / total;
    const offset = circum * (1 - cumulative);
    cumulative += pct;
    return { ...d, dasharray: `${circum * pct} ${circum * (1 - pct)}`, offset };
  });

  return (
    <div className="flex items-center gap-6">
      <div className="relative shrink-0">
        <svg width="120" height="120" viewBox="0 0 100 100">
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f3f4f6" strokeWidth="12" />
          {slices.map((s, i) => (
            <circle key={i} cx={cx} cy={cy} r={r} fill="none"
              stroke={s.color} strokeWidth="12"
              strokeDasharray={s.dasharray}
              strokeDashoffset={s.offset}
              transform={`rotate(-90 ${cx} ${cy})`}
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold text-gray-900">{total}</span>
          <span className="text-[10px] text-gray-400">leadlar</span>
        </div>
      </div>
      <div className="space-y-2">
        {data.map(d => (
          <div key={d.label} className="flex items-center gap-2 text-sm">
            <span className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: d.color }} />
            <span className="text-gray-600 flex-1">{d.label}</span>
            <span className="font-semibold text-gray-900 ml-4">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SimpleBarChart({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-end gap-3 h-36">
        {data.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <span className="text-[10px] text-gray-400">{fmtM(d.value)}</span>
            <div className="w-full bg-indigo-100 rounded-t-sm" style={{ height: `${(d.value / max) * 100}%`, minHeight: 4 }}>
              <div className="w-full h-full bg-indigo-200 rounded-t-sm opacity-80" />
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-3">
        {data.map((d, i) => (
          <div key={i} className="flex-1 text-center text-[11px] text-gray-400">{d.label}</div>
        ))}
      </div>
    </div>
  );
}

const METHOD_LABEL: Record<string, string> = { CASH: 'Naqd', PAYME: 'Payme', CLICK: 'Click', BANK_TRANSFER: 'Bank' };

export default function AdminDashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState({ students: 0, monthIncome: 0, leads: 0, debtors: 0, prevMonthIncome: 0, newStudents: 0, newLeads: 0 });
  const [chartData, setChartData] = useState<{ label: string; value: number }[]>([]);
  const [donutData, setDonutData] = useState<{ label: string; value: number; color: string }[]>([]);
  const [recentPayments, setRecentPayments] = useState<any[]>([]);
  const [topOperators, setTopOperators] = useState<any[]>([]);

  const centerName = (user as any)?.center?.name ?? 'Markaz';
  const now = new Date();
  const monthName = MONTHS_UZ[now.getMonth()];

  useEffect(() => {
    async function load() {
      const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
      const [studentsRes, paymentsRes, leadsRes, usersRes] = await Promise.all([
        api.get('/students').catch(() => ({ data: [] })),
        api.get(`/payments?from=${monthStart}&limit=1000`).catch(() => ({ data: [] })),
        api.get('/leads').catch(() => ({ data: [] })),
        api.get('/users').catch(() => ({ data: [] })),
      ]);

      const students: any[] = studentsRes.data;
      const payments: any[] = Array.isArray(paymentsRes.data) ? paymentsRes.data : (paymentsRes.data?.data || []);
      const leads: any[] = Array.isArray(leadsRes.data) ? leadsRes.data : (leadsRes.data?.data || []);
      const users: any[] = usersRes.data;

      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      const isThisMonth = (d: string) => { const dt = new Date(d); return dt.getMonth() === currentMonth && dt.getFullYear() === currentYear; };
      const isPrevMonth = (d: string) => { const dt = new Date(d); const pm = currentMonth === 0 ? 11 : currentMonth - 1; const py = currentMonth === 0 ? currentYear - 1 : currentYear; return dt.getMonth() === pm && dt.getFullYear() === py; };
      const isThisWeek = (d: string) => { const dt = new Date(d); const diff = now.getTime() - dt.getTime(); return diff >= 0 && diff < 7 * 86400000; };

      const monthPayments = payments.filter(p => !p.isRefunded && isThisMonth(p.paidAt));
      const prevPayments = payments.filter(p => !p.isRefunded && isPrevMonth(p.paidAt));
      const monthIncome = monthPayments.reduce((s, p) => s + Number(p.amount), 0);
      const prevMonthIncome = prevPayments.reduce((s, p) => s + Number(p.amount), 0);

      const newStudents = students.filter(s => isThisMonth(s.createdAt)).length;
      const newLeads = leads.filter(l => isThisWeek(l.createdAt)).length;

      // Qarzdorlar: faol guruhda bo'lib, shu oy yetarli to'lov qilmaganlar
      const monthPaidMap: Record<string, number> = {};
      payments.forEach(p => {
        if (!p.isRefunded) {
          const sid = p.student?.id;
          if (sid) monthPaidMap[sid] = (monthPaidMap[sid] || 0) + Number(p.amount);
        }
      });
      const debtors = students.filter(s => {
        const active = s.enrollments?.find((e: any) => e.isActive);
        if (!active) return false;
        const price = Number(active.group?.price || 0);
        if (price <= 0) return false;
        return (monthPaidMap[s.id] || 0) < price;
      }).length;

      // Build 6-month chart
      const months6: { label: string; value: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(currentYear, currentMonth - i, 1);
        const m = d.getMonth(); const y = d.getFullYear();
        const sum = payments.filter(p => { const pd = new Date(p.paidAt); return !p.isRefunded && pd.getMonth() === m && pd.getFullYear() === y; }).reduce((s, p) => s + Number(p.amount), 0);
        months6.push({ label: MONTHS_UZ[m], value: sum });
      }

      // Build donut (lead sources)
      const sourceCounts: Record<string, number> = {};
      leads.forEach(l => { const s = l.source || 'Boshqa'; sourceCounts[s] = (sourceCounts[s] || 0) + 1; });
      const COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#a855f7', '#f97316'];
      const donut = Object.entries(sourceCounts).slice(0, 4).map(([label, value], i) => ({ label, value, color: COLORS[i] || '#6b7280' }));

      // Top operators
      const operators = users.filter(u => u.role === 'OPERATOR');
      const opStats = operators.map(op => {
        const opLeads = leads.filter(l => l.operatorId === op.id);
        const enrolled = opLeads.filter(l => l.status === 'ENROLLED').length;
        const conv = opLeads.length ? Math.round((enrolled / opLeads.length) * 100) : 0;
        return { ...op, totalLeads: opLeads.length, enrolled, conv };
      }).sort((a, b) => b.conv - a.conv).slice(0, 5);

      setStats({ students: students.length, monthIncome, leads: leads.length, debtors, prevMonthIncome, newStudents, newLeads });
      setChartData(months6);
      setDonutData(donut);
      setRecentPayments(payments.filter(p => !p.isRefunded).slice(0, 6));
      setTopOperators(opStats);
    }
    void load();
  }, []);

  const incomeTrend = stats.prevMonthIncome > 0 ? ((stats.monthIncome - stats.prevMonthIncome) / stats.prevMonthIncome * 100).toFixed(1) : null;

  return (
    <div>
      {/* Title */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bosh sahifa</h1>
          <p className="text-sm text-gray-400 mt-0.5">{centerName} · {now.getFullYear()} yil {monthName} oyi sharhi</p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={<GraduationCap size={18} className="text-gray-500" />}
          title="Faol talabalar"
          value={stats.students}
          trend={stats.newStudents > 0 ? `+${stats.newStudents} bu oy` : undefined}
        />
        <StatCard
          icon={<TrendingUp size={18} className="text-gray-500" />}
          title={`${monthName} daromadi`}
          value={`${fmtM(stats.monthIncome)}`}
          trend={incomeTrend ? `+${incomeTrend}% o'tgan oyga` : undefined}
        />
        <StatCard
          icon={<Filter size={18} className="text-gray-500" />}
          title="Yangi leadlar"
          value={stats.leads}
          trend={stats.newLeads > 0 ? `+${stats.newLeads} bu hafta` : undefined}
        />
        <StatCard
          icon={<CreditCard size={18} className="text-gray-500" />}
          title="Qarzdorlar"
          value={stats.debtors}
          trend={undefined}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <div className="lg:col-span-2 bg-white rounded-xl border p-5">
          <div className="flex items-baseline gap-2 mb-4">
            <span className="font-semibold text-gray-900">Daromad dinamikasi</span>
            <span className="text-sm text-gray-400">6 oy · mln so&apos;m</span>
          </div>
          <SimpleBarChart data={chartData} />
        </div>
        <div className="bg-white rounded-xl border p-5">
          <div className="flex items-baseline gap-2 mb-4">
            <span className="font-semibold text-gray-900">Lead manbalari</span>
            <span className="text-sm text-gray-400">{MONTHS_UZ[now.getMonth()]}</span>
          </div>
          {donutData.length > 0 ? <DonutChart data={donutData} /> : (
            <div className="text-center text-gray-400 py-8 text-sm">Leadlar yo&apos;q</div>
          )}
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent payments */}
        <div className="bg-white rounded-xl border p-5">
          <div className="flex items-center justify-between mb-4">
            <span className="font-semibold text-gray-900">So&apos;nggi to&apos;lovlar</span>
            <a href="/admin/payments" className="text-sm text-gray-400 hover:text-indigo-600 flex items-center gap-1">Barchasi <ArrowRight size={13} /></a>
          </div>
          <div className="space-y-3">
            {recentPayments.map(p => (
              <div key={p.id} className="flex items-center gap-3">
                <Avatar name={p.student?.name ?? '?'} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{p.student?.name}</p>
                  <p className="text-xs text-gray-400 truncate">{p.student?.enrollments?.[0]?.group?.course?.name ?? '—'}</p>
                </div>
                <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full text-gray-600 shrink-0">
                  {METHOD_LABEL[p.method] ?? p.method}
                </span>
                <span className="text-sm font-semibold text-gray-900 shrink-0">
                  {Number(p.amount).toLocaleString()} so&apos;m
                </span>
              </div>
            ))}
            {recentPayments.length === 0 && <p className="text-sm text-gray-400 text-center py-4">To&apos;lovlar yo&apos;q</p>}
          </div>
        </div>

        {/* Top operators */}
        <div className="bg-white rounded-xl border p-5">
          <div className="flex items-center justify-between mb-4">
            <span className="font-semibold text-gray-900">Top operatorlar</span>
            <span className="text-sm text-gray-400">{MONTHS_UZ[now.getMonth()]} · konversiya</span>
          </div>
          <div className="space-y-3">
            {topOperators.map((op, i) => (
              <div key={op.id} className="flex items-center gap-3">
                <span className="text-xs text-gray-400 w-4 shrink-0">#{i + 1}</span>
                <Avatar name={op.name} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{op.name}</p>
                  <p className="text-xs text-gray-400">{op.enrolled}/{op.totalLeads} lead · {op.conv}% konversiya</p>
                </div>
                <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden shrink-0">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${op.conv}%` }} />
                </div>
              </div>
            ))}
            {topOperators.length === 0 && <p className="text-sm text-gray-400 text-center py-4">Operatorlar yo&apos;q</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, title, value, trend }: {
  icon: React.ReactNode; title: string; value: string | number; trend?: string;
}) {
  return (
    <div className="bg-white rounded-xl border p-5">
      <div className="flex items-center gap-2 text-gray-400 text-sm mb-3">
        {icon}
        <span>{title}</span>
      </div>
      <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
      {trend && (
        <div className="flex items-center gap-1">
          <span className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded bg-green-50 text-green-600 font-medium"><TrendingUp size={10} /> {trend}</span>
        </div>
      )}
    </div>
  );
}
