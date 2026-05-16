'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { ArrowLeft, ChevronLeft, ChevronRight, ExternalLink, Info } from 'lucide-react';
import { useToast } from '@/components/ui/ToastProvider';

const MONTHS_UZ = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];
const DAYS_SHORT = ['Du', 'Se', 'Chor', 'Pay', 'Ju', 'Sha', 'Yak'];

function MiniCalendar({ selected, onChange }: { selected: Date; onChange: (d: Date) => void }) {
  const [year, setYear] = useState(selected.getFullYear());
  const [month, setMonth] = useState(selected.getMonth());

  function prevMonth() { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); }
  function nextMonth() { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); }

  const firstDay = new Date(year, month, 1).getDay();
  const offset = firstDay === 0 ? 6 : firstDay - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrev = new Date(year, month, 0).getDate();
  const cells: { day: number; cur: boolean }[] = [];
  for (let i = offset - 1; i >= 0; i--) cells.push({ day: daysInPrev - i, cur: false });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, cur: true });
  while (cells.length % 7 !== 0) cells.push({ day: cells.length - daysInMonth - offset + 1, cur: false });

  return (
    <div className="bg-indigo-700 rounded-2xl p-5 text-white select-none">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-indigo-600 transition-colors">
          <ChevronLeft size={16} />
        </button>
        <div className="flex items-center gap-2 text-sm font-semibold">
          <span>{MONTHS_UZ[month]}</span>
          <span className="text-indigo-300">›</span>
          <span>{year}</span>
        </div>
        <button onClick={nextMonth} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-indigo-600 transition-colors">
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Day names */}
      <div className="grid grid-cols-7 mb-2">
        {DAYS_SHORT.map(d => (
          <div key={d} className="text-center text-[11px] font-semibold text-indigo-300 py-1">{d}</div>
        ))}
      </div>

      {/* Cells */}
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((cell, i) => {
          const isSelected = cell.cur && selected.getDate() === cell.day && selected.getMonth() === month && selected.getFullYear() === year;
          const isToday = cell.cur && new Date().getDate() === cell.day && new Date().getMonth() === month && new Date().getFullYear() === year;
          return (
            <button
              key={i}
              disabled={!cell.cur}
              onClick={() => cell.cur && onChange(new Date(year, month, cell.day))}
              className={`h-8 w-full flex items-center justify-center text-sm rounded-lg transition-colors font-medium
                ${!cell.cur ? 'text-indigo-600 cursor-default'
                  : isSelected ? 'bg-white text-indigo-700 font-bold shadow'
                  : isToday ? 'bg-indigo-500 text-white'
                  : 'text-white hover:bg-indigo-600'}`}
            >
              {cell.day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function EnrollPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const toast = useToast();

  const [group, setGroup] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const [showStudentList, setShowStudentList] = useState(false);
  const [enrollDate, setEnrollDate] = useState(new Date());
  const [paymentAmount, setPaymentAmount] = useState('');
  const [addAgreement, setAddAgreement] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get(`/groups/${id}`), api.get('/students')])
      .then(([g, s]) => {
        setGroup(g.data);
        setPaymentAmount(g.data.price ? String(g.data.price) : '');
        setStudents(s.data);
      })
      .catch(() => toast.error('Ma\'lumotlar yuklanmadi'))
      .finally(() => setPageLoading(false));
  }, [id]);

  const selectedStudent = students.find(s => s.id === selectedStudentId);

  const filteredStudents = students.filter(s => {
    if (!studentSearch) return true;
    const q = studentSearch.toLowerCase();
    return s.name?.toLowerCase().includes(q) || s.phone?.includes(q);
  });

  async function handleEnroll() {
    if (!selectedStudentId) { toast.warning("O'quvchini tanlang"); return; }
    setLoading(true);
    try {
      await api.post(`/groups/${id}/enroll`, { studentId: selectedStudentId });
      router.push(`/admin/groups/${id}`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  }

  if (pageLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-7 w-7 border-2 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  if (!group) return <div className="text-center py-20 text-gray-400">Guruh topilmadi</div>;

  const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('ru-RU') : '—';
  const debtStart = enrollDate.toLocaleDateString('ru-RU');
  const debtEnd = new Date(enrollDate.getFullYear(), enrollDate.getMonth() + 1, enrollDate.getDate()).toLocaleDateString('ru-RU');

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-5">
        <button
          onClick={() => router.back()}
          className="w-8 h-8 flex items-center justify-center rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-500 transition-colors"
        >
          <ArrowLeft size={16} />
        </button>
        <span className="text-xs text-gray-400">Guruhlar</span>
        <span className="text-gray-300">›</span>
        <span className="text-xs font-semibold text-gray-700">Guruhga biriktirish</span>
      </div>

      <h1 className="text-xl font-bold text-gray-900 mb-5 uppercase tracking-wide">Guruhga biriktirish</h1>

      <div className="flex gap-5 items-start">
        {/* ── Left: group info ── */}
        <div className="w-72 shrink-0 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50">
            <p className="text-sm font-bold text-gray-800">Guruh haqida</p>
          </div>
          <div className="px-5 py-4 space-y-3.5">
            {[
              {
                label: 'Guruh nomi',
                value: group.name,
                colored: true,
                icon: <ExternalLink size={11} className="shrink-0" />,
                onClick: () => router.push(`/admin/groups/${id}`),
              },
              { label: 'Kurs', value: group.course?.name, bold: true },
              {
                label: "O'qituvchi",
                value: group.teacher?.name,
                colored: true,
                icon: <ExternalLink size={11} className="shrink-0" />,
              },
              { label: 'Guruh ochilgan sana', value: fmtDate(group.startDate) },
              { label: "O'quvchilar soni", value: String(group._count?.enrollments ?? group.enrollments?.length ?? 0) },
              { label: 'Narxi', value: group.price ? `${Number(group.price).toLocaleString()}` : '—', teal: true },
              { label: "Oylik to'lov turi", value: 'Sanadan sanagacha', teal: true },
              { label: 'Qarzdorlik davri', value: `${debtStart} - ${debtEnd}`, bold: true },
              {
                label: 'Bir dars summasi',
                value: group.price && group.days?.length
                  ? Math.round(Number(group.price) / (group.days.length * 4)).toLocaleString()
                  : '—',
                bold: true,
              },
            ].map(row => (
              <div key={row.label} className="flex items-start justify-between gap-3">
                <span className="text-xs text-gray-400 shrink-0 pt-0.5">{row.label}</span>
                <button
                  onClick={row.onClick}
                  disabled={!row.onClick}
                  className={`text-xs text-right flex items-center gap-1 ${
                    row.colored ? 'text-teal-600 font-semibold hover:underline'
                    : row.teal ? 'text-teal-500 font-semibold'
                    : row.bold ? 'text-gray-900 font-bold'
                    : 'text-gray-700'
                  }`}
                >
                  {row.value || '—'}
                  {row.icon}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right: form ── */}
        <div className="flex-1 min-w-0 space-y-4">

          {/* Section 1: Group + Student */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-sm font-bold text-gray-800 mb-4">Guruhni tanlang &amp; O&apos;quvchini tanlang</h2>

            {/* Group (read-only) */}
            <div className="mb-4">
              <label className="text-xs font-medium text-gray-500 block mb-1.5">Guruhni tanlang</label>
              <div className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 bg-gray-50">
                {group.name}{group.teacher?.name ? ` | ${group.teacher.name}` : ''}
              </div>
            </div>

            {/* Student selector */}
            <div className="mb-4 relative">
              <label className="text-xs font-medium text-gray-500 block mb-1.5">O&apos;quvchini tanlang</label>
              <div
                className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm cursor-pointer flex items-center justify-between hover:border-indigo-300 transition-colors"
                onClick={() => setShowStudentList(v => !v)}
              >
                <span className={selectedStudent ? 'text-gray-900 font-medium' : 'text-gray-400'}>
                  {selectedStudent ? `${selectedStudent.name} · ${selectedStudent.phone}` : "O'quvchini tanlang"}
                </span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-gray-400 shrink-0">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </div>

              {showStudentList && (
                <div className="absolute top-full left-0 right-0 mt-1 z-30 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
                  <div className="p-2 border-b border-gray-100">
                    <input
                      value={studentSearch}
                      onChange={e => setStudentSearch(e.target.value)}
                      placeholder="Ism yoki telefon..."
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
                      autoFocus
                      onClick={e => e.stopPropagation()}
                    />
                  </div>
                  <div className="max-h-52 overflow-y-auto">
                    {filteredStudents.slice(0, 30).map(s => (
                      <button
                        key={s.id}
                        onClick={() => { setSelectedStudentId(s.id); setShowStudentList(false); setStudentSearch(''); }}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-indigo-50 transition-colors text-left ${selectedStudentId === s.id ? 'bg-indigo-50' : ''}`}
                      >
                        <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-bold shrink-0">
                          {s.name?.charAt(0)?.toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{s.name}</p>
                          <p className="text-xs text-gray-400">{s.phone}</p>
                        </div>
                      </button>
                    ))}
                    {filteredStudents.length === 0 && (
                      <p className="text-center py-5 text-sm text-gray-400">Topilmadi</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Agreement toggle */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setAddAgreement(v => !v)}
                className={`relative w-10 h-6 rounded-full transition-colors ${addAgreement ? 'bg-indigo-600' : 'bg-gray-200'}`}
              >
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${addAgreement ? 'left-5' : 'left-1'}`} />
              </button>
              <span className="text-sm text-gray-600">O&apos;quvchi uchun guruh bilan kelishuv qo&apos;shish</span>
            </div>
          </div>

          {/* Section 2: Date + Payment */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-sm font-bold text-gray-800 mb-4">Qo&apos;shilish sanasi va to&apos;lov</h2>

            <div className="flex gap-5 items-start">
              {/* Calendar */}
              <div className="flex-1">
                <MiniCalendar selected={enrollDate} onChange={setEnrollDate} />
                <p className="text-xs text-center text-gray-400 mt-2">
                  Tanlangan sana: <span className="font-semibold text-gray-700">{enrollDate.toLocaleDateString('ru-RU')}</span>
                </p>
              </div>

              {/* Payment + info */}
              <div className="flex-1 space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1.5">
                    Birinchi oylik to&apos;lov summasini tahrirlash
                  </label>
                  <input
                    type="number"
                    value={paymentAmount}
                    onChange={e => setPaymentAmount(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/30 font-semibold text-gray-900"
                  />
                </div>

                <button className="w-full flex items-center gap-2 px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-sm font-medium transition-colors border border-indigo-100">
                  <Info size={15} className="shrink-0" />
                  Dars vaqtlari haqida ma&apos;lumot
                </button>

                {group.days?.length > 0 && (
                  <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-500 space-y-1">
                    <p><span className="font-medium text-gray-700">Kunlar:</span> {group.days.join(', ')}</p>
                    <p><span className="font-medium text-gray-700">Vaqt:</span> {group.startTime} – {group.endTime}</p>
                    {group.room && <p><span className="font-medium text-gray-700">Xona:</span> {group.room}</p>}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-3">
            <button
              onClick={() => void handleEnroll()}
              disabled={loading || !selectedStudentId}
              className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
            >
              {loading ? 'Saqlanmoqda...' : "Guruhga biriktirish"}
            </button>
            <button
              onClick={() => router.back()}
              className="px-6 py-3 border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-xl text-sm font-medium transition-colors"
            >
              Bekor
            </button>
          </div>
        </div>
      </div>

      {/* Click-outside close for student list */}
      {showStudentList && (
        <div className="fixed inset-0 z-20" onClick={() => setShowStudentList(false)} />
      )}
    </div>
  );
}
