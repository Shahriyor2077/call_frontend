'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import { Download, MoreVertical } from 'lucide-react';
import { useToast } from '@/components/ui/ToastProvider';

type Tab = 'all' | 'debtors' | 'graduated';

export default function AdminStudentsPage() {
  const toast = useToast();
  const [students, setStudents] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [filterGroup, setFilterGroup] = useState('');
  const [tab, setTab] = useState<Tab>('all');
  const [modal, setModal] = useState<'create' | 'enroll' | 'edit' | 'changeGroup' | 'delete' | 'actions' | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [form, setForm] = useState({
    name: '', surname: '', phone: '', parentPhone: '',
    gender: 'MALE', birthDate: '', notes: '', groupId: '',
  });
  const [enrollOnCreate, setEnrollOnCreate] = useState(false);
  const [enrollForm, setEnrollForm] = useState({ groupId: '' });
  const [loading, setLoading] = useState(false);
  const [historyStudent, setHistoryStudent] = useState<any>(null);
  const [historyPayments, setHistoryPayments] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [payModal, setPayModal] = useState<any>(null);
  const [payForm, setPayForm] = useState({ amount: '', method: 'CASH', notes: '', type: 'MONTHLY' });
  const [payConfirm, setPayConfirm] = useState(false);
  const [payLoading, setPayLoading] = useState(false);

  const [monthPaidMap, setMonthPaidMap] = useState<Record<string, number>>({});

  async function load() {
    const now = new Date();
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const [s, g, p] = await Promise.all([
      api.get('/students'),
      api.get('/groups'),
      api.get(`/payments?from=${monthStart}&limit=1000`).catch(() => ({ data: { data: [] } })),
    ]);
    setStudents(s.data);
    setGroups(g.data);
    const map: Record<string, number> = {};
    const pays: any[] = p.data?.data || [];
    pays.forEach((pay: any) => {
      if (!pay.isRefunded && pay.student?.id) {
        map[pay.student.id] = (map[pay.student.id] || 0) + Number(pay.amount);
      }
    });
    setMonthPaidMap(map);
  }
  useEffect(() => { void load(); }, []);

  const emptyForm = { name: '', surname: '', phone: '', parentPhone: '', gender: 'MALE', birthDate: '', notes: '', groupId: '' };

  async function create() {
    if (!form.name.trim()) { toast.warning('Ismni kiriting'); return; }
    if (!form.phone.trim()) { toast.warning('Telefon raqamini kiriting'); return; }
    setLoading(true);
    try {
      const payload: any = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        gender: form.gender,
      };
      if (form.surname)     payload.surname     = form.surname;
      if (form.parentPhone) payload.parentPhone = form.parentPhone;
      if (form.birthDate)   payload.birthDate   = form.birthDate;
      if (form.notes)       payload.notes       = form.notes;
      if (enrollOnCreate && form.groupId) payload.groupId = form.groupId;
      await api.post('/students', payload);
      setModal(null);
      setForm(emptyForm);
      setEnrollOnCreate(false);
      void load();
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg.join(' ') : msg || 'Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  }

  async function enrollStudent() {
    if (!selectedStudent || !enrollForm.groupId) return;
    setLoading(true);
    try {
      await api.post('/groups/enroll', {
        studentId: selectedStudent.id,
        groupId: enrollForm.groupId,
      });
      setModal(null);
      setEnrollForm({ groupId: '' });
      void load();
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg.join(' ') : msg || 'Guruhga yozishda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  }

  async function changeGroup() {
    if (!selectedStudent || !enrollForm.groupId) return;
    const currentEnrollment = selectedStudent.enrollments?.find((e: any) => e.isActive);
    if (!currentEnrollment) return;
    setLoading(true);
    try {
      await api.post('/groups/transfer', {
        studentId: selectedStudent.id,
        fromGroupId: currentEnrollment.groupId,
        toGroupId: enrollForm.groupId,
      });
      setModal(null);
      setEnrollForm({ groupId: '' });
      void load();
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg.join(' ') : msg || 'Guruhni almashtirishda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  }

  async function updateStudent() {
    if (!selectedStudent) return;
    setLoading(true);
    try {
      const payload: any = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        gender: form.gender,
        surname: form.surname || undefined,
        parentPhone: form.parentPhone || undefined,
        birthDate: form.birthDate || undefined,
        notes: form.notes || undefined,
      };
      await api.put(`/students/${selectedStudent.id}`, payload);
      setModal(null);
      void load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  }

  async function deleteStudent() {
    if (!selectedStudent) return;
    setLoading(true);
    try {
      await api.delete(`/students/${selectedStudent.id}`);
      setModal(null);
      void load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  }

  async function openHistory(student: any) {
    setHistoryLoading(true);
    setHistoryStudent(student);
    try {
      const { data } = await api.get(`/payments?studentId=${student.id}&limit=100`);
      setHistoryPayments(data.data || []);
    } catch {
      setHistoryPayments([]);
    } finally {
      setHistoryLoading(false);
    }
  }

  async function submitPayment() {
    if (!payModal || !payForm.amount) return;
    setPayLoading(true);
    try {
      await api.post('/payments', {
        studentId: payModal.id,
        amount: Number(payForm.amount),
        method: payForm.method,
        notes: payForm.notes,
        type: payForm.type,
      });
      setPayConfirm(false);
      setPayModal(null);
      setPayForm({ amount: '', method: 'CASH', notes: '', type: 'MONTHLY' });
      // Refresh history if open for same student
      if (historyStudent?.id === payModal.id) {
        const { data } = await api.get(`/payments?studentId=${payModal.id}&limit=100`);
        setHistoryPayments(data.data || []);
      }
      void load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Xatolik yuz berdi');
    } finally {
      setPayLoading(false);
    }
  }

  const allStudents = students.filter(s => {
    const matchSearch = !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.phone.includes(search);
    const matchGroup = !filterGroup || s.enrollments?.some((e: any) => e.groupId === filterGroup && e.isActive);
    return matchSearch && matchGroup;
  });

  function isDebtor(s: any) {
    const active = s.enrollments?.find((e: any) => e.isActive);
    if (!active) return false;
    const price = Number(active.group?.price || 0);
    if (price <= 0) return false;
    return (monthPaidMap[s.id] || 0) < price;
  }

  const byTab = allStudents.filter(s => {
    if (tab === 'debtors') return isDebtor(s);
    if (tab === 'graduated') return s.enrollments?.every((e: any) => !e.isActive);
    return true;
  });

  const counts = {
    all: allStudents.length,
    debtors: allStudents.filter(isDebtor).length,
    graduated: allStudents.filter(s => s.enrollments?.every((e: any) => !e.isActive)).length,
  };

  const MONTH_UZ = ['yan', 'fev', 'mar', 'apr', 'may', 'iyn', 'iyl', 'avg', 'sen', 'okt', 'noy', 'dek'];
  function fmtDate(d: string) {
    const dt = new Date(d);
    return `${dt.getDate()} ${MONTH_UZ[dt.getMonth()]} ${dt.getFullYear()}`;
  }

  function exportToExcel() {
    if (byTab.length === 0) {
      toast.warning('Export qilish uchun ma\'lumot yo\'q');
      return;
    }

    try {
      // CSV format (Excel ochadi)
      const headers = ['Ism', 'Telefon', 'Guruh', 'Kurs', 'Tolangan', 'Holat', 'Yozilgan'];
      const rows = byTab.map(s => {
        const activeEnrollment = s.enrollments?.find((e: any) => e.isActive);
        const totalPaid = s.payments?.filter((p: any) => !p.isRefunded).reduce((sum: number, p: any) => sum + Number(p.amount), 0) ?? 0;
        const isActive = !!activeEnrollment;

        return [
          s.name || '',
          s.phone || '',
          activeEnrollment?.group?.name || '-',
          activeEnrollment?.group?.course?.name || '-',
          totalPaid,
          isActive ? 'Faol' : 'Nofaol',
          fmtDate(s.createdAt)
        ];
      });

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      // BOM qo'shish (Excel uchun UTF-8)
      const BOM = '\uFEFF';
      const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `talabalar_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();

      // Cleanup
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 100);
    } catch (error) {
      console.error('Export xatosi:', error);
      toast.error('Export qilishda xatolik yuz berdi');
    }
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Talabalar</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Markazga yozilgan barcha talabalar.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportToExcel}
            className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            <Download size={14} /> Eksport
          </button>
          <Button onClick={() => setModal("create")}>+ Yangi talaba</Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mt-5 border-b border-gray-100 mb-4">
        {(
          [
            ["all", "Barchasi"],
            ["debtors", "Qarzdorlar"],
            ["graduated", "Bitirganlar"],
          ] as [Tab, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`pb-3 px-1 mr-5 text-sm font-medium border-b-2 transition-colors ${
              tab === key
                ? "border-gray-900 text-gray-900"
                : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            {label}
            <span className="ml-1.5 text-gray-400">· {counts[key]}</span>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            placeholder="Ism yoki telefon..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm w-56 focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
          />
        </div>
        <select
          value={filterGroup}
          onChange={(e) => setFilterGroup(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 focus:outline-none"
        >
          <option value="">Barcha guruhlar</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
        <span className="ml-auto text-sm text-gray-400 bg-gray-100 px-3 py-1.5 rounded-xl">
          {byTab.length} ta
        </span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="px-5 py-3 text-xs font-semibold text-gray-400 tracking-wide">
                TALABA
              </th>
              <th className="px-5 py-3 text-xs font-semibold text-gray-400 tracking-wide">
                GURUH
              </th>
              <th className="px-5 py-3 text-xs font-semibold text-gray-400 tracking-wide">
                KURS
              </th>
              <th className="px-5 py-3 text-xs font-semibold text-gray-400 tracking-wide">
                TELEFON
              </th>
              <th className="px-5 py-3 text-xs font-semibold text-gray-400 tracking-wide">
                TO&apos;LANGAN
              </th>
              <th className="px-5 py-3 text-xs font-semibold text-gray-400 tracking-wide">
                BALANS
              </th>
              <th className="px-5 py-3 text-xs font-semibold text-gray-400 tracking-wide">
                HOLAT
              </th>
              <th className="px-5 py-3 text-xs font-semibold text-gray-400 tracking-wide">
                YOZILGAN
              </th>
              <th className="px-5 py-3 text-xs font-semibold text-gray-400 tracking-wide w-12"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {byTab.map((s) => {
              const activeEnrollment = s.enrollments?.find(
                (e: any) => e.isActive,
              );
              const totalPaid =
                s.payments
                  ?.filter((p: any) => !p.isRefunded)
                  .reduce((sum: number, p: any) => sum + Number(p.amount), 0) ??
                0;
              const isActive = !!activeEnrollment;

              return (
                <tr
                  key={s.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => openHistory(s)}
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={s.name} size="sm" />
                      <span className="font-medium text-gray-900 hover:text-indigo-600 transition-colors">
                        {s.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-gray-600">
                    {activeEnrollment?.group?.name ?? "—"}
                  </td>
                  <td className="px-5 py-4 text-gray-600">
                    {activeEnrollment?.group?.course?.name ?? "—"}
                  </td>
                  <td className="px-5 py-4 text-gray-400">{s.phone}</td>
                  <td className="px-5 py-4 font-medium text-gray-900">
                    {totalPaid > 0 ? `${totalPaid.toLocaleString()} so'm` : "—"}
                  </td>
                  <td className="px-5 py-4">
                    {(() => {
                      const price = Number(activeEnrollment?.group?.price || 0);
                      if (!activeEnrollment || price <= 0) return <span className="text-gray-300">—</span>;
                      const paid = monthPaidMap[s.id] || 0;
                      const balance = paid - price;
                      return (
                        <span className={`text-sm font-medium ${balance >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                          {balance >= 0 ? '+' : ''}{balance.toLocaleString()} so'm
                        </span>
                      );
                    })()}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${isActive ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-green-500" : "bg-gray-400"}`}
                      />
                      {isActive ? "Faol" : "Nofaol"}
                    </span>
                    {!isActive && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedStudent(s);
                          setModal("enroll");
                        }}
                        className="ml-2 text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                      >
                        Guruhga yozish
                      </button>
                    )}
                  </td>
                  <td className="px-5 py-4 text-gray-400 text-xs">
                    {fmtDate(s.createdAt)}
                  </td>
                  <td className="px-5 py-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedStudent(s);
                        setModal("actions");
                      }}
                      className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400"
                    >
                      <MoreVertical size={15} />
                    </button>
                  </td>
                </tr>
              );
            })}
            {byTab.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="px-5 py-12 text-center text-gray-400"
                >
                  Talabalar topilmadi
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal
        open={modal === "actions"}
        onClose={() => setModal(null)}
        title={selectedStudent?.name ?? "Talaba"}
        size="sm"
      >
        <div className="space-y-3">
          <Button
            onClick={() => {
              setForm({
                name: selectedStudent.name || '',
                surname: selectedStudent.surname || '',
                phone: selectedStudent.phone || '',
                parentPhone: selectedStudent.parentPhone || '',
                gender: selectedStudent.gender || 'MALE',
                birthDate: selectedStudent.birthDate ? selectedStudent.birthDate.split('T')[0] : '',
                notes: selectedStudent.notes || '',
                groupId: '',
              });
              setModal("edit");
            }}
            variant="secondary"
            className="w-full"
          >
            Tahrirlash
          </Button>
          {selectedStudent?.enrollments?.find((e: any) => e.isActive) && (
            <Button
              onClick={() => {
                setEnrollForm({ groupId: "" });
                setModal("changeGroup");
              }}
              variant="secondary"
              className="w-full"
            >
              Guruhni almashtirish
            </Button>
          )}
          <Button
            onClick={() => setModal("delete")}
            variant="danger"
            className="w-full"
          >
            O'chirish
          </Button>
        </div>
      </Modal>

      <Modal
        open={modal === "edit"}
        onClose={() => setModal(null)}
        title="Talabani tahrirlash"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Ismi *" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
            <Input label="Familiyasi" value={form.surname} onChange={e => setForm(p => ({ ...p, surname: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Telefon *" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="+998901234567" />
            <Input label="Ota-onasining telefoni" value={form.parentPhone} onChange={e => setForm(p => ({ ...p, parentPhone: e.target.value }))} placeholder="+998901234567" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Jinsi</label>
              <div className="flex gap-2">
                {[{ v: 'MALE', l: 'Erkak' }, { v: 'FEMALE', l: 'Ayol' }].map(g => (
                  <button key={g.v} type="button" onClick={() => setForm(p => ({ ...p, gender: g.v }))}
                    className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-colors ${form.gender === g.v ? 'bg-indigo-700 border-indigo-700 text-white' : 'border-gray-200 text-gray-600 hover:border-indigo-300'}`}>
                    {g.l}
                  </button>
                ))}
              </div>
            </div>
            <Input label="Tug'ilgan sanasi" type="date" value={form.birthDate} onChange={e => setForm(p => ({ ...p, birthDate: e.target.value }))} />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">Izoh</label>
            <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/30 resize-none" />
          </div>
          <div className="flex gap-3 pt-2">
            <Button onClick={() => void updateStudent()} loading={loading} className="flex-1">Saqlash</Button>
            <Button variant="secondary" onClick={() => setModal(null)} className="flex-1">Bekor</Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={modal === "changeGroup"}
        onClose={() => setModal(null)}
        title={`Guruhni almashtirish — ${selectedStudent?.name}`}
        size="sm"
      >
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-3 text-sm">
            <p className="text-gray-500">Hozirgi guruh:</p>
            <p className="font-medium text-gray-900 mt-1">
              {
                selectedStudent?.enrollments?.find((e: any) => e.isActive)
                  ?.group?.name
              }
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">
              Yangi guruh *
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={enrollForm.groupId}
              onChange={(e) => setEnrollForm({ groupId: e.target.value })}
            >
              <option value="">— Guruhni tanlang —</option>
              {groups
                .filter((g) => {
                  if (g.status !== 'GATHERING' && g.status !== 'ACTIVE') return false;
                  const currentGroupId = selectedStudent?.enrollments?.find((e: any) => e.isActive)?.groupId;
                  return g.id !== currentGroupId;
                })
                .map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} · {g.course?.name}
                  </option>
                ))}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <Button
              onClick={() => void changeGroup()}
              loading={loading}
              className="flex-1"
            >
              Almashtirish
            </Button>
            <Button
              variant="secondary"
              onClick={() => setModal(null)}
              className="flex-1"
            >
              Bekor
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={modal === "delete"}
        onClose={() => setModal(null)}
        title="Talabani o'chirish"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            <span className="font-semibold text-gray-900">
              {selectedStudent?.name}
            </span>{" "}
            talabani o'chirishni xohlaysizmi?
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-sm text-amber-800">
              ⚠️ Bu amal qaytarilmaydi. Talaba va unga tegishli barcha
              ma'lumotlar o'chiriladi.
            </p>
          </div>
          <div className="flex gap-3 pt-2">
            <Button
              variant="danger"
              onClick={() => void deleteStudent()}
              loading={loading}
              className="flex-1"
            >
              O'chirish
            </Button>
            <Button
              variant="secondary"
              onClick={() => setModal(null)}
              className="flex-1"
            >
              Bekor
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={modal === "create"}
        onClose={() => { setModal(null); setForm(emptyForm); setEnrollOnCreate(false); }}
        title="Yangi talaba qo'shish"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Ismi *" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Ismi" />
            <Input label="Familiyasi" value={form.surname} onChange={e => setForm(p => ({ ...p, surname: e.target.value }))} placeholder="Familiyasi" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Telefon raqami *" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="+998901234567" />
            <Input label="Ota-onasining telefon raqami" value={form.parentPhone} onChange={e => setForm(p => ({ ...p, parentPhone: e.target.value }))} placeholder="+998901234567" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {/* Gender */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Jinsi</label>
              <div className="flex gap-2">
                {[{ v: 'MALE', l: 'Erkak' }, { v: 'FEMALE', l: 'Ayol' }].map(g => (
                  <button
                    key={g.v}
                    type="button"
                    onClick={() => setForm(p => ({ ...p, gender: g.v }))}
                    className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-colors ${form.gender === g.v ? 'bg-indigo-700 border-indigo-700 text-white' : 'border-gray-200 text-gray-600 hover:border-indigo-300'}`}
                  >
                    {g.l}
                  </button>
                ))}
              </div>
            </div>
            <Input label="Tug'ilgan sanasi" type="date" value={form.birthDate} onChange={e => setForm(p => ({ ...p, birthDate: e.target.value }))} />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">Izoh</label>
            <textarea
              value={form.notes}
              onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
              placeholder="Izoh..."
              rows={2}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/30 resize-none"
            />
          </div>
          {/* Guruhga biriktirish toggle */}
          <div className="border-t border-gray-100 pt-4 space-y-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setEnrollOnCreate(v => !v)}
                className={`relative w-10 h-6 rounded-full transition-colors ${enrollOnCreate ? 'bg-indigo-600' : 'bg-gray-200'}`}
              >
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${enrollOnCreate ? 'left-5' : 'left-1'}`} />
              </button>
              <span className="text-sm font-medium text-gray-700">Guruhga biriktirish</span>
            </div>
            {enrollOnCreate && (
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Guruh</label>
                <select
                  value={form.groupId}
                  onChange={e => setForm(p => ({ ...p, groupId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
                >
                  <option value="">— Guruhni tanlang —</option>
                  {groups.filter(g => g.status === 'GATHERING' || g.status === 'ACTIVE').map(g => (
                    <option key={g.id} value={g.id}>{g.name} · {g.course?.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <div className="flex gap-3 pt-2">
            <Button onClick={() => void create()} loading={loading} className="flex-1">Saqlash</Button>
            <Button variant="secondary" onClick={() => { setModal(null); setForm(emptyForm); setEnrollOnCreate(false); }} className="flex-1">Bekor</Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={modal === "enroll"}
        onClose={() => setModal(null)}
        title={`Guruhga yozish — ${selectedStudent?.name}`}
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">
              Guruh *
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={enrollForm.groupId}
              onChange={(e) => setEnrollForm({ groupId: e.target.value })}
            >
              <option value="">— Guruhni tanlang —</option>
              {groups
                .filter(
                  (g) => g.status === "GATHERING" || g.status === "ACTIVE",
                )
                .map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} · {g.course?.name}
                  </option>
                ))}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <Button
              onClick={() => void enrollStudent()}
              loading={loading}
              className="flex-1"
            >
              Guruhga yozish
            </Button>
            <Button
              variant="secondary"
              onClick={() => setModal(null)}
              className="flex-1"
            >
              Bekor
            </Button>
          </div>
        </div>
      </Modal>

      {/* Payment History Modal */}
      <Modal
        open={!!historyStudent}
        onClose={() => setHistoryStudent(null)}
        title={`${historyStudent?.name} — To'lovlar tarixi`}
        size="lg"
      >
        {(() => {
          const MONTHS = [
            "Yan",
            "Fev",
            "Mar",
            "Apr",
            "May",
            "Iyn",
            "Iyl",
            "Avg",
            "Sen",
            "Okt",
            "Noy",
            "Dek",
          ];
          const fmtD = (d: string) => {
            const dt = new Date(d);
            return `${dt.getDate()} ${MONTHS[dt.getMonth()]} ${dt.getFullYear()}`;
          };
          const totalPaid = historyPayments
            .filter((p) => !p.isRefunded)
            .reduce((s, p) => s + Number(p.amount), 0);
          const METHOD_LABEL: Record<string, string> = {
            CASH: "Naqd",
            PAYME: "Payme",
            CLICK: "Click",
            BANK_TRANSFER: "Bank",
          };
          const METHOD_COLOR: Record<string, string> = {
            CASH: "bg-green-50 text-green-700",
            PAYME: "bg-cyan-50 text-cyan-700",
            CLICK: "bg-orange-50 text-orange-700",
            BANK_TRANSFER: "bg-purple-50 text-purple-700",
          };
          const activeGroup = historyStudent?.enrollments?.find(
            (e: any) => e.isActive,
          )?.group;
          return (
            <div>
              {/* Student info bar */}
              <div className="flex items-center gap-4 mb-5 p-4 bg-gray-50 rounded-xl">
                <Avatar name={historyStudent?.name ?? ""} />
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">
                    {historyStudent?.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {historyStudent?.phone}
                  </p>
                  {activeGroup && (
                    <p className="text-xs text-indigo-600 mt-0.5">
                      {activeGroup.name} · {activeGroup.course?.name}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400 mb-0.5">
                    Jami to&apos;langan
                  </p>
                  <p className="text-xl font-bold text-green-700">
                    {totalPaid.toLocaleString()} so&apos;m
                  </p>
                  <p className="text-xs text-gray-400">
                    {historyPayments.filter((p) => !p.isRefunded).length} ta
                    to&apos;lov
                  </p>
                </div>
              </div>

              {historyLoading ? (
                <div className="text-center py-8 text-gray-400 text-sm">
                  Yuklanmoqda...
                </div>
              ) : historyPayments.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  <p className="text-sm">Hali to&apos;lovlar yo&apos;q</p>
                </div>
              ) : (
                <div className="rounded-xl border overflow-hidden mb-5">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b">
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">
                          Sana
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">
                          Guruh
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">
                          Tur
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">
                          Usul
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">
                          Operator
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">
                          Izoh
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wide">
                          Summa
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {historyPayments.map((p) => {
                        const grp = p.student?.enrollments?.[0]?.group;
                        return (
                          <tr
                            key={p.id}
                            className={`hover:bg-gray-50 ${p.isRefunded ? "opacity-50" : ""}`}
                          >
                            <td className="px-4 py-3 text-gray-500 text-xs">
                              {fmtD(p.paidAt)}
                            </td>
                            <td className="px-4 py-3">
                              {grp ? (
                                <div>
                                  <p className="text-xs font-medium text-gray-700">
                                    {grp.name}
                                  </p>
                                  <p className="text-xs text-gray-400">
                                    {grp.course?.name}
                                  </p>
                                </div>
                              ) : (
                                <span className="text-xs text-gray-300">—</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-xs font-medium text-gray-600">
                                {p.type === "MONTHLY" ? "Oylik" : "Avans"}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`text-xs px-2 py-0.5 rounded-full font-medium ${METHOD_COLOR[p.method] ?? "bg-gray-100 text-gray-600"}`}
                              >
                                {METHOD_LABEL[p.method] ?? p.method}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-xs text-gray-500">
                              {p.operator?.name ?? "—"}
                            </td>
                            <td className="px-4 py-3 text-xs text-gray-400">
                              {p.notes || "—"}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span
                                className={`font-semibold ${p.isRefunded ? "line-through text-gray-400" : "text-green-700"}`}
                              >
                                {p.isRefunded ? "" : "+"}
                                {Number(p.amount).toLocaleString()} so&apos;m
                              </span>
                              {p.isRefunded && (
                                <span className="ml-1 text-xs text-red-500">
                                  qaytarilgan
                                </span>
                              )}
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
                    setPayModal(historyStudent);
                    setPayForm({
                      amount: "",
                      method: "CASH",
                      notes: "",
                      type: "MONTHLY",
                    });
                  }}
                >
                  + To&apos;lov kiritish
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setHistoryStudent(null)}
                >
                  Yopish
                </Button>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* Payment Form Modal */}
      <Modal
        open={!!payModal}
        onClose={() => setPayModal(null)}
        title={`To'lov · ${payModal?.name ?? ""}`}
        size="sm"
      >
        <div className="space-y-4">
          <Input
            label="Miqdor (so'm) *"
            type="number"
            value={payForm.amount}
            onChange={(e) =>
              setPayForm((p) => ({ ...p, amount: e.target.value }))
            }
            placeholder="0"
          />
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">
              Usul
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none"
              value={payForm.method}
              onChange={(e) =>
                setPayForm((p) => ({ ...p, method: e.target.value }))
              }
            >
              <option value="CASH">Naqd</option>
              <option value="PAYME">Payme</option>
              <option value="CLICK">Click</option>
              <option value="BANK_TRANSFER">Bank o&apos;tkazmasi</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">
              Tur
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none"
              value={payForm.type}
              onChange={(e) =>
                setPayForm((p) => ({ ...p, type: e.target.value }))
              }
            >
              <option value="MONTHLY">Oylik</option>
              <option value="ADVANCE">Avans</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">
              Izoh
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
              rows={2}
              value={payForm.notes}
              onChange={(e) =>
                setPayForm((p) => ({ ...p, notes: e.target.value }))
              }
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button
              onClick={() => {
                if (!payForm.amount) {
                  toast.warning('Miqdorni kiriting');
                  return;
                }
                setPayConfirm(true);
              }}
              className="flex-1"
            >
              Saqlash
            </Button>
            <Button
              variant="secondary"
              onClick={() => setPayModal(null)}
              className="flex-1"
            >
              Bekor
            </Button>
          </div>
        </div>
      </Modal>

      {/* Payment Confirm Modal */}
      <Modal
        open={payConfirm}
        onClose={() => setPayConfirm(false)}
        title="To'lovni tasdiqlash"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            <span className="font-semibold text-gray-900">
              {payModal?.name}
            </span>{" "}
            uchun to&apos;lovni tasdiqlaysizmi?
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Miqdor:</span>
              <span className="font-semibold">
                {Number(payForm.amount).toLocaleString()} so&apos;m
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Usul:</span>
              <span className="font-medium">
                {
                  {
                    CASH: "Naqd",
                    PAYME: "Payme",
                    CLICK: "Click",
                    BANK_TRANSFER: "Bank",
                  }[payForm.method]
                }
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Tur:</span>
              <span className="font-medium">
                {payForm.type === "MONTHLY" ? "Oylik" : "Avans"}
              </span>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button
              onClick={() => void submitPayment()}
              loading={payLoading}
              className="flex-1"
            >
              Ha, tasdiqlash
            </Button>
            <Button
              variant="secondary"
              onClick={() => setPayConfirm(false)}
              className="flex-1"
            >
              Yo&apos;q
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
