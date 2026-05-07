'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';

export default function ActivityPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [centers, setCenters] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      const [u, c] = await Promise.all([api.get('/users'), api.get('/centers')]);
      setUsers(u.data);
      setCenters(c.data);
    }
    void load();
  }, []);

  const rows = users
    .filter(u => u.role !== 'SUPERADMIN')
    .map(u => ({
      ...u,
      centerName: centers.find(c => c.id === u.centerId)?.name ?? u.center?.name ?? '—',
    }));

  const totalUsers = rows.length;
  const activeUsers = rows.filter(u => u.isActive).length;
  const blockedUsers = rows.filter(u => !u.isActive).length;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Faollik nazorati</h1>
        <p className="text-sm text-gray-400 mt-0.5">Foydalanuvchilar ro'yxati va holati</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-3xl font-bold text-gray-900">{totalUsers}</p>
          <p className="text-sm text-gray-400 mt-1">Jami foydalanuvchilar</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-3xl font-bold text-emerald-600">{activeUsers}</p>
          <p className="text-sm text-gray-400 mt-1">Faol foydalanuvchilar</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-3xl font-bold text-rose-500">{blockedUsers}</p>
          <p className="text-sm text-gray-400 mt-1">Bloklangan</p>
        </div>
      </div>

      {/* Users table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50">
          <h2 className="font-semibold text-gray-900">Foydalanuvchilar</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left text-gray-400 text-xs font-medium">
              <th className="px-5 py-3">FOYDALANUVCHI</th>
              <th className="px-5 py-3">ROL</th>
              <th className="px-5 py-3">MARKAZ</th>
              <th className="px-5 py-3">TELEFON</th>
              <th className="px-5 py-3">HOLAT</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {rows.map(u => (
              <tr key={u.id} className="hover:bg-gray-50/60">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={u.name} size="sm" />
                    <p className="font-medium text-gray-900">{u.name}</p>
                  </div>
                </td>
                <td className="px-5 py-3"><Badge value={u.role} /></td>
                <td className="px-5 py-3 text-gray-500">{u.centerName}</td>
                <td className="px-5 py-3 text-gray-500">{u.phone}</td>
                <td className="px-5 py-3">
                  <Badge value={u.isActive ? 'ACTIVE' : 'CANCELLED'} />
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={5} className="px-5 py-10 text-center text-gray-400">Ma'lumot yo'q</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
