'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { DollarSign, TrendingUp, Users, Percent } from 'lucide-react';

const MONTHS_FULL = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];
const MONTHS_SHORT = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyn', 'Iyl', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'];

/* ── Bar chart ── */
function BarChart({ data, color = '#6366f1' }: { data: { label: string; value: number }[]; color?: string }) {
  const max = Math.max(...data.map(d => d.value), 1);
  function fmt(n: number) {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
    return String(n);
  }
  return (
    <div className="flex flex-col gap-1 w-full">
      <div className="flex items-end gap-2 h-32">
        {data.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
            <span className="text-[9px] font-semibold" style={{ color, opacity: d.value > 0 ? 1 : 0 }}>
              {d.value > 0 ? fmt(d.value) : ''}
            </span>
            <div
              className="w-full rounded-t transition-all"
              style={{
                height: `${Math.max((d.value / max) * 100, d.value > 0 ? 6 : 1)}%`,
                backgroundColor: d.value > 0 ? color : '#f3f4f6',
                minHeight: 2,
              }}
            />
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        {data.map((d, i) => (
          <div key={i} className="flex-1 text-center text-[8px] text-gray-400">{d.label}</div>
        ))}
      </div>
    </div>
  );
}

/* ── Info card ── */
function InfoCard({ title, value, icon, from, to }: {
  title: string; value: string; icon: React.ReactNode; from: string; to: string;
}) {
  return (
    <div className="relative bg-white rounded-2xl border border-gray-100 p-5 shadow-sm group overflow-hidden">
      <div className={`absolute inset-0 bg-linear-to-br ${from} ${to} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
      <div className="relative flex items-center gap-4">
        <div className={`w-11 h-11 rounded-xl bg-linear-to-br ${from} ${to} flex items-center justify-center text-white shadow-md shrink-0`}>
          {icon}
        </div>
        <div>
          <p className="text-xs text-gray-400 font-medium">{title}</p>
          <p className="text-lg font-bold text-gray-900 mt-0.5">{value}</p>
        </div>
      </div>
    </div>
  );
}

export default function OperatorSalaryPage() {
  const [salary, setSalary] = useState<any>(null);
  const [chartData, setChartData] = useState<{ label: string; value: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const { data } = await api.get('/salary/me');
        setSalary(data);
        const now = new Date();
        const months: { label: string; value: number }[] = [];
        for (let i = 5; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          months.push({
            label: MONTHS_SHORT[d.getMonth()],
            value: i === 0 ? Math.round(Number(data?.salary ?? 0)) : 0,
          });
        }
        setChartData(months);
      } catch { /* ignore */ }
      setLoading(false);
    }
    void load();
  }, []);

  function fmtNum(n: number) {
    return n.toLocaleString('ru-RU').replace(/,/g, ' ');
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
    </div>
  );

  if (!salary) return (
    <div className="flex flex-col items-center justify-center h-64 text-gray-400">
      <DollarSign size={40} className="mb-3 text-gray-200" />
      <p className="text-sm">Maosh ma&apos;lumoti topilmadi</p>
    </div>
  );

  const [yearStr, monthStr] = (salary.month ?? `${new Date().getFullYear()}-${new Date().getMonth() + 1}`).split('-');
  const monthLabel = MONTHS_FULL[Number(monthStr) - 1] ?? '';
  const salaryAmount = Math.round(Number(salary.salary ?? 0));
  const totalPayments = Number(salary.totalPayments ?? 0);
  const pct = Number(salary.percentage ?? 10);
  const fixedAmount = Number(salary.fixedAmount ?? 0);
  const bonus = Math.round((totalPayments * pct) / 100);
  const paymentsCount = salary.payments?.length ?? 0;
  const payments: any[] = salary.payments ?? [];

  const breakdownRows = [
    { label: 'Asosiy maosh', value: fixedAmount > 0 ? `${fmtNum(fixedAmount)} so'm` : '—', green: false, bold: false },
    { label: 'Olib kelgan daromad', value: `${fmtNum(totalPayments)} so'm`, green: false, bold: false },
    { label: `Bonus (${pct}%)`, value: `+${fmtNum(bonus)} so'm`, green: true, bold: false },
    { label: 'Jami maosh', value: `${fmtNum(salaryAmount)} so'm`, green: false, bold: true },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Maoshim</h1>
          <p className="text-sm text-gray-400 mt-0.5">{monthLabel} {yearStr} · hisob-kitob</p>
        </div>
        <span className="text-xs font-medium px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-full border border-indigo-100">
          {monthLabel} {yearStr}
        </span>
      </div>

      {/* Big salary gradient card */}
      <div className="relative bg-linear-to-br from-indigo-500 via-violet-600 to-purple-700 rounded-2xl shadow-2xl p-7 text-white overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative">
          <div className="flex items-start justify-between mb-5">
            <div>
              <p className="text-sm opacity-90 mb-2 font-medium">{monthLabel} oyi maoshi</p>
              <p className="text-5xl font-bold tracking-tight">
                {fmtNum(salaryAmount)} <span className="text-2xl opacity-75">so'm</span>
              </p>
            </div>
            <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
              <DollarSign size={28} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-5 border-t border-white/20">
            <div className="hover:bg-white/10 rounded-xl p-3 transition-all duration-200">
              <p className="text-xs opacity-75 mb-1.5 font-medium">Bonus foiz</p>
              <p className="text-lg font-bold">{pct}%</p>
            </div>
            <div className="hover:bg-white/10 rounded-xl p-3 transition-all duration-200">
              <p className="text-xs opacity-75 mb-1.5 font-medium">To&apos;lovlar soni</p>
              <p className="text-lg font-bold">{paymentsCount} ta</p>
            </div>
            <div className="hover:bg-white/10 rounded-xl p-3 transition-all duration-200">
              <p className="text-xs opacity-75 mb-1.5 font-medium">Asosiy maosh</p>
              <p className="text-lg font-bold">{fixedAmount > 0 ? `${fmtNum(fixedAmount)} so'm` : '—'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <InfoCard title="Olib kelgan daromad" value={`${fmtNum(totalPayments)} so'm`}
          icon={<TrendingUp size={18} />} from="from-blue-500" to="to-indigo-600" />
        <InfoCard title="Bonus miqdori" value={`${fmtNum(bonus)} so'm`}
          icon={<DollarSign size={18} />} from="from-emerald-400" to="to-teal-600" />
        <InfoCard title="To'lovlar soni" value={`${paymentsCount} ta`}
          icon={<Users size={18} />} from="from-orange-400" to="to-rose-500" />
        <InfoCard title="Foiz ulushi" value={`${pct}%`}
          icon={<Percent size={18} />} from="from-violet-500" to="to-purple-700" />
      </div>

      {/* Chart + Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-semibold text-gray-900">Maosh dinamikasi</p>
              <p className="text-xs text-gray-400 mt-0.5">Oxirgi 6 oy</p>
            </div>
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shrink-0" />
          </div>
          <BarChart data={chartData} color="#6366f1" />
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100">
            <p className="font-semibold text-gray-900">Hisob-kitob</p>
          </div>
          <div className="divide-y divide-gray-50">
            {breakdownRows.map(row => (
              <div key={row.label} className={`px-5 py-3.5 flex items-center justify-between ${row.bold ? 'bg-indigo-50' : ''}`}>
                <span className={`text-sm ${row.bold ? 'font-semibold text-gray-900' : 'text-gray-500'}`}>{row.label}</span>
                <span className={`text-sm font-medium ${row.bold ? 'font-bold text-indigo-700' : row.green ? 'text-emerald-600' : 'text-gray-700'}`}>
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Payments history */}
      {payments.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <p className="font-semibold text-gray-900">To&apos;lovlar tarixi</p>
            <p className="text-xs text-gray-400 mt-0.5">{payments.length} ta to&apos;lov</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-5 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Talaba</th>
                  <th className="px-5 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Miqdor</th>
                  <th className="px-5 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Bonus</th>
                  <th className="px-5 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Sana</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {payments.map((p: any, i: number) => (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 text-sm font-medium text-gray-800">{p.student?.name ?? '—'}</td>
                    <td className="px-5 py-3 text-sm text-gray-600">{fmtNum(Number(p.amount))} so'm</td>
                    <td className="px-5 py-3 text-sm text-emerald-600 font-medium">
                      +{fmtNum(Math.round(Number(p.amount) * pct / 100))} so'm
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-400">
                      {new Date(p.paidAt).toLocaleDateString('uz-UZ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
