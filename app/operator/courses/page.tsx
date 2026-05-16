'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { BookOpen } from 'lucide-react';

const PAGE_SIZE = 15;

export default function OperatorCoursesPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  async function load() {
    const { data } = await api.get('/courses');
    setCourses(data);
  }
  useEffect(() => { void load(); }, []);

  const totalPages = Math.ceil(courses.length / PAGE_SIZE);
  const paginated = courses.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div>
      <div className="flex items-start justify-between mb-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kurslar</h1>
          <p className="text-sm text-gray-400 mt-0.5">Markazda taklif qilinayotgan barcha kurslar.</p>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mb-4 mt-4 bg-white rounded-xl border border-gray-100 px-4 py-2.5 shadow-sm">
          <p className="text-sm text-gray-500">Sahifa {currentPage} / {totalPages} · Jami {courses.length} ta</p>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              ← Oldingi
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              Keyingi →
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-6">
        {paginated.map((c, idx) => {
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
              onClick={() => router.push(`/operator/groups?courseId=${c.id}`)}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl bg-linear-to-br ${gFrom} ${gTo} flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform shrink-0`}>
                  <BookOpen size={22} />
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
        {paginated.length === 0 && (
          <div className="col-span-3 text-center py-16 text-gray-400">
            <BookOpen size={36} className="mx-auto mb-3 text-gray-300" />
            <p className="font-medium">Hozircha kurs yo&apos;q</p>
          </div>
        )}
      </div>
    </div>
  );
}
