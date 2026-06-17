import type { Metadata } from 'next';
import '../globals.css';

export const metadata: Metadata = {
    title: 'SmartHub - O\'quv markazlari uchun CRM',
    description: 'Ta\'lim markazlari uchun ishonchli CRM yechimi. Bepul demo versiyasini sinab ko\'ring.',
};

export default function LandingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="uz" suppressHydrationWarning>
            <body suppressHydrationWarning>
                {children}
            </body>
        </html>
    );
}
