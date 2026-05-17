'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Avatar from '@/components/ui/Avatar';
import {
  ArrowLeft, Users, AlertCircle, Clock, Calendar,
  FileText, CreditCard, UserMinus, MoreVertical,
} from 'lucide-react';
import { useToast } from '@/components/ui/ToastProvider';

const STATUS_LABELS: Record<string, string> = {
  GATHERING: "To'plash", ACTIVE: 'Faol', COMPLETED: 'Yakunlangan', CANCELLED: 'Bekor',
};
const STATUS_COLOR: Record<string, string> = {
  ACTIVE: 'bg-green-50 text-green-700',
  GATHERING: 'bg-blue-50 text-blue-700',
  COMPLETED: 'bg-gray-100 text-gray-500',
  CANCELLED: 'bg-red-50 text-red-500',
};
const DAY_MAP: Record<number, string> = { 0: 'YA', 1: 'DU', 2: 'SE', 3: 'CH', 4: 'PA', 5: 'JU', 6: 'SH' };
const MONTHS = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyn', 'Iyl', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'];

function fmtD(d: Date | string) {
  const dt = new Date(d);
  return `${dt.getDate()} ${MONTHS[dt.getMonth()]} ${dt.getFullYear()}`;
}

type Tab = 'students' | 'debtors' | 'schedule';

export default function GroupDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();

  const toast = useToast();
  const [group, setGroup] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [payLoading, setPayLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('students');
  const [studentSearch, setStudentSearch] = useState('');

  const [paymentModal, setPaymentModal] = useState<any>(null);
  const [paymentConfirmModal, setPaymentConfirmModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ amount: '', discountAmount: '', method: 'CASH', notes: '', type: 'MONTHLY' });
  const [unenrollModal, setUnenrollModal] = useState<any>(null);
  const [unenrollLoading, setUnenrollLoading] = useState(false);

  const [detailModal, setDetailModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [finishModal, setFinishModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [courses, setCourses] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [editForm, setEditForm] = useState({
    courseId: '', teacherId: '', name: '', type: 'OFFLINE', maxStudents: '',
    price: '', room: '', platform: '', meetLink: '', address: '',
    days: [] as string[], startTime: '', endTime: '', startDate: '',
    duration: '', durationUnit: 'month',
  });

  const [historyStudent, setHistoryStudent] = useState<any>(null);
  const [historyPayments, setHistoryPayments] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get(`/groups/${id}`);
      setGroup(data);

      const groupPrice = Number(data.price || 0);
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const enrolledStudents = data.enrollments?.map((e: any) => e.student) || [];
      const enrollments = data.enrollments || [];

      const enriched = await Promise.all(
        enrolledStudents.map(async (student: any) => {
          const enrollment = enrollments.find((e: any) => e.student?.id === student.id);
          try {
            const { data: payData } = await api.get(`/payments?studentId=${student.id}&limit=50`);
            const allPayments: any[] = payData.data || [];
            const lastPayment = allPayments[0] || null;
            const monthTotal = allPayments
              .filter(p => !p.isRefunded && new Date(p.paidAt) >= startOfMonth)
              .reduce((sum, p) => sum + Number(p.amount) + Number(p.discountAmount || 0), 0);
            const debt = groupPrice > 0 ? Math.max(0, groupPrice - monthTotal) : 0;
            const overpayment = groupPrice > 0 ? Math.max(0, monthTotal - groupPrice) : 0;
            return { ...student, addedBy: enrollment?.operator ?? null, lastPayment, monthTotal, debt, overpayment };
          } catch {
            return { ...student, addedBy: null, lastPayment: null, monthTotal: 0, debt: groupPrice, overpayment: 0 };
          }
        })
      );
      setStudents(enriched);
    } catch {
      toast.error('Ma\'lumotlar yuklanmadi');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    void api.get('/courses').then(r => setCourses(r.data)).catch(() => {});
    void api.get('/teachers').then(r => setTeachers(r.data)).catch(() => {});
  }, [id]);

  function openEdit() {
    if (!group) return;
    setEditForm({
      courseId: group.courseId || '',
      teacherId: group.teacherId || '',
      name: group.name || '',
      type: group.type || 'OFFLINE',
      maxStudents: group.maxStudents ? String(group.maxStudents) : '',
      price: group.price ? String(group.price) : '',
      room: group.room || '',
      platform: group.platform || '',
      meetLink: group.meetLink || '',
      address: group.address || '',
      days: group.days || [],
      startTime: group.startTime || '',
      endTime: group.endTime || '',
      startDate: group.startDate ? group.startDate.split('T')[0] : '',
      duration: group.duration ? String(group.duration) : '',
      durationUnit: group.durationUnit || 'month',
    });
    setEditModal(true);
  }

  async function saveEdit() {
    if (!editForm.name.trim()) { toast.warning('Guruh nomini kiriting'); return; }
    setEditLoading(true);
    try {
      await api.put(`/groups/${id}`, {
        courseId:    editForm.courseId || undefined,
        teacherId:   editForm.teacherId || undefined,
        name:        editForm.name.trim(),
        type:        editForm.type,
        maxStudents: Number(editForm.maxStudents) || 0,
        price:       editForm.price ? Number(editForm.price) : undefined,
        room:        editForm.room || undefined,
        platform:    editForm.platform || undefined,
        meetLink:    editForm.meetLink || undefined,
        address:     editForm.address || undefined,
        days:        editForm.days,
        startTime:   editForm.startTime || '',
        endTime:     editForm.endTime || '',
        startDate:   editForm.startDate || undefined,
        duration:    editForm.duration ? Number(editForm.duration) : undefined,
        durationUnit: editForm.durationUnit || undefined,
      });
      toast.success('Saqlandi');
      setEditModal(false);
      await load();
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg.join(' ') : msg || 'Xatolik yuz berdi');
    } finally {
      setEditLoading(false);
    }
  }

  async function openHistory(student: any) {
    setHistoryLoading(true);
    setHistoryStudent(student);
    try {
      const { data } = await api.get(`/payments?studentId=${student.id}&limit=100`);
      setHistoryPayments(data.data || []);
    } catch { /* ignore */ } finally {
      setHistoryLoading(false);
    }
  }

  function handlePaymentSubmit() {
    if (!paymentForm.amount) { toast.warning('Miqdorni kiriting'); return; }
    setPaymentConfirmModal(true);
  }

  async function unenrollStudent() {
    if (!unenrollModal) return;
    setUnenrollLoading(true);
    try {
      await api.delete(`/groups/${id}/enroll/${unenrollModal.id}`);
      setUnenrollModal(null);
      await load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Xatolik yuz berdi');
    } finally {
      setUnenrollLoading(false);
    }
  }

  async function finishGroup() {
    if (!group) return;
    setActionLoading(true);
    try {
      await api.put(`/groups/${id}`, { status: 'COMPLETED' });
      setFinishModal(false);
      setActionsOpen(false);
      await load();
      toast.success('Guruh yakunlandi');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Guruhni yakunlashda xatolik yuz berdi');
    } finally {
      setActionLoading(false);
    }
  }

  async function deleteGroup() {
    if (!group) return;
    setActionLoading(true);
    try {
      await api.delete(`/groups/${id}`);
      setDeleteModal(false);
      setActionsOpen(false);
      toast.success('Guruh o\'chirildi');
      router.push('/admin/groups');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Guruhni o\'chirishda xatolik yuz berdi');
    } finally {
      setActionLoading(false);
    }
  }

  async function submitPayment() {
    if (!paymentModal) return;
    setPayLoading(true);
    try {
      const { data } = await api.post('/payments', {
        studentId: paymentModal.id,
        totalAmount: Number(paymentForm.amount),
        discountAmount: Number(paymentForm.discountAmount) || 0,
        method: paymentForm.method,
        notes: paymentForm.notes,
        type: paymentForm.type,
      });
      setPaymentConfirmModal(false);
      setPaymentModal(null);
      setPaymentForm({ amount: '', discountAmount: '', method: 'CASH', notes: '', type: 'MONTHLY' });
      router.push(`/admin/payments/${data.id}/print`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Xatolik yuz berdi');
    } finally {
      setPayLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-7 w-7 border-2 border-indigo-600 border-t-transparent" />
      </div>
    );
  }
  if (!group) {
    return <div className="text-center py-20 text-gray-400">Guruh topilmadi</div>;
  }

  const debtorCount = students.filter(s => s.debt > 0).length;
  const todayDay = DAY_MAP[new Date().getDay()];
  const hasSchedule = Boolean(group.days?.length && group.startTime && group.endTime);
  const hasClassToday = hasSchedule && group.days?.includes(todayDay);
  const todayTime = !hasSchedule
    ? 'Kiritilmagan'
    : hasClassToday
      ? `${group.startTime} - ${group.endTime}`
      : "Bugun dars yo'q";

  const filteredStudents = students.filter(s =>
    !studentSearch || s.name?.toLowerCase().includes(studentSearch.toLowerCase()) || s.phone?.includes(studentSearch)
  );
  const debtors = students.filter(s => s.debt > 0);

  const tabs: { key: Tab; label: string; icon: React.ReactNode; count?: number }[] = [
    { key: 'students', label: "O'quvchilar", icon: <Users size={14} />, count: students.length },
    { key: 'debtors', label: 'Qarzdorliklar', icon: <AlertCircle size={14} />, count: debtorCount },
    { key: 'schedule', label: 'Dars vaqtlari', icon: <Clock size={14} /> },
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-5 items-start">
      {actionsOpen && (
        <button
          aria-label="Menyuni yopish"
          className="fixed inset-0 z-30 cursor-default"
          onClick={() => setActionsOpen(false)}
        />
      )}
      {/* ── Left info card ── */}
      <div className="w-full lg:w-68 shrink-0">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          {/* Name */}
          <div className="flex items-start justify-between mb-1 relative">
            <h2 className="text-[17px] font-bold text-gray-900 leading-tight">{group.name}</h2>
            <button
              onClick={() => setActionsOpen(v => !v)}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 shrink-0"
            >
              <MoreVertical size={14} />
            </button>
            {actionsOpen && (
              <div className="absolute right-0 top-8 z-40 w-44 bg-white border border-gray-200 rounded-xl shadow-lg py-1.5">
                <button
                  onClick={() => {
                    setActionsOpen(false);
                    setFinishModal(true);
                  }}
                  disabled={group.status === 'COMPLETED'}
                  className="w-full text-left px-3.5 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:text-gray-300 disabled:hover:bg-white transition-colors"
                >
                  Guruhni yakunlash
                </button>
                <button
                  onClick={() => {
                    setActionsOpen(false);
                    setDeleteModal(true);
                  }}
                  className="w-full text-left px-3.5 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  Guruhni o'chirish
                </button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-4">
            <Calendar size={11} />
            <span>Yaratilgan: {group.createdAt ? fmtD(group.createdAt) : '—'}</span>
          </div>

          {/* Status badge */}
          <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full mb-4 ${STATUS_COLOR[group.status] ?? 'bg-gray-100 text-gray-500'}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
            {STATUS_LABELS[group.status] ?? group.status}
          </span>

          {/* Info rows */}
          <div className="space-y-3 border-t border-gray-50 pt-4">
            {[
              { label: "O'qituvchi", value: group.teacher?.name, colored: true },
              { label: 'Kurs', value: group.course?.name },
              { label: 'Narxi', value: group.price ? `${Number(group.price).toLocaleString()} UZS` : '—' },
              { label: 'Jadval', value: group.days?.length ? `${group.days.join(', ')} · ${group.startTime}–${group.endTime}` : '—' },
              { label: 'Boshlanish', value: group.startDate ? fmtD(group.startDate) : '—' },
              { label: "Max talaba", value: group.maxStudents ? String(group.maxStudents) : '—' },
              { label: 'Xona', value: group.room || group.platform || '—' },
            ].map(row => (
              <div key={row.label} className="flex items-start justify-between gap-2">
                <span className="text-xs text-gray-400 shrink-0">{row.label}</span>
                <span className={`text-xs font-medium text-right ${row.colored ? 'text-indigo-600' : 'text-gray-700'}`}>
                  {row.value || '—'}
                </span>
              </div>
            ))}
          </div>

          {/* Buttons */}
          <div className="mt-5 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => router.back()}
                className="flex items-center justify-center gap-1.5 py-2 bg-amber-400 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold transition-colors"
              >
                <ArrowLeft size={13} /> Orqaga
              </button>
              <button
                onClick={() => setDetailModal(true)}
                className="flex items-center justify-center gap-1.5 py-2 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl text-xs font-semibold transition-colors"
              >
                Batafsil
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right content ── */}
      <div className="flex-1 min-w-0 space-y-4">

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: "O'quvchilar soni", value: students.length, icon: <Users size={20} />, from: 'from-blue-500', to: 'to-indigo-600' },
            { label: 'Qarzdor o\'quvchilar', value: debtorCount, icon: <AlertCircle size={20} />, from: 'from-amber-400', to: 'to-orange-500' },
            { label: 'Bugungi dars vaqti', value: todayTime, icon: <Clock size={20} />, from: 'from-emerald-400', to: 'to-teal-600' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 mb-2 font-medium">{s.label}</p>
                <p className={`${String(s.value).length > 12 ? 'text-lg' : 'text-2xl'} font-bold text-gray-900 leading-none`}>
                  {s.value}
                </p>
              </div>
              <div className={`w-11 h-11 rounded-xl bg-linear-to-br ${s.from} ${s.to} flex items-center justify-center text-white shadow-sm shrink-0`}>
                {s.icon}
              </div>
            </div>
          ))}
        </div>

        {/* Tabs + content */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Tab bar */}
          <div className="flex border-b border-gray-100">
            {tabs.map(t => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`flex items-center gap-1.5 px-5 py-3.5 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === t.key
                    ? 'border-indigo-600 text-indigo-700'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <span className={activeTab === t.key ? 'text-indigo-500' : 'text-gray-400'}>{t.icon}</span>
                {t.label}
                {t.count !== undefined && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                    activeTab === t.key ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-500'
                  }`}>{t.count}</span>
                )}
              </button>
            ))}
          </div>

          {/* O'quvchilar tab */}
          {activeTab === 'students' && (
            <div>
              <div className="flex items-center gap-3 p-4 border-b border-gray-50">
                <div className="relative flex-1 max-w-56">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                  <input
                    value={studentSearch}
                    onChange={e => setStudentSearch(e.target.value)}
                    placeholder="Qidirish..."
                    className="pl-8 pr-3 py-2 w-full border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
                  />
                </div>
                <div className="flex-1" />
                <button
                  onClick={() => router.push(`/admin/groups/${id}/enroll`)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-colors"
                >
                  <Users size={14} /> Qo&apos;shish
                </button>
              </div>

              {filteredStudents.length === 0 ? (
                <div className="py-16 text-center text-gray-400">
                  <Users size={32} className="mx-auto mb-3 text-gray-300" />
                  <p className="text-sm">Talabalar topilmadi</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-50">
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide w-12">ID</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Ismi</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Telefon raqami</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Balans</th>
                      <th className="px-5 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wide w-28"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredStudents.map((s, idx) => {
                      const hasDebt = group.price && s.debt > 0;
                      const hasOver = group.price && s.overpayment > 0;
                      const isPaid = group.price && s.debt === 0 && s.monthTotal > 0;
                      return (
                        <tr
                          key={s.id}
                          onClick={() => router.push(`/admin/students/${s.id}`)}
                          className="hover:bg-gray-50/60 transition-colors cursor-pointer"
                        >
                          <td className="px-5 py-3.5 text-gray-400 text-xs font-mono">{idx + 1}</td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2.5">
                              <Avatar name={s.name} size="sm" />
                              <span className="font-medium text-gray-900 hover:text-indigo-600 transition-colors">{s.name}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-gray-500 text-sm">{s.phone}</td>
                          <td className="px-5 py-3.5">
                            {hasOver ? (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700">
                                +{Number(s.overpayment).toLocaleString()} UZS
                              </span>
                            ) : isPaid ? (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-green-50 text-green-700">
                                To&apos;liq
                              </span>
                            ) : hasDebt ? (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-red-50 text-red-700">
                                -{Number(s.debt).toLocaleString()} UZS
                              </span>
                            ) : (
                              <span className="text-xs text-gray-300">—</span>
                            )}
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openHistory(s);
                                }}
                                title="To'lovlar tarixi"
                                className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors"
                              >
                                <FileText size={14} />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPaymentModal(s);
                                  setPaymentForm({
                                    amount: s.debt > 0 ? String(s.debt) : (group.price ? String(group.price) : ''),
                                    discountAmount: '', method: 'CASH', notes: '', type: 'MONTHLY',
                                  });
                                }}
                                title="To'lov kiritish"
                                className="w-8 h-8 flex items-center justify-center rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 transition-colors"
                              >
                                <CreditCard size={14} />
                              </button>
                              <button
                                title="Guruhdan chiqarish"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setUnenrollModal(s);
                                }}
                                className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 hover:bg-red-100 text-red-500 transition-colors"
                              >
                                <UserMinus size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Qarzdorliklar tab */}
          {activeTab === 'debtors' && (
            <div>
              {debtors.length === 0 ? (
                <div className="py-16 text-center text-gray-400">
                  <AlertCircle size={32} className="mx-auto mb-3 text-gray-300" />
                  <p className="text-sm">Hech qanday qarzdor yo&apos;q</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-50">
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide w-12">ID</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Talaba</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Telefon</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">To&apos;langan</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Qarz</th>
                      <th className="px-5 py-3 text-right w-24"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {debtors.map((s, idx) => (
                      <tr
                        key={s.id}
                        onClick={() => router.push(`/admin/students/${s.id}`)}
                        className="hover:bg-red-50/30 transition-colors cursor-pointer"
                      >
                        <td className="px-5 py-3.5 text-gray-400 text-xs font-mono">{idx + 1}</td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <Avatar name={s.name} size="sm" />
                            <span className="font-medium text-gray-900">{s.name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-gray-500">{s.phone}</td>
                        <td className="px-5 py-3.5 text-sm text-gray-600">{Number(s.monthTotal).toLocaleString()} UZS</td>
                        <td className="px-5 py-3.5">
                          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-red-50 text-red-700">
                            -{Number(s.debt).toLocaleString()} UZS
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setPaymentModal(s);
                              setPaymentForm({ amount: String(s.debt), discountAmount: '', method: 'CASH', notes: '', type: 'MONTHLY' });
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg text-xs font-semibold transition-colors"
                          >
                            <CreditCard size={13} /> To&apos;lov
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Dars vaqtlari tab */}
          {activeTab === 'schedule' && (
            <div className="p-5">
              <div className="grid grid-cols-7 gap-2 mb-4">
                {['Du', 'Se', 'Chor', 'Pa', 'Ju', 'Sh', 'Yk'].map((label, i) => {
                  const key = ['DU','SE','CH','PA','JU','SH','YA'][i];
                  const isClass = group.days?.includes(key);
                  const isToday = DAY_MAP[new Date().getDay()] === key;
                  return (
                    <div key={key} className={`rounded-xl p-3 text-center border transition-all ${
                      isClass && isToday ? 'bg-amber-500 border-amber-500 text-white shadow-sm'
                        : isClass ? 'bg-amber-50 border-amber-200 text-amber-800'
                          : 'bg-gray-50 border-gray-100 text-gray-400'
                    }`}>
                      <p className="text-xs font-semibold">{label}</p>
                      {isClass && (
                        <p className={`text-[10px] mt-1 ${isToday ? 'text-amber-100' : 'text-amber-600'}`}>
                          {group.startTime}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600">
                <p><span className="font-medium">Vaqt:</span> {group.startTime} – {group.endTime}</p>
                {group.room && <p className="mt-1"><span className="font-medium">Xona:</span> {group.room}</p>}
                {group.address && <p className="mt-1"><span className="font-medium">Manzil:</span> {group.address}</p>}
                {group.platform && <p className="mt-1"><span className="font-medium">Platforma:</span> {group.platform}</p>}
                {group.meetLink && <p className="mt-1"><span className="font-medium">Link:</span> <a href={group.meetLink} className="text-indigo-600 underline">{group.meetLink}</a></p>}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Payment History Modal ── */}
      <Modal open={!!historyStudent} onClose={() => setHistoryStudent(null)} title={`${historyStudent?.name ?? ''} — To'lovlar tarixi`} size="lg">
        {(() => {
          const METHOD_LABEL: Record<string, string> = { CASH: 'Naqd', PAYME: 'Payme', CLICK: 'Click', BANK_TRANSFER: 'Bank' };
          const METHOD_COLOR: Record<string, string> = { CASH: 'bg-green-50 text-green-700', PAYME: 'bg-cyan-50 text-cyan-700', CLICK: 'bg-orange-50 text-orange-700', BANK_TRANSFER: 'bg-purple-50 text-purple-700' };
          const totalPaid = historyPayments.filter(p => !p.isRefunded).reduce((s, p) => s + Number(p.amount) + Number(p.discountAmount || 0), 0);
          return (
            <div>
              <div className="flex items-center gap-4 mb-5 p-4 bg-gray-50 rounded-xl">
                <Avatar name={historyStudent?.name ?? ''} />
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{historyStudent?.name}</p>
                  <p className="text-sm text-gray-500">{historyStudent?.phone}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400 mb-0.5">Jami to&apos;langan</p>
                  <p className="text-xl font-bold text-green-700">{totalPaid.toLocaleString()} so&apos;m</p>
                </div>
              </div>
              {historyLoading ? (
                <div className="text-center py-8 text-gray-400">Yuklanmoqda...</div>
              ) : historyPayments.length === 0 ? (
                <div className="text-center py-10 text-gray-400 text-sm">Hali to&apos;lovlar yo&apos;q</div>
              ) : (
                <div className="rounded-xl border overflow-hidden mb-4">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b">
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Sana</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Tur</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Usul</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Izoh</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase">Summa</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {historyPayments.map(p => (
                        <tr key={p.id} className={`hover:bg-gray-50 ${p.isRefunded ? 'opacity-50' : ''}`}>
                          <td className="px-4 py-3 text-xs text-gray-500">{fmtD(p.paidAt)}</td>
                          <td className="px-4 py-3 text-xs text-gray-600">{p.type === 'MONTHLY' ? 'Oylik' : 'Avans'}</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${METHOD_COLOR[p.method] ?? 'bg-gray-100 text-gray-600'}`}>
                              {METHOD_LABEL[p.method] ?? p.method}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-400">{p.notes || '—'}</td>
                          <td className="px-4 py-3 text-right">
                            <span className={`font-semibold text-sm ${p.isRefunded ? 'line-through text-gray-400' : 'text-green-700'}`}>
                              +{Number(p.amount).toLocaleString()} so&apos;m
                              {Number(p.discountAmount || 0) > 0 && (
                                <span className="ml-2 text-xs text-amber-600">
                                  chegirma {Number(p.discountAmount).toLocaleString()} so'm
                                </span>
                              )}
                            </span>
                            {p.isRefunded && <span className="ml-1 text-xs text-red-500">qaytarilgan</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t">
                <Button onClick={() => { setPaymentModal(historyStudent); setPaymentForm({ amount: historyStudent?.debt > 0 ? String(historyStudent.debt) : (group?.price ? String(group.price) : ''), discountAmount: '', method: 'CASH', notes: '', type: 'MONTHLY' }); }}>
                  + To&apos;lov kiritish
                </Button>
                <Button variant="secondary" onClick={() => setHistoryStudent(null)}>Yopish</Button>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* ── Payment Modal ── */}
      <Modal open={!!paymentModal} onClose={() => setPaymentModal(null)} title={`To'lov · ${paymentModal?.name ?? ''}`} size="sm">
        <div className="space-y-4">
          <Input label="Miqdor (so'm) *" type="text" value={paymentForm.amount ? Number(paymentForm.amount).toLocaleString('en-US') : ''} onChange={e => setPaymentForm(p => ({ ...p, amount: e.target.value.replace(/\D/g, '') }))} placeholder="0" />
          <Input label="Chegirma (so'm)" type="text" value={paymentForm.discountAmount ? Number(paymentForm.discountAmount).toLocaleString('en-US') : ''} onChange={e => setPaymentForm(p => ({ ...p, discountAmount: e.target.value.replace(/\D/g, '') }))} placeholder="0" />
          <Select label="Usul" value={paymentForm.method} onChange={e => setPaymentForm(p => ({ ...p, method: e.target.value }))}>
            <option value="CASH">Naqd</option>
            <option value="PAYME">Payme</option>
            <option value="CLICK">Click</option>
            <option value="BANK_TRANSFER">Bank o&apos;tkazmasi</option>
          </Select>
          <Select label="Tur" value={paymentForm.type} onChange={e => setPaymentForm(p => ({ ...p, type: e.target.value }))}>
            <option value="MONTHLY">Oylik</option>
            <option value="ADVANCE">Avans</option>
          </Select>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">Izoh</label>
            <textarea className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/30" rows={2} value={paymentForm.notes} onChange={e => setPaymentForm(p => ({ ...p, notes: e.target.value }))} />
          </div>
          <div className="flex gap-3 pt-2">
            <Button onClick={handlePaymentSubmit} loading={payLoading} className="flex-1">Saqlash</Button>
            <Button variant="secondary" onClick={() => setPaymentModal(null)} className="flex-1">Bekor</Button>
          </div>
        </div>
      </Modal>

      {/* ── Unenroll Confirm Modal ── */}
      <Modal open={!!unenrollModal} onClose={() => setUnenrollModal(null)} title="Guruhdan chiqarish" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            <span className="font-semibold text-gray-900">{unenrollModal?.name}</span>ni guruhdan chiqarishni xohlaysizmi?
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-sm text-amber-800">⚠️ Bu amal talabani guruhdan olib tashlaydi.</p>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="danger" onClick={() => void unenrollStudent()} loading={unenrollLoading} className="flex-1">Chiqarish</Button>
            <Button variant="secondary" onClick={() => setUnenrollModal(null)} className="flex-1">Bekor</Button>
          </div>
        </div>
      </Modal>

      {/* ── Detail Modal ── */}
      <Modal open={finishModal} onClose={() => setFinishModal(false)} title="Guruhni yakunlash" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            <span className="font-semibold text-gray-900">{group?.name}</span> guruhini yakunlangan holatga o'tkazmoqchimisiz?
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
            <p className="text-sm text-amber-800">
              Yakunlangan guruhga yangi o'quvchi biriktirib bo'lmaydi.
            </p>
          </div>
          <div className="flex gap-3 pt-2">
            <Button onClick={() => void finishGroup()} loading={actionLoading} className="flex-1">
              Yakunlash
            </Button>
            <Button variant="secondary" onClick={() => setFinishModal(false)} className="flex-1">Bekor</Button>
          </div>
        </div>
      </Modal>

      <Modal open={deleteModal} onClose={() => setDeleteModal(false)} title="Guruhni o'chirish" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            <span className="font-semibold text-gray-900">{group?.name}</span> guruhini o'chirishni xohlaysizmi?
          </p>
          <div className="bg-red-50 border border-red-100 rounded-xl p-3">
            <p className="text-sm text-red-700">
              Bu amal guruhni ro'yxatdan olib tashlaydi. Guruhdagi biriktirish ma'lumotlari ko'rinmaydi.
            </p>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="danger" onClick={() => void deleteGroup()} loading={actionLoading} className="flex-1">
              O'chirish
            </Button>
            <Button variant="secondary" onClick={() => setDeleteModal(false)} className="flex-1">Bekor</Button>
          </div>
        </div>
      </Modal>

      <Modal open={detailModal} onClose={() => setDetailModal(false)} title="Guruh haqida" size="sm">
        {group && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">{group.name}</h2>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLOR[group.status] ?? 'bg-gray-100 text-gray-500'}`}>
                {STATUS_LABELS[group.status] ?? group.status}
              </span>
            </div>

            <div className="divide-y divide-gray-50">
              {[
                { label: 'Kurs',          value: group.course?.name },
                { label: "O'qituvchi",    value: group.teacher ? `${group.teacher.name}${group.teacher.specialty ? ` · ${group.teacher.specialty}` : ''}` : null },
                { label: 'Tur',           value: group.type === 'ONLINE' ? 'Online' : 'Offline' },
                { label: 'Narxi',         value: group.price ? `${Number(group.price).toLocaleString()} UZS` : null },
                { label: 'Xona / Platforma', value: group.room || group.platform || null },
                { label: 'Manzil',        value: group.address || null },
                { label: 'Meet linki',    value: group.meetLink || null },
                { label: 'Dars kunlari',  value: group.days?.length ? group.days.join(', ') : null },
                { label: 'Dars vaqti',    value: group.startTime && group.endTime ? `${group.startTime} – ${group.endTime}` : null },
                { label: 'Boshlanish',    value: group.startDate ? fmtD(group.startDate) : null },
                { label: 'Davomiyligi',   value: group.duration ? `${group.duration} ${group.durationUnit === 'week' ? 'hafta' : 'oy'}` : null },
                { label: 'Max talaba',    value: group.maxStudents ? `${students.length} / ${group.maxStudents}` : null },
                { label: 'Yaratilgan',    value: group.createdAt ? fmtD(group.createdAt) : null },
              ].map(row => row.value ? (
                <div key={row.label} className="flex items-start justify-between gap-4 py-2.5">
                  <span className="text-sm text-gray-400 shrink-0">{row.label}</span>
                  <span className="text-sm font-medium text-gray-800 text-right">{row.value}</span>
                </div>
              ) : null)}
            </div>

            <div className="flex gap-3 pt-2">
              <Button onClick={() => { setDetailModal(false); openEdit(); }} variant="secondary" className="flex-1">
                Tahrirlash
              </Button>
              <Button onClick={() => setDetailModal(false)} className="flex-1">Yopish</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Edit Group Modal ── */}
      <Modal open={editModal} onClose={() => setEditModal(false)} title="Guruhni tahrirlash" size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Select label="Kurs" value={editForm.courseId} onChange={e => setEditForm(p => ({ ...p, courseId: e.target.value }))}>
              <option value="">— Tanlang —</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
            <Input label="Guruh nomi *" value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} />
          </div>
          <Select label="O'qituvchi" value={editForm.teacherId} onChange={e => setEditForm(p => ({ ...p, teacherId: e.target.value }))}>
            <option value="">— Tanlang —</option>
            {teachers.map(t => <option key={t.id} value={t.id}>{t.name}{t.specialty ? ` (${t.specialty})` : ''}</option>)}
          </Select>
          <div className="grid grid-cols-3 gap-3">
            <Select label="Tur" value={editForm.type} onChange={e => setEditForm(p => ({ ...p, type: e.target.value }))}>
              <option value="OFFLINE">Offline</option>
              <option value="ONLINE">Online</option>
            </Select>
            <Input label="Max talabalar" type="number" value={editForm.maxStudents} onChange={e => setEditForm(p => ({ ...p, maxStudents: e.target.value }))} onWheel={e => e.currentTarget.blur()} />
            <Input label="Narx (so'm)" type="number" value={editForm.price} onChange={e => setEditForm(p => ({ ...p, price: e.target.value }))} onWheel={e => e.currentTarget.blur()} />
          </div>
          {editForm.type === 'ONLINE' ? (
            <div className="grid grid-cols-2 gap-3">
              <Input label="Meet linki" value={editForm.meetLink} onChange={e => setEditForm(p => ({ ...p, meetLink: e.target.value }))} placeholder="https://zoom.us/..." />
              <Input label="Platforma" value={editForm.platform} onChange={e => setEditForm(p => ({ ...p, platform: e.target.value }))} placeholder="Zoom, Meet..." />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <Input label="Xona" value={editForm.room} onChange={e => setEditForm(p => ({ ...p, room: e.target.value }))} />
              <Input label="Manzil" value={editForm.address} onChange={e => setEditForm(p => ({ ...p, address: e.target.value }))} />
            </div>
          )}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Dars kunlari</label>
            <div className="flex flex-wrap gap-2">
              {[{value:'DU',label:'Du'},{value:'SE',label:'Se'},{value:'CH',label:'Chor'},{value:'PA',label:'Pa'},{value:'JU',label:'Ju'},{value:'SH',label:'Sh'},{value:'YA',label:'Yk'}].map(d => (
                <button key={d.value} type="button"
                  onClick={() => setEditForm(p => ({ ...p, days: p.days.includes(d.value) ? p.days.filter(x => x !== d.value) : [...p.days, d.value] }))}
                  className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${editForm.days.includes(d.value) ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-300 text-gray-600 hover:border-indigo-400'}`}>
                  {d.label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Input label="Boshlanish vaqti" type="time" value={editForm.startTime} onChange={e => setEditForm(p => ({ ...p, startTime: e.target.value }))} />
            <Input label="Tugash vaqti" type="time" value={editForm.endTime} onChange={e => setEditForm(p => ({ ...p, endTime: e.target.value }))} />
            <Input label="Boshlanish sanasi" type="date" value={editForm.startDate} onChange={e => setEditForm(p => ({ ...p, startDate: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Davomiyligi" type="number" value={editForm.duration} onChange={e => setEditForm(p => ({ ...p, duration: e.target.value }))} onWheel={e => e.currentTarget.blur()} />
            <Select label="Birlik" value={editForm.durationUnit} onChange={e => setEditForm(p => ({ ...p, durationUnit: e.target.value }))}>
              <option value="month">Oy</option>
              <option value="week">Hafta</option>
            </Select>
          </div>
          <div className="flex gap-3 pt-2">
            <Button onClick={() => void saveEdit()} loading={editLoading} className="flex-1">Saqlash</Button>
            <Button variant="secondary" onClick={() => setEditModal(false)} className="flex-1">Bekor</Button>
          </div>
        </div>
      </Modal>

      {/* ── Payment Confirm Modal ── */}
      <Modal open={paymentConfirmModal} onClose={() => setPaymentConfirmModal(false)} title="To'lovni tasdiqlash" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            <span className="font-semibold text-gray-900">{paymentModal?.name}</span> uchun to&apos;lovni tasdiqlaysizmi?
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-2">
            {[
              ['Miqdor', `${Number(paymentForm.amount).toLocaleString()} so'm`],
              ['Chegirma', `${(Number(paymentForm.discountAmount) || 0).toLocaleString()} so'm`],
              ['Usul', paymentForm.method === 'CASH' ? 'Naqd' : paymentForm.method === 'PAYME' ? 'Payme' : paymentForm.method === 'CLICK' ? 'Click' : 'Bank'],
              ['Tur', paymentForm.type === 'MONTHLY' ? 'Oylik' : 'Avans'],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between text-sm">
                <span className="text-gray-500">{k}:</span>
                <span className="font-semibold text-gray-900">{v}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-3 pt-2">
            <Button onClick={() => void submitPayment()} loading={payLoading} className="flex-1">Ha, tasdiqlash</Button>
            <Button variant="secondary" onClick={() => setPaymentConfirmModal(false)} className="flex-1">Yo&apos;q</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
