'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { Building2, TrendingUp, AlertTriangle, Activity } from 'lucide-react';
import Badge from '@/components/ui/Badge';

export default function SuperadminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [subs, setSubs] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const [statsRes, subsRes] = await Promise.all([
          api.get('/centers/stats'),
          api.get('/subscriptions'),
        ]);
        setStats(statsRes.data);
        setSubs(subsRes.data);
      } catch {
        /* server xatosi — foydalanuvchi refresh qilishi mumkin */
      }
    }
    void load();
  }, []);

  const activeCount = subs.filter(s => s.status === 'ACTIVE').length;
  const demoCount = subs.filter(s => s.status === 'DEMO').length;
  const expiredCount = subs.filter(s => s.status === 'EXPIRED').length;

  const expiringSoon = subs.filter(s => {
    if (!s.endDate) return false;
    const days = Math.ceil((new Date(s.endDate).getTime() - Date.now()) / 86400000);
    return days <= 7 && days >= 0 && (s.status === 'ACTIVE' || s.status === 'DEMO');
  });

  const planDist = subs.reduce<Record<string, number>>((acc, s) => {
    const name = s.plan?.name ?? 'Demo';
    acc[name] = (acc[name] ?? 0) + 1;
    return acc;
  }, {});

  const COLORS = ['bg-indigo-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-sky-500'];
  const planEntries = Object.entries(planDist);
  const totalPlan = planEntries.reduce((s, [, v]) => s + v, 0) || 1;

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          href="/superadmin/centers"
          icon={<Building2 size={18} className="text-indigo-600" />}
          iconBg="bg-indigo-50"
          label="Jami markazlar"
          value={stats?.total ?? '—'}
        />
        <StatCard
          href="/superadmin/subscriptions"
          icon={<TrendingUp size={18} className="text-emerald-600" />}
          iconBg="bg-emerald-50"
          label="Faol obunalar"
          value={activeCount}
          sub={demoCount > 0 ? `${demoCount} ta demo` : undefined}
        />
        <StatCard
          href="/superadmin/subscriptions"
          icon={<AlertTriangle size={18} className="text-amber-600" />}
          iconBg="bg-amber-50"
          label="Yaqinda tugaydi"
          value={expiringSoon.length}
          sub={expiringSoon.length > 0 ? '7 kun ichida' : undefined}
        />
        <StatCard
          href="/superadmin/subscriptions"
          icon={<Activity size={18} className="text-rose-600" />}
          iconBg="bg-rose-50"
          label="Tugagan obunalar"
          value={expiredCount}
        />
      </div>

      {/* Two columns: plan distribution + expiring soon */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Tarif distribution */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Tarif bo'yicha taqsimot</h2>
          {planEntries.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">Obunalar yo'q</p>
          ) : (
            <div className="space-y-3">
              {planEntries.map(([name, count], i) => (
                <div key={name}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-gray-600">{name}</span>
                    <span className="font-semibold text-gray-900">{count} ta</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${COLORS[i % COLORS.length]} rounded-full`}
                      style={{ width: `${(count / totalPlan) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Expiring soon */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Yaqinda tugaydigan obunalar</h2>
          {expiringSoon.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">Hozircha yo'q</p>
          ) : (
            <div className="space-y-2">
              {expiringSoon.map(s => {
                const days = Math.ceil((new Date(s.endDate).getTime() - Date.now()) / 86400000);
                return (
                  <div key={s.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <span className="font-medium text-gray-900 text-sm">{s.center.name}</span>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${days <= 3 ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                      {days} kun qoldi
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent subscriptions */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50">
          <h2 className="font-semibold text-gray-900">So'nggi obunalar</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left text-gray-400 text-xs font-medium">
              <th className="px-5 py-3">MARKAZ</th>
              <th className="px-5 py-3">TARIF</th>
              <th className="px-5 py-3">STATUS</th>
              <th className="px-5 py-3">TUGASH SANASI</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {subs.slice(0, 8).map(s => (
              <tr key={s.id} className="hover:bg-gray-50/60">
                <td className="px-5 py-3 font-medium text-gray-900">{s.center.name}</td>
                <td className="px-5 py-3 text-gray-500">{s.plan?.name ?? '—'}</td>
                <td className="px-5 py-3"><Badge value={s.status} /></td>
                <td className="px-5 py-3 text-gray-500">{new Date(s.endDate).toLocaleDateString('uz-UZ')}</td>
              </tr>
            ))}
            {subs.length === 0 && (
              <tr><td colSpan={4} className="px-5 py-10 text-center text-gray-400">Ma'lumot yo'q</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatCard({ href, icon, iconBg, label, value, sub }: {
  href: string;
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <Link href={href} className="block bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer group">
      <div className={`w-9 h-9 ${iconBg} rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>{icon}</div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </Link>
  );
}
