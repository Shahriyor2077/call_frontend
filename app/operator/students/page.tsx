'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Toast from '@/components/ui/Toast';
import { Plus } from 'lucide-react';

const MONTH_UZ = ['yan', 'fev', 'mar', 'apr', 'may', 'iyn', 'iyl', 'avg', 'sen', 'okt', 'noy', 'dek'];
function fmtDate(d: string) {
  const dt = new Date(d);
  return `${dt.getDate()} ${MONTH_UZ[dt.getMonth()]}`;
}

export default function OperatorStudentsPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [payModal, setPayModal] = useState<any>(null);
  const [payConfirmModal, setPayConfirmModal] = useState(false);
  const [createModal, setCreateModal] = useState(false);
  const [enrollModal, setEnrollModal] = useState<any>(null);
  const [payForm, setPayForm] = useState({ amount: '', method: 'CASH', notes: '' });
  const [studentForm, setStudentForm] = useState({ name: '', phone: '', address: '', notes: '' });
  const [enrollForm, setEnrollForm] = useState({ groupId: '' });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  async function load() {
    const [studentsRes, groupsRes] = await Promise.all([
      api.get('/students'),
      api.get('/groups')
    ]);
    const studentsData = Array.isArray(studentsRes.data) ? studentsRes.data : (studentsRes.data?.data || []);
    const groupsData = Array.isArray(groupsRes.data) ? groupsRes.data : (groupsRes.data?.data || []);
    setStudents(studentsData);
    setGroups(groupsData);
  }
  useEffect(() => { void load(); }, []);

  async function submitPay() {
    if (!payModal) return;
    setLoading(true);
    try {
      await api.post('/payments', {
        studentId: payModal.id,
        amount: Number(payForm.amount),
        method: payForm.method,
        notes: payForm.notes,
        type: 'MONTHLY',
      });
      setPayConfirmModal(false);
      setPayModal(null);
      setPayForm({ amount: '', method: 'CASH', notes: '' });
      void load();
    } finally { setLoading(false); }
  }

  function handlePaymentSubmit() {
    if (!payForm.amount) {
      setToast({ message: 'Miqdorni kiriting', type: 'error' });
      return;
    }
    setPayConfirmModal(true);
  }

  async function createStudent() {
    if (!studentForm.name || !studentForm.phone) {
      setToast({ message: 'Ism va telefon majburiy!', type: 'error' });
      return;
    }
    setLoading(true);
    try {
      await api.post('/students', studentForm);
      setCreateModal(false);
      setStudentForm({ name: '', phone: '', address: '', notes: '' });
      setToast({ message: 'Talaba muvaffaqiyatli qo\'shildi', type: 'success' });
      void load();
    } catch (err: any) {
      setToast({ message: err?.response?.data?.message || 'Xatolik yuz berdi', type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  async function enrollStudent() {
    if (!enrollModal || !enrollForm.groupId) {
      setToast({ message: 'Guruhni tanlang!', type: 'error' });
      return;
    }
    setLoading(true);
    try {
      await api.post(`/students/${enrollModal.id}/enroll`, { groupId: enrollForm.groupId });
      setEnrollModal(null);
      setEnrollForm({ groupId: '' });
      setToast({ message: 'Talaba guruhga yozildi', type: 'success' });
      void load();
    } catch (err: any) {
      setToast({ message: err?.response?.data?.message || 'Xatolik yuz berdi', type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  const filtered = students.filter(s =>
    !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.phone.includes(search)
  );

  return (
    <div>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="flex items-start justify-between mb-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Talabalarim</h1>
          <p className="text-sm text-gray-400 mt-0.5">Mening talabalarim ro&apos;yxati</p>
        </div>
        <Button onClick={() => setCreateModal(true)}><Plus size={14} className="mr-1" />Yangi talaba</Button>
      </div>

      <div className="flex items-center gap-3 mt-5 mb-4">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            placeholder="Ism yoki telefon..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm w-56 focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
          />
        </div>
        <span className="ml-auto text-sm text-gray-400 bg-gray-100 px-3 py-1.5 rounded-xl">{filtered.length} ta</span>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="px-5 py-3 text-xs font-semibold text-gray-400 tracking-wide">TALABA</th>
              <th className="px-5 py-3 text-xs font-semibold text-gray-400 tracking-wide">GURUH</th>
              <th className="px-5 py-3 text-xs font-semibold text-gray-400 tracking-wide">TELEFON</th>
              <th className="px-5 py-3 text-xs font-semibold text-gray-400 tracking-wide">TO&apos;LANGAN</th>
              <th className="px-5 py-3 text-xs font-semibold text-gray-400 tracking-wide">HOLAT</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map(s => {
              const activeEnrollment = s.enrollments?.find((e: any) => e.isActive);
              const totalPaid = s.payments?.filter((p: any) => !p.isRefunded).reduce((sum: number, p: any) => sum + Number(p.amount), 0) ?? 0;
              const isActive = !!activeEnrollment;

              return (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={s.name} size="sm" />
                      <div>
                        <p className="font-medium text-gray-900">{s.name}</p>
                        <p className="text-xs text-gray-400">{fmtDate(s.createdAt)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-gray-600">{activeEnrollment?.group?.name ?? '—'}</td>
                  <td className="px-5 py-4 text-gray-400">{s.phone}</td>
                  <td className="px-5 py-4 font-medium text-gray-900">
                    {totalPaid > 0 ? `${totalPaid.toLocaleString()} so'm` : '—'}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                      {isActive ? 'Faol' : 'Nofaol'}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setPayModal(s)}
                        className="inline-flex items-center gap-1 text-xs px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 font-medium transition-colors"
                      >
                        <Plus size={11} />To&apos;lov
                      </button>
                      {!activeEnrollment && (
                        <button
                          onClick={() => { setEnrollModal(s); setEnrollForm({ groupId: '' }); }}
                          className="inline-flex items-center gap-1 text-xs px-3 py-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 font-medium transition-colors"
                        >
                          <Plus size={11} />Guruhga yozish
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="px-5 py-12 text-center text-gray-400">Talabalar topilmadi</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal open={!!payModal} onClose={() => setPayModal(null)} title={`To'lov · ${payModal?.name ?? ''}`} size="sm">
        <div className="space-y-4">
          <Input label="Miqdor (so'm) *" type="number" value={payForm.amount} onChange={e => setPayForm(p => ({ ...p, amount: e.target.value }))} placeholder="0" />
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Usul</label>
            <select className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none" value={payForm.method} onChange={e => setPayForm(p => ({ ...p, method: e.target.value }))}>
              <option value="CASH">Naqd</option>
              <option value="PAYME">Payme</option>
              <option value="CLICK">Click</option>
              <option value="BANK_TRANSFER">Bank o&apos;tkazmasi</option>
            </select>
          </div>
          <Input label="Izoh" value={payForm.notes} onChange={e => setPayForm(p => ({ ...p, notes: e.target.value }))} />
          <div className="flex gap-3 pt-2">
            <Button onClick={handlePaymentSubmit} loading={loading} className="flex-1">Saqlash</Button>
            <Button variant="secondary" onClick={() => setPayModal(null)} className="flex-1">Bekor</Button>
          </div>
        </div>
      </Modal>

      {/* Payment Confirmation Modal */}
      <Modal open={payConfirmModal} onClose={() => setPayConfirmModal(false)} title="To'lovni tasdiqlash" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            <span className="font-semibold text-gray-900">{payModal?.name}</span> uchun to'lovni tasdiqlaysizmi?
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Miqdor:</span>
              <span className="font-semibold text-gray-900">{Number(payForm.amount).toLocaleString()} so&apos;m</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Usul:</span>
              <span className="font-medium text-gray-900">
                {payForm.method === 'CASH' ? 'Naqd' : payForm.method === 'PAYME' ? 'Payme' : payForm.method === 'CLICK' ? 'Click' : 'Bank o\'tkazmasi'}
              </span>
            </div>
            {payForm.notes && (
              <div className="pt-2 border-t border-blue-200">
                <span className="text-xs text-gray-500">Izoh:</span>
                <p className="text-sm text-gray-700 mt-1">{payForm.notes}</p>
              </div>
            )}
          </div>
          <div className="flex gap-3 pt-2">
            <Button onClick={() => void submitPay()} loading={loading} className="flex-1">
              Ha, tasdiqlash
            </Button>
            <Button variant="secondary" onClick={() => setPayConfirmModal(false)} className="flex-1">
              Yo&apos;q
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={createModal} onClose={() => setCreateModal(false)} title="Yangi talaba" size="sm">
        <div className="space-y-4">
          <Input
            label="Ism *"
            value={studentForm.name}
            onChange={e => setStudentForm(p => ({ ...p, name: e.target.value }))}
            placeholder="Ism familiya"
          />
          <Input
            label="Telefon *"
            value={studentForm.phone}
            onChange={e => setStudentForm(p => ({ ...p, phone: e.target.value }))}
            placeholder="+998901234567"
          />
          <div className="flex gap-3 pt-2">
            <Button onClick={() => void createStudent()} loading={loading} className="flex-1">Saqlash</Button>
            <Button variant="secondary" onClick={() => setCreateModal(false)} className="flex-1">Bekor</Button>
          </div>
        </div>
      </Modal>

      <Modal open={!!enrollModal} onClose={() => setEnrollModal(null)} title={`Guruhga yozish · ${enrollModal?.name ?? ''}`} size="sm">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">Guruh *</label>
            <select
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none"
              value={enrollForm.groupId}
              onChange={e => setEnrollForm({ groupId: e.target.value })}
            >
              <option value="">— Tanlang —</option>
              {groups.map(g => (
                <option key={g.id} value={g.id}>
                  {g.name} · {g.course?.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <Button onClick={() => void enrollStudent()} loading={loading} className="flex-1">Yozish</Button>
            <Button variant="secondary" onClick={() => setEnrollModal(null)} className="flex-1">Bekor</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
