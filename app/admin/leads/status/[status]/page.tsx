'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';
import Avatar from '@/components/ui/Avatar';
import { useToast } from '@/components/ui/ToastProvider';
import { ArrowLeft, ChevronLeft, ChevronRight, Phone, Search } from 'lucide-react';

const STATUS_INFO: Record<string, { label: string; dot: string; badge: string; iconBg: string }> = {
    NEW:         { label: 'Yangi',      dot: 'bg-blue-500',   badge: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',     iconBg: 'bg-blue-500' },
    IN_PROGRESS: { label: "Bog'lanildi", dot: 'bg-amber-500',  badge: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',   iconBg: 'bg-amber-500' },
    ENROLLED:    { label: 'Qiziqyapti', dot: 'bg-violet-500', badge: 'bg-violet-50 text-violet-700 ring-1 ring-violet-200', iconBg: 'bg-violet-500' },
    NOT_COME:    { label: 'Kelmadi',    dot: 'bg-gray-400',   badge: 'bg-gray-50 text-gray-600 ring-1 ring-gray-200',       iconBg: 'bg-gray-400' },
    REJECTED:    { label: 'Rad etdi',   dot: 'bg-red-500',    badge: 'bg-red-50 text-red-700 ring-1 ring-red-200',          iconBg: 'bg-red-500' },
};

const SOURCE_COLORS: Record<string, string> = {
    Instagram: 'bg-pink-50 text-pink-700',
    Telegram:  'bg-blue-50 text-blue-700',
    Tavsiya:   'bg-green-50 text-green-700',
    Sayt:      'bg-violet-50 text-violet-700',
};

const MONTH_UZ = ['yan', 'fev', 'mar', 'apr', 'may', 'iyn', 'iyl', 'avg', 'sen', 'okt', 'noy', 'dek'];
function formatDate(d: string) {
    const dt = new Date(d);
    return `${dt.getDate()} ${MONTH_UZ[dt.getMonth()]} ${dt.getFullYear()}`;
}

export default function LeadsByStatusPage() {
    const router = useRouter();
    const params = useParams();
    const toast = useToast();
    const status = params.status as string;

    const [leads, setLeads] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState('');
    const limit = 15;

    const statusInfo = STATUS_INFO[status];

    async function load() {
        setLoading(true);
        try {
            const { data } = await api.get(`/leads?page=${page}&limit=${limit}&status=${status}`);
            setLeads(data.data);
            setTotalPages(data.meta.totalPages);
            setTotal(data.meta.total);
        } catch {
            toast.error('Leadlar yuklanmadi');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (status) void load();
    }, [page, status]);

    const filtered = search
        ? leads.filter(l =>
            l.name?.toLowerCase().includes(search.toLowerCase()) ||
            l.phone?.includes(search)
          )
        : leads;

    if (!statusInfo) {
        return <div className="text-center py-12"><p className="text-gray-400">Noto&apos;g&apos;ri status</p></div>;
    }

    function PaginationBar() {
        if (totalPages <= 1) return null;
        return (
            <div className="flex items-center justify-between bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-2.5">
                <p className="text-sm text-gray-500">Sahifa {page} / {totalPages} · Jami {total} ta</p>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                        <ChevronLeft size={15} /> Oldingi
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(n => n === 1 || n === totalPages || Math.abs(n - page) <= 1)
                        .reduce<(number | 'dots')[]>((acc, n, idx, arr) => {
                            if (idx > 0 && n - (arr[idx - 1] as number) > 1) acc.push('dots');
                            acc.push(n);
                            return acc;
                        }, [])
                        .map((item, idx) =>
                            item === 'dots' ? (
                                <span key={`dots-${idx}`} className="px-2 text-gray-400 text-sm">…</span>
                            ) : (
                                <button
                                    key={item}
                                    onClick={() => setPage(item as number)}
                                    className={`min-w-8 px-2 py-1.5 rounded-lg text-sm font-medium border transition-colors cursor-pointer ${
                                        page === item
                                            ? 'bg-indigo-600 text-white border-indigo-600'
                                            : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                                    }`}
                                >
                                    {item}
                                </button>
                            )
                        )}
                    <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                        Keyingi <ChevronRight size={15} />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div>
            <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-5"
            >
                <ArrowLeft size={16} />
                Orqaga
            </button>

            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl ${statusInfo.iconBg} flex items-center justify-center shrink-0`}>
                        <span className="w-3.5 h-3.5 rounded-full bg-white/80" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 tracking-wide">{statusInfo.label.toUpperCase()}</h1>
                        <p className="text-sm text-gray-400 mt-0.5">Jami {total} ta lead</p>
                    </div>
                </div>
                <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Ism yoki telefon..."
                        className="pl-8 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/30 w-52"
                    />
                </div>
            </div>

            <div className="space-y-3">
                <PaginationBar />

                {/* Table */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50/50 text-left">
                                <th className="px-4 py-3 text-xs font-semibold text-gray-400 tracking-wide">#</th>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-400 tracking-wide">To&apos;liq ismi</th>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-400 tracking-wide">Telefon raqami</th>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-400 tracking-wide hidden md:table-cell">Yo&apos;nalish</th>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-400 tracking-wide hidden lg:table-cell">Manba</th>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-400 tracking-wide hidden lg:table-cell">Operator</th>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-400 tracking-wide hidden md:table-cell">Sana</th>
                                <th className="px-4 py-3 w-8" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading && (
                                <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-400 text-sm">Yuklanmoqda...</td></tr>
                            )}
                            {!loading && filtered.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="px-4 py-14 text-center text-gray-400">
                                        {search ? 'Qidiruvga mos lead topilmadi' : 'Bu statusda leadlar yo\'q'}
                                    </td>
                                </tr>
                            )}
                            {!loading && filtered.map((lead, idx) => (
                                <tr
                                    key={lead.id}
                                    onClick={() => router.push(`/admin/leads/${lead.id}`)}
                                    className="hover:bg-gray-50/60 cursor-pointer transition-colors group"
                                >
                                    <td className="px-4 py-3.5 text-gray-400 text-xs font-mono">
                                        {(page - 1) * limit + idx + 1}
                                    </td>
                                    <td className="px-4 py-3.5">
                                        <div className="flex items-center gap-2.5">
                                            <Avatar name={lead.name} size="sm" />
                                            <span className="font-medium text-gray-900 group-hover:text-indigo-700 transition-colors">{lead.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3.5">
                                        <a
                                            href={`tel:${lead.phone}`}
                                            onClick={e => e.stopPropagation()}
                                            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-indigo-600 transition-colors"
                                        >
                                            <Phone size={12} />
                                            {lead.phone}
                                        </a>
                                    </td>
                                    <td className="px-4 py-3.5 hidden md:table-cell">
                                        <span className="text-sm text-gray-500">{lead.interest || '—'}</span>
                                    </td>
                                    <td className="px-4 py-3.5 hidden lg:table-cell">
                                        {lead.source ? (
                                            <span className={`text-xs px-2.5 py-1 rounded-lg font-medium ${SOURCE_COLORS[lead.source] || 'bg-gray-100 text-gray-600'}`}>
                                                {lead.source}
                                            </span>
                                        ) : <span className="text-gray-300">—</span>}
                                    </td>
                                    <td className="px-4 py-3.5 hidden lg:table-cell">
                                        {lead.operator ? (
                                            <div className="flex items-center gap-2">
                                                <Avatar name={lead.operator.name} size="sm" />
                                                <span className="text-sm text-gray-600">{lead.operator.name}</span>
                                            </div>
                                        ) : <span className="text-gray-300">—</span>}
                                    </td>
                                    <td className="px-4 py-3.5 hidden md:table-cell">
                                        <span className="text-xs text-gray-400">{formatDate(lead.createdAt)}</span>
                                    </td>
                                    <td className="px-4 py-3.5 text-right">
                                        <span className="text-gray-300 group-hover:text-indigo-400 transition-colors">›</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <PaginationBar />
            </div>
        </div>
    );
}
