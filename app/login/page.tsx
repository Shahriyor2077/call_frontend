'use client';

import { useRouter } from 'next/navigation';
import { UserCog, Headset, ChevronRight, Zap } from 'lucide-react';
import ClientOnly from '@/components/layout/ClientOnly';

const roles = [
  {
    href: '/login/admin',
    icon: UserCog,
    title: 'Admin',
    description: "Markaz boshqaruvi",
    color: '#60a5fa',
    light: 'rgba(96,165,250,0.12)',
  },
  {
    href: '/login/operator',
    icon: Headset,
    title: 'Operator',
    description: "Leads va to'lovlar",
    color: '#34d399',
    light: 'rgba(52,211,153,0.12)',
  },
];

export default function LoginPage() {
  const router = useRouter();

  return (
    <ClientOnly fallback={<div className="min-h-screen" style={{ background: 'linear-gradient(160deg, #1e2433 0%, #141824 100%)' }} suppressHydrationWarning />}>
      <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{ background: 'linear-gradient(160deg, #1e2433 0%, #141824 100%)' }}>
        <div className="w-full max-w-sm">
          {/* Logo */}
          <div className="flex flex-col items-center mb-10">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-indigo-900/50" style={{ background: 'linear-gradient(135deg, #6366f1, #4338ca)' }}>
              <Zap size={26} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">SmartHub</h1>
            <p className="text-sm text-slate-400 mt-1">Rolni tanlang</p>
          </div>

          {/* Cards */}
          <div className="space-y-3">
            {roles.map(role => {
              const Icon = role.icon;
              return (
                <button
                  key={role.href}
                  onClick={() => router.push(role.href)}
                  className="group w-full flex items-center gap-4 p-4 rounded-2xl border border-slate-700/60 hover:border-slate-600 hover:-translate-y-0.5 transition-all duration-200 text-left"
                  style={{ background: 'rgba(255,255,255,0.04)' }}
                >
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: role.light }}>
                    <Icon size={20} style={{ color: role.color }} />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-white text-sm">{role.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{role.description}</p>
                  </div>
                  <ChevronRight size={15} className="text-slate-600 group-hover:text-slate-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </ClientOnly>
  );
}
