'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';
import { ArrowLeft, Phone, ChevronLeft, ChevronRight } from 'lucide-react';

const STATUS_INFO: Record<string, { label: string; dot: string }> = {
    NEW: { label: 'Yangi', dot: 'bg-blue-500' },
    IN_PROGRESS: { label: 'Muloqotda', dot: 'bg-amber-500' },
    ENROLLED: { label: 'Yozildi', dot: 'bg-green-500' },
    NOT_COME: { label: 'Kelmadi', dot: 'bg-gray-400' },
    REJECTED: { label: 'Rad etdi', dot: 'bg-red-500' },
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
                        onClick={() => router.push(`/operator/leads/${lead.id}`)}
                        className="bg-white border border-gray-100 rounded-xl p-4 hover:border-gray-200 hover:shadow-md transition-all cursor-pointer"
                    >
                        <p className="font-semibold text-gray-900 text-base mb-2">{lead.name}</p>

                        {lead.interest && (
                            <p className="text-sm text-indigo-600 mb-2">{lead.interest}</p>
                        )}

                        {lead.source && (
                            <p className="text-xs text-gray-400 mb-3">{lead.source}</p>
                        )}

                        {lead.notes && (
                            <div className="bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-600 mb-3 line-clamp-2">
                                {lead.notes}
                            </div>
                        )}

                        <a
                            href={`tel:${lead.phone}`}
                            onClick={e => e.stopPropagation()}
                            className="flex items-center gap-2 py-2 px-3 rounded-lg bg-green-50 text-green-700 text-sm font-medium hover:bg-green-100 mt-3"
                        >
                            <Phone size={14} /> {lead.phone}
                        </a>
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
