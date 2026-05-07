'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { ArrowLeft } from 'lucide-react';

const SOURCE_OPTIONS = ['Instagram', 'Telegram', 'Tavsiya', 'Sayt', 'Boshqa'];

export default function NewLeadPage() {
    const router = useRouter();
    const [form, setForm] = useState({
        name: '',
        phone: '',
        interest: '',
        source: '',
        notes: '',
        operatorId: '',
    });
    const [operators, setOperators] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        async function loadOperators() {
            try {
                const { data } = await api.get('/users?role=OPERATOR');
                setOperators(data);
            } catch (err) {
                console.error('Operatorlarni yuklashda xato:', err);
            }
        }
        void loadOperators();
    }, []);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!form.name || !form.phone) return;

        setLoading(true);
        try {
            await api.post('/leads', form);
            router.push('/admin/leads');
        } catch (err) {
            console.error('Lead yaratishda xato:', err);
            alert('Xatolik yuz berdi');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="max-w-2xl">
            <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
            >
                <ArrowLeft size={16} />
                Orqaga
            </button>

            <div className="bg-white rounded-xl border p-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-6">Yangi lead qo'shish</h1>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <Input
                        label="Ism *"
                        value={form.name}
                        onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                        placeholder="Ism familiya"
                        required
                    />

                    <Input
                        label="Telefon *"
                        value={form.phone}
                        onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                        placeholder="+998901234567"
                        required
                    />

                    <Input
                        label="Qiziqish yo'nalishi"
                        value={form.interest}
                        onChange={e => setForm(p => ({ ...p, interest: e.target.value }))}
                    />

                    <div>
                        <label className="text-sm font-medium text-gray-700 block mb-1.5">
                            Manba
                        </label>
                        <select
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            value={form.source}
                            onChange={e => setForm(p => ({ ...p, source: e.target.value }))}
                        >
                            <option value="">— Tanlang —</option>
                            {SOURCE_OPTIONS.map(s => (
                                <option key={s} value={s}>
                                    {s}
                                </option>
                            ))}
                        </select>
                    </div>

                    {operators.length > 0 && (
                        <div>
                            <label className="text-sm font-medium text-gray-700 block mb-1.5">
                                Operator (ixtiyoriy)
                            </label>
                            <select
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                value={form.operatorId}
                                onChange={e => setForm(p => ({ ...p, operatorId: e.target.value }))}
                            >
                                <option value="">— O'zim —</option>
                                {operators.map(op => (
                                    <option key={op.id} value={op.id}>
                                        {op.name}
                                    </option>
                                ))}
                            </select>
                            <p className="text-xs text-gray-400 mt-1">
                                Agar tanlamasangiz, lead sizga biriktiriladi
                            </p>
                        </div>
                    )}

                    <div>
                        <label className="text-sm font-medium text-gray-700 block mb-1.5">
                            Izoh
                        </label>
                        <textarea
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            rows={4}
                            value={form.notes}
                            onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                            placeholder="Qo'shimcha ma'lumotlar..."
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button type="submit" loading={loading} className="flex-1">
                            Saqlash
                        </Button>
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => router.back()}
                            className="flex-1"
                        >
                            Bekor qilish
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
