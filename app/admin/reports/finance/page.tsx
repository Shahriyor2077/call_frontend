'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { TrendingUp, DollarSign, ChevronDown, X } from 'lucide-react';

const MONTHS_UZ = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];
const MONTHS_SHORT = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyn', 'Iyl', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'];

const METHOD_LABEL: Record<string, string> = { CASH: 'Naqd', PAYME: 'Payme', CLICK: 'Click', BANK_TRANSFER: 'Bank' };
const METHOD_COLOR: Record<string, string> = {
  CASH: 'bg-emerald-500', PAYME: 'bg-cyan-500', CLICK: 'bg-orange-400', BANK_TRANSFER: 'bg-violet-500',
};
const METHOD_LIGHT: Record<string, string> = {
  CASH: 'bg-emerald-50 text-emerald-700', PAYME: 'bg-cyan-50 text-cyan-700',
  CLICK: 'bg-orange-50 text-orange-700', BANK_TRANSFER: 'bg-violet-50 text-violet-700',
};

function fmtM(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}
function fmtNum(n: number) {
  return n.toLocaleString('ru-RU').replace(/,/g, ' ');
}
function toInputDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const PERIODS = [
  { label: 'Bugun',        from: () => { const d = new Date(); return toInputDate(d); }, to: () => { const d = new Date(); return toInputDate(d); } },
  { label: 'Bu hafta',     from: () => { const n = new Date(); const m = new Date(n); m.setDate(n.getDate() - n.getDay() + 1); return toInputDate(m); }, to: () => toInputDate(new Date()) },
  { label: 'Bu oy',        from: () => { const n = new Date(); return toInputDate(new Date(n.getFullYear(), n.getMonth(), 1)); }, to: () => toInputDate(new Date()) },
  { label: "O'tgan oy",    from: () => { const n = new Date(); return toInputDate(new Date(n.getFullYear(), n.getMonth() - 1, 1)); }, to: () => { const n = new Date(); return toInputDate(new Date(n.getFullYear(), n.getMonth(), 0)); } },
  { label: 'Yil boshidan', from: () => { const n = new Date(); return toInputDate(new Date(n.getFullYear(), 0, 1)); }, to: () => toInputDate(new Date()) },
];

function BarChart({ data, color = '#6366f1' }: { data: { label: string; value: number }[]; color?: string }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="flex items-end gap-1 h-36">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
          <span className="text-[9px] font-semibold opacity-0 group-hover:opacity-100 transition-opacity" style={{ color }}>
            {d.value > 0 ? fmtM(d.value) : ''}
          </span>
          <div
            className="w-full rounded-t transition-all"
            style={{
              height: `${Math.max((d.value / max) * 100, d.value > 0 ? 5 : 1)}%`,
              backgroundColor: d.value > 0 ? color : '#f3f4f6',
              minHeight: 2,
            }}
          />
          <span className="text-[9px] text-gray-400 mt-0.5">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

export default function FinanceReportPage() {
  const now = new Date();
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState(toInputDate(new Date(now.getFullYear(), now.getMonth(), 1)));
  const [dateTo, setDateTo]     = useState(toInputDate(now));
  const [periodOpen, setPeriodOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('Bu oy');

  async function load() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '5000', from: dateFrom, to: dateTo });
      const { data } = await api.get(`/payments?${params}`);
      setPayments(data.data || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, [dateFrom, dateTo]);

  const active    = payments.filter(p => !p.isRefunded);
  const refunded  = payments.filter(p => p.isRefunded);
  const totalSum  = active.reduce((s, p) => s + Number(p.amount), 0);
  const refundSum = refunded.reduce((s, p) => s + Number(p.amount), 0);
  const netSum    = totalSum - refundSum;

  /* by method */
  const byMethod: Record<string, number> = {};
  active.forEach(p => { byMethod[p.method] = (byMethod[p.method] || 0) + Number(p.amount); });

  /* daily bar chart */
  const fromDate = new Date(dateFrom);
  const toDate   = new Date(dateTo);
  toDate.setHours(23, 59, 59);
  const diffDays = Math.round((toDate.getTime() - fromDate.getTime()) / 86400000) + 1;

  let barData: { label: string; value: number }[] = [];
  if (diffDays <= 31) {
    barData = Array.from({ length: diffDays }, (_, i) => {
      const d = new Date(fromDate);
      d.setDate(fromDate.getDate() + i);
      const dayStr = toInputDate(d);
      const val = active
        .filter(p => p.paidAt.startsWith(dayStr))
        .reduce((s, p) => s + Number(p.amount), 0);
      return { label: `${d.getDate()}`, value: val };
    });
  } else {
    const monthMap: Record<string, number> = {};
    active.forEach(p => {
      const d = new Date(p.paidAt);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      monthMap[key] = (monthMap[key] || 0) + Number(p.amount);
    });
    const months = Object.keys(monthMap).sort();
    barData = months.map(k => {
      const [, m] = k.split('-').map(Number);
      return { label: MONTHS_SHORT[m], value: monthMap[k] };
    });
  }

  /* by type */
  const byType = {
    MONTHLY: active.filter(p => p.type === 'MONTHLY').reduce((s, p) => s + Number(p.amount), 0),
    ADVANCE: active.filter(p => p.type === 'ADVANCE').reduce((s, p) => s + Number(p.amount), 0),
  };

  function applyPeriod(p: typeof PERIODS[0]) {
    setDateFrom(p.from()); setDateTo(p.to());
    setSelectedPeriod(p.label); setPeriodOpen(false);
  }

  const periodLabel = dateFrom && dateTo
    ? `${dateFrom.replace(/-/g, '.')} — ${dateTo.replace(/-/g, '.')}`
    : '';

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Moliyaviy hisobot</h1>
          <p className="text-sm text-gray-400 mt-0.5">Daromad va to&apos;lovlar tahlili</p>
        </div>

        {/* Period controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white shadow-sm">
            <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setSelectedPeriod(''); }}
              className="text-sm border-none outline-none w-28 bg-transparent" />
            <span className="text-gray-300 mx-1">—</span>
            <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setSelectedPeriod(''); }}
              className="text-sm border-none outline-none w-28 bg-transparent" />
          </div>
          <div className="relative">
            <button onClick={() => setPeriodOpen(v => !v)}
              className={`flex items-center gap-1.5 px-3 py-2 border rounded-xl text-sm shadow-sm transition-colors ${selectedPeriod ? 'border-indigo-200 bg-indigo-50 text-indigo-700' : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'}`}>
              {selectedPeriod || 'Davrni tanlang'}
              {selectedPeriod ? <X size={13} onClick={e => { e.stopPropagation(); setSelectedPeriod(''); }} /> : <ChevronDown size={13} />}
            </button>
            {periodOpen && (
              <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl py-1.5 z-30 min-w-36">
                {PERIODS.map(p => (
                  <button key={p.label} onClick={() => applyPeriod(p)}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-indigo-50 transition-colors ${selectedPeriod === p.label ? 'text-indigo-700 font-semibold' : 'text-gray-700'}`}>
                    {p.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><div className="w-7 h-7 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <>
          {/* Top stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
            {[
              { label: "Jami tushum",   value: totalSum, sub: `${active.length} ta to'lov`,    from: 'from-indigo-500', to: 'to-violet-600' },
              { label: 'Sof daromad',   value: netSum,   sub: `${fmtNum(refundSum)} UZS qaytarildi`, from: 'from-emerald-400', to: 'to-teal-600' },
              { label: 'Oylik to\'lovlar', value: byType.MONTHLY, sub: `${active.filter(p => p.type === 'MONTHLY').length} ta`, from: 'from-blue-500', to: 'to-indigo-600' },
              { label: 'Avans',         value: byType.ADVANCE, sub: `${active.filter(p => p.type === 'ADVANCE').length} ta`, from: 'from-amber-400', to: 'to-orange-500' },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className={`w-10 h-10 rounded-xl bg-linear-to-br ${s.from} ${s.to} flex items-center justify-center text-white mb-3 shadow-sm`}>
                  <DollarSign size={18} />
                </div>
                <p className="text-[22px] font-bold text-gray-900 leading-none mb-1">{fmtNum(s.value)}</p>
                <p className="text-xs text-gray-400 font-medium">UZS</p>
                <p className="text-xs text-gray-400 mt-2">{s.sub}</p>
              </div>
            ))}
          </div>

          {/* Chart + Method breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
            {/* Bar chart */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-semibold text-gray-900">Tushum dinamikasi</p>
                  <p className="text-xs text-gray-400 mt-0.5">{periodLabel}</p>
                </div>
                <TrendingUp size={16} className="text-indigo-400" />
              </div>
              {barData.length > 0 ? (
                <BarChart data={barData} color="#6366f1" />
              ) : (
                <div className="h-36 flex items-center justify-center text-gray-400 text-sm">Ma&apos;lumot yo&apos;q</div>
              )}
            </div>

            {/* By method */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <p className="font-semibold text-gray-900 mb-4">To&apos;lov usullari</p>
              {Object.keys(byMethod).length === 0 ? (
                <div className="text-center text-sm text-gray-400 py-8">Ma&apos;lumot yo&apos;q</div>
              ) : (
                <div className="space-y-3">
                  {Object.entries(byMethod)
                    .sort(([, a], [, b]) => b - a)
                    .map(([method, sum]) => {
                      const pct = totalSum > 0 ? Math.round((sum / totalSum) * 100) : 0;
                      return (
                        <div key={method}>
                          <div className="flex items-center justify-between mb-1">
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${METHOD_LIGHT[method] ?? 'bg-gray-100 text-gray-600'}`}>
                              {METHOD_LABEL[method] ?? method}
                            </span>
                            <div className="text-right">
                              <span className="text-sm font-bold text-gray-900">{fmtNum(sum)}</span>
                              <span className="text-xs text-gray-400 ml-1">UZS</span>
                            </div>
                          </div>
                          <div className="w-full h-1.5 bg-gray-100 rounded-full">
                            <div className={`h-full rounded-full ${METHOD_COLOR[method] ?? 'bg-gray-400'}`} style={{ width: `${pct}%` }} />
                          </div>
                          <p className="text-[10px] text-gray-400 mt-0.5 text-right">{pct}%</p>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>

          {/* Recent payments table */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
              <p className="font-semibold text-gray-900">So&apos;nggi to&apos;lovlar</p>
              <span className="text-sm text-gray-400 bg-gray-100 px-2.5 py-1 rounded-lg">{active.length} ta</span>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50/60 border-b border-gray-100 text-left">
                  <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Talaba</th>
                  <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Guruh</th>
                  <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Usul</th>
                  <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Tur</th>
                  <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide text-right">Summa</th>
                  <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Sana</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {active.slice(0, 50).map(p => {
                  const g = p.student?.enrollments?.[0]?.group;
                  const d = new Date(p.paidAt);
                  const ds = `${String(d.getDate()).padStart(2,'0')}.${String(d.getMonth()+1).padStart(2,'0')}.${d.getFullYear()}`;
                  return (
                    <tr key={p.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-5 py-3 font-medium text-gray-900">{p.student?.name}</td>
                      <td className="px-5 py-3 text-gray-500">{g?.name ?? '—'}</td>
                      <td className="px-5 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${METHOD_LIGHT[p.method] ?? 'bg-gray-100 text-gray-600'}`}>
                          {METHOD_LABEL[p.method] ?? p.method}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-xs text-gray-500">{p.type === 'MONTHLY' ? 'Oylik' : 'Avans'}</td>
                      <td className="px-5 py-3 text-right font-semibold text-teal-600">+{fmtNum(Number(p.amount))} UZS</td>
                      <td className="px-5 py-3 text-gray-400 text-xs">{ds}</td>
                    </tr>
                  );
                })}
                {active.length === 0 && (
                  <tr><td colSpan={6} className="px-5 py-12 text-center text-gray-400">Tanlangan davrda to&apos;lovlar yo&apos;q</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {periodOpen && <div className="fixed inset-0 z-20" onClick={() => setPeriodOpen(false)} />}
    </div>
  );
}
