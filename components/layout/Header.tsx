'use client';

import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';

const breadcrumbMap: Record<string, string> = {
  '/superadmin': 'Dashboard',
  '/superadmin/centers': 'Markazlar',
  '/superadmin/plans': 'Tarif paketlari',
  '/superadmin/subscriptions': 'Obunalar',
  '/superadmin/revenue': 'Daromad',
  '/superadmin/users': 'Foydalanuvchilar',


  '/admin': 'Dashboard',
  '/admin/courses': 'Kurslar',
  '/admin/groups': 'Guruhlar',
  '/admin/students': 'Talabalar',
  '/admin/schedule': 'Jadval',
  '/admin/leads': 'Leadlar',
  '/admin/payments': "To'lovlar",
  '/admin/operators': 'Operatorlar',
  '/admin/teachers': "O'qituvchilar",
  '/admin/salary': 'Maosh',
  '/admin/settings': 'Sozlamalar',

  '/operator': 'Dashboard',
  '/operator/leads': 'Leadlar',
  '/operator/students': 'Talabalarim',
  '/operator/groups': 'Kurslar',
  '/operator/schedule': 'Jadval',
  '/operator/payments': "To'lovlar",
  '/operator/salary': 'Maosh',
};

export default function Header() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const page = breadcrumbMap[pathname] ?? 'Sahifa';
  const centerName = (user as any)?.center?.name ?? 'EduCRM';

  return (
    <header className="h-14 bg-white border-b bord  er-gray-100 flex items-center px-5 gap-4 shrink-0">
      <div className="flex items-center gap-1.5 text-sm">
        <span className="text-gray-400 font-medium">{centerName}</span>
        <span className="text-gray-300">/</span>
        <span className="font-semibold text-gray-800">{page}</span>
      </div>

      <div className="flex-1" />

      <div className="w-32" />
    </header>
  );
}
