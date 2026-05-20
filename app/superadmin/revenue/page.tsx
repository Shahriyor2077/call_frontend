'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import { DollarSign, TrendingUp, Users, TrendingDown } from 'lucide-react';

export default function RevenuePage() {
  const [centers, setCenters] = useState<any[]>([]);
  const [subs, setSubs] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const [c, s, p] = await Promise.all([
          api.get('/centers'),
          api.get('/subscriptions'),
          api.get('/plans'),
        ]);
        setCenters(c.data);
        setSubs(s.data);
        setPlans(p.data);
      } catch {
        /* silent — sahifa bo'sh ko'rinadi */
      }
    }
    void load();
  }, []);

  const activeSubs = subs.filter(s => s.status === 'ACTIVE');
  const expiredSubs = subs.filter(s => s.status === 'EXPIRED');

  // MRR: faol obunalar uchun har bir plan narxini 30 kunga normallashtirish
  const mrr = activeSubs.reduce((total, s) => {
    const price = Number(s.plan?.price ?? 0);
    const days = s.plan?.durationDays ?? 30;
    return total + (price / days) * 30;
  }, 0);

  // Jami to'langan (barcha ACTIVE + EXPIRED obunalar narxi)
  const totalRevenue = [...activeSubs, ...expiredSubs].reduce((total, s) => {
    return total + Number(s.plan?.price ?? 0);
  }, 0);

  const churn = subs.length > 0
    ? ((expiredSubs.length / subs.length) * 100).toFixed(1)
    : '0';

  const activeCenters = centers.filter(c => c.subscription?.status === 'ACTIVE');

  const planDist = subs.reduce<Record<string, number>>((acc, s) => {
    const name = s.plan?.name ?? 'Demo';
    acc[name] = (acc[name] ?? 0) + 1;
    return acc;
  }, {});
  const planEntries = Object.entries(planDist);
  const totalSubs = subs.length || 1;

  const COLORS = ['bg-indigo-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-sky-500'];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Daromad hisoboti</h1>
        <p className="text-sm text-gray-400 mt-0.5">Obuna va markazlar statistikasi</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={<DollarSign size={18} className="text-indigo-600" />}
          bg="bg-indigo-50"
          label="MRR (oylik daromad)"
          value={`${Math.round(mrr).toLocaleString('uz-UZ')} so'm`}
          sub="Faol obunalardan"
        />
        <KpiCard
          icon={<TrendingUp size={18} className="text-emerald-600" />}
          bg="bg-emerald-50"
          label="Jami daromad"
          value={`${totalRevenue.toLocaleString('uz-UZ')} so'm`}
          sub={`${activeSubs.length + expiredSubs.length} ta obuna`}
        />
        <KpiCard
          icon={<Users size={18} className="text-violet-600" />}
          bg="bg-violet-50"
          label="Faol markazlar"
          value={String(activeCenters.length)}
          sub={`${centers.length} ta jami`}
        />
        <KpiCard
          icon={<TrendingDown size={18} className="text-rose-600" />}
          bg="bg-rose-50"
          label="Churn Rate"
          value={`${churn}%`}
          sub="Tugagan / jami"
        />
      </div>

      {/* Plan distribution + plan prices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Tarif bo'yicha taqsimot</h2>
          {planEntries.length === 0 ? (
            <p className="text-sm text-gray-400 py-6 text-center">Obunalar yo'q</p>
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
                      style={{ width: `${(count / totalSubs) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Tarif paketlari narxlari</h2>
          {plans.length === 0 ? (
            <p className="text-sm text-gray-400 py-6 text-center">Tarif paketlari yo'q</p>
          ) : (
            <div className="space-y-2">
              {plans.map(p => {
                const subsUsingPlan = subs.filter(s => s.plan?.id === p.id && s.status === 'ACTIVE').length;
                const planRevenue = subsUsingPlan * Number(p.price);
                return (
                  <div key={p.id} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{p.name}</p>
                      <p className="text-xs text-gray-400">{p.operatorLimit} operator · {p.durationDays} kun · {subsUsingPlan} ta faol</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">{Number(p.price).toLocaleString('uz-UZ')} so'm</p>
                      {subsUsingPlan > 0 && (
                        <p className="text-xs text-emerald-600 font-medium">+{planRevenue.toLocaleString('uz-UZ')} so'm</p>
                      )}
                      <Badge value={p.isActive ? 'ACTIVE' : 'CANCELLED'} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Active centers */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50">
          <h2 className="font-semibold text-gray-900">Faol markazlar</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-gray-400 text-xs font-medium">
                <th className="px-5 py-3">#</th>
                <th className="px-5 py-3">MARKAZ</th>
                <th className="px-5 py-3">TARIF</th>
                <th className="px-5 py-3">NARX</th>
                <th className="px-5 py-3">OBUNA TUGASHI</th>
                <th className="px-5 py-3">HOLAT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {activeCenters.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-gray-400">Faol markazlar yo'q</td></tr>
              ) : activeCenters.map((c, i) => (
                <tr key={c.id} className="hover:bg-gray-50/60">
                  <td className="px-5 py-3 text-gray-400 font-medium">{i + 1}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={c.name} size="sm" />
                      <span className="font-medium text-gray-900">{c.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-gray-500">{c.subscription?.plan?.name ?? '—'}</td>
                  <td className="px-5 py-3 text-gray-700 font-medium">
                    {c.subscription?.plan?.price
                      ? `${Number(c.subscription.plan.price).toLocaleString('uz-UZ')} so'm`
                      : '—'}
                  </td>
                  <td className="px-5 py-3 text-gray-500">
                    {c.subscription?.endDate
                      ? new Date(c.subscription.endDate).toLocaleDateString('uz-UZ')
                      : '—'}
                  </td>
                  <td className="px-5 py-3"><Badge value={c.subscription?.status ?? 'ACTIVE'} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ icon, bg, label, value, sub }: { icon: React.ReactNode; bg: string; label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center mb-3`}>{icon}</div>
      <p className="text-xl font-bold text-gray-900 leading-tight">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}
