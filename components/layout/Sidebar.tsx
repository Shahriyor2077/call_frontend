'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import {
  LayoutDashboard, BookOpen, Users, GraduationCap, Calendar,
  Target, Wallet, UserCog, School, DollarSign, Settings,
  LogOut, ChevronLeft, ChevronRight,
} from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import { useState, useEffect } from 'react';
import api from '@/lib/api';

type NavItem = { href: string; label: string; icon: React.ReactNode; countKey?: string };
type NavSection = { title: string; items: NavItem[] };

function buildAdminSections(): NavSection[] {
  return [
    {
      title: "BOSH SAHIFA",
      items: [
        { href: '/admin', label: 'Dashboard', icon: <LayoutDashboard size={16} /> },
      ],
    },
    {
      title: "TA'LIM",
      items: [
        { href: '/admin/courses', label: 'Kurslar', icon: <BookOpen size={16} />, countKey: 'courses' },
        { href: '/admin/groups', label: 'Guruhlar', icon: <Users size={16} />, countKey: 'groups' },
        { href: '/admin/schedule', label: 'Jadval', icon: <Calendar size={16} /> },
      ],
    },
    {
      title: 'TALABALAR',
      items: [
        { href: '/admin/students', label: "O'quvchilar", icon: <GraduationCap size={16} />, countKey: 'students' },
        { href: '/admin/leads', label: 'Leadlar', icon: <Target size={16} />, countKey: 'leads' },
      ],
    },
    {
      title: 'MOLIYA',
      items: [
        { href: '/admin/payments', label: "To'lovlar", icon: <Wallet size={16} /> },
      ],
    },
    {
      title: 'HISOBOTLAR',
      items: [
        { href: '/admin/reports/finance', label: 'Moliya', icon: <DollarSign size={16} /> },
        { href: '/admin/reports/debtors', label: 'Qarzdorlar', icon: <Wallet size={16} /> },
      ],
    },
    {
      title: 'XODIMLAR',
      items: [
        { href: '/admin/operators', label: 'Operatorlar', icon: <UserCog size={16} />, countKey: 'operators' },
        { href: '/admin/teachers', label: "O'qituvchilar", icon: <School size={16} /> },
        { href: '/admin/salary', label: 'Maosh', icon: <DollarSign size={16} /> },
      ],
    },
    {
      title: 'TIZIM',
      items: [
        { href: '/admin/settings', label: 'Sozlamalar', icon: <Settings size={16} /> },
      ],
    },
  ];
}

const superadminSections: NavSection[] = [
  {
    title: 'BOSHQARUV',
    items: [
      { href: '/superadmin', label: 'Dashboard', icon: <LayoutDashboard size={16} /> },
      { href: '/superadmin/centers', label: 'Markazlar', icon: <Users size={16} /> },
      { href: '/superadmin/plans', label: 'Tarif paketlari', icon: <Wallet size={16} /> },
      { href: '/superadmin/subscriptions', label: 'Obunalar', icon: <Calendar size={16} /> },
    ],
  },
  {
    title: 'HISOBOTLAR',
    items: [
      { href: '/superadmin/revenue', label: 'Daromad', icon: <DollarSign size={16} /> },
    ],
  },
  {
    title: 'TIZIM',
    items: [
      { href: '/superadmin/users', label: 'Foydalanuvchilar', icon: <UserCog size={16} /> },
    ],
  },
];

function buildOperatorSections(): NavSection[] {
  return [
    {
      title: "MENING ISHIM",
      items: [
        { href: '/operator/leads', label: 'Leadlar', icon: <Target size={16} />, countKey: 'leads' },
        { href: '/operator/students', label: 'Talabalarim', icon: <GraduationCap size={16} />, countKey: 'students' },
        { href: '/operator/payments', label: "To'lovlar", icon: <Wallet size={16} /> },
      ],
    },
    {
      title: "MA'LUMOT",
      items: [
        { href: '/operator/courses', label: 'Kurslar', icon: <BookOpen size={16} /> },
        { href: '/operator/groups', label: 'Guruhlar', icon: <Users size={16} /> },
        { href: '/operator/schedule', label: 'Jadval', icon: <Calendar size={16} /> },
      ],
    },
    {
      title: 'SHAXSIY',
      items: [
        { href: '/operator/salary', label: 'Maosh', icon: <DollarSign size={16} /> },
      ],
    },
  ];
}

export default function Sidebar({
  mobileOpen = false,
  onMobileClose = () => {},
}: {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}) {
  const { user, logout } = useAuthStore();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (user?.role !== 'ADMIN') return;
    async function loadCounts() {
      try {
        const [courses, groups, students, leads, users] = await Promise.all([
          api.get('/courses').catch(() => ({ data: [] })),
          api.get('/groups').catch(() => ({ data: [] })),
          api.get('/students').catch(() => ({ data: [] })),
          api.get('/leads').catch(() => ({ data: [] })),
          api.get('/users').catch(() => ({ data: [] })),
        ]);
        setCounts({
          courses: courses.data.length,
          groups: groups.data.length,
          students: students.data.length,
          leads: leads.data.length,
          operators: users.data.filter((u: any) => u.role === 'OPERATOR').length,
        });
      } catch { /* ignore */ }
    }
    void loadCounts();
  }, [user?.role]);

  if (!user) return null;

  const sections =
    user.role === 'SUPERADMIN' ? superadminSections
      : user.role === 'ADMIN' ? buildAdminSections()
        : buildOperatorSections();

  const centerName = (user as any).center?.name ?? 'Markaz';
  const initials = centerName.split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase();

  function isActive(href: string) {
    const roots = ['/superadmin', '/admin', '/operator'];
    if (roots.includes(href)) return pathname === href;
    return pathname.startsWith(href);
  }

  return (
    <aside className={[
      'flex flex-col h-full bg-white border-r border-gray-100 shrink-0 transition-all duration-200',
      'fixed md:relative inset-y-0 left-0 z-40 md:z-auto',
      'w-55',
      collapsed ? 'md:w-14' : 'md:w-55',
      mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
    ].join(' ')}>
      {/* Logo */}
      <div className={`flex items-center h-14 border-b border-gray-100 px-3 ${collapsed ? 'justify-center' : 'justify-between'}`}>
        {!collapsed && (
          <span className="text-[15px] font-bold text-gray-900">SmartHub</span>
        )}
        <button
          onClick={() => setCollapsed(v => !v)}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors shrink-0 cursor-pointer"
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {user.role === 'ADMIN' && !collapsed && (
        <div className="px-3 py-2.5 border-b border-gray-100">
          <div className="flex items-center gap-2.5 w-full px-2 py-1.5 rounded-lg">
            <div className="w-7 h-7 bg-indigo-100 text-indigo-700 rounded-lg flex items-center justify-center text-xs font-bold shrink-0">
              {initials}
            </div>
            <span className="text-sm font-medium text-gray-800 flex-1 text-left truncate">{centerName}</span>
          </div>
        </div>
      )}

      <nav className="flex-1 overflow-y-auto py-3 space-y-4 px-2">
        {sections.map(section => (
          <div key={section.title}>
            {!collapsed && (
              <p className="text-[9px] font-semibold tracking-widest text-gray-400 px-2 mb-1.5">
                {section.title}
              </p>
            )}
            <ul className="space-y-0.5">
              {section.items.map(item => {
                const active = isActive(item.href);
                const count = item.countKey ? counts[item.countKey] : undefined;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      title={collapsed ? item.label : undefined}
                      onClick={onMobileClose}
                      className={`flex items-center gap-2.5 px-2 py-2 rounded-lg text-[13px] transition-colors ${active ? 'bg-gray-100 text-gray-900 font-medium' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                        } ${collapsed ? 'justify-center' : ''}`}
                    >
                      <span className={`shrink-0 ${active ? 'text-gray-700' : 'text-gray-400'}`}>
                        {item.icon}
                      </span>
                      {!collapsed && (
                        <>
                          <span className="flex-1 truncate">{item.label}</span>
                          {count !== undefined && count > 0 && (
                            <span className="text-[11px] text-gray-400 font-medium">{count}</span>
                          )}
                        </>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div className="border-t border-gray-100 p-2">
        {!collapsed && (
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg mb-0.5">
            <Avatar name={user.name} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-gray-800 truncate">{user.name}</p>
              <p className="text-[10px] text-gray-400 truncate">
                {user.role === 'ADMIN' ? 'Admin' : user.role === 'OPERATOR' ? 'Operator' : 'Superadmin'}
                {(user as any).center?.name ? ` · ${(user as any).center.name}` : ''}
              </p>
            </div>
          </div>
        )}
        <button
          onClick={() => { logout(); window.location.href = '/login'; }}
          title={collapsed ? 'Chiqish' : undefined}
          className={`w-full flex items-center gap-2 px-2 py-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg text-[13px] transition-colors ${collapsed ? 'justify-center' : ''}`}
        >
          <LogOut size={14} className="shrink-0" />
          {!collapsed && 'Chiqish'}
        </button>
      </div>
    </aside>
  );
}
