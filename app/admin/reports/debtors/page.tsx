'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { useToast } from '@/components/ui/ToastProvider';
import { AlertTriangle, Phone, Users, Search, ChevronDown, X } from 'lucide-react';

function fmtNum(n: number) {
  return n.toLocaleString('ru-RU').replace(/,/g, ' ');
}

function debtBadge(debt: number) {
  if (debt >= 1_000_000) return 'bg-red-100 text-red-700';
  if (debt >= 300_000)   return 'bg-orange-100 text-orange-700';
  return 'bg-amber-100 text-amber-700';
}

export default function DebtorsReportPage() {
  const toast = useToast();
  const router = useRouter();
  const [debtors, setDebtors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [groupFilter, setGroupFilter] = useState('');
  const [sortBy, setSortBy] = useState<'debt' | 'name'>('debt');
  const [sortOpen, setSortOpen] = useState(false);
  const [paymentStudent, setPaymentStudent] = useState<any>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDiscount, setPaymentDiscount] = useState('');
  const [payLoading, setPayLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get('/students/debtors');
      setDebtors(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  /* collect unique groups for filter */
  const allGroups = Array.from(
    new Map(
      debtors.flatMap(d => d.enrollmentDetails.map((e: any) => [e.group.id, e.group]))
    ).values()
  );

  const filtered = debtors
    .filter(d => {
      const q = search.toLowerCase();
      const matchSearch = !q || d.name.toLowerCase().includes(q) || d.phone.includes(q);
      const matchGroup = !groupFilter || d.enrollmentDetails.some((e: any) => e.group.id === groupFilter);
      return matchSearch && matchGroup;
    })
    .sort((a, b) => sortBy === 'debt' ? b.debt - a.debt : a.name.localeCompare(b.name));

  const totalDebt = filtered.reduce((s: number, d: any) => s + d.debt, 0);

  async function submitPayment() {
    if (!paymentStudent) return;
    if (!paymentAmount || isNaN(Number(paymentAmount))) {
      toast.warning('To\'lov miqdorini kiriting');
      return;
    }
    const totalAmt = Number(paymentAmount);
    const discount = Number(paymentDiscount) || 0;
    if (discount > totalAmt) { toast.warning("Chegirma to'lov miqdoridan katta bo'lishi mumkin emas"); return; }
    setPayLoading(true);
    try {
      const { data } = await api.post('/payments', {
        studentId: paymentStudent.id,
        totalAmount: totalAmt,
        discountAmount: discount,
        type: 'MONTHLY',
        method: 'CASH',
        paidAt: new Date().toISOString(),
      });
      toast.success('To\'lov kiritildi');
      setPaymentStudent(null);
      setPaymentAmount('');
      setPaymentDiscount('');
      router.push(`/admin/payments/${data.id}/print`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Xatolik yuz berdi');
    } finally {
      setPayLoading(false);
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Qarzdorlar ro&apos;yxati</h1>
          <p className="text-sm text-gray-400 mt-0.5">Faol guruhlarda to&apos;liq to&apos;lamagan talabalar</p>
        </div>
        <button onClick={() => void load()}
          className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 shadow-sm transition-colors">
          Yangilash
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-7 h-7 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="w-10 h-10 rounded-xl bg-linear-to-br from-red-400 to-rose-600 flex items-center justify-center text-white mb-3 shadow-sm">
                <AlertTriangle size={18} />
              </div>
              <p className="text-[22px] font-bold text-gray-900 leading-none mb-1">{fmtNum(totalDebt)}</p>
              <p className="text-xs text-gray-400 font-medium">UZS — Umumiy qarz</p>
              <p className="text-xs text-gray-400 mt-2">{filtered.length} ta qarzdor talaba</p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="w-10 h-10 rounded-xl bg-linear-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white mb-3 shadow-sm">
                <Users size={18} />
              </div>
              <p className="text-[22px] font-bold text-gray-900 leading-none mb-1">
                {filtered.filter(d => d.debt >= 1_000_000).length}
              </p>
              <p className="text-xs text-gray-400 font-medium">ta katta qarzdor (≥ 1 000 000)</p>
              <p className="text-xs text-gray-400 mt-2">
                {fmtNum(filtered.filter(d => d.debt >= 1_000_000).reduce((s, d) => s + d.debt, 0))} UZS
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="w-10 h-10 rounded-xl bg-linear-to-br from-amber-400 to-yellow-500 flex items-center justify-center text-white mb-3 shadow-sm">
                <Phone size={18} />
              </div>
              <p className="text-[22px] font-bold text-gray-900 leading-none mb-1">
                {filtered.length > 0 ? fmtNum(Math.round(totalDebt / filtered.length)) : 0}
              </p>
              <p className="text-xs text-gray-400 font-medium">UZS — O&apos;rtacha qarz</p>
              <p className="text-xs text-gray-400 mt-2">Har bir qarzdorga</p>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4">
            <div className="flex flex-wrap gap-3">
              {/* Search */}
              <div className="relative flex-1 min-w-48">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Ism yoki telefon..."
                  className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-300"
                />
              </div>

              {/* Group filter */}
              <Select value={groupFilter} onChange={e => setGroupFilter(e.target.value)}>
                <option value="">Barcha guruhlar</option>
                {allGroups.map((g: any) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </Select>

              {/* Sort */}
              <div className="relative">
                <button onClick={() => setSortOpen(v => !v)}
                  className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 cursor-pointer">
                  {sortBy === 'debt' ? 'Qarz bo\'yicha' : 'Ism bo\'yicha'}
                  <ChevronDown size={13} />
                </button>
                {sortOpen && (
                  <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl py-1.5 z-30 min-w-36">
                    {(['debt', 'name'] as const).map(s => (
                      <button key={s} onClick={() => { setSortBy(s); setSortOpen(false); }}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-indigo-50 cursor-pointer ${sortBy === s ? 'text-indigo-700 font-semibold' : 'text-gray-700'}`}>
                        {s === 'debt' ? "Qarz bo'yicha" : "Ism bo'yicha"}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {(search || groupFilter) && (
                <button onClick={() => { setSearch(''); setGroupFilter(''); }}
                  className="flex items-center gap-1 px-3 py-2 text-sm text-gray-400 hover:text-gray-600">
                  <X size={13} /> Tozalash
                </button>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
              <p className="font-semibold text-gray-900">Qarzdorlar</p>
              <span className="text-sm text-gray-400 bg-gray-100 px-2.5 py-1 rounded-lg">{filtered.length} ta</span>
            </div>

            {filtered.length === 0 ? (
              <div className="py-16 text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <AlertTriangle size={20} className="text-green-500" />
                </div>
                <p className="text-gray-500 font-medium">Qarzdorlar topilmadi</p>
                <p className="text-sm text-gray-400 mt-1">Barcha talabalar to&apos;lovlarini amalga oshirishgan</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50/60 border-b border-gray-100 text-left">
                    <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">#</th>
                    <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Talaba</th>
                    <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Telefon</th>
                    <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Guruh / Kurs</th>
                    <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide text-right">Kutilgan</th>
                    <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide text-right">To&apos;langan</th>
                    <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide text-right">Qarz</th>
                    <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide text-center">Amal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((d, i) => {
                    const firstEnrollment = d.enrollmentDetails[0];
                    const group = firstEnrollment?.group;
                    const extraGroups = d.enrollmentDetails.length - 1;
                    return (
                      <tr key={d.id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="px-5 py-3.5 text-gray-400 text-xs">{i + 1}</td>
                        <td className="px-5 py-3.5">
                          <div className="font-semibold text-gray-900">{d.name}</div>
                          {d.surname && <div className="text-xs text-gray-400">{d.surname}</div>}
                        </td>
                        <td className="px-5 py-3.5">
                          <a href={`tel:${d.phone}`} className="text-indigo-600 hover:underline font-medium">{d.phone}</a>
                          {d.parentPhone && (
                            <div className="text-xs text-gray-400 mt-0.5">{d.parentPhone}</div>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          {group ? (
                            <div>
                              <div className="font-medium text-gray-800">{group.name}</div>
                              <div className="text-xs text-gray-400">{group.course?.name}</div>
                              {extraGroups > 0 && (
                                <div className="text-xs text-indigo-500 mt-0.5">+{extraGroups} ta guruh</div>
                              )}
                            </div>
                          ) : '—'}
                        </td>
                        <td className="px-5 py-3.5 text-right text-gray-500 text-xs font-medium">
                          {fmtNum(d.totalExpected)} UZS
                        </td>
                        <td className="px-5 py-3.5 text-right text-emerald-600 text-xs font-semibold">
                          {fmtNum(d.totalPaid)} UZS
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${debtBadge(d.debt)}`}>
                            {fmtNum(Math.round(d.debt))} UZS
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <button
                            onClick={() => { setPaymentStudent(d); setPaymentAmount(String(d.debt > 0 ? Math.round(d.debt) : '')); }}
                            className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 transition-colors cursor-pointer">
                            To&apos;lov
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                {filtered.length > 0 && (
                  <tfoot>
                    <tr className="bg-gray-50 border-t border-gray-100">
                      <td colSpan={4} className="px-5 py-3 text-xs font-semibold text-gray-500">Jami ({filtered.length} ta)</td>
                      <td className="px-5 py-3 text-right text-xs font-semibold text-gray-500">
                        {fmtNum(filtered.reduce((s, d) => s + d.totalExpected, 0))} UZS
                      </td>
                      <td className="px-5 py-3 text-right text-xs font-semibold text-emerald-600">
                        {fmtNum(filtered.reduce((s, d) => s + d.totalPaid, 0))} UZS
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span className="text-xs font-bold text-red-600">{fmtNum(Math.round(totalDebt))} UZS</span>
                      </td>
                      <td />
                    </tr>
                  </tfoot>
                )}
              </table>
            )}
          </div>
        </>
      )}

      {sortOpen && <div className="fixed inset-0 z-20" onClick={() => setSortOpen(false)} />}

      <Modal open={!!paymentStudent} onClose={() => setPaymentStudent(null)} title={`To'lov · ${paymentStudent?.name ?? ''}`} size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-500">Qarz: <span className="font-semibold text-red-600">{fmtNum(Math.round(paymentStudent?.debt ?? 0))} UZS</span></p>
          <Input
            label="Miqdor (UZS) *"
            type="number"
            value={paymentAmount}
            onChange={e => setPaymentAmount(e.target.value)}
            placeholder="0"
          />
          <Input
            label="Chegirma (UZS)"
            type="number"
            value={paymentDiscount}
            onChange={e => setPaymentDiscount(e.target.value)}
            placeholder="0"
          />
          <div className="flex gap-3 pt-2">
            <Button onClick={() => void submitPayment()} loading={payLoading} className="flex-1">Saqlash</Button>
            <Button variant="secondary" onClick={() => setPaymentStudent(null)} className="flex-1">Bekor</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
