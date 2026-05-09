'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { Users, Layers, BookOpen, UserCheck } from 'lucide-react';

const MONTHS_UZ = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyn', 'Iyl', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'];

/* ─── Line + Area chart ─────────────────────────────────── */
function LineAreaChart({
  data,
  color = '#3b82f6',
}: {
  data: { x: string; y: number }[];
  color?: string;
}) {
  if (data.length < 2) return null;
  const max = Math.max(...data.map(d => d.y), 1);
  const W = 400; const H = 110;
  const pL = 8; const pR = 8; const pT = 18; const pB = 22;
  const pts = data.map((d, i) => ({
    x: pL + (i / (data.length - 1)) * (W - pL - pR),
    y: pT + (1 - d.y / max) * (H - pT - pB),
  }));
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const area = `${line} L${pts[pts.length - 1].x},${H - pB} L${pts[0].x},${H - pB} Z`;
  const gid = `lg${color.replace('#', '')}`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 110 }}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0.01" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gid})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="4" fill={color} stroke="white" strokeWidth="2" />
          <text x={p.x} y={H - 5} textAnchor="middle" fontSize="9" fill="#9ca3af">{data[i].x}</text>
          {data[i].y > 0 && (
            <text x={p.x} y={p.y - 8} textAnchor="middle" fontSize="9" fill={color} fontWeight="700">
              {data[i].y}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}

/* ─── Vertical bar chart ─────────────────────────────────── */
function BarChart({
  data,
  color = '#3b82f6',
}: {
  data: { label: string; value: number }[];
  color?: string;
}) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="flex flex-col gap-1 w-full">
      <div className="flex items-end gap-1 h-28">
        {data.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
            <span className="text-[9px] font-semibold" style={{ color, opacity: d.value > 0 ? 1 : 0 }}>
              {d.value || ''}
            </span>
            <div
              className="w-full rounded-t transition-all"
              style={{
                height: `${Math.max((d.value / max) * 100, d.value > 0 ? 6 : 1)}%`,
                backgroundColor: d.value > 0 ? color : '#f3f4f6',
                minHeight: 2,
              }}
            />
          </div>
        ))}
      </div>
      <div className="flex gap-1">
        {data.map((d, i) => (
          <div key={i} className="flex-1 text-center text-[8px] text-gray-400">{d.label}</div>
        ))}
      </div>
    </div>
  );
}

/* ─── Donut chart ────────────────────────────────────────── */
function DonutChart({
  data,
  centerLabel,
}: {
  data: { label: string; value: number; color: string }[];
  centerLabel?: string;
}) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  let cum = 0;
  const r = 38; const cx = 50; const cy = 50;
  const circ = 2 * Math.PI * r;
  const slices = data.map(d => {
    const pct = d.value / total;
    const offset = circ * (1 - cum);
    cum += pct;
    return { ...d, da: `${circ * pct} ${circ * (1 - pct)}`, offset, pct };
  });
  return (
    <div className="flex items-center gap-5">
      <div className="relative shrink-0">
        <svg width="110" height="110" viewBox="0 0 100 100">
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f3f4f6" strokeWidth="13" />
          {slices.map((s, i) => (
            <circle key={i} cx={cx} cy={cy} r={r} fill="none"
              stroke={s.color} strokeWidth="13"
              strokeDasharray={s.da}
              strokeDashoffset={s.offset}
              transform={`rotate(-90 ${cx} ${cy})`}
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-bold text-gray-900">{total}</span>
          {centerLabel && <span className="text-[9px] text-gray-400 text-center leading-tight">{centerLabel}</span>}
        </div>
      </div>
      <div className="space-y-2 flex-1">
        {slices.map(s => (
          <div key={s.label} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
            <span className="text-xs text-gray-600 flex-1 truncate">{s.label}</span>
            <span className="text-xs font-bold" style={{ color: s.color }}>
              {(s.pct * 100).toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Stat card ──────────────────────────────────────────── */
function StatCard({
  title, value, icon, from, to, onClick,
}: {
  title: string; value: number | string; icon: React.ReactNode; from: string; to: string;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-all group ${onClick ? 'cursor-pointer hover:border-indigo-200' : ''}`}
    >
      <div className={`w-11 h-11 rounded-xl bg-linear-to-br ${from} ${to} flex items-center justify-center text-white mb-4 shadow-sm group-hover:scale-105 transition-transform`}>
        {icon}
      </div>
      <p className="text-[28px] font-bold text-gray-900 leading-none mb-1.5">{value}</p>
      <p className="text-sm text-gray-400 font-medium">{title}</p>
    </div>
  );
}

/* ─── Main page ──────────────────────────────────────────── */
export default function AdminDashboard() {
  const { user } = useAuthStore();
  const router = useRouter();
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const [counts, setCounts] = useState({ students: 0, groups: 0, courses: 0, staff: 0 });
  const [incomeFlow, setIncomeFlow] = useState<{ x: string; y: number }[]>([]);
  const [studentFlow, setStudentFlow] = useState<{ x: string; y: number }[]>([]);
  const [monthlyStudents, setMonthlyStudents] = useState<{ label: string; value: number }[]>([]);
  const [leadDonut, setLeadDonut] = useState<{ label: string; value: number; color: string }[]>([]);
  const [finDonut, setFinDonut] = useState<{ label: string; value: number; color: string }[]>([]);
  const [genderDonut, setGenderDonut] = useState<{ label: string; value: number; color: string }[]>([]);

  const centerName = (user as any)?.center?.name ?? 'Markaz';

  useEffect(() => {
    async function load() {
      const [studRes, grpRes, crsRes, usrRes, leadRes] = await Promise.all([
        api.get('/students').catch(() => ({ data: [] })),
        api.get('/groups').catch(() => ({ data: [] })),
        api.get('/courses').catch(() => ({ data: [] })),
        api.get('/users').catch(() => ({ data: [] })),
        api.get('/leads?page=1&limit=500').catch(() => ({ data: { data: [] } })),
      ]);

      const students: any[] = studRes.data ?? [];
      const groups: any[] = grpRes.data ?? [];
      const courses: any[] = crsRes.data ?? [];
      const users: any[] = usrRes.data ?? [];
      const leads: any[] = Array.isArray(leadRes.data) ? leadRes.data : (leadRes.data?.data ?? []);

      /* counts */
      setCounts({
        students: students.length,
        groups: groups.length,
        courses: courses.length,
        staff: users.filter((u: any) => u.role === 'OPERATOR' || u.role === 'ADMIN').length,
      });

      /* income line chart — last 7 months (in thousands) */
      const allPayRes = await api.get('/payments?page=1&limit=5000').catch(() => ({ data: [] }));
      const allPay: any[] = Array.isArray(allPayRes.data) ? allPayRes.data : (allPayRes.data?.data ?? []);

      const income7 = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(currentYear, currentMonth - 6 + i, 1);
        const m = d.getMonth(); const y = d.getFullYear();
        const sum = allPay
          .filter(p => { const pd = new Date(p.paidAt); return !p.isRefunded && pd.getMonth() === m && pd.getFullYear() === y; })
          .reduce((s, p) => s + Number(p.amount), 0);
        return { x: MONTHS_UZ[m], y: Math.round(sum / 1000) };
      });
      setIncomeFlow(income7);

      /* student flow — last 7 months (new students) */
      const flow7 = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(currentYear, currentMonth - 6 + i, 1);
        const m = d.getMonth(); const y = d.getFullYear();
        const cnt = students.filter(s => { const cd = new Date(s.createdAt); return cd.getMonth() === m && cd.getFullYear() === y; }).length;
        return { x: MONTHS_UZ[m], y: cnt };
      });
      setStudentFlow(flow7);

      /* monthly students bar chart — full year */
      const monthly = MONTHS_UZ.map((label, m) => ({
        label,
        value: students.filter(s => { const d = new Date(s.createdAt); return d.getFullYear() === currentYear && d.getMonth() === m; }).length,
      }));
      setMonthlyStudents(monthly);

      /* lead sources donut */
      const SRC_COLORS: Record<string, string> = {
        Instagram: '#ec4899', Telegram: '#3b82f6', Tavsiya: '#22c55e', Sayt: '#a855f7', Boshqa: '#f97316',
      };
      const srcMap: Record<string, number> = {};
      leads.forEach(l => { const s = l.source || 'Boshqa'; srcMap[s] = (srcMap[s] || 0) + 1; });
      const ldDonut = Object.entries(srcMap).slice(0, 5).map(([label, value]) => ({
        label, value, color: SRC_COLORS[label] ?? '#6b7280',
      }));
      setLeadDonut(ldDonut.length ? ldDonut : [{ label: 'Leadlar yo\'q', value: 1, color: '#e5e7eb' }]);

      /* financial donut — debtors vs not */
      const monthPaid: Record<string, number> = {};
      allPay.forEach(p => {
        if (!p.isRefunded) {
          const sid = p.student?.id;
          const pd = new Date(p.paidAt);
          if (sid && pd.getMonth() === currentMonth && pd.getFullYear() === currentYear) {
            monthPaid[sid] = (monthPaid[sid] || 0) + Number(p.amount);
          }
        }
      });
      const debtors = students.filter(s => {
        const active = s.enrollments?.find((e: any) => e.isActive);
        if (!active) return false;
        const price = Number(active.group?.price || 0);
        return price > 0 && (monthPaid[s.id] || 0) < price;
      }).length;
      setFinDonut([
        { label: 'Qarzdor emas', value: students.length - debtors, color: '#3b82f6' },
        { label: 'Qarzdor', value: debtors, color: '#f59e0b' },
      ]);

      /* gender donut */
      const males = students.filter(s => s.gender === 'MALE').length;
      const females = students.filter(s => s.gender === 'FEMALE').length;
      setGenderDonut([
        { label: 'Erkak', value: males, color: '#3b82f6' },
        { label: 'Ayol', value: females, color: '#ec4899' },
      ]);
    }
    void load();
  }, []);

  return (
    <div className="space-y-5">
      {/* Period badge */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Umumiy ko&apos;rinish</h1>
          <p className="text-sm text-gray-400 mt-0.5">{MONTHS_UZ[currentMonth]} {currentYear}</p>
        </div>
        <span className="text-xs font-medium px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-full border border-indigo-100">
          {centerName}
        </span>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="O'quvchilar soni" value={counts.students} from="from-blue-500" to="to-indigo-600"
          icon={<Users size={20} />} onClick={() => router.push('/admin/students')} />
        <StatCard title="Guruhlar soni" value={counts.groups} from="from-emerald-400" to="to-teal-600"
          icon={<Layers size={20} />} onClick={() => router.push('/admin/groups')} />
        <StatCard title="Xodimlar soni" value={counts.staff} from="from-orange-400" to="to-rose-500"
          icon={<UserCheck size={20} />} onClick={() => router.push('/admin/operators')} />
        <StatCard title="Kurslar soni" value={counts.courses} from="from-violet-500" to="to-purple-700"
          icon={<BookOpen size={20} />} onClick={() => router.push('/admin/courses')} />
      </div>

      {/* Line charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-semibold text-gray-900">Daromad dinamikasi</p>
              <p className="text-xs text-gray-400 mt-0.5">Oxirgi 7 oy · ming so&apos;m</p>
            </div>
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
          </div>
          <LineAreaChart data={incomeFlow} color="#3b82f6" />
        </div>
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-semibold text-gray-900">O&apos;quvchilar oqimi</p>
              <p className="text-xs text-gray-400 mt-0.5">Oxirgi 7 oy</p>
            </div>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0" />
          </div>
          <LineAreaChart data={studentFlow} color="#f59e0b" />
        </div>
      </div>

      {/* Bar + Donuts row */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Bar chart */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-semibold text-gray-900">Oylik o&apos;quvchilar</p>
              <p className="text-xs text-gray-400 mt-0.5">{currentYear} yil bo&apos;yicha</p>
            </div>
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
          </div>
          <BarChart data={monthlyStudents} color="#3b82f6" />
        </div>

        {/* Lead sources donut */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-semibold text-gray-900">Lead manbalari</p>
              <p className="text-xs text-gray-400 mt-0.5">Qayerdan kelmoqda</p>
            </div>
          </div>
          <DonutChart data={leadDonut} centerLabel="leadlar" />
        </div>

        {/* Financial donut */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-semibold text-gray-900">Moliyaviy holat</p>
              <p className="text-xs text-gray-400 mt-0.5">Joriy oy</p>
            </div>
          </div>
          <DonutChart data={finDonut} centerLabel="talabalar" />
        </div>

        {/* Gender donut */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-semibold text-gray-900">Jins bo&apos;yicha</p>
              <p className="text-xs text-gray-400 mt-0.5">Erkak / Ayol nisbati</p>
            </div>
          </div>
          <DonutChart data={genderDonut} centerLabel="jami" />
        </div>
      </div>
    </div>
  );
}
