'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Printer, ArrowLeft } from 'lucide-react';

const METHOD_LABEL: Record<string, string> = {
  CASH: 'Naqd pul', PAYME: 'Payme', CLICK: 'Click', BANK_TRANSFER: 'Bank o\'tkazmasi',
};
const TYPE_LABEL: Record<string, string> = { MONTHLY: 'Oylik to\'lov', ADVANCE: 'Avans to\'lov' };

function pad(n: number) { return String(n).padStart(2, '0'); }
function fmtDateTime(d: string) {
  const dt = new Date(d);
  return `${pad(dt.getDate())}.${pad(dt.getMonth() + 1)}.${dt.getFullYear()} ${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
}

export default function PaymentPrintPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [payment, setPayment] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/payments/${id}`)
      .then(({ data }) => { setPayment(data); setLoading(false); })
      .catch(() => { setLoading(false); });
  }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-gray-400 text-sm">Yuklanmoqda...</div>
  );
  if (!payment) return (
    <div className="flex items-center justify-center h-64 text-gray-400 text-sm">To&apos;lov topilmadi</div>
  );

  const center = payment.center;
  const dt = fmtDateTime(payment.paidAt);
  const [datePart, timePart] = dt.split(' ');

  return (
    <div>
      {/* Screen toolbar — hidden when printing */}
      <div className="flex items-center justify-between mb-6 print:hidden">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft size={15} /> Orqaga
        </button>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-colors"
        >
          <Printer size={15} /> Chop etish
        </button>
      </div>

      {/* Receipt */}
      <div className="max-w-sm mx-auto bg-white border border-gray-200 rounded-2xl shadow-sm p-8 print:shadow-none print:border-none print:rounded-none print:p-6">
        {/* Header */}
        <div className="text-center mb-6">
          <p className="text-xs text-gray-400 mb-1">
            {new Date(payment.paidAt).toLocaleDateString('ru-RU', { day:'2-digit', month:'2-digit', year:'numeric' })}
            {' '}
            {timePart}
          </p>
          <h1 className="text-xl font-black text-gray-900 tracking-wider uppercase mb-4">
            To&apos;lov kvitansiyasi
          </h1>
          {center && (
            <div className="text-xs text-gray-500 space-y-0.5">
              {center.name && <p className="font-medium text-gray-700">{center.name}</p>}
              {center.address && <p>Manzil: {center.address}</p>}
              {center.phone && <p>Telefon: {center.phone}</p>}
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-dashed border-gray-300 my-4" />

        {/* Date row */}
        <div className="flex justify-between text-xs text-gray-500 mb-4">
          <span>{datePart}</span>
          <span>{timePart}</span>
        </div>

        {/* Details */}
        <div className="space-y-3">
          {[
            ['O\'quvchi',       payment.student?.name ?? '—'],
            ['To\'lov turi',    TYPE_LABEL[payment.type] ?? payment.type],
            ['To\'lov shakli',  METHOD_LABEL[payment.method] ?? payment.method],
            ["To'lovni olgan",  payment.operator?.name ?? '—'],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between text-sm">
              <span className="text-gray-500">{label}</span>
              <span className="font-medium text-gray-800">{value}</span>
            </div>
          ))}

          <div className="border-t border-dashed border-gray-200 pt-3 flex justify-between items-center">
            <span className="text-sm font-bold text-gray-700">To&apos;lov miqdori</span>
            <span className="text-xl font-black text-gray-900">
              {Number(payment.amount).toLocaleString()} UZS
            </span>
          </div>

          {payment.notes && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Izoh</span>
              <span className="font-medium text-gray-800 text-right max-w-40">{payment.notes}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-dashed border-gray-300 mt-6 pt-4 text-center">
          <p className="text-sm font-semibold text-indigo-600">To&apos;lovingiz uchun rahmat!</p>
        </div>
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print\\:shadow-none, .print\\:shadow-none * { visibility: visible; }
          .print\\:shadow-none { position: absolute; left: 0; top: 0; width: 100%; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
    </div>
  );
}
