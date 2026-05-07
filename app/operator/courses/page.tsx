'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function OperatorCoursesPage() {
    const [courses, setCourses] = useState<any[]>([]);
    const [groups, setGroups] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    async function load() {
        setLoading(true);
        try {
            const [coursesRes, groupsRes] = await Promise.all([
                api.get('/courses'),
                api.get('/groups')
            ]);
            setCourses(coursesRes.data);
            setGroups(groupsRes.data);
        } catch (err) {
            console.error('Yuklanmadi:', err);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { void load(); }, []);

    const filtered = courses.filter(c =>
        !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.description?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div>
            <div className="flex items-start justify-between mb-2">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Kurslar</h1>
                    <p className="text-sm text-gray-400 mt-0.5">Mavjud o&apos;quv kurslari ro&apos;yxati.</p>
                </div>
            </div>

            <div className="flex items-center gap-3 mt-5 mb-4">
                <div className="relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                    </svg>
                    <input
                        placeholder="Kurs nomi..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm w-56 focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
                    />
                </div>
                <span className="ml-auto text-sm text-gray-400 bg-gray-100 px-3 py-1.5 rounded-xl">{filtered.length} ta</span>
            </div>

            <div className="space-y-4">
                {loading ? (
                    <div className="text-center py-12 text-gray-400">Yuklanmoqda...</div>
                ) : filtered.map(course => {
                    const courseGroups = groups.filter(g => g.courseId === course.id);
                    return (
                        <div key={course.id} className="bg-white rounded-xl border p-5">
                            <div className="mb-4">
                                <h3 className="text-lg font-semibold text-gray-900 mb-1">Kurs: {course.name}</h3>
                                {course.description && (
                                    <p className="text-sm text-gray-500">{course.description}</p>
                                )}
                            </div>

                            {course.duration && (
                                <div className="flex items-center gap-2 text-sm mb-3">
                                    <span className="text-gray-400">Davomiyligi:</span>
                                    <span className="text-gray-700 font-medium">
                                        {course.duration} {course.durationUnit === 'month' ? 'oy' : 'hafta'}
                                    </span>
                                </div>
                            )}

                            {courseGroups.length > 0 ? (
                                <div className="space-y-2">
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                                        Guruhlar ({courseGroups.length} ta)
                                    </p>
                                    {courseGroups.map(group => (
                                        <div key={group.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">Guruh: {group.name}</p>
                                                <p className="text-xs text-gray-500 mt-0.5">
                                                    {group.days?.join(', ')} · {group.startTime}–{group.endTime}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-semibold text-indigo-600">
                                                    {group.price ? `${Number(group.price).toLocaleString()} so'm` : 'Narx yo\'q'}
                                                </p>
                                                <p className="text-xs text-gray-400 mt-0.5">
                                                    {group._count?.enrollments ?? 0}/{group.maxStudents} talaba
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-400 italic">Bu kursda hali guruhlar yo'q</p>
                            )}
                        </div>
                    );
                })}
                {!loading && filtered.length === 0 && (
                    <div className="text-center py-12 text-gray-400">Kurslar topilmadi</div>
                )}
            </div>
        </div>
    );
}
