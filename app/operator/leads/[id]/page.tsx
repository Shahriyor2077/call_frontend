'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Modal from '@/components/ui/Modal';
import { ArrowLeft, Phone, Calendar } from 'lucide-react';
import { useToast } from '@/components/ui/ToastProvider';

const COLUMNS = [
    { key: 'NEW',         label: 'Yangi',     dot: 'bg-blue-500',   badge: 'bg-blue-50 text-blue-700' },
    { key: 'IN_PROGRESS', label: 'Muloqotda', dot: 'bg-amber-500',  badge: 'bg-amber-50 text-amber-700' },
    { key: 'ENROLLED',    label: 'Yozildi',   dot: 'bg-green-500',  badge: 'bg-green-50 text-green-700' },
    { key: 'NOT_COME',    label: 'Kelmadi',   dot: 'bg-gray-400',   badge: 'bg-gray-50 text-gray-600' },
    { key: 'REJECTED',    label: 'Rad etdi',  dot: 'bg-red-500',    badge: 'bg-red-50 text-red-700' },
];

const SOURCE_OPTIONS = ['Instagram', 'Telegram', 'Tavsiya', 'Sayt', 'Boshqa'];

const MONTH_UZ = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr'];
function formatDate(d: string) {
    const dt = new Date(d);
    return `${dt.getDate()} ${MONTH_UZ[dt.getMonth()]} ${dt.getFullYear()}`;
}
function timeAgo(d: string) {
    const days = Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
    if (days === 0) return 'Bugun';
    if (days === 1) return 'Kecha';
    if (days < 30) return `${days} kun oldin`;
    return `${Math.floor(days / 30)} oy oldin`;
}

export default function LeadDetailPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;

    const toast = useToast();
    const [lead, setLead] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleteModal, setDeleteModal] = useState(false);

    async function loadLead() {
        setLoading(true);
        try {
            const { data } = await api.get(`/leads/${id}`);
            setLead(data);
        } catch {
            toast.error('Lead topilmadi');
            router.back();
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { if (id) void loadLead(); }, [id]);

    async function updateStatus(status: string) {
        setSaving(true);
        try {
            await api.put(`/leads/${id}/status`, { status });
            setLead((prev: any) => ({ ...prev, status }));
        } catch {
            toast.error('Xatolik yuz berdi');
        } finally {
            setSaving(false);
        }
    }

    async function updateLead() {
        setSaving(true);
        try {
            await api.put(`/leads/${id}`, lead);
            toast.success('Saqlandi');
        } catch {
            toast.error('Xatolik yuz berdi');
        } finally {
            setSaving(false);
        }
    }

    async function deleteLead() {
        setSaving(true);
        try {
            await api.delete(`/leads/${id}`);
            router.back();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Xatolik yuz berdi');
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!lead) return null;

    const currentStatus = COLUMNS.find(c => c.key === lead.status);

    return (
        <div className="max-w-4xl">
            <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-5 transition-colors"
            >
                <ArrowLeft size={16} />
                Orqaga
            </button>

            {/* Hero */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-5">
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 text-lg font-bold shrink-0">
                        {lead.name?.slice(0, 1).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">{lead.name}</h1>
                                <a
                                    href={`tel:${lead.phone}`}
                                    className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-green-600 mt-0.5 transition-colors"
                                >
                                    <Phone size={13} />
                                    {lead.phone}
                                </a>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                                {currentStatus && (
                                    <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${currentStatus.badge}`}>
                                        {currentStatus.label}
                                    </span>
                                )}
                                <a
                                    href={`tel:${lead.phone}`}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-xl hover:bg-green-700 text-xs font-medium transition-colors"
                                >
                                    <Phone size={13} />
                                    Qo&apos;ng&apos;iroq
                                </a>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-gray-400">
                            <span className="flex items-center gap-1.5">
                                <Calendar size={12} />
                                {formatDate(lead.createdAt)} · {timeAgo(lead.createdAt)}
                            </span>
                            {lead.interest && (
                                <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{lead.interest}</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Form */}
                <div className="col-span-2">
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Ma&apos;lumotlarni tahrirlash</p>

                        <Input label="Ism" value={lead.name} onChange={e => setLead({ ...lead, name: e.target.value })} />
                        <Input label="Telefon" value={lead.phone} onChange={e => setLead({ ...lead, phone: e.target.value })} />
                        <Input label="Qiziqish yo'nalishi" value={lead.interest || ''} onChange={e => setLead({ ...lead, interest: e.target.value })} />

                        <Select
                            label="Manba"
                            value={lead.source || ''}
                            onChange={e => setLead({ ...lead, source: e.target.value })}
                        >
                            <option value="">— Tanlang —</option>
                            {SOURCE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                        </Select>

                        <div>
                            <label className="text-sm font-medium text-gray-700 block mb-1.5">Izoh</label>
                            <textarea
                                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-400 resize-none"
                                rows={4}
                                value={lead.notes || ''}
                                onChange={e => setLead({ ...lead, notes: e.target.value })}
                                placeholder="Izoh qo'shing..."
                            />
                        </div>

                        <div className="flex items-center gap-3 pt-2">
                            <Button onClick={() => void updateLead()} loading={saving} className="flex-1">Saqlash</Button>
                            <button
                                onClick={() => setDeleteModal(true)}
                                className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 border border-red-200 rounded-xl transition-colors cursor-pointer"
                            >
                                O&apos;chirish
                            </button>
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div>
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Status</p>
                        <div className="space-y-1.5">
                            {COLUMNS.map(col => (
                                <button
                                    key={col.key}
                                    onClick={() => void updateStatus(col.key)}
                                    disabled={saving}
                                    className={`w-full py-2.5 px-3 rounded-xl text-sm font-medium text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                                        lead.status === col.key
                                            ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                                            : 'border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50 text-gray-700'
                                    }`}
                                >
                                    <span className={`w-2 h-2 rounded-full shrink-0 ${lead.status === col.key ? 'bg-white/80' : col.dot}`} />
                                    {col.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <Modal open={deleteModal} onClose={() => setDeleteModal(false)} title="Leadni o'chirish" size="sm">
                <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                        <span className="font-semibold text-gray-900">{lead.name}</span> leadini o&apos;chirishni xohlaysizmi?
                    </p>
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                        <p className="text-sm text-amber-800">Bu amal qaytarilmaydi. Lead va unga tegishli barcha ma&apos;lumotlar o&apos;chiriladi.</p>
                    </div>
                    <div className="flex gap-3 pt-2">
                        <Button variant="danger" onClick={() => void deleteLead()} loading={saving} className="flex-1">O&apos;chirish</Button>
                        <Button variant="secondary" onClick={() => setDeleteModal(false)} className="flex-1">Bekor</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
