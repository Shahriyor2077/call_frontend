'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import { Download, Check, Wallet } from 'lucide-react';
import { useToast } from '@/components/ui/ToastProvider';

const MONTHS_UZ = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];

function fmtM(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  return n.toLocaleString();
}

export default function AdminSalaryPage() {
  const toast = useToast();
  const [report, setReport] = useState<any>(null);
  const [localPct, setLocalPct] = useState<Record<string, number>>({});
  const now = new Date();
  const [month, setMonth] = useState(() => `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);

  async function load() {
    const { data } = await api.get(`/salary/report?month=${month}`);
    setReport(data);
    const pctMap: Record<string, number> = {};
    data.operators?.forEach((r: any) => { pctMap[r.operator.id] = Number(r.percentage); });
    setLocalPct(pctMap);
  }
  useEffect(() => { void load(); }, [month]);

  function confirm() {
    toast.info('Maosh hisoboti ko\'rib chiqildi. Backend tasdiqlash endpointi hali mavjud emas.');
  }

  const [y, m] = month.split('-');
  const monthLabel = `${MONTHS_UZ[Number(m) - 1]} · ${y}`;
  const totalBase = report?.operators?.reduce((s: number, r: any) => s + Number(r.totalPayments ?? 0), 0) ?? 0;
  const totalFixed = report?.operators?.reduce((s: number, r: any) => s + Number(r.fixedAmount ?? 0), 0) ?? 0;
  const totalBonusOnly = report?.operators?.reduce((s: number, r: any) =>
    s + Math.round((Number(r.totalPayments ?? 0) * Number(r.percentage ?? 0)) / 100), 0) ?? 0;
  const totalSalary = report?.operators?.reduce((s: number, r: any) => s + Math.round(Number(r.salary ?? 0)), 0) ?? 0;

  return (
    <div>
      <div className="flex items-start justify-between mb-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Maosh</h1>
          {report && (
            <p className="text-sm text-gray-400 mt-0.5">
              Operatorlar uchun {MONTHS_UZ[Number(m) - 1].toLowerCase()} oyi maoshi · {fmtM(totalBase)} so&apos;m jamlangan to&apos;lovlardan
            </p>
          )}
        </div>
        <div className="flex gap-2 items-center">
          <input
            type="month"
            value={month}
            onChange={e => setMonth(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none"
          />
          <button className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">
            <Download size={14} /> Eksport
          </button>
          <Button onClick={() => void confirm()}><Check size={14} className="mr-1" />Hisoblash va tasdiqlash</Button>
        </div>
      </div>

      {report && (
        <>
          {/* Info banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-600">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 16v-4" />
                  <path d="M12 8h.01" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900 mb-1">Maosh sozlamalari</p>
                <p className="text-sm text-blue-700">
                  Foiz va oylik maosh <span className="font-semibold">Operatorlar</span> sahifasida har bir operator uchun alohida sozlanadi.
                  3 nuqta (⋮) tugmasini bosing → <span className="font-semibold">Maosh sozlamalari</span>
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border overflow-hidden">
            {/* Month header */}
            <div className="px-5 py-4 border-b flex items-center gap-3">
              <span className="font-semibold text-gray-900">{monthLabel}</span>
              <span className="text-sm text-gray-400">Oylik maosh + sotuvdan foiz</span>
            </div>

            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left bg-gray-50">
                  <th className="px-5 py-3 text-xs font-semibold text-gray-400 tracking-wide">OPERATOR</th>
                  <th className="px-5 py-3 text-xs font-semibold text-gray-400 tracking-wide">TO&apos;LOVLAR</th>
                  <th className="px-5 py-3 text-xs font-semibold text-gray-400 tracking-wide">FOIZ</th>
                  <th className="px-5 py-3 text-xs font-semibold text-gray-400 tracking-wide text-right">OYLIK MAOSH</th>
                  <th className="px-5 py-3 text-xs font-semibold text-gray-400 tracking-wide text-right">SOTUVDAN BONUS</th>
                  <th className="px-5 py-3 text-xs font-semibold text-gray-400 tracking-wide text-right">JAMI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {report.operators?.map((r: any) => {
                  const pct = localPct[r.operator.id] ?? Number(r.percentage);
                  const fixedAmt = Number(r.fixedAmount ?? 0);
                  const bonus = (Number(r.totalPayments) * pct) / 100;
                  const total = bonus + fixedAmt;
                  return (
                    <tr key={r.operator.id} className="hover:bg-gray-50">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={r.operator.name} size="sm" />
                          <div>
                            <p className="font-medium text-gray-900">{r.operator.name}</p>
                            <p className="text-xs text-gray-400">{r.paymentsCount} ta to&apos;lov</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-gray-600">{Number(r.totalPayments).toLocaleString()} so&apos;m</td>
                      <td className="px-5 py-4 text-gray-700 font-medium">{pct}%</td>
                      <td className="px-5 py-4 text-right text-indigo-600 font-medium">
                        {fixedAmt > 0 ? `${fixedAmt.toLocaleString()} so'm` : '—'}
                      </td>
                      <td className="px-5 py-4 text-right font-semibold text-green-600">
                        +{Math.round(bonus).toLocaleString()} so&apos;m
                      </td>
                      <td className="px-5 py-4 text-right font-bold text-gray-900">
                        {Math.round(total).toLocaleString()} so&apos;m
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {/* Total row */}
              <tfoot>
                <tr className="border-t bg-gray-50">
                  <td className="px-5 py-4 font-semibold text-gray-700" colSpan={3}>Jami chiqim</td>
                  <td className="px-5 py-4 text-right text-indigo-600 font-medium">
                    {totalFixed > 0 ? `${totalFixed.toLocaleString()} so'm` : '—'}
                  </td>
                  <td className="px-5 py-4 text-right font-bold text-green-600">
                    +{totalBonusOnly.toLocaleString()} so&apos;m
                  </td>
                  <td className="px-5 py-4 text-right font-bold text-gray-900">
                    {totalSalary.toLocaleString()} so&apos;m
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      )}

      {!report && (
        <div className="text-center py-16 text-gray-400">
          <Wallet size={32} className="mx-auto mb-3 text-gray-300" />
          <p className="text-sm">Ma&apos;lumot yuklanmoqda...</p>
        </div>
      )}
    </div>
  );
}
