'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import { School, MoreVertical, Phone, Users, BookOpen, Search } from 'lucide-react';
import { useToast } from '@/components/ui/ToastProvider';

export default function TeachersPage() {
  const toast = useToast();
  const [teachers, setTeachers] = useState<any[]>([]);
  const [modal, setModal] = useState(false);
  const [editModal, setEditModal] = useState<any>(null);
  const [deleteModal, setDeleteModal] = useState<any>(null);
  const [form, setForm] = useState({ name: '', phone: '', specialty: '' });
  const [loading, setLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 15;

  async function load() {
    const { data } = await api.get('/teachers');
    setTeachers(data);
  }
  useEffect(() => { void load(); }, []);

  async function save() {
    setLoading(true);
    try {
      await api.post('/teachers', form);
      setModal(false);
      setForm({ name: '', phone: '', specialty: '' });
      void load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Xatolik yuz berdi');
    } finally { setLoading(false); }
  }

  async function update() {
    if (!editModal) return;
    setLoading(true);
    try {
      await api.put(`/teachers/${editModal.id}`, { name: editModal.name, phone: editModal.phone, specialty: editModal.specialty });
      setEditModal(null);
      void load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Xatolik yuz berdi');
    } finally { setLoading(false); }
  }

  async function deleteTeacher() {
    if (!deleteModal) return;
    setLoading(true);
    try {
      await api.delete(`/teachers/${deleteModal.id}`);
      setDeleteModal(null);
      void load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  }

  const totalGroups = teachers.reduce((s, t) => s + (t._count?.groups ?? 0), 0);
  const totalStudents = teachers.reduce((s, t) => s + (t.groups ?? []).reduce((gs: number, g: any) => gs + (g._count?.enrollments ?? 0), 0), 0);

  const filtered = search
    ? teachers.filter(t =>
        t.name?.toLowerCase().includes(search.toLowerCase()) ||
        t.phone?.includes(search) ||
        t.specialty?.toLowerCase().includes(search.toLowerCase())
      )
    : teachers;

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const gradients = [
    ['from-indigo-500', 'to-violet-600'],
    ['from-emerald-400', 'to-teal-600'],
    ['from-rose-400', 'to-pink-600'],
    ['from-amber-400', 'to-orange-500'],
    ['from-sky-400', 'to-blue-600'],
    ['from-violet-500', 'to-purple-700'],
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">O&apos;qituvchilar</h1>
          <p className="text-sm text-gray-400 mt-0.5">Markazdagi pedagogik kadrlar.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
              placeholder="Qidirish..."
              className="pl-8 pr-3 py-2 border border-gray-200 rounded-xl text-sm w-48 focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
            />
          </div>
          <Button onClick={() => { setForm({ name: '', phone: '', specialty: '' }); setModal(true); }}>
            + Yangi o&apos;qituvchi
          </Button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="w-10 h-10 rounded-xl bg-linear-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white mb-3 shadow-sm">
            <School size={18} />
          </div>
          <p className="text-2xl font-bold text-gray-900 leading-none mb-1">{teachers.length}</p>
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Jami o&apos;qituvchilar</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="w-10 h-10 rounded-xl bg-linear-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white mb-3 shadow-sm">
            <BookOpen size={18} />
          </div>
          <p className="text-2xl font-bold text-gray-900 leading-none mb-1">{totalGroups}</p>
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Jami guruhlar</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="w-10 h-10 rounded-xl bg-linear-to-br from-rose-400 to-pink-600 flex items-center justify-center text-white mb-3 shadow-sm">
            <Users size={18} />
          </div>
          <p className="text-2xl font-bold text-gray-900 leading-none mb-1">{totalStudents}</p>
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Jami talabalar</p>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mb-4 bg-white rounded-xl border border-gray-100 px-4 py-2.5 shadow-sm">
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

      {/* Cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {paginated.map((t, idx) => {
          const studentCount = (t.groups ?? []).reduce((s: number, g: any) => s + (g._count?.enrollments ?? 0), 0);
          const [gFrom, gTo] = gradients[idx % gradients.length];
          return (
            <div
              key={t.id}
              className={`bg-white rounded-2xl border border-gray-100 p-5 relative hover:shadow-md hover:border-indigo-200 transition-all group shadow-sm ${!t.isActive ? 'opacity-60' : ''}`}
            >
              {/* Card header */}
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl bg-linear-to-br ${gFrom} ${gTo} flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform shrink-0`}>
                  <School size={22} />
                </div>
                <div className="relative">
                  <button
                    onClick={e => { e.stopPropagation(); setMenuOpen(menuOpen === t.id ? null : t.id); }}
                    className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-400 transition-colors cursor-pointer"
                  >
                    <MoreVertical size={15} />
                  </button>
                  {menuOpen === t.id && (
                    <div className="absolute right-0 top-9 bg-white border border-gray-200 rounded-xl shadow-lg py-1.5 z-10 w-36">
                      <button
                        onClick={e => { e.stopPropagation(); setEditModal({ ...t }); setMenuOpen(null); }}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 text-gray-700 cursor-pointer"
                      >
                        Tahrirlash
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); setDeleteModal(t); setMenuOpen(null); }}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer"
                      >
                        O&apos;chirish
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Info */}
              <p className="text-[17px] font-bold text-gray-900 mb-0.5 truncate">{t.name}</p>
              <p className="text-xs text-gray-400 mb-2 truncate">{t.specialty || "Mutaxassislik ko'rsatilmagan"}</p>
              <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-4">
                <Phone size={11} />
                <span>{t.phone}</span>
              </div>

              {/* Divider */}
              <div className="border-t border-gray-50 mb-4" />

              {/* Stats */}
              <div className="grid grid-cols-2 gap-2">
                <div className="text-center p-2 bg-gray-50 rounded-xl">
                  <p className="text-lg font-bold text-gray-900 leading-none">{t._count?.groups ?? 0}</p>
                  <p className="text-[10px] text-gray-400 mt-1 font-medium">Guruhlar</p>
                </div>
                <div className="text-center p-2 bg-gray-50 rounded-xl">
                  <p className="text-lg font-bold text-gray-900 leading-none">{studentCount}</p>
                  <p className="text-[10px] text-gray-400 mt-1 font-medium">Talabalar</p>
                </div>
              </div>
            </div>
          );
        })}
        {paginated.length === 0 && (
          <div className="col-span-3 text-center py-16 text-gray-400">
            <School size={36} className="mx-auto mb-3 text-gray-300" />
            <p className="font-medium">Hozircha o&apos;qituvchi yo&apos;q</p>
          </div>
        )}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="Yangi o'qituvchi" size="sm">
        <div className="space-y-4">
          <Input label="Ism familiya *" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Shahriyor Zaripov" />
          <Input label="Telefon *" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="+998901234567" />
          <Input label="Mutaxassislik" value={form.specialty} onChange={e => setForm(p => ({ ...p, specialty: e.target.value }))} placeholder="Mutaxassislik" />
          <div className="flex gap-3 pt-2">
            <Button onClick={() => void save()} loading={loading} className="flex-1">Saqlash</Button>
            <Button variant="secondary" onClick={() => setModal(false)} className="flex-1">Bekor</Button>
          </div>
        </div>
      </Modal>

      <Modal open={!!editModal} onClose={() => setEditModal(null)} title="O'qituvchini tahrirlash" size="sm">
        {editModal && (
          <div className="space-y-4">
            <Input label="Ism familiya *" value={editModal.name} onChange={e => setEditModal((p: any) => ({ ...p, name: e.target.value }))} />
            <Input label="Telefon *" value={editModal.phone} onChange={e => setEditModal((p: any) => ({ ...p, phone: e.target.value }))} />
            <Input label="Mutaxassislik" value={editModal.specialty || ''} onChange={e => setEditModal((p: any) => ({ ...p, specialty: e.target.value }))} />
            <div className="flex gap-3 pt-2">
              <Button onClick={() => void update()} loading={loading} className="flex-1">Saqlash</Button>
              <Button variant="secondary" onClick={() => setEditModal(null)} className="flex-1">Bekor</Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={!!deleteModal} onClose={() => setDeleteModal(null)} title="O'qituvchini o'chirish">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            <span className="font-semibold text-gray-900">{deleteModal?.name}</span> o&apos;qituvchisini o&apos;chirishni xohlaysizmi?
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-sm text-amber-800">
              ⚠️ Bu amal qaytarilmaydi. O&apos;qituvchi va unga tegishli barcha ma&apos;lumotlar o&apos;chiriladi.
            </p>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="danger" onClick={() => void deleteTeacher()} loading={loading} className="flex-1">
              O&apos;chirish
            </Button>
            <Button variant="secondary" onClick={() => setDeleteModal(null)} className="flex-1">Bekor</Button>
          </div>
        </div>
      </Modal>

      {menuOpen && <div className="fixed inset-0 z-0" onClick={() => setMenuOpen(null)} />}
    </div>
  );
}
