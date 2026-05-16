'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { Download, Check, Wallet, DollarSign, CheckCircle, Users, TrendingUp, Clock } from 'lucide-react';
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
  const [payModal, setPayModal] = useState<any>(null);
  const [payLoading, setPayLoading] = useState(false);
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
    toast.info('Maosh hisoboti ko\'rib chiqildi');
  }

  async function handlePay() {
    if (!payModal) return;
    setPayLoading(true);
    try {
      await api.post(`/salary/pay/${payModal.operator.id}`, {
        month,
        amount: payModal.totalPayments,
        bonusAmount: payModal.bonus,
        fixedAmount: payModal.fixedAmount,
        notes: '',
      });
      toast.success('Maosh muvaffaqiyatli to\'landi');
      setPayModal(null);
      await load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Xatolik yuz berdi');
    } finally {
      setPayLoading(false);
    }
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
      <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
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
          <button className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 cursor-pointer">
            <Download size={14} /> Eksport
          </button>
          <Button onClick={() => void confirm()}><Check size={14} className="mr-1" />Hisoblash va tasdiqlash</Button>
        </div>
      </div>

      {report && (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <div className="w-10 h-10 rounded-xl bg-linear-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white mb-3 shadow-sm">
                <Users size={18} />
              </div>
              <p className="text-2xl font-bold text-gray-900 leading-none mb-1">{report.operators?.length ?? 0}</p>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Operatorlar</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <div className="w-10 h-10 rounded-xl bg-linear-to-br from-sky-400 to-blue-600 flex items-center justify-center text-white mb-3 shadow-sm">
                <TrendingUp size={18} />
              </div>
              <p className="text-2xl font-bold text-gray-900 leading-none mb-1">{fmtM(totalBase)}</p>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Jami to&apos;lovlar</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <div className="w-10 h-10 rounded-xl bg-linear-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white mb-3 shadow-sm">
                <DollarSign size={18} />
              </div>
              <p className="text-2xl font-bold text-gray-900 leading-none mb-1">{fmtM(totalSalary)}</p>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Jami maosh</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <div className="w-10 h-10 rounded-xl bg-linear-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white mb-3 shadow-sm">
                <Clock size={18} />
              </div>
              <p className="text-2xl font-bold text-gray-900 leading-none mb-1">
                {report.operators?.filter((r: any) => !r.isPaid).length ?? 0}
              </p>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">To&apos;lanmagan</p>
            </div>
          </div>

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

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Month header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-violet-50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-linear-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-sm">
                  <Wallet size={16} />
                </div>
                <div>
                  <p className="font-bold text-gray-900">{monthLabel}</p>
                  <p className="text-xs text-gray-400">Oylik maosh + sotuvdan foiz</p>
                </div>
              </div>
              <span className="text-xs font-semibold px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-full">
                {report.operators?.length ?? 0} operator
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-100">
                    <th className="px-5 py-3.5 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Operator</th>
                    <th className="px-5 py-3.5 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-widest">To&apos;lovlar</th>
                    <th className="px-5 py-3.5 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Foiz</th>
                    <th className="px-5 py-3.5 text-right text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Oylik maosh</th>
                    <th className="px-5 py-3.5 text-right text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Bonus</th>
                    <th className="px-5 py-3.5 text-right text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Jami</th>
                    <th className="px-5 py-3.5 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Holat</th>
                    <th className="px-5 py-3.5"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {report.operators?.map((r: any, idx: number) => {
                    const pct = localPct[r.operator.id] ?? Number(r.percentage);
                    const fixedAmt = Number(r.fixedAmount ?? 0);
                    const bonus = (Number(r.totalPayments) * pct) / 100;
                    const total = bonus + fixedAmt;
                    return (
                      <tr key={r.operator.id} className={`hover:bg-indigo-50/30 transition-colors ${idx % 2 === 1 ? 'bg-gray-50/30' : ''}`}>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar name={r.operator.name} size="sm" />
                            <div>
                              <p className="font-semibold text-gray-900">{r.operator.name}</p>
                              <p className="text-xs text-gray-400 mt-0.5">{r.paymentsCount} ta to&apos;lov</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <p className="font-medium text-gray-800">{Number(r.totalPayments).toLocaleString()}</p>
                          <p className="text-[11px] text-gray-400">so&apos;m</p>
                        </td>
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-violet-50 text-violet-700 border border-violet-100">
                            {pct}%
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          {fixedAmt > 0 ? (
                            <div>
                              <p className="font-semibold text-indigo-600">{fixedAmt.toLocaleString()}</p>
                              <p className="text-[11px] text-gray-400">so&apos;m</p>
                            </div>
                          ) : <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div>
                            <p className="font-semibold text-emerald-600">+{Math.round(bonus).toLocaleString()}</p>
                            <p className="text-[11px] text-gray-400">so&apos;m</p>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="inline-block text-right">
                            <p className="text-base font-bold text-gray-900">{Math.round(total).toLocaleString()}</p>
                            <p className="text-[11px] text-gray-400">so&apos;m</p>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          {r.isPaid ? (
                            <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                              <CheckCircle size={11} /> To&apos;landi
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-semibold">
                              <Clock size={11} /> Kutilmoqda
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          {!r.isPaid && (
                            <button
                              onClick={() => setPayModal({ ...r, bonus: Math.round(bonus), total: Math.round(total) })}
                              className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-700 transition-all shadow-sm hover:shadow-indigo-200 hover:shadow-md cursor-pointer"
                            >
                              <DollarSign size={13} /> To&apos;lash
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-200 bg-gradient-to-r from-gray-50 to-indigo-50/30">
                    <td className="px-5 py-4 font-bold text-gray-700" colSpan={3}>
                      <div className="flex items-center gap-2">
                        <TrendingUp size={14} className="text-indigo-500" />
                        Jami chiqim
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      {totalFixed > 0 ? (
                        <div>
                          <p className="font-bold text-indigo-600">{totalFixed.toLocaleString()}</p>
                          <p className="text-[11px] text-gray-400">so&apos;m</p>
                        </div>
                      ) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div>
                        <p className="font-bold text-emerald-600">+{totalBonusOnly.toLocaleString()}</p>
                        <p className="text-[11px] text-gray-400">so&apos;m</p>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div>
                        <p className="text-lg font-black text-gray-900">{totalSalary.toLocaleString()}</p>
                        <p className="text-[11px] text-gray-400">so&apos;m</p>
                      </div>
                    </td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </>
      )}

      {!report && (
        <div className="text-center py-16 text-gray-400">
          <Wallet size={32} className="mx-auto mb-3 text-gray-300" />
          <p className="text-sm">Ma&apos;lumot yuklanmoqda...</p>
        </div>
      )}

      {/* Pay Modal */}
      <Modal open={!!payModal} onClose={() => setPayModal(null)} title="Maosh to'lash" size="sm">
        {payModal && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Operator:</span>
                <span className="text-sm font-semibold text-gray-900">{payModal.operator.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Oy:</span>
                <span className="text-sm font-semibold text-gray-900">{monthLabel}</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                <span className="text-sm text-gray-600">Oylik maosh:</span>
                <span className="text-sm font-medium text-indigo-600">
                  {payModal.fixedAmount > 0 ? `${payModal.fixedAmount.toLocaleString()} so'm` : '—'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Sotuvdan bonus:</span>
                <span className="text-sm font-medium text-green-600">+{payModal.bonus.toLocaleString()} so&apos;m</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                <span className="text-sm font-semibold text-gray-900">Jami to&apos;lanadi:</span>
                <span className="text-lg font-bold text-gray-900">{payModal.total.toLocaleString()} so&apos;m</span>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
              <p className="text-sm text-amber-800">
                ⚠️ Maosh to&apos;langandan keyin bu amal qaytarilmaydi.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <Button onClick={() => void handlePay()} loading={payLoading} className="flex-1">
                <DollarSign size={14} className="mr-1" /> To&apos;lash
              </Button>
              <Button variant="secondary" onClick={() => setPayModal(null)} className="flex-1">
                Bekor qilish
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
