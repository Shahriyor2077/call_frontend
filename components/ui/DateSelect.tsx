'use client';

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

  const selectCls =
    'flex-1 px-2 py-2 border border-gray-200 rounded-xl text-sm bg-white ' +
    'focus:outline-none focus:ring-2 focus:ring-indigo-400/30 text-gray-700 ' +
    'appearance-none cursor-pointer';

  return (
    <div>
      {label && (
        <label className="text-sm font-medium text-gray-700 block mb-1.5">
          {label}{required && ' *'}
        </label>
      )}
      <div className="flex gap-2">
        {/* Kun */}
        <select
          value={day || ''}
          onChange={e => update(year, month, Number(e.target.value))}
          className={selectCls}
        >
          <option value="">Kun</option>
          {Array.from({ length: maxDay }, (_, i) => i + 1).map(d => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>

        {/* Oy */}
        <select
          value={month || ''}
          onChange={e => update(year, Number(e.target.value), day)}
          className={`${selectCls} flex-[1.8]`}
        >
          <option value="">Oy</option>
          {MONTHS_UZ.map((m, i) => (
            <option key={i + 1} value={i + 1}>{m}</option>
          ))}
        </select>

        {/* Yil */}
        <select
          value={year || ''}
          onChange={e => update(Number(e.target.value), month, day)}
          className={`${selectCls} flex-[1.4]`}
        >
          <option value="">Yil</option>
          {years.map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
