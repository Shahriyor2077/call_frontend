'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import { Plus } from 'lucide-react';

const METHOD_LABEL: Record<string, string> = { CASH: 'Naqd', PAYME: 'Payme', CLICK: 'Click', BANK_TRANSFER: 'Bank' };
const METHOD_COLOR: Record<string, string> = {
  CASH: 'bg-green-50 text-green-700',
  PAYME: 'bg-blue-50 text-blue-700',
  CLICK: 'bg-indigo-50 text-indigo-700',
  BANK_TRANSFER: 'bg-gray-100 text-gray-600',
};

const MONTHS_UZ = ['yan', 'fev', 'mar', 'apr', 'may', 'iyn', 'iyl', 'avg', 'sen', 'okt', 'noy', 'dek'];
function fmtDate(d: string) {
  const dt = new Date(d);
  return `${dt.getDate()} ${MONTHS_UZ[dt.getMonth()]} ${dt.getFullYear()}`;
}

export default function OperatorPaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ studentId: '', amount: '', method: 'CASH', notes: '', type: 'MONTHLY' });
  const [loading, setLoading] = useState(false);

  async function load() {
    const [p, s] = await Promise.all([api.get('/payments'), api.get('/students')]);
    const payments = Array.isArray(p.data) ? p.data : (p.data?.data || []);
    const students = Array.isArray(s.data) ? s.data : (s.data?.data || []);
    setPayments(payments.filter((x: any) => !x.isRefunded));
    setStudents(students);
  }
  useEffect(() => { void load(); }, []);

  async function submit() {
    setLoading(true);
    try {
      await api.post('/payments', { ...form, amount: Number(form.amount) });
      setModal(false);
      setForm({ studentId: '', amount: '', method: 'CASH', notes: '', type: 'MONTHLY' });
      void load();
    } finally { setLoading(false); }
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">To&apos;lovlar</h1>
          <p className="text-sm text-gray-400 mt-0.5">Kiritilgan to&apos;lovlar tarixi</p>
        </div>
        <Button onClick={() => setModal(true)}><Plus size={14} className="mr-1" />Yangi to&apos;lov</Button>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="px-5 py-3 text-xs font-semibold text-gray-400 tracking-wide">SANA</th>
              <th className="px-5 py-3 text-xs font-semibold text-gray-400 tracking-wide">TALABA</th>
              <th className="px-5 py-3 text-xs font-semibold text-gray-400 tracking-wide">KURS</th>
              <th className="px-5 py-3 text-xs font-semibold text-gray-400 tracking-wide">USUL</th>
              <th className="px-5 py-3 text-xs font-semibold text-gray-400 tracking-wide text-right">SUMMA</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {payments.map(p => {
              const activeEnrollment = p.student?.enrollments?.find((e: any) => e.isActive);
              return (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-5 py-4 text-gray-400 text-xs">{fmtDate(p.paidAt)}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <Avatar name={p.student?.name ?? '?'} size="sm" />
                      <span className="font-medium text-gray-900">{p.student?.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-gray-500 text-xs">
                    {activeEnrollment?.group?.course?.name ?? '—'}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${METHOD_COLOR[p.method] ?? 'bg-gray-100 text-gray-600'}`}>
                      {METHOD_LABEL[p.method] ?? p.method}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right font-semibold text-gray-900">
                    {Number(p.amount).toLocaleString()} so&apos;m
                  </td>
                </tr>
              );
            })}
            {payments.length === 0 && (
              <tr><td colSpan={5} className="px-5 py-12 text-center text-gray-400">To&apos;lovlar yo&apos;q</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="Yangi to'lov" size="sm">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Talaba *</label>
            <select
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none"
              value={form.studentId}
              onChange={e => setForm(p => ({ ...p, studentId: e.target.value }))}
            >
              <option value="">— Tanlang —</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.name} · {s.phone}</option>)}
            </select>
          </div>
          <Input label="Miqdor (so'm) *" type="number" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} placeholder="0" />
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Usul</label>
            <select className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none" value={form.method} onChange={e => setForm(p => ({ ...p, method: e.target.value }))}>
              <option value="CASH">Naqd</option>
              <option value="PAYME">Payme</option>
              <option value="CLICK">Click</option>
              <option value="BANK_TRANSFER">Bank o&apos;tkazmasi</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Tur</label>
            <select className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none" value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
              <option value="MONTHLY">Oylik</option>
              <option value="ADVANCE">Avans</option>
            </select>
          </div>
          <Input label="Izoh" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
          <div className="flex gap-3 pt-2">
            <Button onClick={() => void submit()} loading={loading} className="flex-1">Saqlash</Button>
            <Button variant="secondary" onClick={() => setModal(false)} className="flex-1">Bekor</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
