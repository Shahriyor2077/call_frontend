import AuthProvider from '@/components/layout/AuthProvider';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function SuperadminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <DashboardLayout>{children}</DashboardLayout>
    </AuthProvider>
  );
}
