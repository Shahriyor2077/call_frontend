'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { ArrowLeft } from 'lucide-react';
import { useToast } from '@/components/ui/ToastProvider';

export default function NewPaymentPage() {
    const router = useRouter();
    const [students, setStudents] = useState<any[]>([]);
    const [filteredStudents, setFilteredStudents] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<any>(null);
    const [form, setForm] = useState({
        studentId: '',
        amount: '',
        method: 'CASH',
        notes: '',
        type: 'MONTHLY',
    });
    const toast = useToast();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        async function loadStudents() {
            try {
                const { data } = await api.get('/students');
                setStudents(data);
            } catch (err) {
                console.error('Talabalarni yuklashda xato:', err);
            }
        }
        void loadStudents();
    }, []);

    useEffect(() => {
        if (searchQuery) {
            const filtered = students.filter(s =>
                s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                s.phone.includes(searchQuery)
            ).slice(0, 10); // Faqat 10 ta ko'rsatish
            setFilteredStudents(filtered);
        } else {
            setFilteredStudents([]);
        }
    }, [searchQuery, students]);

    function selectStudent(student: any) {
        setSelectedStudent(student);
        setForm(p => ({ ...p, studentId: student.id }));
        setSearchQuery(student.name);
        setShowDropdown(false);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!form.studentId || !form.amount) return;

        setLoading(true);
        try {
            await api.post('/payments', { ...form, amount: Number(form.amount) });
            router.push('/admin/payments');
        } catch (err) {
            console.error('To\'lov yaratishda xato:', err);
            toast.error('Xatolik yuz berdi');
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
                <h1 className="text-2xl font-bold text-gray-900 mb-6">Yangi to'lov kiritish</h1>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="relative">
                        <label className="text-sm font-medium text-gray-700 block mb-1.5">
                            Talaba *
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="Talaba ismi yoki telefon raqami..."
                                value={searchQuery}
                                onChange={e => {
                                    setSearchQuery(e.target.value);
                                    setShowDropdown(true);
                                }}
                                onFocus={() => setShowDropdown(true)}
                                required
                            />
                            {showDropdown && filteredStudents.length > 0 && (
                                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                    {filteredStudents.map(student => (
                                        <button
                                            key={student.id}
                                            type="button"
                                            onClick={() => selectStudent(student)}
                                            className="w-full px-3 py-2 text-left hover:bg-gray-50 border-b last:border-b-0"
                                        >
                                            <p className="text-sm font-medium text-gray-900">{student.name}</p>
                                            <p className="text-xs text-gray-500">{student.phone}</p>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        {selectedStudent && (
                            <div className="mt-2 flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
                                <span className="font-medium">{selectedStudent.name}</span>
                                <span>·</span>
                                <span>{selectedStudent.phone}</span>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedStudent(null);
                                        setForm(p => ({ ...p, studentId: '' }));
                                        setSearchQuery('');
                                    }}
                                    className="ml-auto text-red-600 hover:text-red-700"
                                >
                                    ✕
                                </button>
                            </div>
                        )}
                    </div>

                    <Input
                        label="Miqdor (so'm) *"
                        type="number"
                        value={form.amount}
                        onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
                        placeholder="0"
                        required
                    />

                    <div>
                        <label className="text-sm font-medium text-gray-700 block mb-1.5">
                            To'lov usuli
                        </label>
                        <select
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            value={form.method}
                            onChange={e => setForm(p => ({ ...p, method: e.target.value }))}
                        >
                            <option value="CASH">Naqd</option>
                            <option value="PAYME">Payme</option>
                            <option value="CLICK">Click</option>
                            <option value="BANK_TRANSFER">Bank o'tkazmasi</option>
                        </select>
                    </div>

                    <div>
                        <label className="text-sm font-medium text-gray-700 block mb-1.5">
                            To'lov turi
                        </label>
                        <select
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            value={form.type}
                            onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                        >
                            <option value="MONTHLY">Oylik to'lov</option>
                            <option value="ADVANCE">Avans</option>
                        </select>
                    </div>

                    <div>
                        <label className="text-sm font-medium text-gray-700 block mb-1.5">
                            Izoh
                        </label>
                        <textarea
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            rows={3}
                            value={form.notes}
                            onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                            placeholder="Qo'shimcha ma'lumotlar..."
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button type="submit" loading={loading} className="flex-1">
                            To'lovni saqlash
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
