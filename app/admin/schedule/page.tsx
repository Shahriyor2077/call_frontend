'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

const DAYS = [
  { key: 'DU', label: 'Du' },
  { key: 'SE', label: 'Se' },
  { key: 'CH', label: 'Chor' },
  { key: 'PA', label: 'Pa' },
  { key: 'JU', label: 'Ju' },
  { key: 'SH', label: 'Sh' },
  { key: 'YA', label: 'Yk' },
];

const HOURS = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'];

const COLORS = [
  'bg-blue-100 text-blue-700 border-blue-200',
  'bg-indigo-100 text-indigo-700 border-indigo-200',
  'bg-violet-100 text-violet-700 border-violet-200',
  'bg-green-100 text-green-700 border-green-200',
  'bg-amber-100 text-amber-700 border-amber-200',
  'bg-rose-100 text-rose-700 border-rose-200',
  'bg-cyan-100 text-cyan-700 border-cyan-200',
];

const MONTH_SHORT = ['yan', 'fev', 'mar', 'apr', 'may', 'iyn', 'iyl', 'avg', 'sen', 'okt', 'noy', 'dek'];

export default function SchedulePage() {
  const [groups, setGroups] = useState<any[]>([]);
  const [weekOffset, setWeekOffset] = useState(0);

  useEffect(() => {
    api.get('/groups').then(r => setGroups(r.data)).catch(() => {});
  }, []);

  function groupsForDayHour(dayKey: string, hour: string) {
    return groups.filter(g => {
      if (!g.days?.includes(dayKey)) return false;
      if (!g.startTime) return false;
      const [h] = g.startTime.split(':');
      return `${h.padStart(2, '0')}:00` === hour;
    });
  }

  const colorMap: Record<string, string> = {};
  groups.forEach((g, i) => { colorMap[g.id] = COLORS[i % COLORS.length]; });

  const now = new Date();
  const todayNormalized = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - (now.getDay() === 0 ? 6 : now.getDay() - 1) + weekOffset * 7);
  weekStart.setHours(0, 0, 0, 0);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  function getDayDate(idx: number) {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + idx);
    return d;
  }

  function isToday(idx: number) {
    const d = getDayDate(idx);
    return d.getTime() === todayNormalized.getTime();
  }

  const activeHours = HOURS.filter(hour =>
    DAYS.some(d => groupsForDayHour(d.key, hour).length > 0)
  );
  const displayHours = activeHours.length > 0 ? HOURS.filter(h => {
    const idx = HOURS.indexOf(h);
    const firstIdx = HOURS.indexOf(activeHours[0]);
    const lastIdx = HOURS.indexOf(activeHours[activeHours.length - 1]);
    return idx >= firstIdx && idx <= lastIdx;
  }) : HOURS.slice(1, 9);

  const weekLabel = `${weekStart.getDate()} ${MONTH_SHORT[weekStart.getMonth()]} — ${weekEnd.getDate()} ${MONTH_SHORT[weekEnd.getMonth()]} ${weekEnd.getFullYear()}`;

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Jadval</h1>
          <p className="text-sm text-gray-400 mt-0.5">Haftalik dars jadvali — barcha guruhlar.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWeekOffset(v => v - 1)}
            className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-500 cursor-pointer"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => setWeekOffset(0)}
            className="px-4 py-1.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer min-w-40 text-center"
          >
            {weekOffset === 0 ? 'Bu hafta' : weekLabel}
          </button>
          <button
            onClick={() => setWeekOffset(v => v + 1)}
            className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-500 cursor-pointer"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden shadow-sm">
        {/* Header row */}
        <div className="grid border-b bg-gray-50" style={{ gridTemplateColumns: '64px repeat(7, 1fr)' }}>
          <div className="border-r" />
          {DAYS.map((d, idx) => {
            const date = getDayDate(idx);
            const today = isToday(idx);
            return (
              <div
                key={d.key}
                className={`py-3 text-center border-r last:border-r-0 ${today ? 'bg-indigo-50' : ''}`}
              >
                <p className={`text-xs font-semibold uppercase tracking-wide ${today ? 'text-indigo-600' : 'text-gray-400'}`}>
                  {d.label}
                </p>
                <p className={`text-sm font-bold mt-0.5 ${today ? 'text-indigo-700' : 'text-gray-600'}`}>
                  {date.getDate()}
                </p>
                {today && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mx-auto mt-1" />}
              </div>
            );
          })}
        </div>

        {/* Time rows */}
        {displayHours.map(hour => (
          <div key={hour} className="grid border-b last:border-b-0" style={{ gridTemplateColumns: '64px repeat(7, 1fr)', minHeight: '64px' }}>
            <div className="border-r flex items-start justify-end pr-3 pt-2.5">
              <span className="text-xs text-gray-400 font-medium">{hour}</span>
            </div>
            {DAYS.map((d, idx) => {
              const dayGroups = groupsForDayHour(d.key, hour);
              const today = isToday(idx);
              return (
                <div key={d.key} className={`border-r last:border-r-0 p-1.5 space-y-1 ${today ? 'bg-indigo-50/40' : ''}`}>
                  {dayGroups.map(g => (
                    <div
                      key={g.id}
                      className={`rounded-lg px-2 py-1.5 text-xs font-medium border ${colorMap[g.id]} shadow-sm`}
                      title={`${g.name} · ${g.startTime}–${g.endTime}`}
                    >
                      <div className="truncate font-semibold">{g.name}</div>
                      <div className="opacity-60 text-[10px] mt-0.5">{g.startTime}–{g.endTime}</div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        ))}

        {groups.length === 0 && (
          <div className="py-16 text-center text-gray-400">
            <Calendar size={32} className="mx-auto mb-2 text-gray-300" />
            <p className="text-sm">Jadval bo&apos;sh — guruhlar qo&apos;shilganda bu yerda ko&apos;rinadi</p>
          </div>
        )}
      </div>
    </div>
  );
}
