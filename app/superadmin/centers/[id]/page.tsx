'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import Badge from '@/components/ui/Badge';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import { ArrowLeft, Users, GraduationCap, BookOpen, Phone, MapPin, Calendar } from 'lucide-react';

export default function CenterDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [center, setCenter] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [c, u] = await Promise.all([
          api.get(`/centers/${id}`),
          api.get('/users'),
        ]);
        setCenter(c.data);
        setUsers(u.data.filter((u: any) => u.centerId === id));
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400 text-sm">
        Yuklanmoqda...
      </div>
    );
  }

  if (!center) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400 text-sm">
        Markaz topilmadi
      </div>
    );
  }

  const sub = center.subscription;
  const daysLeft = sub?.endDate
    ? Math.ceil((new Date(sub.endDate).getTime() - Date.now()) / 86400000)
    : null;

  const admins = users.filter(u => u.role === 'ADMIN');
  const operators = users.filter(u => u.role === 'OPERATOR');

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
        <div className="flex items-center gap-3 flex-1">
          <Avatar name={center.name} size="lg" />
          <div>
            <h1 className="text-xl font-bold text-gray-900">{center.name}</h1>
            <p className="text-sm text-gray-400">
              Ro'yxatga olingan: {new Date(center.createdAt).toLocaleDateString('uz-UZ')}
            </p>
          </div>
        </div>
        <Badge value={center.isActive ? 'ACTIVE' : 'CANCELLED'} />
      </div>

      {/* Info + subscription */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Info card */}
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
            <StatBox icon={<Users size={15} className="text-indigo-500" />} label="Xodimlar" value={center._count?.users ?? 0} />
            <StatBox icon={<GraduationCap size={15} className="text-emerald-500" />} label="O'quvchilar" value={center._count?.students ?? 0} />
            <StatBox icon={<BookOpen size={15} className="text-amber-500" />} label="Guruhlar" value={center._count?.groups ?? 0} />
          </div>
        </div>

        {/* Subscription card */}
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
                  {sub.plan?.price ? `${Number(sub.plan.price).toLocaleString('uz-UZ')} so'm` : '—'}
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
            <Button
              size="sm"
              variant="secondary"
              onClick={() => router.push('/superadmin/subscriptions')}
              className="w-full"
            >
              Obunani boshqarish
            </Button>
          </div>
        </div>
      </div>

      {/* Users table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Xodimlar</h2>
          <div className="flex gap-2 text-xs text-gray-400">
            <span>{admins.length} ta admin</span>
            <span>·</span>
            <span>{operators.length} ta operator</span>
          </div>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left text-gray-400 text-xs font-medium">
              <th className="px-5 py-3">XODIM</th>
              <th className="px-5 py-3">TELEFON</th>
              <th className="px-5 py-3">ROL</th>
              <th className="px-5 py-3">HOLAT</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {users.length === 0 ? (
              <tr><td colSpan={4} className="px-5 py-10 text-center text-gray-400">Xodimlar yo'q</td></tr>
            ) : users.map(u => (
              <tr key={u.id} className="hover:bg-gray-50/60">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={u.name} size="sm" />
                    <span className="font-medium text-gray-900">{u.name}</span>
                  </div>
                </td>
                <td className="px-5 py-3 text-gray-500">{u.phone}</td>
                <td className="px-5 py-3"><Badge value={u.role} /></td>
                <td className="px-5 py-3"><Badge value={u.isActive ? 'ACTIVE' : 'CANCELLED'} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatBox({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="bg-gray-50 rounded-xl p-3 text-center">
      <div className="flex justify-center mb-1">{icon}</div>
      <p className="text-lg font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-400">{label}</p>
    </div>
  );
}
