'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import {
  LayoutDashboard, BookOpen, Users, GraduationCap, Calendar,
  Target, Wallet, UserCog, School, DollarSign, Settings, LogOut,
  Bell, ChevronDown, TrendingUp, AlertCircle,
} from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import { useState, useRef, useEffect } from 'react';

type SubItem = { href: string; label: string; icon: React.ReactNode };
type NavItem =
  | { type: 'link'; href: string; label: string; icon: React.ReactNode }
  | { type: 'dropdown'; key: string; label: string; icon: React.ReactNode; children: SubItem[] };

function buildAdminNav(): NavItem[] {
  return [
    { type: 'link', href: '/admin', label: 'Dashboard', icon: <LayoutDashboard size={14} /> },
    {
      type: 'dropdown', key: 'talim', label: "Ta'lim", icon: <BookOpen size={14} />,
      children: [
        { href: '/admin/courses', label: 'Kurslar', icon: <BookOpen size={13} /> },
        { href: '/admin/groups', label: 'Guruhlar', icon: <Users size={13} /> },
        { href: '/admin/schedule', label: 'Jadval', icon: <Calendar size={13} /> },
      ],
    },
    { type: 'link', href: '/admin/students', label: "O'quvchilar", icon: <GraduationCap size={14} /> },
    { type: 'link', href: '/admin/payments', label: "To'lovlar", icon: <Wallet size={14} /> },
    {
      type: 'dropdown', key: 'hisobot', label: 'Hisobot', icon: <TrendingUp size={14} />,
      children: [
        { href: '/admin/reports/finance', label: 'Moliya', icon: <DollarSign size={13} /> },
        { href: '/admin/reports/debtors', label: 'Qarzdorlar', icon: <AlertCircle size={13} /> },
      ],
    },
    { type: 'link', href: '/admin/leads', label: 'Leadlar', icon: <Target size={14} /> },
    { type: 'link', href: '/admin/operators', label: 'Operatorlar', icon: <UserCog size={14} /> },
    { type: 'link', href: '/admin/teachers', label: "O'qituvchilar", icon: <School size={14} /> },
    { type: 'link', href: '/admin/salary', label: 'Maosh', icon: <DollarSign size={14} /> },
    { type: 'link', href: '/admin/settings', label: 'Sozlamalar', icon: <Settings size={14} /> },
  ];
}

const superadminNav: NavItem[] = [
  { type: 'link', href: '/superadmin', label: 'Dashboard', icon: <LayoutDashboard size={14} /> },
  { type: 'link', href: '/superadmin/centers', label: 'Markazlar', icon: <Users size={14} /> },
  { type: 'link', href: '/superadmin/plans', label: 'Tarif paketlari', icon: <Wallet size={14} /> },
  { type: 'link', href: '/superadmin/subscriptions', label: 'Obunalar', icon: <Calendar size={14} /> },
  { type: 'link', href: '/superadmin/revenue', label: 'Daromad', icon: <DollarSign size={14} /> },
  { type: 'link', href: '/superadmin/users', label: 'Foydalanuvchilar', icon: <UserCog size={14} /> },
];

function buildOperatorNav(): NavItem[] {
  return [
    { type: 'link', href: '/operator/leads', label: 'Leadlar', icon: <Target size={14} /> },
    { type: 'link', href: '/operator/students', label: 'Talabalarim', icon: <GraduationCap size={14} /> },
    { type: 'link', href: '/operator/payments', label: "To'lovlar", icon: <Wallet size={14} /> },
    { type: 'link', href: '/operator/courses', label: 'Kurslar', icon: <BookOpen size={14} /> },
    { type: 'link', href: '/operator/groups', label: 'Guruhlar', icon: <Users size={14} /> },
    { type: 'link', href: '/operator/schedule', label: 'Jadval', icon: <Calendar size={14} /> },
    { type: 'link', href: '/operator/salary', label: 'Maosh', icon: <DollarSign size={14} /> },
  ];
}

export default function TopNav() {
  const { user, logout } = useAuthStore();
  const pathname = usePathname();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [dropdownLeft, setDropdownLeft] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  if (!user) return null;

  const navItems =
    user.role === 'SUPERADMIN' ? superadminNav
      : user.role === 'ADMIN' ? buildAdminNav()
        : buildOperatorNav();

  const centerName = (user as any).center?.name ?? '';

  function isActive(href: string) {
    const roots = ['/superadmin', '/admin', '/operator'];
    if (roots.includes(href)) return pathname === href;
    return pathname.startsWith(href);
  }

  function isDropdownActive(children: SubItem[]) {
    return children.some(c => pathname.startsWith(c.href));
  }

  const roleLabel =
    user.role === 'ADMIN' ? 'Admin'
      : user.role === 'OPERATOR' ? 'Operator'
        : 'Superadmin';

  return (
    <header className="bg-white border-b border-gray-200 shrink-0 shadow-sm">
      {/* ── Top row ── */}
      <div className="flex items-center h-14.5 px-6 gap-5">

        {/* Logo */}
        <div className="flex items-center gap-2.5 shrink-0">
          <span className="text-[15px] font-bold text-gray-900">SmartHub</span>
          {centerName && (
            <div className="flex flex-col leading-none">
              <span className="text-[10px] text-gray-400 font-medium">{centerName}</span>
            </div>
          )}
        </div>

        <div className="flex-1" />

        {/* Right actions */}
        <div className="flex items-center gap-1.5">
          <button className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
            <Bell size={17} />
          </button>

          <div className="w-px h-6 bg-gray-200 mx-1" />

          <div className="flex items-center gap-2.5 pl-1">
            <Avatar name={user.name} size="sm" />
            <div className="hidden sm:block leading-none">
              <p className="text-[13px] font-semibold text-gray-900">{user.name}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">{roleLabel}</p>
            </div>
          </div>

          <button
            onClick={() => { logout(); window.location.href = '/login'; }}
            className="ml-1 w-9 h-9 flex items-center justify-center rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            title="Chiqish"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>

      {/* ── Nav row ── */}
      <div ref={dropdownRef} className="flex items-stretch h-10 px-4 gap-0.5 overflow-x-auto scrollbar-none relative">
        {navItems.map(item => {
          if (item.type === 'link') {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 px-3 text-[13px] whitespace-nowrap font-medium border-b-2 transition-colors ${active
                    ? 'border-indigo-600 text-indigo-700'
                    : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
                  }`}
              >
                <span className={active ? 'text-indigo-500' : 'text-gray-400'}>{item.icon}</span>
                {item.label}
              </Link>
            );
          }

          /* dropdown */
          const active = isDropdownActive(item.children);
          const open = openDropdown === item.key;
          return (
            <div key={item.key} className="relative flex items-stretch">
              <button
                onClick={(e) => {
                  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                  setDropdownLeft(rect.left);
                  setOpenDropdown(open ? null : item.key);
                }}
                className={`flex items-center gap-1.5 px-3 text-[13px] whitespace-nowrap font-medium border-b-2 transition-colors ${active || open
                    ? 'border-indigo-600 text-indigo-700'
                    : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
                  }`}
              >
                <span className={active || open ? 'text-indigo-500' : 'text-gray-400'}>{item.icon}</span>
                {item.label}
                <ChevronDown
                  size={12}
                  className={`transition-transform ${open ? 'rotate-180' : ''} ${active || open ? 'text-indigo-400' : 'text-gray-400'}`}
                />
              </button>

              {open && (
                <div
                  className="fixed mt-1 bg-white border border-gray-200 rounded-xl shadow-lg py-1.5 z-50 min-w-40"
                  style={{ top: 98, left: dropdownLeft }}
                >
                  {item.children.map(child => (
                    <Link
                      key={child.href}
                      href={child.href}
                      onClick={() => setOpenDropdown(null)}
                      className={`flex items-center gap-2.5 px-4 py-2 text-[13px] transition-colors ${pathname.startsWith(child.href)
                          ? 'text-indigo-700 bg-indigo-50 font-medium'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                    >
                      <span className={pathname.startsWith(child.href) ? 'text-indigo-500' : 'text-gray-400'}>
                        {child.icon}
                      </span>
                      {child.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </header>
  );
}
