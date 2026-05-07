'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Wallet } from 'lucide-react';

const MONTHS_UZ = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];

function fmtM(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toLocaleString();
}

function SimpleBarChart({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-end gap-3 h-28">
        {data.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <span className="text-[10px] text-gray-400">{fmtM(d.value)}</span>
            <div className="w-full bg-indigo-100 rounded-t-sm" style={{ height: `${(d.value / max) * 100}%`, minHeight: 4 }}>
              <div className="w-full h-full bg-indigo-400 rounded-t-sm opacity-80" />
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

export default function OperatorSalaryPage() {
  const [salary, setSalary] = useState<any>(null);
  const [chartData, setChartData] = useState<{ label: string; value: number }[]>([]);

  useEffect(() => {
    async function load() {
      const { data } = await api.get('/salary/me');
      setSalary(data);
      const now = new Date();
      const months: { label: string; value: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push({ label: MONTHS_UZ[d.getMonth()].slice(0, 3), value: i === 0 ? Number(data?.salary ?? 0) : 0 });
      }
      setChartData(months);
    }
    void load();
  }, []);

  if (!salary) return (
    <div className="flex flex-col items-center justify-center h-64 text-gray-400">
      <Wallet size={32} className="mb-3 text-gray-300" />
      <p className="text-sm">Yuklanmoqda...</p>
    </div>
  );

  const [, m] = (salary.month ?? `${new Date().getFullYear()}-${new Date().getMonth() + 1}`).split('-');
  const monthLabel = `${MONTHS_UZ[Number(m) - 1]?.toUpperCase()} OYI MAOSHI`;
  const salaryAmount = Math.round(Number(salary.salary ?? 0));
  const totalPayments = Number(salary.totalPayments ?? 0);
  const pct = Number(salary.percentage ?? 10);
  const fixedAmount = Number(salary.fixedAmount ?? 0);
  const bonus = Math.round((totalPayments * pct) / 100);
  const paymentsCount = salary.payments?.length ?? 0;

  const rows = [
    { label: 'Asosiy maosh', display: fixedAmount > 0 ? `${fixedAmount.toLocaleString()} so'm` : '—' },
    { label: 'Olib kelgan talabalar', display: `${paymentsCount} ta` },
    { label: 'Konversiya foizi', display: `${pct}%` },
    { label: 'Olib kelgan daromad', display: `${totalPayments.toLocaleString()} so'm` },
    { label: 'Bonus', display: `+${bonus.toLocaleString()} so'm`, green: true },
    { label: 'Jami', display: `${salaryAmount.toLocaleString()} so'm`, bold: true },
  ];

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Maoshim</h1>
          <p className="text-sm text-gray-400 mt-0.5">{salary.month} · hisob-kitob</p>
        </div>
      </div>

      {/* Big maosh card */}
      <div className="bg-indigo-600 rounded-2xl p-6 text-white mb-4">
        <p className="text-xs text-indigo-300 uppercase tracking-widest font-semibold mb-3">{monthLabel}</p>
        <p className="text-5xl font-bold mb-1">{fmtM(salaryAmount)}</p>
        <p className="text-indigo-300 text-sm mb-4">so&apos;m</p>
        <div className="pt-4 border-t border-indigo-500 flex gap-6 text-sm text-indigo-200">
          <span>{pct}% foiz</span>
          <span>{fmtM(totalPayments)} so&apos;mdan</span>
          <span>{paymentsCount} ta to&apos;lov</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Breakdown table */}
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="px-5 py-4 border-b">
            <span className="font-semibold text-gray-900">Hisob-kitob</span>
          </div>
          <div className="divide-y">
            {rows.map(row => (
              <div key={row.label} className={`px-5 py-3.5 flex items-center justify-between ${row.bold ? 'bg-gray-50' : ''}`}>
                <span className={`text-sm ${row.bold ? 'font-semibold text-gray-900' : 'text-gray-500'}`}>{row.label}</span>
                <span className={`text-sm font-medium ${row.bold ? 'font-bold text-gray-900' : row.green ? 'text-green-600' : 'text-gray-700'}`}>
                  {row.display}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 6-month chart */}
        <div className="bg-white rounded-xl border p-5">
          <div className="flex items-baseline gap-2 mb-4">
            <span className="font-semibold text-gray-900">Maosh dinamikasi</span>
            <span className="text-sm text-gray-400">6 oy</span>
          </div>
          <SimpleBarChart data={chartData} />
        </div>
      </div>
    </div>
  );
}
