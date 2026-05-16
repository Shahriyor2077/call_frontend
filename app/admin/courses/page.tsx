'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import { MoreVertical, BookOpen, AlertTriangle } from 'lucide-react';
import { useToast } from '@/components/ui/ToastProvider';

export default function CoursesPage() {
  const router = useRouter();
  const toast = useToast();
  const [courses, setCourses] = useState<any[]>([]);
  const [modal, setModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [deleting, setDeleting] = useState<any>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', description: '' });
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 15;

  async function load() {
    const { data } = await api.get('/courses');
    setCourses(data);
  }
  useEffect(() => { void load(); }, []);

  function openCreate() {
    setEditing(null);
    setForm({ name: '', description: '' });
    setModal(true);
  }
  function openEdit(c: any) {
    setEditing(c);
    setForm({ name: c.name, description: c.description || '' });
    setModal(true);
    setMenuOpen(null);
  }

  function openDelete(c: any) {
    setDeleting(c);
    setDeleteModal(true);
    setMenuOpen(null);
  }

  async function deleteCourse() {
    if (!deleting) return;
    setLoading(true);
    try {
      await api.delete(`/courses/${deleting.id}`);
      setDeleteModal(false);
      await load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    if (!form.name) return;
    setLoading(true);
    try {
      const body = {
        name: form.name,
        description: form.description,
      };
      if (editing) await api.put(`/courses/${editing.id}`, body);
      else await api.post('/courses', body);
      setModal(false);
      await load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kurslar</h1>
          <p className="text-sm text-gray-400 mt-0.5">Markazda taklif qilinayotgan barcha kurslar.</p>
        </div>
        <Button onClick={openCreate}>+ Yangi kurs</Button>
      </div>

      {Math.ceil(courses.length / PAGE_SIZE) > 1 && (
        <div className="flex items-center justify-between mt-4 mb-2 bg-white rounded-xl border border-gray-100 px-4 py-2.5 shadow-sm">
          <p className="text-sm text-gray-500">Sahifa {currentPage} / {Math.ceil(courses.length / PAGE_SIZE)} · Jami {courses.length} ta</p>
          <div className="flex gap-2">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">
              ← Oldingi
            </button>
            <button onClick={() => setCurrentPage(p => Math.min(Math.ceil(courses.length / PAGE_SIZE), p + 1))} disabled={currentPage === Math.ceil(courses.length / PAGE_SIZE)}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">
              Keyingi →
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-6">
        {courses.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE).map((c, idx) => {
          const totalStudents = (c.groups ?? []).reduce((s: number, g: any) => s + (g._count?.enrollments ?? 0), 0);
          const teacher = (c.groups ?? []).find((g: any) => g.teacher)?.teacher;
          const gradients = [
            ['from-indigo-500', 'to-violet-600'],
            ['from-emerald-400', 'to-teal-600'],
            ['from-rose-400',   'to-pink-600'],
            ['from-amber-400',  'to-orange-500'],
            ['from-sky-400',    'to-blue-600'],
            ['from-violet-500', 'to-purple-700'],
          ];
          const [gFrom, gTo] = gradients[idx % gradients.length];

          return (
            <div
              key={c.id}
              className="bg-white rounded-2xl border border-gray-100 p-5 relative cursor-pointer hover:shadow-md hover:border-indigo-200 transition-all group shadow-sm"
              onClick={() => router.push(`/admin/groups?courseId=${c.id}`)}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl bg-linear-to-br ${gFrom} ${gTo} flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform shrink-0`}>
                  <BookOpen size={22} />
                </div>
                <div className="relative">
                  <button
                    onClick={e => { e.stopPropagation(); setMenuOpen(menuOpen === c.id ? null : c.id); }}
                    className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-400 transition-colors cursor-pointer"
                  >
                    <MoreVertical size={15} />
                  </button>
                  {menuOpen === c.id && (
                    <div className="absolute right-0 top-9 bg-white border border-gray-200 rounded-xl shadow-lg py-1.5 z-10 w-36">
                      <button onClick={e => { e.stopPropagation(); openEdit(c); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 text-gray-700 cursor-pointer">Tahrirlash</button>
                      <button onClick={e => { e.stopPropagation(); openDelete(c); }} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer">O&apos;chirish</button>
                    </div>
                  )}
                </div>
              </div>

              {/* Title */}
              <p className="text-[17px] font-bold text-gray-900 mb-0.5 truncate">{c.name}</p>
              <p className="text-xs text-gray-400 mb-4 truncate">{c.description || 'Tavsif kiritilmagan'}</p>

              {/* Divider */}
              <div className="border-t border-gray-50 mb-4" />

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center p-2 bg-gray-50 rounded-xl">
                  <p className="text-lg font-bold text-gray-900 leading-none">{c._count?.groups ?? 0}</p>
                  <p className="text-[10px] text-gray-400 mt-1 font-medium">Guruh</p>
                </div>
                <div className="text-center p-2 bg-gray-50 rounded-xl">
                  <p className="text-lg font-bold text-gray-900 leading-none">{totalStudents}</p>
                  <p className="text-[10px] text-gray-400 mt-1 font-medium">Talaba</p>
                </div>
                <div className="text-center p-2 bg-gray-50 rounded-xl truncate">
                  <p className="text-[13px] font-bold text-gray-900 leading-none truncate">{teacher?.name?.split(' ')[0] ?? '—'}</p>
                  <p className="text-[10px] text-gray-400 mt-1 font-medium">O&apos;qituvchi</p>
                </div>
              </div>
            </div>
          );
        })}
        {courses.length === 0 && (
          <div className="col-span-3 text-center py-16 text-gray-400">
            <BookOpen size={36} className="mx-auto mb-3 text-gray-300" />
            <p className="font-medium">Hozircha kurs yo&apos;q</p>
          </div>
        )}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Kursni tahrirlash' : 'Yangi kurs'}>
        <div className="space-y-4">
          <Input
            label="Kurs nomi *"
            value={form.name}
            onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
            placeholder="Kurs nomini kiriting"
          />
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Tavsif <span className="text-gray-400 font-normal">(ixtiyoriy)</span>
            </label>
            <textarea
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              placeholder="Kurs haqida qisqacha ma'lumot..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-400 min-h-25"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button onClick={() => void save()} loading={loading} className="flex-1">Saqlash</Button>
            <Button variant="secondary" onClick={() => setModal(false)} className="flex-1">Bekor</Button>
          </div>
        </div>
      </Modal>

      <Modal open={deleteModal} onClose={() => setDeleteModal(false)} title="Kursni o'chirish">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
              <AlertTriangle size={20} />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">
                "{deleting?.name}" kursini o'chirmoqchimisiz?
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Bu amal bajarilgandan keyin kursni qayta tiklab bo'lmaydi.
              </p>
            </div>
          </div>
          <div className="bg-red-50 border border-red-100 rounded-xl p-3">
            <p className="text-sm text-red-700">
              Kursga bog'langan barcha guruhlar ham o'chiriladi. Davom etishdan oldin ma'lumotlarni tekshirib oling.
            </p>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="danger" onClick={() => void deleteCourse()} loading={loading} className="flex-1">
              O'chirish
            </Button>
            <Button variant="secondary" onClick={() => setDeleteModal(false)} className="flex-1">Bekor</Button>
          </div>
        </div>
      </Modal>

      {menuOpen && <div className="fixed inset-0 z-0" onClick={() => setMenuOpen(null)} />}
    </div>
  );
}
