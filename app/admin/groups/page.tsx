'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Avatar from '@/components/ui/Avatar';
import { MoreVertical } from 'lucide-react';

const DAYS_OPTIONS = [
  { value: 'DU', label: 'Du' },
  { value: 'SE', label: 'Se' },
  { value: 'CH', label: 'Chor' },
  { value: 'PA', label: 'Pa' },
  { value: 'JU', label: 'Ju' },
  { value: 'SH', label: 'Sh' },
  { value: 'YA', label: 'Yk' },
];

const STATUS_LABELS: Record<string, string> = {
  GATHERING: "To'plash", ACTIVE: 'Faol', COMPLETED: 'Yakunlangan', CANCELLED: 'Bekor',
};

export default function GroupsPage() {
  const searchParams = useSearchParams();
  const [groups, setGroups] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [filterCourse, setFilterCourse] = useState(searchParams.get('courseId') ?? '');
  const [filterStatus, setFilterStatus] = useState('');
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [statusModal, setStatusModal] = useState<any>(null);
  const [deleteModal, setDeleteModal] = useState<any>(null);
  const [studentsModal, setStudentsModal] = useState<any>(null);
  const [paymentModal, setPaymentModal] = useState<any>(null);
  const [paymentConfirmModal, setPaymentConfirmModal] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [paymentForm, setPaymentForm] = useState({ amount: '', method: 'CASH', notes: '', type: 'MONTHLY' });
  const [form, setForm] = useState({
    courseId: '', teacherId: '', name: '', type: 'OFFLINE', maxStudents: '',
    price: '', meetLink: '', platform: '', room: '', address: '',
    days: [] as string[], startTime: '', endTime: '', startDate: '',
    duration: '', durationUnit: 'month',
  });
  const [loading, setLoading] = useState(false);
  const [studentHistory, setStudentHistory] = useState<any>(null);
  const [studentHistoryPayments, setStudentHistoryPayments] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  async function load() {
    const [g, c, t] = await Promise.all([api.get('/groups'), api.get('/courses'), api.get('/teachers')]);
    setGroups(g.data);
    setCourses(c.data);
    setTeachers(t.data);
  }
  useEffect(() => { void load(); }, []);

  function toggleDay(d: string) {
    setForm(p => ({ ...p, days: p.days.includes(d) ? p.days.filter(x => x !== d) : [...p.days, d] }));
  }

  async function save() {
    if (!form.courseId)            return alert('Kursni tanlang');
    if (!form.name.trim())         return alert('Guruh nomini kiriting');
    if (form.days.length === 0)    return alert('Kamida bitta dars kunini tanlang');
    if (!form.startTime)           return alert('Boshlanish vaqtini kiriting');
    if (!form.endTime)             return alert('Tugash vaqtini kiriting');
    if (!form.maxStudents)         return alert('Maksimal talabalar sonini kiriting');

    setLoading(true);
    const payload = {
      courseId:    form.courseId,
      name:        form.name.trim(),
      type:        form.type,
      maxStudents: Number(form.maxStudents),
      days:        form.days,
      startTime:   form.startTime,
      endTime:     form.endTime,
      price:        form.price       ? Number(form.price)    : undefined,
      teacherId:    form.teacherId   || undefined,
      startDate:    form.startDate   || undefined,
      meetLink:     form.meetLink    || undefined,
      platform:     form.platform    || undefined,
      room:         form.room        || undefined,
      address:      form.address     || undefined,
      duration:     form.duration    ? Number(form.duration) : undefined,
      durationUnit: form.durationUnit || undefined,
    };

    try {
      if (editing) {
        await api.put(`/groups/${editing.id}`, payload);
      } else {
        await api.post('/groups', payload);
      }
      setModal(false);
      setEditing(null);
      await load();
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      alert(Array.isArray(msg) ? msg.join('\n') : msg || 'Guruh saqlashda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  }

  function openEdit(g: any) {
    setEditing(g);
    setForm({
      courseId: g.courseId,
      teacherId: g.teacherId || '',
      name: g.name,
      type: g.type,
      maxStudents: String(g.maxStudents),
      price: g.price ? String(g.price) : '',
      meetLink: g.meetLink || '',
      platform: g.platform || '',
      room: g.room || '',
      address: g.address || '',
      days: g.days || [],
      startTime: g.startTime || '',
      endTime: g.endTime || '',
      startDate: g.startDate ? g.startDate.split('T')[0] : '',
      duration: g.duration ? String(g.duration) : '',
      durationUnit: g.durationUnit || 'month',
    });
    setModal(true);
  }

  async function viewStudents(g: any) {
    setLoading(true);
    try {
      const { data } = await api.get(`/groups/${g.id}`);
      const enrolledStudents = data.enrollments?.map((e: any) => e.student) || [];

      const groupPrice = Number(g.price || 0);
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const enrollments = data.enrollments || [];
    const studentsWithPayments = await Promise.all(
        enrolledStudents.map(async (student: any) => {
          const enrollment = enrollments.find((e: any) => e.student?.id === student.id);
          try {
            const { data: payData } = await api.get(`/payments?studentId=${student.id}&limit=50`);
            const allPayments: any[] = payData.data || [];
            const lastPayment = allPayments[0] || null;

            let nextPaymentDate: Date | null = null;
            if (lastPayment) {
              const d = new Date(lastPayment.paidAt);
              nextPaymentDate = new Date(d.getFullYear(), d.getMonth() + 1, d.getDate());
            }

            const monthTotal = allPayments
              .filter(p => !p.isRefunded && new Date(p.paidAt) >= startOfMonth)
              .reduce((sum, p) => sum + Number(p.amount), 0);

            const debt = groupPrice > 0 ? Math.max(0, groupPrice - monthTotal) : 0;
            const overpayment = groupPrice > 0 ? Math.max(0, monthTotal - groupPrice) : 0;

            return { ...student, addedBy: enrollment?.student?.operator ?? null, lastPayment, nextPaymentDate, monthTotal, debt, overpayment };
          } catch {
            return { ...student, addedBy: null, lastPayment: null, nextPaymentDate: null, monthTotal: 0, debt: groupPrice, overpayment: 0 };
          }
        })
      );

      setStudents(studentsWithPayments);
      setStudentsModal(g);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(g: any, status: string) {
    await api.put(`/groups/${g.id}`, { status });
    setStatusModal(null);
    void load();
  }

  async function deleteGroup() {
    if (!deleteModal) return;
    setLoading(true);
    try {
      await api.delete(`/groups/${deleteModal.id}`);
      setDeleteModal(null);
      await load();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  }

  async function openStudentHistory(student: any) {
    setHistoryLoading(true);
    try {
      const { data } = await api.get(`/payments?studentId=${student.id}&limit=100`);
      setStudentHistoryPayments(data.data || []);
      setStudentHistory(student);
    } catch {
      // ignore
    } finally {
      setHistoryLoading(false);
    }
  }

  async function submitPayment() {
    if (!paymentModal) return;
    setLoading(true);
    try {
      await api.post('/payments', {
        studentId: paymentModal.id,
        amount: Number(paymentForm.amount),
        method: paymentForm.method,
        notes: paymentForm.notes,
        type: paymentForm.type,
      });
      setPaymentConfirmModal(false);
      setPaymentModal(null);
      setPaymentForm({ amount: '', method: 'CASH', notes: '', type: 'MONTHLY' });
      if (studentsModal) await viewStudents(studentsModal);
      // Refresh history if open
      if (studentHistory?.id === paymentModal.id) {
        const { data } = await api.get(`/payments?studentId=${paymentModal.id}&limit=100`);
        setStudentHistoryPayments(data.data || []);
      }
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  }

  function handlePaymentSubmit() {
    if (!paymentForm.amount) {
      alert('Miqdorni kiriting');
      return;
    }
    setPaymentConfirmModal(true);
  }

  const filtered = groups.filter(g => {
    if (search && !g.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterCourse && g.courseId !== filterCourse) return false;
    if (filterStatus && g.status !== filterStatus) return false;
    return true;
  });

  function resetForm() {
    setForm({ courseId: '', teacherId: '', name: '', type: 'OFFLINE', maxStudents: '', price: '', meetLink: '', platform: '', room: '', address: '', days: [], startTime: '', endTime: '', startDate: '', duration: '', durationUnit: 'month' });
    setEditing(null);
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Guruhlar</h1>
          <p className="text-sm text-gray-400 mt-0.5">Faol va rejalashtirilgan o&apos;quv guruhlari.</p>
        </div>
        <Button onClick={() => { resetForm(); setModal(true); }}>+ Yangi guruh</Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mt-5 mb-4">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            placeholder="Guruh nomi..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm w-52 focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
          />
        </div>
        <select
          value={filterCourse}
          onChange={e => setFilterCourse(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 focus:outline-none"
        >
          <option value="">Barcha kurslar</option>
          {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 focus:outline-none"
        >
          <option value="">Barcha holatlar</option>
          {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <span className="ml-auto text-sm text-gray-400 bg-gray-100 px-3 py-1.5 rounded-xl">{filtered.length} ta</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="px-5 py-3 text-xs font-semibold text-gray-400 tracking-wide">GURUH</th>
              <th className="px-5 py-3 text-xs font-semibold text-gray-400 tracking-wide">KURS</th>
              <th className="px-5 py-3 text-xs font-semibold text-gray-400 tracking-wide">O&apos;QITUVCHI</th>
              <th className="px-5 py-3 text-xs font-semibold text-gray-400 tracking-wide">JADVAL</th>
              <th className="px-5 py-3 text-xs font-semibold text-gray-400 tracking-wide">XONA</th>
              <th className="px-5 py-3 text-xs font-semibold text-gray-400 tracking-wide">TALABALAR</th>
              <th className="px-5 py-3 text-xs font-semibold text-gray-400 tracking-wide">HOLAT</th>
              <th className="px-5 py-3 text-xs font-semibold text-gray-400 tracking-wide">BOSHLANISH</th>
              <th className="px-5 py-3 text-xs font-semibold text-gray-400 tracking-wide w-12"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map(g => {
              const enrolled = g._count?.enrollments ?? 0;
              const pct = Math.min(100, (enrolled / (g.maxStudents || 1)) * 100);
              return (
                <tr key={g.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => viewStudents(g)}>
                  <td className="px-5 py-4 font-medium text-gray-900">{g.name}</td>
                  <td className="px-5 py-4 text-indigo-600 font-medium">{g.course?.name}</td>
                  <td className="px-5 py-4">
                    {g.teacher ? (
                      <div className="flex items-center gap-2">
                        <Avatar name={g.teacher.name} size="sm" />
                        <span className="text-gray-700">{g.teacher.name}</span>
                      </div>
                    ) : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-5 py-4 text-xs text-gray-500">
                    <div>{g.days?.join(', ')}</div>
                    <div className="text-gray-400">{g.startTime}–{g.endTime}</div>
                  </td>
                  <td className="px-5 py-4 text-gray-600">{g.room || g.platform || <span className="text-gray-300">—</span>}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">{enrolled}/{g.maxStudents}</span>
                      <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${g.status === 'ACTIVE' ? 'bg-green-50 text-green-700'
                      : g.status === 'GATHERING' ? 'bg-blue-50 text-blue-700'
                        : 'bg-gray-100 text-gray-500'
                      }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${g.status === 'ACTIVE' ? 'bg-green-500' : g.status === 'GATHERING' ? 'bg-blue-500' : 'bg-gray-400'}`} />
                      {STATUS_LABELS[g.status] ?? g.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-gray-400 text-xs">
                    {g.startDate ? new Date(g.startDate).toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                  </td>
                  <td className="px-5 py-4">
                    <button
                      onClick={(e) => { e.stopPropagation(); setStatusModal(g); }}
                      className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400"
                    >
                      <MoreVertical size={15} />
                    </button>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={9} className="px-5 py-12 text-center text-gray-400">Guruhlar topilmadi</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Modal */}
      <Modal open={modal} onClose={() => { setModal(false); setEditing(null); }} title={editing ? 'Guruhni tahrirlash' : 'Yangi guruh'} size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Kurs *</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" value={form.courseId} onChange={e => setForm(p => ({ ...p, courseId: e.target.value }))}>
                <option value="">— Tanlang —</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <Input label="Guruh nomi *" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">O&apos;qituvchi</label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" value={form.teacherId} onChange={e => setForm(p => ({ ...p, teacherId: e.target.value }))}>
              <option value="">— Tanlang —</option>
              {teachers.map(t => <option key={t.id} value={t.id}>{t.name}{t.specialty ? ` (${t.specialty})` : ''}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Tur</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
                <option value="OFFLINE">Offline</option>
                <option value="ONLINE">Online</option>
              </select>
            </div>
            <Input label="Max talabalar *" type="number" value={form.maxStudents} onChange={e => setForm(p => ({ ...p, maxStudents: e.target.value }))} />
            <Input label="Narx (so'm)" type="number" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} />
          </div>
          {form.type === 'ONLINE' ? (
            <div className="grid grid-cols-2 gap-3">
              <Input label="Meet linki" value={form.meetLink} onChange={e => setForm(p => ({ ...p, meetLink: e.target.value }))} placeholder="https://zoom.us/..." />
              <Input label="Platforma" value={form.platform} onChange={e => setForm(p => ({ ...p, platform: e.target.value }))} placeholder="Zoom, Meet..." />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <Input label="Xona" value={form.room} onChange={e => setForm(p => ({ ...p, room: e.target.value }))} placeholder="" />
              <Input label="Manzil" value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} />
            </div>
          )}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Dars kunlari *</label>
            <div className="flex flex-wrap gap-2">
              {DAYS_OPTIONS.map(d => (
                <button key={d.value} type="button" onClick={() => toggleDay(d.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${form.days.includes(d.value) ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-300 text-gray-600 hover:border-indigo-400'}`}>
                  {d.label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Boshlanish vaqti *"
              type="time"
              value={form.startTime}
              onChange={e => setForm(p => ({ ...p, startTime: e.target.value }))}
            />
            <Input
              label="Tugash vaqti *"
              type="time"
              value={form.endTime}
              onChange={e => setForm(p => ({ ...p, endTime: e.target.value }))}
            />
            <Input
              label="Boshlanish sanasi"
              type="date"
              value={form.startDate}
              onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Davomiyligi"
              type="number"
              value={form.duration}
              onChange={e => setForm(p => ({ ...p, duration: e.target.value }))}
            />
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Birlik</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                value={form.durationUnit}
                onChange={e => setForm(p => ({ ...p, durationUnit: e.target.value }))}
              >
                <option value="month">Oy</option>
                <option value="week">Hafta</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button onClick={() => void save()} loading={loading} className="flex-1">Saqlash</Button>
            <Button variant="secondary" onClick={() => { setModal(false); setEditing(null); }} className="flex-1">Bekor</Button>
          </div>
        </div>
      </Modal>

      {/* Actions Modal */}
      <Modal open={!!statusModal} onClose={() => setStatusModal(null)} title={statusModal?.name ?? 'Guruh'} size="sm">
        <div className="space-y-3">
          <Button onClick={() => { openEdit(statusModal); setStatusModal(null); }} variant="secondary" className="w-full">
            Tahrirlash
          </Button>
          <Button onClick={() => { setDeleteModal(statusModal); setStatusModal(null); }} variant="danger" className="w-full">
            O&apos;chirish
          </Button>
          <div className="border-t pt-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Status o&apos;zgartirish</p>
            <div className="space-y-2">
              {Object.entries(STATUS_LABELS).map(([s, label]) => (
                <button key={s} onClick={() => updateStatus(statusModal, s)}
                  className={`w-full py-2.5 rounded-xl text-sm font-medium border transition-colors flex items-center gap-2.5 px-4 ${statusModal?.status === s ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-200 hover:border-indigo-400 text-gray-700'
                    }`}>
                  <span className={`w-2 h-2 rounded-full ${statusModal?.status === s ? 'bg-white' : s === 'ACTIVE' ? 'bg-green-500' : s === 'GATHERING' ? 'bg-blue-500' : 'bg-gray-400'}`} />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Modal>

      {/* Students Modal */}
      <Modal open={!!studentsModal} onClose={() => setStudentsModal(null)} title={`${studentsModal?.name} — Talabalar`} size="xl">
        <div>
          {/* Group info bar */}
          <div className="flex items-center gap-4 mb-5 p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Kurs narxi</span>
              <span className="text-lg font-bold text-gray-900">
                {studentsModal?.price ? Number(studentsModal.price).toLocaleString() + ' so\'m' : '—'}
              </span>
            </div>
            <div className="w-px h-6 bg-gray-200" />
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Talabalar</span>
              <span className="text-lg font-bold text-gray-900">{students.length} / {studentsModal?.maxStudents}</span>
            </div>
            <div className="w-px h-6 bg-gray-200" />
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Jadval</span>
              <span className="text-sm font-medium text-gray-700">{studentsModal?.days?.join(', ')} · {studentsModal?.startTime}–{studentsModal?.endTime}</span>
            </div>
          </div>

          {students.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p className="text-sm">Bu guruhda hali talabalar yo&apos;q</p>
            </div>
          ) : (
            <div className="rounded-xl border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Talaba</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Qo&apos;shgan</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Oxirgi to&apos;lov</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Keyingi to&apos;lov</th>
                    {studentsModal?.price && (
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Shu oy qarz</th>
                    )}
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wide">Amal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {students.map((student: any) => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const next: Date | null = student.nextPaymentDate ? new Date(student.nextPaymentDate) : null;
                    const diffDays = next ? Math.ceil((next.getTime() - today.getTime()) / 86400000) : null;
                    const isOverdue = diffDays !== null && diffDays < 0;
                    const isSoon = diffDays !== null && diffDays >= 0 && diffDays <= 3;
                    const hasDebt = studentsModal?.price && student.debt > 0;
                    const hasOverpayment = studentsModal?.price && student.overpayment > 0;
                    const isPaidFull = studentsModal?.price && student.debt === 0 && student.monthTotal > 0;

                    const MONTHS = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyn', 'Iyl', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'];
                    function fmtD(d: Date) { return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`; }

                    return (
                      <tr key={student.id} className={`hover:bg-gray-50 ${hasDebt ? 'bg-red-50/30' : hasOverpayment ? 'bg-blue-50/20' : ''}`}>
                        <td className="px-4 py-3.5 cursor-pointer" onClick={() => openStudentHistory(student)}>
                          <div className="flex items-center gap-3">
                            <Avatar name={student.name} size="sm" />
                            <div>
                              <p className="font-medium text-gray-900 hover:text-indigo-600 transition-colors">{student.name}</p>
                              <p className="text-xs text-gray-400">{student.phone}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          {student.addedBy ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full bg-indigo-50 text-indigo-700">
                              {student.addedBy.name}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-300">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          {student.lastPayment ? (
                            <div>
                              <p className="text-sm text-gray-700 font-medium">{fmtD(new Date(student.lastPayment.paidAt))}</p>
                              <p className="text-xs text-gray-400">{Number(student.lastPayment.amount).toLocaleString()} so&apos;m</p>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400 italic">Hali to&apos;lov yo&apos;q</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          {next ? (
                            <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
                              isOverdue ? 'bg-red-50 text-red-700' :
                              isSoon ? 'bg-amber-50 text-amber-700' :
                              'bg-green-50 text-green-700'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${isOverdue ? 'bg-red-500' : isSoon ? 'bg-amber-500' : 'bg-green-500'}`} />
                              {fmtD(next)}
                              {isOverdue && <span className="ml-1">({Math.abs(diffDays!)} kun kech)</span>}
                              {isSoon && !isOverdue && diffDays === 0 && <span className="ml-1">(bugun)</span>}
                              {isSoon && !isOverdue && diffDays! > 0 && <span className="ml-1">({diffDays} kun)</span>}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-300">—</span>
                          )}
                        </td>
                        {studentsModal?.price && (
                          <td className="px-4 py-3.5">
                            {hasOverpayment ? (
                              <div>
                                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700">
                                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                  +{Number(student.overpayment).toLocaleString()} so&apos;m ortiqcha
                                </span>
                                <p className="text-xs text-gray-400 mt-1 px-1">
                                  {Number(student.monthTotal).toLocaleString()} / {Number(studentsModal.price).toLocaleString()} to&apos;landi
                                </p>
                              </div>
                            ) : isPaidFull ? (
                              <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-green-50 text-green-700">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                To&apos;liq
                              </span>
                            ) : hasDebt ? (
                              <div>
                                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-red-50 text-red-700">
                                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                  {Number(student.debt).toLocaleString()} so&apos;m qarz
                                </span>
                                {student.monthTotal > 0 && (
                                  <p className="text-xs text-gray-400 mt-1 px-1">
                                    {Number(student.monthTotal).toLocaleString()} / {Number(studentsModal.price).toLocaleString()} to&apos;landi
                                  </p>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-gray-300">—</span>
                            )}
                          </td>
                        )}
                        <td className="px-4 py-3.5 text-right">
                          <button
                            onClick={() => {
                              setPaymentModal(student);
                              setPaymentForm({
                                amount: student.debt > 0 ? String(student.debt) : (studentsModal?.price ? String(studentsModal.price) : ''),
                                method: 'CASH',
                                notes: '',
                                type: 'MONTHLY',
                              });
                            }}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors"
                          >
                            + To&apos;lov
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex justify-between items-center pt-4 mt-4 border-t">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
              To&apos;lov tarixini ko&apos;rish uchun talaba ismiga bosing
            </div>
            <Button variant="secondary" onClick={() => setStudentsModal(null)}>Yopish</Button>
          </div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal open={!!deleteModal} onClose={() => setDeleteModal(null)} title="Guruhni o'chirish">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            <span className="font-semibold text-gray-900">{deleteModal?.name}</span> guruhini o'chirishni xohlaysizmi?
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-sm text-amber-800">
              ⚠️ Bu amal qaytarilmaydi. Guruh va unga tegishli barcha ma'lumotlar o'chiriladi.
            </p>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="danger" onClick={() => void deleteGroup()} loading={loading} className="flex-1">
              O'chirish
            </Button>
            <Button variant="secondary" onClick={() => setDeleteModal(null)} className="flex-1">Bekor</Button>
          </div>
        </div>
      </Modal>

      {/* Student Payment History Modal */}
      <Modal open={!!studentHistory} onClose={() => setStudentHistory(null)} title={`${studentHistory?.name} — To'lovlar tarixi`} size="lg">
        {(() => {
          const MONTHS = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyn', 'Iyl', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'];
          const fmtD = (d: string) => { const dt = new Date(d); return `${dt.getDate()} ${MONTHS[dt.getMonth()]} ${dt.getFullYear()}`; };
          const totalPaid = studentHistoryPayments.filter(p => !p.isRefunded).reduce((s, p) => s + Number(p.amount), 0);
          const METHOD_LABEL: Record<string, string> = { CASH: 'Naqd', PAYME: 'Payme', CLICK: 'Click', BANK_TRANSFER: 'Bank' };
          const METHOD_COLOR: Record<string, string> = { CASH: 'bg-green-50 text-green-700', PAYME: 'bg-cyan-50 text-cyan-700', CLICK: 'bg-orange-50 text-orange-700', BANK_TRANSFER: 'bg-purple-50 text-purple-700' };
          return (
            <div>
              {/* Student info bar */}
              <div className="flex items-center gap-4 mb-5 p-4 bg-gray-50 rounded-xl">
                <Avatar name={studentHistory?.name ?? ''} />
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{studentHistory?.name}</p>
                  <p className="text-sm text-gray-500">{studentHistory?.phone}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400 mb-0.5">Jami to&apos;langan</p>
                  <p className="text-xl font-bold text-green-700">{totalPaid.toLocaleString()} so&apos;m</p>
                  <p className="text-xs text-gray-400">{studentHistoryPayments.filter(p => !p.isRefunded).length} ta to&apos;lov</p>
                </div>
              </div>

              {historyLoading ? (
                <div className="text-center py-8 text-gray-400 text-sm">Yuklanmoqda...</div>
              ) : studentHistoryPayments.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  <p className="text-sm">Hali to&apos;lovlar yo&apos;q</p>
                </div>
              ) : (
                <div className="rounded-xl border overflow-hidden mb-5">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b">
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Sana</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Guruh</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Tur</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Usul</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Izoh</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wide">Summa</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {studentHistoryPayments.map(p => {
                        const grp = p.student?.enrollments?.[0]?.group;
                        return (
                        <tr key={p.id} className={`hover:bg-gray-50 ${p.isRefunded ? 'opacity-50' : ''}`}>
                          <td className="px-4 py-3 text-gray-500 text-xs">{fmtD(p.paidAt)}</td>
                          <td className="px-4 py-3">
                            {grp ? (
                              <div>
                                <p className="text-xs font-medium text-gray-700">{grp.name}</p>
                                <p className="text-xs text-gray-400">{grp.course?.name}</p>
                              </div>
                            ) : <span className="text-xs text-gray-300">—</span>}
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs font-medium text-gray-600">{p.type === 'MONTHLY' ? 'Oylik' : 'Avans'}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${METHOD_COLOR[p.method] ?? 'bg-gray-100 text-gray-600'}`}>
                              {METHOD_LABEL[p.method] ?? p.method}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-400">{p.notes || '—'}</td>
                          <td className="px-4 py-3 text-right">
                            <span className={`font-semibold ${p.isRefunded ? 'line-through text-gray-400' : 'text-green-700'}`}>
                              {p.isRefunded ? '' : '+'}{Number(p.amount).toLocaleString()} so&apos;m
                            </span>
                            {p.isRefunded && <span className="ml-1 text-xs text-red-500">qaytarilgan</span>}
                          </td>
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="flex justify-between items-center pt-2 border-t">
                <Button
                  onClick={() => {
                    setPaymentModal(studentHistory);
                    setPaymentForm({
                      amount: studentHistory?.debt > 0 ? String(studentHistory.debt) : (studentsModal?.price ? String(studentsModal.price) : ''),
                      method: 'CASH',
                      notes: '',
                      type: 'MONTHLY',
                    });
                  }}
                >
                  + To&apos;lov kiritish
                </Button>
                <Button variant="secondary" onClick={() => setStudentHistory(null)}>Yopish</Button>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* Payment Modal — history dan keyin (ustida ko'rinishi uchun) */}
      <Modal open={!!paymentModal} onClose={() => setPaymentModal(null)} title={`To'lov · ${paymentModal?.name ?? ''}`} size="sm">
        <div className="space-y-4">
          <Input
            label="Miqdor (so'm) *"
            type="number"
            value={paymentForm.amount}
            onChange={e => setPaymentForm(p => ({ ...p, amount: e.target.value }))}
            placeholder="0"
          />
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">Usul</label>
            <select className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none" value={paymentForm.method} onChange={e => setPaymentForm(p => ({ ...p, method: e.target.value }))}>
              <option value="CASH">Naqd</option>
              <option value="PAYME">Payme</option>
              <option value="CLICK">Click</option>
              <option value="BANK_TRANSFER">Bank o&apos;tkazmasi</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">Tur</label>
            <select className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none" value={paymentForm.type} onChange={e => setPaymentForm(p => ({ ...p, type: e.target.value }))}>
              <option value="MONTHLY">Oylik</option>
              <option value="ADVANCE">Avans</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">Izoh</label>
            <textarea className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/30" rows={3} value={paymentForm.notes} onChange={e => setPaymentForm(p => ({ ...p, notes: e.target.value }))} />
          </div>
          <div className="flex gap-3 pt-2">
            <Button onClick={handlePaymentSubmit} loading={loading} className="flex-1">Saqlash</Button>
            <Button variant="secondary" onClick={() => setPaymentModal(null)} className="flex-1">Bekor</Button>
          </div>
        </div>
      </Modal>

      {/* Payment Confirmation Modal */}
      <Modal open={paymentConfirmModal} onClose={() => setPaymentConfirmModal(false)} title="To'lovni tasdiqlash" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            <span className="font-semibold text-gray-900">{paymentModal?.name}</span> uchun to&apos;lovni tasdiqlaysizmi?
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Miqdor:</span>
              <span className="font-semibold text-gray-900">{Number(paymentForm.amount).toLocaleString()} so&apos;m</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Usul:</span>
              <span className="font-medium text-gray-900">
                {paymentForm.method === 'CASH' ? 'Naqd' : paymentForm.method === 'PAYME' ? 'Payme' : paymentForm.method === 'CLICK' ? 'Click' : 'Bank o\'tkazmasi'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Tur:</span>
              <span className="font-medium text-gray-900">{paymentForm.type === 'MONTHLY' ? 'Oylik' : 'Avans'}</span>
            </div>
            {paymentForm.notes && (
              <div className="pt-2 border-t border-blue-200">
                <span className="text-xs text-gray-500">Izoh:</span>
                <p className="text-sm text-gray-700 mt-1">{paymentForm.notes}</p>
              </div>
            )}
          </div>
          <div className="flex gap-3 pt-2">
            <Button onClick={() => void submitPayment()} loading={loading} className="flex-1">Ha, tasdiqlash</Button>
            <Button variant="secondary" onClick={() => setPaymentConfirmModal(false)} className="flex-1">Yo&apos;q</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
