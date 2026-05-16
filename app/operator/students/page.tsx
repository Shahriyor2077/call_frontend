'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import {
  Download, Users, UserCheck, UserX, CircleDollarSign,
  Search, SlidersHorizontal, FileUp, ChevronDown, UserPlus, CreditCard, Eye, Pencil,
  X, RotateCcw,
} from 'lucide-react';
import { useToast } from '@/components/ui/ToastProvider';

type Filter = 'all' | 'active' | 'noGroup' | 'debtors';

export default function OperatorStudentsPage() {
  const toast = useToast();
  const router = useRouter();
  const [students, setStudents] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [groupFilter, setGroupFilter] = useState('');
  const [teacherFilter, setTeacherFilter] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [centerName, setCenterName] = useState('Filial');
  const importRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  const [modal, setModal] = useState<'create' | 'enroll' | 'edit' | 'changeGroup' | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [form, setForm] = useState({
    name: '', surname: '', phone: '', parentPhone: '',
    gender: 'MALE', birthDate: '', notes: '', groupId: '',
  });
  const [enrollOnCreate, setEnrollOnCreate] = useState(false);
  const [enrollForm, setEnrollForm] = useState({ groupId: '' });
  const [loading, setLoading] = useState(false);
  const [monthPaidMap, setMonthPaidMap] = useState<Record<string, number>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 15;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (importRef.current && !importRef.current.contains(e.target as Node)) setImportOpen(false);
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setFilterOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function load() {
    const now = new Date();
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const [s, g, t, p, me] = await Promise.all([
      api.get('/students'),
      api.get('/groups'),
      api.get('/teachers').catch(() => ({ data: [] })),
      api.get(`/payments?from=${monthStart}&limit=1000`).catch(() => ({ data: { data: [] } })),
      api.get('/auth/me').catch(() => null),
    ]);
    setStudents(s.data);
    setGroups(g.data);
    setTeachers(Array.isArray(t.data) ? t.data : t.data?.data || []);
    if (me?.data?.center?.name) setCenterName(me.data.center.name);
    const map: Record<string, number> = {};
    const pays: any[] = p.data?.data || [];
    pays.forEach((pay: any) => {
      if (!pay.isRefunded && pay.student?.id) {
        map[pay.student.id] = (map[pay.student.id] || 0) + Number(pay.amount) + Number(pay.discountAmount || 0);
      }
    });
    setMonthPaidMap(map);
  }
  useEffect(() => { void load(); }, []);

  const emptyForm = { name: '', surname: '', phone: '', parentPhone: '', gender: 'MALE', birthDate: '', notes: '', groupId: '' };

  function isDebtor(s: any) {
    const active = s.enrollments?.find((e: any) => e.isActive);
    if (!active) return false;
    const price = Number(active.group?.price || 0);
    if (price <= 0) return false;
    return (monthPaidMap[s.id] || 0) < price;
  }

  const searched = students.filter(s =>
    !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.phone.includes(search)
  );

  const byFilter = searched.filter(s => {
    const activeEnrollment = s.enrollments?.find((e: any) => e.isActive);
    if (filter === 'active' && !activeEnrollment) return false;
    if (filter === 'noGroup' && activeEnrollment) return false;
    if (filter === 'debtors' && !isDebtor(s)) return false;
    if (groupFilter && activeEnrollment?.groupId !== groupFilter) return false;
    if (teacherFilter && activeEnrollment?.group?.teacherId !== teacherFilter) return false;
    return true;
  });

  const totalPages = Math.ceil(byFilter.length / PAGE_SIZE);
  const paginated = byFilter.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function clearFilters() {
    setGroupFilter('');
    setTeacherFilter('');
    setCurrentPage(1);
  }

  const counts = {
    all: searched.length,
    active: searched.filter(s => s.enrollments?.some((e: any) => e.isActive)).length,
    noGroup: searched.filter(s => !s.enrollments?.some((e: any) => e.isActive)).length,
    debtors: searched.filter(isDebtor).length,
  };

  const MONTH_UZ = ['yan', 'fev', 'mar', 'apr', 'may', 'iyn', 'iyl', 'avg', 'sen', 'okt', 'noy', 'dek'];
  function fmtDate(d: string) {
    const dt = new Date(d);
    return `${dt.getDate()} ${MONTH_UZ[dt.getMonth()]} ${dt.getFullYear()}`;
  }

  async function create() {
    if (!form.name.trim()) { toast.warning('Ismni kiriting'); return; }
    if (!form.phone.trim()) { toast.warning('Telefon raqamini kiriting'); return; }
    setLoading(true);
    try {
      const payload: any = { name: form.name.trim(), phone: form.phone.trim(), gender: form.gender };
      if (form.surname)     payload.surname     = form.surname;
      if (form.parentPhone) payload.parentPhone = form.parentPhone;
      if (form.birthDate)   payload.birthDate   = form.birthDate;
      if (form.notes)       payload.notes       = form.notes;
      if (enrollOnCreate && form.groupId) payload.groupId = form.groupId;
      await api.post('/students', payload);
      setModal(null); setForm(emptyForm); setEnrollOnCreate(false); void load();
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg.join(' ') : msg || 'Xatolik yuz berdi');
    } finally { setLoading(false); }
  }

  async function enrollStudent() {
    if (!selectedStudent || !enrollForm.groupId) return;
    setLoading(true);
    try {
      await api.post('/groups/enroll', { studentId: selectedStudent.id, groupId: enrollForm.groupId });
      setModal(null); setEnrollForm({ groupId: '' }); void load();
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg.join(' ') : msg || 'Guruhga yozishda xatolik');
    } finally { setLoading(false); }
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
      setModal(null); setEnrollForm({ groupId: '' }); void load();
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg.join(' ') : msg || 'Guruhni almashtirishda xatolik');
    } finally { setLoading(false); }
  }

  async function updateStudent() {
    if (!selectedStudent) return;
    setLoading(true);
    try {
      await api.put(`/students/${selectedStudent.id}`, {
        name: form.name.trim(), phone: form.phone.trim(), gender: form.gender,
        surname: form.surname || undefined, parentPhone: form.parentPhone || undefined,
        birthDate: form.birthDate || undefined, notes: form.notes || undefined,
      });
      setModal(null); void load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Xatolik yuz berdi');
    } finally { setLoading(false); }
  }

  function exportToExcel() {
    if (byFilter.length === 0) { toast.warning("Export qilish uchun ma'lumot yo'q"); return; }
    const headers = ['Ism', 'Telefon', 'Guruh', 'Kurs', 'Holat', 'Yozilgan'];
    const rows = byFilter.map(s => {
      const ae = s.enrollments?.find((e: any) => e.isActive);
      return [s.name, s.phone, ae?.group?.name || '-', ae?.group?.course?.name || '-', ae ? 'Faol' : 'Nofaol', fmtDate(s.createdAt)];
    });
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `talabalar_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a); a.click();
    setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
  }

  const statCards = [
    { key: 'all' as Filter,      label: "O'QUVCHILAR SONI",    count: counts.all,     Icon: Users,             bg: 'bg-indigo-500',  active: 'bg-indigo-50 border-indigo-200' },
    { key: 'active' as Filter,   label: 'FAOL',                 count: counts.active,  Icon: UserCheck,         bg: 'bg-green-500',   active: 'bg-green-50 border-green-200'   },
    { key: 'noGroup' as Filter,  label: "GURUHSIZ O'QUVCHILAR", count: counts.noGroup, Icon: UserX,             bg: 'bg-orange-500',  active: 'bg-orange-50 border-orange-200' },
    { key: 'debtors' as Filter,  label: 'QARZDOR',              count: counts.debtors, Icon: CircleDollarSign,  bg: 'bg-red-500',     active: 'bg-red-50 border-red-200'       },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-xl font-bold text-gray-900 tracking-wide">O&apos;QUVCHILAR</h1>
        <span className="text-sm text-gray-400 font-medium">O&apos;quvchilar</span>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map(({ key, label, count, Icon, bg, active }) => (
          <button
            key={key}
            onClick={() => { setFilter(key); setCurrentPage(1); }}
            className={`p-3 sm:p-5 rounded-2xl border flex items-center justify-between transition-all shadow-sm hover:shadow-md cursor-pointer ${filter === key ? active : 'bg-white border-gray-100'}`}
          >
            <div className="text-left">
              <p className="text-2xl sm:text-3xl font-bold text-gray-900 leading-none mb-1.5">{count}</p>
              <p className="text-[10px] sm:text-xs font-semibold text-gray-400 tracking-wide">{label}</p>
            </div>
            <div className={`w-9 h-9 sm:w-12 sm:h-12 rounded-xl ${bg} flex items-center justify-center shrink-0 [&>svg]:w-4 [&>svg]:h-4 sm:[&>svg]:w-5.5 sm:[&>svg]:h-5.5`}>
              <Icon size={22} className="text-white" />
            </div>
          </button>
        ))}
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3 mb-1 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-0">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            placeholder="Qidirish ..."
            value={search}
            onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
            className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm w-full focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
          />
        </div>
        <div className="relative" ref={filterRef}>
          <button
            onClick={() => setFilterOpen(v => !v)}
            className={`flex items-center gap-2 px-4 py-2 border rounded-xl text-sm transition-colors cursor-pointer ${filterOpen || groupFilter || teacherFilter ? 'border-indigo-400 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
          >
            <SlidersHorizontal size={14} /> Filter
            {(groupFilter || teacherFilter) && (
              <span className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[10px] flex items-center justify-center font-bold">
                {[groupFilter, teacherFilter].filter(Boolean).length}
              </span>
            )}
          </button>

          {filterOpen && (
            <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-2xl shadow-2xl z-40 w-80 p-4 space-y-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Filterlar</p>
              <Select label="Guruh" value={groupFilter} onChange={e => setGroupFilter(e.target.value)}>
                <option value="">Guruhni tanlang</option>
                {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </Select>
              <Select label="O'qituvchi" value={teacherFilter} onChange={e => setTeacherFilter(e.target.value)}>
                <option value="">O&apos;qituvchini tanlang</option>
                {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </Select>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => { clearFilters(); setFilterOpen(false); }}
                  className="flex-1 flex items-center justify-center gap-2 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <RotateCcw size={13} /> Tozalash
                </button>
                <button
                  onClick={() => setFilterOpen(false)}
                  className="flex-1 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors cursor-pointer"
                >
                  Qo&apos;llash
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="relative" ref={importRef}>
          <button
            onClick={() => setImportOpen(v => !v)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <FileUp size={14} /> Export <ChevronDown size={12} />
          </button>
          {importOpen && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl py-1.5 z-30 min-w-40">
              <button
                onClick={() => { exportToExcel(); setImportOpen(false); }}
                className="w-full text-left px-4 py-2 text-sm hover:bg-indigo-50 text-gray-700 flex items-center gap-2"
              >
                <Download size={13} /> Export CSV
              </button>
            </div>
          )}
        </div>
        <div className="ml-auto">
          <Button onClick={() => setModal('create')}>+ O&apos;quvchi qo&apos;shish</Button>
        </div>
      </div>

      {/* Active filters indicator */}
      {(groupFilter || teacherFilter) && (
        <div className="flex items-center gap-2 px-1 mb-3 mt-2">
          {groupFilter && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 border border-indigo-200 rounded-full text-xs font-medium text-indigo-700">
              {groups.find(g => g.id === groupFilter)?.name}
              <button onClick={() => setGroupFilter('')}><X size={11} /></button>
            </span>
          )}
          {teacherFilter && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 border border-indigo-200 rounded-full text-xs font-medium text-indigo-700">
              {teachers.find(t => t.id === teacherFilter)?.name}
              <button onClick={() => setTeacherFilter('')}><X size={11} /></button>
            </span>
          )}
        </div>
      )}

      {/* Pagination top */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mb-3 bg-white rounded-xl border border-gray-100 px-4 py-2.5 shadow-sm">
          <p className="text-sm text-gray-500">
            Sahifa {currentPage} / {totalPages} · Jami {byFilter.length} ta
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              ← Oldingi
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              Keyingi →
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50 text-left">
              <th className="px-4 py-3 text-xs font-semibold text-gray-400 tracking-wide">ID</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-400 tracking-wide">To&apos;liq ismi</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-400 tracking-wide">Telefon raqami</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-400 tracking-wide">Guruh</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-400 tracking-wide">Filial</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-400 tracking-wide">Balans</th>
              <th className="px-4 py-3 w-36"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {paginated.map((s, i) => {
              const activeEnrollment = s.enrollments?.find((e: any) => e.isActive);
              const price = Number(activeEnrollment?.group?.price || 0);
              const paid = monthPaidMap[s.id] || 0;
              const balance = price > 0 ? paid - price : 0;

              return (
                <tr key={s.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-4 py-3.5 text-gray-400 text-xs font-mono">{byFilter.length - ((currentPage - 1) * PAGE_SIZE + i)}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={s.name} size="sm" />
                      <span className="font-medium text-gray-900">
                        {s.name}{s.surname ? ` ${s.surname}` : ''}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-gray-600">{s.phone}</td>
                  <td className="px-4 py-3.5">
                    {activeEnrollment ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-semibold">
                        {activeEnrollment.group?.name}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-orange-50 text-orange-600 text-xs font-medium">
                        Guruh topilmadi
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 text-xs font-medium">
                      {centerName}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${
                      price > 0 && balance < 0
                        ? 'bg-red-50 text-red-600'
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      {price > 0 ? `${balance.toLocaleString()} UZS` : '0 UZS'}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5">
                      {/* Guruhga yozish / almashtirish */}
                      <div className="relative group/tip">
                        <button
                          onClick={() => { setSelectedStudent(s); setEnrollForm({ groupId: '' }); setModal(activeEnrollment ? 'changeGroup' : 'enroll'); }}
                          className="w-8 h-8 rounded-lg bg-green-500 hover:bg-green-600 flex items-center justify-center text-white transition-colors cursor-pointer"
                        >
                          <UserPlus size={14} />
                        </button>
                        <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-gray-800 text-white text-[11px] px-2 py-1 opacity-0 group-hover/tip:opacity-100 transition-opacity z-50">
                          {activeEnrollment ? 'Guruhni almashtirish' : 'Guruhga yozish'}
                        </span>
                      </div>
                      {/* To'lov kiritish */}
                      <div className="relative group/tip">
                        <button
                          onClick={() => router.push(`/operator/students/payment/${s.id}`)}
                          className="w-8 h-8 rounded-lg bg-teal-600 hover:bg-teal-700 flex items-center justify-center text-white transition-colors cursor-pointer"
                        >
                          <CreditCard size={14} />
                        </button>
                        <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-gray-800 text-white text-[11px] px-2 py-1 opacity-0 group-hover/tip:opacity-100 transition-opacity z-50">
                          To&apos;lov kiritish
                        </span>
                      </div>
                      {/* Ko'rish */}
                      <div className="relative group/tip">
                        <button
                          onClick={() => router.push(`/admin/students/${s.id}`)}
                          className="w-8 h-8 rounded-lg bg-indigo-500 hover:bg-indigo-600 flex items-center justify-center text-white transition-colors cursor-pointer"
                        >
                          <Eye size={14} />
                        </button>
                        <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-gray-800 text-white text-[11px] px-2 py-1 opacity-0 group-hover/tip:opacity-100 transition-opacity z-50">
                          Ko&apos;rish
                        </span>
                      </div>
                      {/* Tahrirlash */}
                      <div className="relative group/tip">
                        <button
                          onClick={() => { setSelectedStudent(s); setForm({ name: s.name || '', surname: s.surname || '', phone: s.phone || '', parentPhone: s.parentPhone || '', gender: s.gender || 'MALE', birthDate: s.birthDate ? s.birthDate.split('T')[0] : '', notes: s.notes || '', groupId: '' }); setModal('edit'); }}
                          className="w-8 h-8 rounded-lg bg-amber-500 hover:bg-amber-600 flex items-center justify-center text-white transition-colors cursor-pointer"
                        >
                          <Pencil size={14} />
                        </button>
                        <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-gray-800 text-white text-[11px] px-2 py-1 opacity-0 group-hover/tip:opacity-100 transition-opacity z-50">
                          Tahrirlash
                        </span>
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
            {paginated.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-14 text-center text-gray-400">
                  O&apos;quvchilar topilmadi
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>

      {/* Edit Modal */}
      <Modal open={modal === 'edit'} onClose={() => setModal(null)} title="Talabani tahrirlash" size="lg">
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

      <Modal open={modal === 'enroll'} onClose={() => setModal(null)} title={`Guruhga yozish — ${selectedStudent?.name}`} size="sm">
        <div className="space-y-4">
          <Select label="Guruh *" value={enrollForm.groupId} onChange={e => setEnrollForm({ groupId: e.target.value })}>
            <option value="">— Guruhni tanlang —</option>
            {groups.filter(g => g.status === 'GATHERING' || g.status === 'ACTIVE').map(g => (
              <option key={g.id} value={g.id}>{g.name} · {g.course?.name}</option>
            ))}
          </Select>
          <div className="flex gap-3 pt-2">
            <Button onClick={() => void enrollStudent()} loading={loading} className="flex-1">Guruhga yozish</Button>
            <Button variant="secondary" onClick={() => setModal(null)} className="flex-1">Bekor</Button>
          </div>
        </div>
      </Modal>

      <Modal open={modal === 'changeGroup'} onClose={() => setModal(null)} title={`Guruhni almashtirish — ${selectedStudent?.name}`} size="sm">
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-3 text-sm">
            <p className="text-gray-500">Hozirgi guruh:</p>
            <p className="font-medium text-gray-900 mt-1">
              {selectedStudent?.enrollments?.find((e: any) => e.isActive)?.group?.name}
            </p>
          </div>
          <Select label="Yangi guruh *" value={enrollForm.groupId} onChange={e => setEnrollForm({ groupId: e.target.value })}>
            <option value="">— Guruhni tanlang —</option>
            {groups.filter(g => {
              if (g.status !== 'GATHERING' && g.status !== 'ACTIVE') return false;
              const cur = selectedStudent?.enrollments?.find((e: any) => e.isActive)?.groupId;
              return g.id !== cur;
            }).map(g => (
              <option key={g.id} value={g.id}>{g.name} · {g.course?.name}</option>
            ))}
          </Select>
          <div className="flex gap-3 pt-2">
            <Button onClick={() => void changeGroup()} loading={loading} className="flex-1">Almashtirish</Button>
            <Button variant="secondary" onClick={() => setModal(null)} className="flex-1">Bekor</Button>
          </div>
        </div>
      </Modal>

      <Modal open={modal === 'create'} onClose={() => { setModal(null); setForm(emptyForm); setEnrollOnCreate(false); }} title="Yangi talaba qo'shish" size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Ismi *" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Ismi" />
            <Input label="Familiyasi" value={form.surname} onChange={e => setForm(p => ({ ...p, surname: e.target.value }))} placeholder="Familiyasi" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Telefon raqami *" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="+998901234567" />
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
            <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Izoh..." rows={2}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/30 resize-none" />
          </div>
          <div className="border-t border-gray-100 pt-4 space-y-3">
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setEnrollOnCreate(v => !v)}
                className={`relative w-10 h-6 rounded-full transition-colors cursor-pointer ${enrollOnCreate ? 'bg-indigo-600' : 'bg-gray-200'}`}>
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${enrollOnCreate ? 'left-5' : 'left-1'}`} />
              </button>
              <span className="text-sm font-medium text-gray-700">Guruhga biriktirish</span>
            </div>
            {enrollOnCreate && (
              <Select label="Guruh" value={form.groupId} onChange={e => setForm(p => ({ ...p, groupId: e.target.value }))}>
                <option value="">— Guruhni tanlang —</option>
                {groups.filter(g => g.status === 'GATHERING' || g.status === 'ACTIVE').map(g => (
                  <option key={g.id} value={g.id}>{g.name} · {g.course?.name}</option>
                ))}
              </Select>
            )}
          </div>
          <div className="flex gap-3 pt-2">
            <Button onClick={() => void create()} loading={loading} className="flex-1">Saqlash</Button>
            <Button variant="secondary" onClick={() => { setModal(null); setForm(emptyForm); setEnrollOnCreate(false); }} className="flex-1">Bekor</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
