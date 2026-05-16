'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Avatar from '@/components/ui/Avatar';
import { UserPlus, Pencil, Eye, Users, CheckCircle2, Clock, Archive } from 'lucide-react';
import { useToast } from '@/components/ui/ToastProvider';

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

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-50 text-green-700 border-green-200',
  GATHERING: 'bg-blue-50 text-blue-700 border-blue-200',
  COMPLETED: 'bg-gray-100 text-gray-500 border-gray-200',
  CANCELLED: 'bg-red-50 text-red-500 border-red-200',
};

const STATUS_DOT: Record<string, string> = {
  ACTIVE: 'bg-green-500', GATHERING: 'bg-blue-500', COMPLETED: 'bg-gray-400', CANCELLED: 'bg-red-400',
};

export default function GroupsPage() {
  const toast = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [groups, setGroups] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [filterCourse, setFilterCourse] = useState(searchParams.get('courseId') ?? '');
  const [filterStatus, setFilterStatus] = useState('');
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [deleteModal, setDeleteModal] = useState<any>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [form, setForm] = useState({
    courseId: '', teacherId: '', name: '', type: 'OFFLINE', maxStudents: '',
    price: '', meetLink: '', platform: '', room: '', address: '',
    days: [] as string[], startTime: '', endTime: '', startDate: '',
    duration: '', durationUnit: 'month',
  });
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 15;

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
    if (!form.courseId) { toast.warning('Kursni tanlang'); return; }
    if (!form.name.trim()) { toast.warning('Guruh nomini kiriting'); return; }
    setLoading(true);
    const payload = {
      courseId: form.courseId,
      name: form.name.trim(),
      type: form.type,
      maxStudents: form.maxStudents ? Number(form.maxStudents) : undefined,
      days: form.days,
      startTime: form.startTime || undefined,
      endTime: form.endTime || undefined,
      price: form.price ? Number(form.price) : undefined,
      teacherId: form.teacherId || undefined,
      startDate: form.startDate || undefined,
      meetLink: form.meetLink || undefined,
      platform: form.platform || undefined,
      room: form.room || undefined,
      address: form.address || undefined,
      duration: form.duration ? Number(form.duration) : undefined,
      durationUnit: form.durationUnit || undefined,
    };
    try {
      if (editing) await api.put(`/groups/${editing.id}`, payload);
      else await api.post('/groups', payload);
      setModal(false);
      setEditing(null);
      await load();
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg.join(' ') : msg || 'Guruh saqlashda xatolik yuz berdi');
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
    setMenuOpen(null);
  }

  async function updateStatus(g: any, status: string) {
    await api.put(`/groups/${g.id}`, { status });
    setMenuOpen(null);
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
      toast.error(err?.response?.data?.message || 'Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  }

  const filtered = groups.filter(g => {
    if (search && !g.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterCourse && g.courseId !== filterCourse) return false;
    if (filterStatus && g.status !== filterStatus) return false;
    return true;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function resetForm() {
    setForm({ courseId: '', teacherId: '', name: '', type: 'OFFLINE', maxStudents: '', price: '', meetLink: '', platform: '', room: '', address: '', days: [], startTime: '', endTime: '', startDate: '', duration: '', durationUnit: 'month' });
    setEditing(null);
  }

  const statCards = [
    { label: 'Guruhlar', value: groups.length, filter: '', icon: <Users size={20} />, from: 'from-indigo-500', to: 'to-violet-600', activeBg: 'bg-indigo-50 border-indigo-200' },
    { label: 'Faol guruhlar', value: groups.filter(g => g.status === 'ACTIVE').length, filter: 'ACTIVE', icon: <CheckCircle2 size={20} />, from: 'from-emerald-400', to: 'to-teal-600', activeBg: 'bg-emerald-50 border-emerald-200' },
    { label: "To'plash", value: groups.filter(g => g.status === 'GATHERING').length, filter: 'GATHERING', icon: <Clock size={20} />, from: 'from-amber-400', to: 'to-orange-500', activeBg: 'bg-amber-50 border-amber-200' },
    { label: 'Yakunlangan', value: groups.filter(g => g.status === 'COMPLETED').length, filter: 'COMPLETED', icon: <Archive size={20} />, from: 'from-rose-400', to: 'to-red-600', activeBg: 'bg-rose-50 border-rose-200' },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Guruhlar</h1>
          <p className="text-sm text-gray-400 mt-0.5">Faol va rejalashtirilgan o&apos;quv guruhlari.</p>
        </div>
        <Button onClick={() => { resetForm(); setModal(true); }}>+ Yangi guruh</Button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {statCards.map(s => {
          const active = filterStatus === s.filter;
          return (
            <button
              key={s.filter}
              onClick={() => { setFilterStatus(active ? '' : s.filter); setCurrentPage(1); }}
              className={`text-left p-4 rounded-2xl border shadow-sm hover:shadow-md transition-all cursor-pointer ${active ? s.activeBg : 'bg-white border-gray-100'}`}
            >
              <div className={`w-10 h-10 rounded-xl bg-linear-to-br ${s.from} ${s.to} flex items-center justify-center text-white mb-3 shadow-sm`}>
                {s.icon}
              </div>
              <p className="text-2xl font-bold text-gray-900 leading-none mb-1">{s.value}</p>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{s.label}</p>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative w-full sm:w-52">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            placeholder="Guruh nomi..."
            value={search}
            onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
            className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm w-full focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
          />
        </div>
        <Select value={filterCourse} onChange={e => { setFilterCourse(e.target.value); setCurrentPage(1); }}>
          <option value="">Barcha kurslar</option>
          {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
        <Select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setCurrentPage(1); }}>
          <option value="">Barcha holatlar</option>
          {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </Select>
        <span className="ml-auto text-sm text-gray-400 bg-gray-100 px-3 py-1.5 rounded-xl">{filtered.length} ta</span>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mb-3 bg-white rounded-xl border border-gray-100 px-4 py-2.5 shadow-sm">
          <p className="text-sm text-gray-500">Sahifa {currentPage} / {totalPages} · Jami {filtered.length} ta</p>
          <div className="flex gap-2">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">
              ← Oldingi
            </button>
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">
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
              <th className="px-5 py-3 text-xs font-semibold text-gray-400 tracking-wide rounded-tl-2xl">GURUH</th>
              <th className="px-5 py-3 text-xs font-semibold text-gray-400 tracking-wide">KURS</th>
              <th className="px-5 py-3 text-xs font-semibold text-gray-400 tracking-wide">O&apos;QITUVCHI</th>
              <th className="px-5 py-3 text-xs font-semibold text-gray-400 tracking-wide">TALABALAR</th>
              <th className="px-5 py-3 text-xs font-semibold text-gray-400 tracking-wide">NARX</th>
              <th className="px-5 py-3 text-xs font-semibold text-gray-400 tracking-wide">HOLAT</th>
              <th className="px-5 py-3 text-xs font-semibold text-gray-400 tracking-wide w-36 rounded-tr-2xl">HARAKATLAR</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {paginated.map(g => {
              const enrolled = g._count?.enrollments ?? 0;
              const pct = Math.min(100, (enrolled / (g.maxStudents || 1)) * 100);
              return (
                <tr key={g.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-5 py-3.5">
                    <div>
                      <p className="font-semibold text-gray-900">{g.name}</p>
                      {(g.days?.length > 0 || g.startTime) && (
                        <div className="flex items-center gap-1 mt-1 flex-wrap">
                          {(g.days || []).map((d: string) => (
                            <span key={d} className="text-[10px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded font-medium">
                              {DAYS_OPTIONS.find(x => x.value === d)?.label ?? d}
                            </span>
                          ))}
                          {g.startTime && (
                            <span className="text-[10px] text-gray-400">{g.startTime}–{g.endTime}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-semibold">
                      {g.course?.name ?? '—'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    {g.teacher ? (
                      <div className="flex items-center gap-2">
                        <Avatar name={g.teacher.name} size="sm" />
                        <span className="text-gray-700 text-sm">{g.teacher.name}</span>
                      </div>
                    ) : <span className="text-gray-300 text-sm">—</span>}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900 text-sm">{enrolled}/{g.maxStudents}</span>
                      <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 font-semibold text-gray-900 text-sm">
                    {g.price ? `${Number(g.price).toLocaleString('uz-UZ')} so'm` : <span className="text-gray-300 font-normal">—</span>}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="relative inline-block">
                      <button
                        onClick={e => { e.stopPropagation(); setMenuOpen(menuOpen === `status_${g.id}` ? null : `status_${g.id}`); }}
                        className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-full cursor-pointer select-none border transition-colors ${STATUS_COLORS[g.status] ?? 'bg-gray-100 text-gray-500'}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[g.status]}`} />
                        {STATUS_LABELS[g.status] ?? g.status}
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="opacity-50"><path d="m6 9 6 6 6-6"/></svg>
                      </button>
                      {menuOpen === `status_${g.id}` && (
                        <div className="absolute left-0 top-full pt-1 z-20">
                          <div className="bg-white border border-gray-200 rounded-xl shadow-xl py-1.5 min-w-36">
                            {Object.entries(STATUS_LABELS).map(([s, label]) => (
                              <button
                                key={s}
                                onClick={() => { void updateStatus(g, s); setMenuOpen(null); }}
                                className={`w-full text-left px-3.5 py-2 text-xs font-medium flex items-center gap-2.5 transition-colors cursor-pointer ${g.status === s ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-50'}`}
                              >
                                <span className={`w-2 h-2 rounded-full shrink-0 ${STATUS_DOT[s]}`} />
                                {label}
                                {g.status === s && <span className="ml-auto text-indigo-500 font-bold">✓</span>}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5">
                      {[
                        { label: "O'quvchi biriktirish", icon: <UserPlus size={14} />, cls: 'bg-green-500 hover:bg-green-600', onClick: () => router.push(`/admin/groups/${g.id}/enroll`) },
                        { label: 'Tahrirlash', icon: <Pencil size={14} />, cls: 'bg-blue-400 hover:bg-blue-500', onClick: () => openEdit(g) },
                        { label: "Ko'rish", icon: <Eye size={14} />, cls: 'bg-indigo-500 hover:bg-indigo-600', onClick: () => router.push(`/admin/groups/${g.id}`) },
                        { label: "O'chirish", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>, cls: 'bg-red-400 hover:bg-red-500', onClick: () => { setDeleteModal(g); } },
                      ].map(btn => (
                        <div key={btn.label} className="relative group/tip">
                          <button
                            onClick={btn.onClick}
                            className={`w-8 h-8 flex items-center justify-center rounded-lg text-white transition-colors cursor-pointer shadow-sm ${btn.cls}`}
                          >
                            {btn.icon}
                          </button>
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-[11px] rounded-lg whitespace-nowrap opacity-0 group-hover/tip:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg">
                            {btn.label}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </td>
                </tr>
              );
            })}
            {paginated.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-14 text-center text-gray-400">Guruhlar topilmadi</td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>

      {/* Create/Edit Modal */}
      <Modal open={modal} onClose={() => { setModal(false); setEditing(null); }} title={editing ? 'Guruhni tahrirlash' : 'Yangi guruh'} size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Select label="Kurs *" value={form.courseId} onChange={e => setForm(p => ({ ...p, courseId: e.target.value }))}>
              <option value="">— Tanlang —</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
            <Input label="Guruh nomi *" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
          </div>
          <Select label="O'qituvchi" value={form.teacherId} onChange={e => setForm(p => ({ ...p, teacherId: e.target.value }))}>
            <option value="">— Tanlang —</option>
            {teachers.map(t => <option key={t.id} value={t.id}>{t.name}{t.specialty ? ` (${t.specialty})` : ''}</option>)}
          </Select>
          <div className="grid grid-cols-3 gap-3">
            <Select label="Tur" value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
              <option value="OFFLINE">Offline</option>
              <option value="ONLINE">Online</option>
            </Select>
            <Input label="Max talabalar" type="number" value={form.maxStudents} onChange={e => setForm(p => ({ ...p, maxStudents: e.target.value }))} onWheel={e => e.currentTarget.blur()} />
            <Input label="Narx (so'm)" type="number" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} onWheel={e => e.currentTarget.blur()} />
          </div>
          {form.type === 'ONLINE' ? (
            <div className="grid grid-cols-2 gap-3">
              <Input label="Meet linki" value={form.meetLink} onChange={e => setForm(p => ({ ...p, meetLink: e.target.value }))} placeholder="https://zoom.us/..." />
              <Input label="Platforma" value={form.platform} onChange={e => setForm(p => ({ ...p, platform: e.target.value }))} placeholder="Zoom, Meet..." />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <Input label="Xona" value={form.room} onChange={e => setForm(p => ({ ...p, room: e.target.value }))} />
              <Input label="Manzil" value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} />
            </div>
          )}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Dars kunlari</label>
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
            <Input label="Boshlanish vaqti" type="time" value={form.startTime} onChange={e => setForm(p => ({ ...p, startTime: e.target.value }))} />
            <Input label="Tugash vaqti" type="time" value={form.endTime} onChange={e => setForm(p => ({ ...p, endTime: e.target.value }))} />
            <Input label="Boshlanish sanasi" type="date" value={form.startDate} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Davomiyligi" type="number" value={form.duration} onChange={e => setForm(p => ({ ...p, duration: e.target.value }))} onWheel={e => e.currentTarget.blur()} />
            <Select label="Birlik" value={form.durationUnit} onChange={e => setForm(p => ({ ...p, durationUnit: e.target.value }))}>
              <option value="month">Oy</option>
              <option value="week">Hafta</option>
            </Select>
          </div>
          <div className="flex gap-3 pt-2">
            <Button onClick={() => void save()} loading={loading} className="flex-1">Saqlash</Button>
            <Button variant="secondary" onClick={() => { setModal(false); setEditing(null); }} className="flex-1">Bekor</Button>
          </div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal open={!!deleteModal} onClose={() => setDeleteModal(null)} title="Guruhni o'chirish">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            <span className="font-semibold text-gray-900">{deleteModal?.name}</span> guruhini o&apos;chirishni xohlaysizmi?
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-sm text-amber-800">
              ⚠️ Bu amal qaytarilmaydi. Guruh va unga tegishli barcha ma&apos;lumotlar o&apos;chiriladi.
            </p>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="danger" onClick={() => void deleteGroup()} loading={loading} className="flex-1">O&apos;chirish</Button>
            <Button variant="secondary" onClick={() => setDeleteModal(null)} className="flex-1">Bekor</Button>
          </div>
        </div>
      </Modal>

      {menuOpen && <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(null)} />}
    </div>
  );
}
