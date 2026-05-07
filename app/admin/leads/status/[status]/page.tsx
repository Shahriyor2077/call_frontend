'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';
import Avatar from '@/components/ui/Avatar';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';

const STATUS_INFO: Record<string, { label: string; dot: string }> = {
    NEW: { label: 'Yangi', dot: 'bg-blue-500' },
    IN_PROGRESS: { label: "Bog'lanildi", dot: 'bg-blue-500' },
    ENROLLED: { label: 'Qiziqyapti', dot: 'bg-violet-500' },
    NOT_COME: { label: 'Kelmadi', dot: 'bg-gray-400' },
    REJECTED: { label: 'Rad etdi', dot: 'bg-red-500' },
};

const SOURCE_COLORS: Record<string, string> = {
    Instagram: 'bg-pink-50 text-pink-700',
    Telegram: 'bg-blue-50 text-blue-700',
    Tavsiya: 'bg-green-50 text-green-700',
    Sayt: 'bg-violet-50 text-violet-700',
};

export default function LeadsByStatusPage() {
    const router = useRouter();
    const params = useParams();
    const status = params.status as string;

    const [leads, setLeads] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const limit = 50;

    const statusInfo = STATUS_INFO[status];

    async function load() {
        setLoading(true);
        try {
            const { data } = await api.get(`/leads?page=${page}&limit=${limit}&status=${status}`);
            setLeads(data.data);
            setTotalPages(data.meta.totalPages);
            setTotal(data.meta.total);
        } catch (err) {
            console.error('Leadlarni yuklashda xato:', err);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (status) void load();
    }, [page, status]);

    if (!statusInfo) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-400">Noto'g'ri status</p>
            </div>
        );
    }

    return (
        <div>
            <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
            >
                <ArrowLeft size={16} />
                Orqaga
            </button>

            <div className="flex items-center gap-3 mb-6">
                <span className={`w-3 h-3 rounded-full ${statusInfo.dot}`} />
                <h1 className="text-2xl font-bold text-gray-900">{statusInfo.label}</h1>
                <span className="text-sm text-gray-400">({total} ta lead)</span>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between mb-4 bg-white rounded-xl border px-4 py-3">
                    <p className="text-sm text-gray-600">
                        Sahifa {page} / {totalPages}
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <ChevronLeft size={16} />
                            Oldingi
                        </button>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            Keyingi
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            )}

            {/* Leads grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {leads.map(lead => (
                    <div
                        key={lead.id}
                        onClick={() => router.push(`/admin/leads/${lead.id}`)}
                        className="bg-white border border-gray-100 rounded-xl p-4 hover:border-gray-200 hover:shadow-md transition-all cursor-pointer"
                    >
                        <p className="font-semibold text-gray-900 text-base mb-2">{lead.name}</p>

                        <div className="flex items-center gap-1.5 text-sm text-gray-600 mb-1">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.15 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.06 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                            </svg>
                            {lead.phone}
                        </div>

                        {lead.interest && (
                            <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-3">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="3" y="3" width="18" height="18" rx="2" />
                                    <path d="M3 9h18M9 21V9" />
                                </svg>
                                {lead.interest}
                            </div>
                        )}

                        {lead.notes && (
                            <div className="bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-600 mb-3 line-clamp-2">
                                {lead.notes}
                            </div>
                        )}

                        <div className="flex items-center justify-between pt-3 border-t">
                            {lead.source ? (
                                <span className={`text-xs px-2.5 py-1 rounded-lg font-medium ${SOURCE_COLORS[lead.source] ?? 'bg-gray-100 text-gray-600'}`}>
                                    {lead.source}
                                </span>
                            ) : <span />}
                            {lead.operator && <Avatar name={lead.operator.name} size="sm" />}
                        </div>
                    </div>
                ))}
            </div>

            {leads.length === 0 && !loading && (
                <div className="text-center py-12 bg-white rounded-xl border">
                    <p className="text-gray-400">Bu statusda leadlar yo'q</p>
                </div>
            )}

            {loading && (
                <div className="text-center py-12">
                    <p className="text-gray-400">Yuklanmoqda...</p>
                </div>
            )}
        </div>
    );
}
