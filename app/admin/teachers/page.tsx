'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Avatar from '@/components/ui/Avatar';
import { School } from 'lucide-react';

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [modal, setModal] = useState(false);
  const [editModal, setEditModal] = useState<any>(null);
  const [deleteModal, setDeleteModal] = useState<any>(null);
  const [form, setForm] = useState({ name: '', phone: '', specialty: '' });
  const [loading, setLoading] = useState(false);

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
      alert(err?.response?.data?.message || 'Xatolik yuz berdi');
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
      alert(err?.response?.data?.message || 'Xatolik yuz berdi');
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
      alert(err?.response?.data?.message || 'Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">O&apos;qituvchilar</h1>
          <p className="text-sm text-gray-400 mt-0.5">Markazdagi pedagogik kadrlar.</p>
        </div>
        <Button onClick={() => { setForm({ name: '', phone: '', specialty: '' }); setModal(true); }}>
          + Yangi o&apos;qituvchi
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
        {teachers.map(t => (
          <div key={t.id} className={`bg-white rounded-xl border p-5 ${!t.isActive ? 'opacity-60' : ''}`}>
            <div className="flex items-center gap-4 mb-4">
              <Avatar name={t.name} size="lg" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900">{t.name}</p>
                <p className="text-sm text-gray-400">{t.specialty || "Mutaxassislik ko'rsatilmagan"}</p>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => setEditModal({ ...t })}
                  className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg hover:border-indigo-400 hover:text-indigo-600 transition-colors"
                >
                  Tahrirlash
                </button>
                <button
                  onClick={() => setDeleteModal(t)}
                  className="text-xs px-3 py-1.5 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                >
                  O&apos;chirish
                </button>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-sm text-gray-400 mb-4">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.15 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.06 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              {t.phone}
            </div>

            <div className="grid grid-cols-2 gap-4 border-t pt-4">
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Guruhlar</p>
                <p className="text-xl font-bold text-gray-900">{t._count?.groups ?? 0}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Talabalar</p>
                <p className="text-xl font-bold text-gray-900">{(t.groups ?? []).reduce((s: number, g: any) => s + (g._count?.enrollments ?? 0), 0)}</p>
              </div>
            </div>
          </div>
        ))}
        {teachers.length === 0 && (
          <div className="col-span-2 text-center py-16 text-gray-400">
            <School size={36} className="mx-auto mb-3 text-gray-300" />
            <p className="font-medium">Hozircha o&apos;qituvchi yo&apos;q</p>
          </div>
        )}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="Yangi o'qituvchi" size="sm">
        <div className="space-y-4">
          <Input label="Ism familiya *" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Shahriyor Zaripov" />
          <Input label="Telefon *" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="+998901234567" />
          <Input label="Mutaxassislik" value={form.specialty} onChange={e => setForm(p => ({ ...p, specialty: e.target.value }))} placeholder="English, Frontend, Math..." />
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

      {/* Delete Modal */}
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
    </div>
  );
}
