'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { useToast } from '@/components/ui/ToastProvider';
import {
  ArrowLeft, RefreshCw, Wallet, AlertCircle,
  Users, CreditCard, Phone, User, Calendar, FileText, Pencil, UserMinus,
} from 'lucide-react';

const MONTHS = ['Yan','Fev','Mar','Apr','May','Iyn','Iyl','Avg','Sen','Okt','Noy','Dek'];
const MONTH_FULL = ['Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr'];
function fmtDate(d: string) {
  const dt = new Date(d);
  return `${String(dt.getDate()).padStart(2,'0')}.${String(dt.getMonth()+1).padStart(2,'0')}.${dt.getFullYear()}`;
}
function fmtDateShort(d: string) {
  const dt = new Date(d);
  return `${dt.getDate()} ${MONTHS[dt.getMonth()]} ${dt.getFullYear()}`;
}

const METHOD_LABEL: Record<string,string> = { CASH:'Naqd', PAYME:'Payme', CLICK:'Click', BANK_TRANSFER:'Bank' };
const METHOD_COLOR: Record<string,string> = {
  CASH:'bg-green-50 text-green-700', PAYME:'bg-cyan-50 text-cyan-700',
  CLICK:'bg-orange-50 text-orange-700', BANK_TRANSFER:'bg-purple-50 text-purple-700',
};
const GENDER_LABEL: Record<string,string> = { MALE:'Erkak', FEMALE:'Ayol' };

type Tab = 'groups' | 'payments' | 'debts';

export default function StudentDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const toast = useToast();

  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('groups');

  const [payModal, setPayModal] = useState(false);
  const [payForm, setPayForm] = useState({ amount: '', discountAmount: '', method: 'CASH', notes: '', type: 'MONTHLY' });
  const [payConfirm, setPayConfirm] = useState(false);
  const [payLoading, setPayLoading] = useState(false);

  const [editModal, setEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', surname: '', phone: '', parentPhone: '', gender: 'MALE', birthDate: '', notes: '' });
  const [editLoading, setEditLoading] = useState(false);

  const [unenrollTarget, setUnenrollTarget] = useState<any>(null);
  const [unenrollLoading, setUnenrollLoading] = useState(false);

  async function load() {
    try {
      const { data } = await api.get(`/students/${id}`);
      setStudent(data);
    } catch {
      toast.error('Talaba topilmadi');
      router.push('/admin/students');
    } finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-gray-400 text-sm">Yuklanmoqda...</div>
  );
  if (!student) return null;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const activeEnrollment = student.enrollments?.find((e: any) => e.isActive);
  const allEnrollments = student.enrollments || [];
  const allPayments: any[] = student.payments || [];

  const monthPayments = allPayments.filter((p: any) => !p.isRefunded && new Date(p.paidAt) >= monthStart);
  const totalPaidMonth = monthPayments.reduce((s: number, p: any) => s + Number(p.amount) + Number(p.discountAmount || 0), 0);
  const price = Number(activeEnrollment?.group?.price || 0);
  const balance = price > 0 ? totalPaidMonth - price : 0;
  const debt = balance < 0 ? Math.abs(balance) : 0;

  async function submitPayment() {
    if (!payForm.amount) return;
    setPayLoading(true);
    try {
      const { data } = await api.post('/payments', {
        studentId: id, amount: Number(payForm.amount),
        discountAmount: Number(payForm.discountAmount) || 0,
        method: payForm.method, notes: payForm.notes, type: payForm.type,
      });
      setPayConfirm(false); setPayModal(false);
      setPayForm({ amount: '', discountAmount: '', method: 'CASH', notes: '', type: 'MONTHLY' });
      router.push(`/admin/payments/${data.id}/print`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Xatolik yuz berdi');
    } finally { setPayLoading(false); }
  }

  async function saveEdit() {
    setEditLoading(true);
    try {
      await api.put(`/students/${id}`, {
        name: editForm.name.trim(), phone: editForm.phone.trim(), gender: editForm.gender,
        surname: editForm.surname || undefined, parentPhone: editForm.parentPhone || undefined,
        birthDate: editForm.birthDate || undefined, notes: editForm.notes || undefined,
      });
      setEditModal(false);
      toast.success("Ma'lumotlar yangilandi");
      void load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Xatolik yuz berdi');
    } finally { setEditLoading(false); }
  }

  async function unenroll() {
    if (!unenrollTarget) return;
    setUnenrollLoading(true);
    try {
      await api.delete(`/groups/${unenrollTarget.groupId}/enroll/${id}`);
      setUnenrollTarget(null);
      toast.success("Talaba guruhdan chiqarildi");
      void load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Xatolik yuz berdi');
    } finally { setUnenrollLoading(false); }
  }

  const tabs = [
    { key: 'groups' as Tab,   label: 'Guruhlar',      Icon: Users },
    { key: 'payments' as Tab, label: "To'lovlar",     Icon: CreditCard },
    { key: 'debts' as Tab,    label: 'Qarzdorliklar', Icon: AlertCircle },
  ];

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/admin/students')}
            className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors">
            <ArrowLeft size={16} className="text-gray-500" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-wide">O&apos;QUVCHINI KO&apos;RISH</h1>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <span className="hover:text-indigo-600 cursor-pointer" onClick={() => router.push('/admin/students')}>O&apos;quvchilar</span>
          <span>›</span>
          <span className="text-gray-600 font-medium">O&apos;quvchini ko&apos;rish</span>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Left panel */}
        <div className="w-full lg:w-72 shrink-0 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex flex-col items-center mb-6">
            <Avatar name={student.name} size="xl" />
            <h2 className="mt-3 font-semibold text-gray-900 text-lg text-center">
              {student.name}{student.surname ? ` ${student.surname}` : ''}
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              Tizimga qo&apos;shilgan sana {fmtDate(student.createdAt)}
            </p>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                <Phone size={13} className="text-gray-500" />
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Telefon raqami</p>
                <p className="font-medium text-gray-800">{student.phone}</p>
              </div>
            </div>
            {student.parentPhone && (
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                  <Phone size={13} className="text-gray-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Ota-onasining telefoni</p>
                  <p className="font-medium text-gray-800">{student.parentPhone}</p>
                </div>
              </div>
            )}
            {student.gender && (
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                  <User size={13} className="text-gray-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Jinsi</p>
                  <p className="font-medium text-gray-800">{GENDER_LABEL[student.gender] ?? student.gender}</p>
                </div>
              </div>
            )}
            {student.birthDate && (
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                  <Calendar size={13} className="text-gray-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Tug&apos;ilgan sanasi</p>
                  <p className="font-medium text-gray-800">{fmtDate(student.birthDate)}</p>
                </div>
              </div>
            )}
            {student.notes && (
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                  <FileText size={13} className="text-gray-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Izoh</p>
                  <p className="font-medium text-gray-800">{student.notes}</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2 mt-6">
            <button
              onClick={() => {
                setEditForm({
                  name: student.name || '', surname: student.surname || '',
                  phone: student.phone || '', parentPhone: student.parentPhone || '',
                  gender: student.gender || 'MALE',
                  birthDate: student.birthDate ? student.birthDate.split('T')[0] : '',
                  notes: student.notes || '',
                });
                setEditModal(true);
              }}
              className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Pencil size={14} /> O&apos;zgartirish
            </button>
            <button
              onClick={() => router.push(`/admin/students/payment/${id}`)}
              className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              <CreditCard size={14} /> To&apos;lov
            </button>
          </div>
        </div>

        {/* Right panel */}
        <div className="flex-1 min-w-0 space-y-5">
          {/* Stat cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-gray-500">Balans</p>
                <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center">
                  <Wallet size={16} className="text-white" />
                </div>
              </div>
              <p className={`text-2xl font-bold ${balance < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                {balance.toLocaleString()} UZS
              </p>
              <button onClick={() => void load()} className="flex items-center gap-1 text-xs text-gray-400 mt-2 hover:text-indigo-600 transition-colors">
                <RefreshCw size={11} /> Yangilash
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-gray-500">Qarzdorlik</p>
                <div className="w-9 h-9 rounded-xl bg-red-500 flex items-center justify-center">
                  <AlertCircle size={16} className="text-white" />
                </div>
              </div>
              <p className={`text-2xl font-bold ${debt > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                {debt > 0 ? debt.toLocaleString() : '0'}
              </p>
              <p className="text-xs text-gray-400 mt-2">Qarzdorlik</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex border-b border-gray-100">
              {tabs.map(({ key, label, Icon }) => (
                <button key={key} onClick={() => setTab(key)}
                  className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-colors border-b-2 ${
                    tab === key ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-800'
                  }`}>
                  <Icon size={15} /> {label}
                </button>
              ))}
            </div>

            {/* Guruhlar tab */}
            {tab === 'groups' && (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50/60 border-b border-gray-100">
                    {['ID', 'Guruh nomi', "Qo'shilgan sana", 'Holat', ''].map(h => (
                      <th key={h} className="px-5 py-3 text-xs font-semibold text-gray-400 text-left tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {allEnrollments.length === 0 && (
                    <tr><td colSpan={5} className="px-5 py-12 text-center text-gray-400 text-sm">Guruhlar yo&apos;q</td></tr>
                  )}
                  {allEnrollments.map((e: any, i: number) => (
                    <tr key={e.id ?? i} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-5 py-3.5 text-gray-400 text-xs font-mono">{allEnrollments.length - i}</td>
                      <td className="px-5 py-3.5">
                        <span
                          onClick={() => router.push(`/admin/groups/${e.groupId}`)}
                          className="text-indigo-600 hover:text-indigo-800 font-medium cursor-pointer"
                        >
                          {e.group?.name ?? '—'}
                        </span>
                        {e.group?.course?.name && (
                          <p className="text-xs text-gray-400">{e.group.course.name}</p>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-gray-500 text-xs">
                        {e.enrolledAt ? fmtDate(e.enrolledAt) : '—'}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${
                          e.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {e.isActive ? 'Faol' : 'Chiqarildi'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        {e.isActive && (
                          <button
                            onClick={() => setUnenrollTarget(e)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-xs font-medium transition-colors"
                          >
                            <UserMinus size={13} /> Chiqarish
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* To'lovlar tab */}
            {tab === 'payments' && (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50/60 border-b border-gray-100">
                    {['Sana', 'Miqdor', 'Usul', 'Tur', 'Izoh'].map(h => (
                      <th key={h} className="px-5 py-3 text-xs font-semibold text-gray-400 text-left tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {allPayments.length === 0 && (
                    <tr><td colSpan={5} className="px-5 py-12 text-center text-gray-400 text-sm">To&apos;lovlar yo&apos;q</td></tr>
                  )}
                  {allPayments.map((p: any) => (
                    <tr key={p.id} className={`hover:bg-gray-50/60 transition-colors ${p.isRefunded ? 'opacity-50' : ''}`}>
                      <td className="px-5 py-3.5 text-gray-500 text-xs">{fmtDateShort(p.paidAt)}</td>
                      <td className="px-5 py-3.5">
                        <span className={`font-semibold ${p.isRefunded ? 'line-through text-gray-400' : 'text-green-700'}`}>
                          +{Number(p.amount).toLocaleString()} so&apos;m
                        </span>
                        {Number(p.discountAmount || 0) > 0 && (
                          <span className="ml-2 text-xs font-medium text-amber-600">
                            chegirma {Number(p.discountAmount).toLocaleString()} so&apos;m
                          </span>
                        )}
                        {p.isRefunded && <span className="ml-2 text-xs text-red-500">qaytarilgan</span>}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${METHOD_COLOR[p.method] ?? 'bg-gray-100 text-gray-600'}`}>
                          {METHOD_LABEL[p.method] ?? p.method}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-gray-600">
                        {p.type === 'MONTHLY' ? 'Oylik' : 'Avans'}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-gray-400">{p.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Qarzdorliklar tab */}
            {tab === 'debts' && (
              <div className="px-5 py-10 text-center text-gray-400 text-sm">
                {debt > 0 ? (
                  <div>
                    <AlertCircle size={40} className="mx-auto mb-3 text-red-300" />
                    <p className="text-lg font-bold text-red-600">{debt.toLocaleString()} UZS</p>
                    <p className="text-xs mt-1">
                      {MONTH_FULL[now.getMonth()]} {now.getFullYear()} uchun qarzdorlik
                    </p>
                  </div>
                ) : (
                  <p>Qarzdorlik yo&apos;q</p>
                )}
              </div>
            )}
          </div>

          {/* Enrollment history */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800 text-sm">Guruhga qo&apos;shilish va chiqarilishlar tarixi</h3>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50/60 border-b border-gray-100">
                  {['ID', 'Guruh nomi', 'Harakat', 'Sana'].map(h => (
                    <th key={h} className="px-5 py-3 text-xs font-semibold text-gray-400 text-left tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {allEnrollments.length === 0 && (
                  <tr><td colSpan={4} className="px-5 py-10 text-center text-gray-400 text-sm">Tarix yo&apos;q</td></tr>
                )}
                {allEnrollments.map((e: any, i: number) => (
                  <tr key={`hist-${e.id ?? i}`} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-5 py-3.5 text-gray-400 text-xs font-mono">{allEnrollments.length - i}</td>
                    <td className="px-5 py-3.5">
                      <span
                        onClick={() => router.push(`/admin/groups/${e.groupId}`)}
                        className="text-indigo-600 hover:text-indigo-800 font-medium cursor-pointer"
                      >
                        {e.group?.name ?? '—'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${
                        e.isActive ? 'bg-teal-50 text-teal-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {e.isActive ? 'Biriktirildi' : 'Chiqarildi'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 text-xs">
                      {e.enrolledAt ? fmtDate(e.enrolledAt) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* To'lov modal */}
      <Modal open={payModal} onClose={() => setPayModal(false)} title={`To'lov · ${student.name}`} size="sm">
        <div className="space-y-4">
          <Input label="Miqdor (so'm) *" type="text" value={payForm.amount ? Number(payForm.amount).toLocaleString('en-US') : ''}
            onChange={e => setPayForm(p => ({ ...p, amount: e.target.value.replace(/\D/g, '') }))} placeholder="0" />
          <Input label="Chegirma (so'm)" type="text" value={payForm.discountAmount ? Number(payForm.discountAmount).toLocaleString('en-US') : ''}
            onChange={e => setPayForm(p => ({ ...p, discountAmount: e.target.value.replace(/\D/g, '') }))} placeholder="0" />
          <Select label="Usul" value={payForm.method} onChange={e => setPayForm(p => ({ ...p, method: e.target.value }))}>
            <option value="CASH">Naqd</option>
            <option value="PAYME">Payme</option>
            <option value="CLICK">Click</option>
            <option value="BANK_TRANSFER">Bank o&apos;tkazmasi</option>
          </Select>
          <Select label="Tur" value={payForm.type} onChange={e => setPayForm(p => ({ ...p, type: e.target.value }))}>
            <option value="MONTHLY">Oylik</option>
            <option value="ADVANCE">Avans</option>
          </Select>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">Izoh</label>
            <textarea className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/30 resize-none" rows={2}
              value={payForm.notes} onChange={e => setPayForm(p => ({ ...p, notes: e.target.value }))} />
          </div>
          <div className="flex gap-3 pt-2">
            <Button onClick={() => { if (!payForm.amount) { toast.warning('Miqdorni kiriting'); return; } setPayConfirm(true); }} className="flex-1">Saqlash</Button>
            <Button variant="secondary" onClick={() => setPayModal(false)} className="flex-1">Bekor</Button>
          </div>
        </div>
      </Modal>

      <Modal open={payConfirm} onClose={() => setPayConfirm(false)} title="To'lovni tasdiqlash" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600"><span className="font-semibold text-gray-900">{student.name}</span> uchun to&apos;lovni tasdiqlaysizmi?</p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
            {[['Miqdor', `${Number(payForm.amount).toLocaleString()} so'm`], ['Chegirma', `${(Number(payForm.discountAmount) || 0).toLocaleString()} so'm`], ['Usul', METHOD_LABEL[payForm.method] ?? payForm.method], ['Tur', payForm.type === 'MONTHLY' ? 'Oylik' : 'Avans']].map(([k, v]) => (
              <div key={k} className="flex justify-between text-sm">
                <span className="text-gray-600">{k}:</span>
                <span className="font-semibold">{v}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-3 pt-2">
            <Button onClick={() => void submitPayment()} loading={payLoading} className="flex-1">Ha, tasdiqlash</Button>
            <Button variant="secondary" onClick={() => setPayConfirm(false)} className="flex-1">Yo&apos;q</Button>
          </div>
        </div>
      </Modal>

      {/* Guruhdan chiqarish confirm */}
      <Modal open={!!unenrollTarget} onClose={() => setUnenrollTarget(null)} title="Guruhdan chiqarish" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            <span className="font-semibold text-gray-900">{student?.name}</span> talabani{' '}
            <span className="font-semibold text-gray-900">{unenrollTarget?.group?.name}</span> guruhidan chiqarishni tasdiqlaysizmi?
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-sm text-amber-800">⚠️ Talaba guruhdan chiqariladi, ammo ma&apos;lumotlari saqlanadi.</p>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="danger" onClick={() => void unenroll()} loading={unenrollLoading} className="flex-1">
              Ha, chiqarish
            </Button>
            <Button variant="secondary" onClick={() => setUnenrollTarget(null)} className="flex-1">Bekor</Button>
          </div>
        </div>
      </Modal>

      {/* Tahrirlash modal */}
      <Modal open={editModal} onClose={() => setEditModal(false)} title="Talabani tahrirlash" size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Ismi *" value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} />
            <Input label="Familiyasi" value={editForm.surname} onChange={e => setEditForm(p => ({ ...p, surname: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Telefon *" value={editForm.phone} onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))} placeholder="+998901234567" />
            <Input label="Ota-onasining telefoni" value={editForm.parentPhone} onChange={e => setEditForm(p => ({ ...p, parentPhone: e.target.value }))} placeholder="+998901234567" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Jinsi</label>
              <div className="flex gap-2">
                {[{ v: 'MALE', l: 'Erkak' }, { v: 'FEMALE', l: 'Ayol' }].map(g => (
                  <button key={g.v} type="button" onClick={() => setEditForm(p => ({ ...p, gender: g.v }))}
                    className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-colors ${editForm.gender === g.v ? 'bg-indigo-700 border-indigo-700 text-white' : 'border-gray-200 text-gray-600'}`}>
                    {g.l}
                  </button>
                ))}
              </div>
            </div>
            <Input label="Tug'ilgan sanasi" type="date" value={editForm.birthDate} onChange={e => setEditForm(p => ({ ...p, birthDate: e.target.value }))} />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">Izoh</label>
            <textarea value={editForm.notes} onChange={e => setEditForm(p => ({ ...p, notes: e.target.value }))} rows={2}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/30 resize-none" />
          </div>
          <div className="flex gap-3 pt-2">
            <Button onClick={() => void saveEdit()} loading={editLoading} className="flex-1">Saqlash</Button>
            <Button variant="secondary" onClick={() => setEditModal(false)} className="flex-1">Bekor</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
