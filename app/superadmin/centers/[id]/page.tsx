'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import Badge from '@/components/ui/Badge';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import {
  ArrowLeft, Users, GraduationCap, BookOpen, Phone, MapPin, Calendar,
  TrendingUp, CreditCard, DollarSign, UserCheck, Percent,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

function fmt(n: number) {
  return Number(n).toLocaleString('uz-UZ');
}

function StatCard({ icon, label, value, sub, color }: {
  icon: React.ReactNode; label: string; value: string; sub?: string; color: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-gray-500">{label}</span>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
          {icon}
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

export default function CenterDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [center, setCenter] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [c, s] = await Promise.all([
          api.get(`/centers/${id}`),
          api.get(`/centers/${id}/detail-stats`),
        ]);
        setCenter(c.data);
        setStats(s.data);
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [id]);

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-gray-400 text-sm">Yuklanmoqda...</div>;
  }
  if (!center) {
    return <div className="flex items-center justify-center py-20 text-gray-400 text-sm">Markaz topilmadi</div>;
  }

  const sub = center.subscription;
  const daysLeft = sub?.endDate
    ? Math.ceil((new Date(sub.endDate).getTime() - Date.now()) / 86400000)
    : null;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft size={16} />
        </button>
        <Avatar name={center.name} size="lg" />
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">{center.name}</h1>
          <p className="text-sm text-gray-400">
            Ro'yxatga olingan: {new Date(center.createdAt).toLocaleDateString('uz-UZ')}
          </p>
        </div>
        <Badge value={center.isActive ? 'ACTIVE' : 'CANCELLED'} />
      </div>

      {/* Stat cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<GraduationCap size={16} className="text-indigo-600" />}
            label="O'quvchilar"
            value={fmt(stats.students.total)}
            sub={`${fmt(stats.students.active)} ta faol`}
            color="bg-indigo-50"
          />
          <StatCard
            icon={<TrendingUp size={16} className="text-amber-600" />}
            label="Leadlar"
            value={fmt(stats.leads.total)}
            sub={`Bu oy: ${fmt(stats.leads.thisMonth)} ta yangi`}
            color="bg-amber-50"
          />
          <StatCard
            icon={<CreditCard size={16} className="text-emerald-600" />}
            label="Jami to'lovlar"
            value={`${fmt(stats.payments.totalAmount)} so'm`}
            sub={`Bu oy: ${fmt(stats.payments.thisMonthAmount)} so'm`}
            color="bg-emerald-50"
          />
          <StatCard
            icon={<BookOpen size={16} className="text-blue-600" />}
            label="Guruhlar"
            value={fmt(stats.groups)}
            sub={`${fmt(stats.operators.length)} ta operator`}
            color="bg-blue-50"
          />
        </div>
      )}

      {/* Info + Subscription */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Markaz ma'lumotlari */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
          <h2 className="font-semibold text-gray-900 text-sm">Markaz ma'lumotlari</h2>
          {center.address && (
            <div className="flex items-start gap-2.5 text-sm">
              <MapPin size={14} className="text-gray-400 mt-0.5 shrink-0" />
              <span className="text-gray-600">{center.address}</span>
            </div>
          )}
          {center.phone && (
            <div className="flex items-center gap-2.5 text-sm">
              <Phone size={14} className="text-gray-400 shrink-0" />
              <span className="text-gray-600">{center.phone}</span>
            </div>
          )}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <div className="flex justify-center mb-1"><Users size={15} className="text-indigo-500" /></div>
              <p className="text-lg font-bold text-gray-900">{center._count?.users ?? 0}</p>
              <p className="text-xs text-gray-400">Xodimlar</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <div className="flex justify-center mb-1"><GraduationCap size={15} className="text-emerald-500" /></div>
              <p className="text-lg font-bold text-gray-900">{center._count?.students ?? 0}</p>
              <p className="text-xs text-gray-400">O'quvchilar</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <div className="flex justify-center mb-1"><BookOpen size={15} className="text-amber-500" /></div>
              <p className="text-lg font-bold text-gray-900">{center._count?.groups ?? 0}</p>
              <p className="text-xs text-gray-400">Guruhlar</p>
            </div>
          </div>
        </div>

        {/* Obuna */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
          <h2 className="font-semibold text-gray-900 text-sm">Obuna holati</h2>
          {sub ? (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Status</span>
                <Badge value={sub.status} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Tarif</span>
                <span className="text-sm font-medium text-gray-900">{sub.plan?.name ?? '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Narx</span>
                <span className="text-sm font-medium text-gray-900">
                  {sub.plan?.price ? `${fmt(Number(sub.plan.price))} so'm` : '—'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Operator limiti</span>
                <span className="text-sm font-medium text-gray-900">
                  {stats?.operators.length ?? 0} / {sub.plan?.operatorLimit ?? '—'} ta
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Tugash sanasi</span>
                <span className="text-sm text-gray-700 flex items-center gap-1.5">
                  <Calendar size={12} className="text-gray-400" />
                  {new Date(sub.endDate).toLocaleDateString('uz-UZ')}
                </span>
              </div>
              {daysLeft !== null && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Qolgan kun</span>
                  <span className={`text-sm font-semibold ${daysLeft <= 3 ? 'text-rose-600' : daysLeft <= 7 ? 'text-amber-500' : 'text-gray-700'}`}>
                    {daysLeft > 0 ? `${daysLeft} kun` : 'Tugagan'}
                  </span>
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-gray-400 py-4 text-center">Obuna mavjud emas</p>
          )}
          <div className="pt-1">
            <Button size="sm" variant="secondary" onClick={() => router.push('/superadmin/subscriptions')} className="w-full">
              Obunani boshqarish
            </Button>
          </div>
        </div>
      </div>

      {/* Lead konversiya */}
      {stats?.leads && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-gray-900">Lead konversiya</h2>
              <p className="text-xs text-gray-400 mt-0.5">Leadlarning o'quvchiga aylanish darajasi</p>
            </div>
            <div className="flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-xl">
              <span className="text-2xl font-bold text-indigo-600">{stats.leads.conversionRate}%</span>
              <span className="text-xs text-indigo-400">konversiya</span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-gray-100 rounded-full h-2.5 mb-4">
            <div
              className="bg-indigo-500 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${stats.leads.conversionRate}%` }}
            />
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { status: 'NEW', label: 'Yangi', color: 'bg-blue-50 text-blue-600' },
              { status: 'IN_PROGRESS', label: 'Jarayonda', color: 'bg-amber-50 text-amber-600' },
              { status: 'ENROLLED', label: "O'quvchi bo'ldi", color: 'bg-emerald-50 text-emerald-600' },
              { status: 'REJECTED', label: 'Rad etildi', color: 'bg-rose-50 text-rose-600' },
              { status: 'NOT_COME', label: 'Kelmadi', color: 'bg-gray-100 text-gray-500' },
            ].map(({ status, label, color }) => {
              const found = stats.leads.byStatus?.find((s: any) => s.status === status);
              const count = found?.count ?? 0;
              return (
                <div key={status} className={`rounded-xl p-3 ${color.split(' ')[0]}`}>
                  <p className={`text-lg font-bold ${color.split(' ')[1]}`}>{count}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{label}</p>
                </div>
              );
            })}
            <div className="rounded-xl p-3 bg-indigo-50">
              <p className="text-lg font-bold text-indigo-600">{stats.leads.total}</p>
              <p className="text-xs text-gray-500 mt-0.5">Jami leadlar</p>
            </div>
          </div>
        </div>
      )}

      {/* Oylik daromad grafigi */}
      {stats?.monthlyChart?.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-semibold text-gray-900">Oylik daromad</h2>
              <p className="text-xs text-gray-400 mt-0.5">So'nggi 6 oy to'lovlari</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">Jami (6 oy)</p>
              <p className="text-sm font-bold text-gray-900">
                {fmt(stats.monthlyChart.reduce((s: number, m: any) => s + m.amount, 0))} so'm
              </p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stats.monthlyChart} barSize={32}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v}
              />
              <Tooltip
                cursor={{ fill: '#f9fafb' }}
                formatter={(value) => [`${fmt(Number(value ?? 0))} so'm`, "To'lov"]}
                labelStyle={{ fontWeight: 600, color: '#111827', marginBottom: 4 }}
                contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 13 }}
              />
              <Bar dataKey="amount" fill="#6366f1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* To'lovlar statistikasi */}
      {stats && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-semibold text-gray-900 mb-4">To'lovlar</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-emerald-50 rounded-xl p-4">
              <p className="text-xs text-emerald-600 font-medium mb-1">Jami summa</p>
              <p className="text-lg font-bold text-gray-900">{fmt(stats.payments.totalAmount)} so'm</p>
            </div>
            <div className="bg-blue-50 rounded-xl p-4">
              <p className="text-xs text-blue-600 font-medium mb-1">Jami to'lovlar soni</p>
              <p className="text-lg font-bold text-gray-900">{fmt(stats.payments.totalCount)} ta</p>
            </div>
            <div className="bg-indigo-50 rounded-xl p-4">
              <p className="text-xs text-indigo-600 font-medium mb-1">Bu oy summa</p>
              <p className="text-lg font-bold text-gray-900">{fmt(stats.payments.thisMonthAmount)} so'm</p>
            </div>
            <div className="bg-amber-50 rounded-xl p-4">
              <p className="text-xs text-amber-600 font-medium mb-1">Bu oy to'lovlar</p>
              <p className="text-lg font-bold text-gray-900">{fmt(stats.payments.thisMonthCount)} ta</p>
            </div>
          </div>
        </div>
      )}

      {/* Operatorlar va maosh */}
      {stats && stats.operators.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Operatorlar va maosh</h2>
            <span className="text-xs text-gray-400">{stats.operators.length} ta operator</span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-gray-400 text-xs font-medium">
                <th className="px-5 py-3">OPERATOR</th>
                <th className="px-5 py-3">TELEFON</th>
                <th className="px-5 py-3">HOLAT</th>
                <th className="px-5 py-3">
                  <span className="flex items-center gap-1"><Percent size={11} /> Foiz</span>
                </th>
                <th className="px-5 py-3">
                  <span className="flex items-center gap-1"><DollarSign size={11} /> Oylik</span>
                </th>
                <th className="px-5 py-3">
                  <span className="flex items-center gap-1"><UserCheck size={11} /> Jami to'langan</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {stats.operators.map((op: any) => (
                <tr key={op.id} className="hover:bg-gray-50/60">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={op.name} size="sm" />
                      <span className="font-medium text-gray-900">{op.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-gray-500">{op.phone}</td>
                  <td className="px-5 py-3">
                    <Badge value={op.isActive ? 'ACTIVE' : 'CANCELLED'} />
                  </td>
                  <td className="px-5 py-3 text-gray-700">
                    {op.salarySetting?.percentage ?? 10}%
                  </td>
                  <td className="px-5 py-3 text-gray-700">
                    {op.salarySetting?.fixedAmount
                      ? `${fmt(Number(op.salarySetting.fixedAmount))} so'm`
                      : '—'}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`font-semibold ${op.totalSalaryPaid > 0 ? 'text-emerald-600' : 'text-gray-400'}`}>
                      {op.totalSalaryPaid > 0 ? `${fmt(op.totalSalaryPaid)} so'm` : '—'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
