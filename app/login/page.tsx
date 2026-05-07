'use client';

import { useRouter } from 'next/navigation';
import { Shield, UserCog, Headset } from 'lucide-react';

const roles = [
  {
    href: '/login/superadmin',
    icon: Shield,
    title: 'Superadmin',
    description: 'Barcha markazlarni boshqarish',
    gradient: 'from-purple-500 to-purple-700',
    hover: 'hover:border-purple-200 hover:bg-purple-50',
  },
  {
    href: '/login/admin',
    icon: UserCog,
    title: 'Admin',
    description: "O'z markazini boshqarish",
    gradient: 'from-blue-500 to-blue-700',
    hover: 'hover:border-blue-200 hover:bg-blue-50',
  },
  {
    href: '/login/operator',
    icon: Headset,
    title: 'Operator',
    description: "Leads va to'lovlarni boshqarish",
    gradient: 'from-emerald-500 to-emerald-700',
    hover: 'hover:border-emerald-200 hover:bg-emerald-50',
  },
];

export default function LoginPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-blue-900 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-white tracking-tight">EduCRM</h1>
          <p className="text-blue-300 mt-2 text-sm">Rolni tanlang</p>
        </div>

        <div className="flex flex-col gap-3">
          {roles.map((role) => {
            const Icon = role.icon;
            return (
              <button
                key={role.href}
                onClick={() => router.push(role.href)}
                className={`bg-white rounded-2xl p-5 flex items-center gap-4 border-2 border-transparent ${role.hover} transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-[1.01] text-left group`}
              >
                <div className={`bg-linear-to-br ${role.gradient} p-3.5 rounded-xl shadow-md shrink-0`}>
                  <Icon size={24} className="text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-base font-bold text-gray-800">{role.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{role.description}</p>
                </div>
                <svg
                  className="text-gray-300 group-hover:text-gray-400 transition-colors shrink-0"
                  width="18"
                  height="18"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
