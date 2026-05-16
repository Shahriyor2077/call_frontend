'use client';

import { ChevronDown } from 'lucide-react';

const MONTHS_UZ = [
  'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
  'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr',
];

function daysInMonth(month: number, year: number) {
  if (!month || !year) return 31;
  return new Date(year, month, 0).getDate();
}

interface Props {
  label?: string;
  value: string; // YYYY-MM-DD
  onChange: (val: string) => void;
  required?: boolean;
}

function NativeSelect({ value, onChange, className, children }: {
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`relative ${className ?? ''}`}>
      <select
        value={value}
        onChange={onChange}
        className="w-full appearance-none px-2.5 py-2 pr-7 border border-gray-300 rounded-lg text-sm bg-white text-gray-800
          focus:outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-400 transition-shadow cursor-pointer"
      >
        {children}
      </select>
      <ChevronDown size={13} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400" />
    </div>
  );
}

export default function DateSelect({ label, value, onChange, required }: Props) {
  const parts = value ? value.split('-') : ['', '', ''];
  const year  = parts[0] ? Number(parts[0]) : 0;
  const month = parts[1] ? Number(parts[1]) : 0;
  const day   = parts[2] ? Number(parts[2]) : 0;

  const maxDay = daysInMonth(month, year);

  function update(y: number, m: number, d: number) {
    if (!y && !m && !d) { onChange(''); return; }
    const safeDay = Math.min(d || 1, daysInMonth(m || 1, y || 2000));
    const yy = String(y || 2000).padStart(4, '0');
    const mm = String(m || 1).padStart(2, '0');
    const dd = String(safeDay).padStart(2, '0');
    onChange(`${yy}-${mm}-${dd}`);
  }

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1949 }, (_, i) => currentYear - i);

  return (
    <div>
      {label && (
        <label className="text-sm font-medium text-gray-700 block mb-1.5">
          {label}{required && ' *'}
        </label>
      )}
      <div className="flex gap-2">
        <NativeSelect value={day || ''} onChange={e => update(year, month, Number(e.target.value))} className="flex-1">
          <option value="">Kun</option>
          {Array.from({ length: maxDay }, (_, i) => i + 1).map(d => (
            <option key={d} value={d}>{d}</option>
          ))}
        </NativeSelect>

        <NativeSelect value={month || ''} onChange={e => update(year, Number(e.target.value), day)} className="flex-[1.8]">
          <option value="">Oy</option>
          {MONTHS_UZ.map((m, i) => (
            <option key={i + 1} value={i + 1}>{m}</option>
          ))}
        </NativeSelect>

        <NativeSelect value={year || ''} onChange={e => update(Number(e.target.value), month, day)} className="flex-[1.4]">
          <option value="">Yil</option>
          {years.map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </NativeSelect>
      </div>
    </div>
  );
}
