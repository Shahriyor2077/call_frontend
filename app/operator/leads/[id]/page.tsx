'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import { ArrowLeft, Phone, Calendar } from 'lucide-react';
import { useToast } from '@/components/ui/ToastProvider';

const COLUMNS = [
    { key: 'NEW', label: 'Yangi', dot: 'bg-blue-500' },
    { key: 'IN_PROGRESS', label: 'Muloqotda', dot: 'bg-amber-500' },
    { key: 'ENROLLED', label: 'Yozildi', dot: 'bg-green-500' },
    { key: 'NOT_COME', label: 'Kelmadi', dot: 'bg-gray-400' },
    { key: 'REJECTED', label: 'Rad etdi', dot: 'bg-red-500' },
];

const SOURCE_OPTIONS = ['Instagram', 'Telegram', 'Tavsiya', 'Sayt', 'Boshqa'];

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
        } catch (err) {
            console.error('Lead yuklashda xato:', err);
            toast.error('Lead topilmadi');
            router.back();
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (id) void loadLead();
    }, [id]);

    async function updateStatus(status: string) {
        setSaving(true);
        try {
            await api.put(`/leads/${id}/status`, { status });
            setLead({ ...lead, status });
        } catch (err) {
            console.error('Status yangilashda xato:', err);
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
        } catch (err) {
            console.error('Lead yangilashda xato:', err);
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
                <div className="text-gray-400">Yuklanmoqda...</div>
            </div>
        );
    }

    if (!lead) return null;

    return (
        <div className="max-w-4xl">
            <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
            >
                <ArrowLeft size={16} />
                Orqaga
            </button>

            <div className="grid grid-cols-3 gap-6">
                {/* Main info */}
                <div className="col-span-2 space-y-6">
                    <div className="bg-white rounded-xl border p-6">
                        <h1 className="text-2xl font-bold text-gray-900 mb-6">Lead ma'lumotlari</h1>

                        <div className="space-y-4">
                            <Input
                                label="Ism"
                                value={lead.name}
                                onChange={e => setLead({ ...lead, name: e.target.value })}
                            />

                            <div>
                                <label className="text-sm font-medium text-gray-700 block mb-1.5">
                                    Telefon
                                </label>
                                <div className="flex gap-2">
                                    <Input
                                        value={lead.phone}
                                        onChange={e => setLead({ ...lead, phone: e.target.value })}
                                        className="flex-1"
                                    />
                                    <a
                                        href={`tel:${lead.phone}`}
                                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                                    >
                                        <Phone size={16} />
                                        Qo'ng'iroq
                                    </a>
                                </div>
                            </div>

                            <Input
                                label="Qiziqish yo'nalishi"
                                value={lead.interest || ''}
                                onChange={e => setLead({ ...lead, interest: e.target.value })}
                            />

                            <div>
                                <label className="text-sm font-medium text-gray-700 block mb-1.5">
                                    Manba
                                </label>
                                <select
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    value={lead.source || ''}
                                    onChange={e => setLead({ ...lead, source: e.target.value })}
                                >
                                    <option value="">— Tanlang —</option>
                                    {SOURCE_OPTIONS.map(s => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-700 block mb-1.5">
                                    Izoh
                                </label>
                                <textarea
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    rows={4}
                                    value={lead.notes || ''}
                                    onChange={e => setLead({ ...lead, notes: e.target.value })}
                                />
                            </div>

                            <Button onClick={() => void updateLead()} loading={saving} className="w-full">
                                Saqlash
                            </Button>

                            <Button onClick={() => setDeleteModal(true)} variant="danger" className="w-full">
                                O&apos;chirish
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Status */}
                    <div className="bg-white rounded-xl border p-5">
                        <h3 className="text-sm font-semibold text-gray-900 mb-3">Status</h3>
                        <div className="space-y-2">
                            {COLUMNS.map(col => (
                                <button
                                    key={col.key}
                                    onClick={() => void updateStatus(col.key)}
                                    disabled={saving}
                                    className={`w-full py-2.5 px-3 rounded-lg text-sm font-medium text-left flex items-center gap-2 transition-colors ${lead.status === col.key
                                        ? 'bg-indigo-600 text-white'
                                        : 'border border-gray-200 hover:border-indigo-300 text-gray-700'
                                        }`}
                                >
                                    <span className={`w-2 h-2 rounded-full ${lead.status === col.key ? 'bg-white' : col.dot}`} />
                                    {col.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Meta */}
                    <div className="bg-white rounded-xl border p-5">
                        <h3 className="text-sm font-semibold text-gray-900 mb-3">Qo'shimcha</h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2 text-gray-600">
                                <Calendar size={14} />
                                <span className="text-xs">
                                    {new Date(lead.createdAt).toLocaleDateString('uz-UZ', {
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric',
                                    })}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Delete Modal */}
            <Modal open={deleteModal} onClose={() => setDeleteModal(false)} title="Leadni o'chirish" size="sm">
                <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                        <span className="font-semibold text-gray-900">{lead.name}</span> leadini o'chirishni xohlaysizmi?
                    </p>
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                        <p className="text-sm text-amber-800">
                            ⚠️ Bu amal qaytarilmaydi. Lead va unga tegishli barcha ma'lumotlar o'chiriladi.
                        </p>
                    </div>
                    <div className="flex gap-3 pt-2">
                        <Button variant="danger" onClick={() => void deleteLead()} loading={saving} className="flex-1">
                            O'chirish
                        </Button>
                        <Button variant="secondary" onClick={() => setDeleteModal(false)} className="flex-1">
                            Bekor
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
