'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import { MoreVertical, BookOpen } from 'lucide-react';

export default function CoursesPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<any[]>([]);
  const [modal, setModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [deleting, setDeleting] = useState<any>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', description: '' });
  const [loading, setLoading] = useState(false);

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
      alert(err?.response?.data?.message || 'Xatolik yuz berdi');
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
      alert(err?.response?.data?.message || 'Xatolik yuz berdi');
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        {courses.map(c => {
          const totalStudents = (c.groups ?? []).reduce((s: number, g: any) => s + (g._count?.enrollments ?? 0), 0);
          const teacher = (c.groups ?? []).find((g: any) => g.teacher)?.teacher;

          return (
            <div key={c.id} className="bg-white rounded-xl border p-5 relative cursor-pointer hover:border-indigo-300 hover:shadow-sm transition-all" onClick={() => router.push(`/admin/groups?courseId=${c.id}`)}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center shrink-0">
                    <svg className="text-indigo-600" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{c.name}</p>
                    <p className="text-xs text-gray-400">{c.description || '—'}</p>
                  </div>
                </div>
                <div className="relative">
                  <button
                    onClick={(e) => { e.stopPropagation(); setMenuOpen(menuOpen === c.id ? null : c.id); }}
                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400"
                  ><MoreVertical size={15} /></button>
                  {menuOpen === c.id && (
                    <div className="absolute right-0 top-8 bg-white border rounded-xl shadow-lg py-1 z-10 w-36">
                      <button onClick={() => openEdit(c)} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50">Tahrirlash</button>
                      <button onClick={() => openDelete(c)} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">O'chirish</button>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Guruhlar</p>
                  <p className="font-semibold text-gray-900">{c._count?.groups ?? 0}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Talabalar</p>
                  <p className="font-semibold text-gray-900">{totalStudents}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">O&apos;qituvchi</p>
                  <p className="font-semibold text-gray-900 truncate">{teacher?.name ?? '—'}</p>
                </div>
              </div>
            </div>
          );
        })}
        {courses.length === 0 && (
          <div className="col-span-2 text-center py-16 text-gray-400">
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 min-h-25"
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
          <p className="text-sm text-gray-600">
            <span className="font-semibold text-gray-900">{deleting?.name}</span> kursini o'chirishni xohlaysizmi?
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-sm text-amber-800">
              ⚠️ Bu amal qaytarilmaydi. Kurs va unga tegishli barcha guruhlar o'chiriladi.
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
