'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useToast } from '@/components/ui/ToastProvider';
import { CreditCard, Banknote, Building2, X, Plus } from 'lucide-react';

const QUICK_AMOUNTS = [200000, 500000, 1000000];

const METHODS = [
  { value: 'CASH',          label: 'Naqd',   Icon: Banknote  },
  { value: 'PAYME',         label: 'Payme',  Icon: CreditCard },
  { value: 'CLICK',         label: 'Click',  Icon: CreditCard },
  { value: 'BANK_TRANSFER', label: 'Bank',   Icon: Building2 },
];

export default function OperatorStudentPaymentPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const toast = useToast();

  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [amount, setAmount] = useState('');
  const [discountAmount, setDiscountAmount] = useState('');
  const [method, setMethod] = useState('PAYME');
  const [notes, setNotes] = useState('');
  const [type, setType] = useState('MONTHLY');

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  useEffect(() => {
    api.get(`/students/${id}`)
      .then(({ data }) => { setStudent(data); setLoading(false); })
      .catch(() => { toast.error('Talaba topilmadi'); router.push('/operator/students'); });
  }, [id]);

  if (loading || !student) return (
    <div className="flex items-center justify-center h-64 text-gray-400 text-sm">Yuklanmoqda...</div>
  );

  const allPay: any[] = student.payments || [];
  const totalPaidMonth = allPay
    .filter((p: any) => !p.isRefunded && new Date(p.paidAt) >= monthStart)
    .reduce((s: number, p: any) => s + Number(p.amount) + Number(p.discountAmount || 0), 0);
  const price = Number(student.enrollments?.find((e: any) => e.isActive)?.group?.price || 0);
  const balance = price > 0 ? totalPaidMonth - price : 0;

  const totalAmt = Number(amount) || 0;
  const discount = Number(discountAmount) || 0;
  const paidAmt = totalAmt - discount;

  async function submit() {
    if (!amount || totalAmt <= 0) { toast.warning("To'lov miqdorini kiriting"); return; }
    if (discount > totalAmt) { toast.warning("Chegirma to'lov miqdoridan katta bo'lishi mumkin emas"); return; }
    setSubmitting(true);
    try {
      await api.post('/payments', {
        studentId: id,
        totalAmount: totalAmt,
        discountAmount: discount,
        method, notes, type,
      });
      toast.success("To'lov muvaffaqiyatli saqlandi");
      router.push('/operator/students');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Xatolik yuz berdi');
    } finally { setSubmitting(false); }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900 tracking-wide">TO&apos;LOV</h1>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <span className="hover:text-indigo-600 cursor-pointer" onClick={() => router.push('/operator/students')}>O&apos;quvchilar</span>
          <span>›</span>
          <span className="text-gray-600 font-medium">To&apos;lov</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Left — student & amount */}
        <div className="col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
          {/* O'quvchi */}
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-2">O&apos;quvchi</label>
            <div className="px-4 py-3 bg-indigo-50 rounded-xl text-sm font-medium text-gray-800">
              {student.name}{student.surname ? ` ${student.surname}` : ''} | {student.phone}
            </div>
          </div>

          {/* Balans */}
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-2">Balans</label>
            <div className={`px-4 py-3 rounded-xl text-sm font-semibold ${balance < 0 ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
              {balance.toLocaleString()} UZS
            </div>
          </div>

          {/* Asl summa */}
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-2">Asl summa (qarz)</label>
            <input
              type="text"
              value={amount ? Number(amount).toLocaleString('en-US') : ''}
              onChange={e => setAmount(e.target.value.replace(/\D/g, ''))}
              placeholder="0"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/30 text-gray-800"
            />
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              {QUICK_AMOUNTS.map(q => (
                <button
                  key={q}
                  onClick={() => setAmount(String(q))}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                    amount === String(q)
                      ? 'bg-indigo-600 border-indigo-600 text-white'
                      : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-600'
                  }`}
                >
                  {q.toLocaleString()}
                  <X size={11} />
                </button>
              ))}
              <button
                onClick={() => setAmount('')}
                className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:border-indigo-300 hover:text-indigo-600 transition-colors"
              >
                <Plus size={13} />
              </button>
            </div>
          </div>

          {/* Chegirma */}
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-2">Chegirma</label>
            <input
              type="text"
              value={discountAmount ? Number(discountAmount).toLocaleString('en-US') : ''}
              onChange={e => setDiscountAmount(e.target.value.replace(/\D/g, ''))}
              placeholder="0"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/30 text-gray-800"
            />
          </div>

          {/* Kassaga tushadi preview */}
          {discount > 0 && totalAmt > 0 && (
            <div className={`rounded-xl px-4 py-3 flex items-center justify-between border ${
              paidAmt < 0
                ? 'bg-red-50 border-red-200'
                : 'bg-amber-50 border-amber-200'
            }`}>
              <span className={`text-sm ${paidAmt < 0 ? 'text-red-700' : 'text-amber-700'}`}>
                Kassaga tushadi:
              </span>
              <span className={`text-lg font-bold ${paidAmt < 0 ? 'text-red-800' : 'text-amber-800'}`}>
                {paidAmt.toLocaleString()} UZS
              </span>
            </div>
          )}

          {/* To'lov turi */}
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-2">To&apos;lov turi</label>
            <div className="flex gap-2">
              {[{ v: 'MONTHLY', l: 'Oylik' }, { v: 'ADVANCE', l: 'Avans' }].map(t => (
                <button key={t.v} onClick={() => setType(t.v)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                    type === t.v ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-gray-200 text-gray-600 hover:border-indigo-300'
                  }`}>
                  {t.l}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right — method & notes */}
        <div className="col-span-2 space-y-5">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <p className="text-sm font-semibold text-gray-700 mb-3">To&apos;lov turini tanlang</p>
            <div className="grid grid-cols-2 gap-2">
              {METHODS.map(({ value, label, Icon }) => (
                <button
                  key={value}
                  onClick={() => setMethod(value)}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                    method === value
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                      : 'border-gray-200 text-gray-600 hover:border-indigo-300'
                  }`}
                >
                  <Icon size={15} /> {label}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <p className="text-sm font-semibold text-gray-700 mb-2">Izoh</p>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={4}
              placeholder="Izoh..."
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/30 resize-none text-gray-700"
            />
            <button
              onClick={() => setNotes(`${new Date().toLocaleDateString('uz-UZ')} oy uchun to'lov`)}
              className="text-xs text-indigo-500 hover:text-indigo-700 mt-2 flex items-center gap-1 transition-colors"
            >
              Tavsiyaviy izoh qo&apos;shish → <Plus size={11} />
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-5 bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-4">
        <button
          onClick={() => router.push('/operator/students')}
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          ← Orqaga
        </button>
        <button
          onClick={() => void submit()}
          disabled={submitting}
          className="flex items-center gap-2 px-8 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
        >
          <CreditCard size={16} />
          {submitting ? 'Saqlanmoqda...' : "To'lash"}
        </button>
      </div>
    </div>
  );
}
