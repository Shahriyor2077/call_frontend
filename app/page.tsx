'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Headset,
    Users,
    BarChart3,
    Clock,
    CheckCircle2,
    ArrowRight,
    Phone,
    Mail,
    Building2,
    Shield,
    Zap,
    TrendingUp,
    BookOpen,
    Sparkles,
    Star
} from 'lucide-react';
import Toast from '@/components/ui/Toast';

export default function LandingPage() {
    const [formData, setFormData] = useState({
        centerName: '',
        contactPerson: '',
        phone: '',
        email: '',
    });
    const [loading, setLoading] = useState(false);
    const [selectedPeriod, setSelectedPeriod] = useState<1 | 3 | 6 | 12>(1);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(true);
    }, []);

    const pricingPlans = [
        {
            name: "Boshlang'ich",
            range: '0-100 ta o\'quvchi',
            prices: { 1: 300000, 3: 750000, 6: 1320000, 12: 2400000 },
            description: 'Endigina boshlayotgan kichik ta\'lim markazlari uchun ideal'
        },
        {
            name: 'Standart',
            range: '101-300 ta o\'quvchi',
            prices: { 1: 500000, 3: 1250000, 6: 2200000, 12: 4000000 },
            description: 'O\'sib borayotgan ta\'lim muassasalari uchun ideal',
            popular: true
        },
        {
            name: 'Professional',
            range: '301-600 ta o\'quvchi',
            prices: { 1: 800000, 3: 1800000, 6: 3240000, 12: 6000000 },
            description: 'Rivojlangan ta\'lim markazlari uchun kengaytirilgan imkoniyatlar'
        },
        {
            name: 'Korporativ',
            range: '601-1000 ta o\'quvchi',
            prices: { 1: 1000000, 3: 2400000, 6: 4500000, 12: 8500000 },
            description: 'Yirik ta\'lim muassasalari uchun keng qamrovli yechim'
        },
        {
            name: 'Premium',
            range: '1000+ ta o\'quvchi',
            prices: { 1: 0, 3: 0, 6: 0, 12: 0 },
            description: 'Juda katta ta\'lim muassasalari uchun maxsus yechim',
            custom: true
        }
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setToast(null);

        try {
            const response = await fetch('https://api.onelms.uz/api/v1/demo-requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (!response.ok) throw new Error('Xatolik yuz berdi');

            setToast({
                message: "So'rov muvaffaqiyatli yuborildi! Tez orada siz bilan bog'lanamiz.",
                type: 'success'
            });
            setFormData({ centerName: '', contactPerson: '', phone: '', email: '' });
        } catch (error) {
            setToast({ message: "Xatolik yuz berdi. Qaytadan urinib ko'ring.", type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 relative overflow-hidden">
            {/* Animated background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 -left-48 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-1/4 -right-48 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
            </div>

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {/* Header */}
            <header className="border-b border-white/10 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 group">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-emerald-500/50">
                                <BookOpen size={20} className="text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-white">OneLMS</h1>
                                <p className="text-xs text-slate-400">O'quv markazlari uchun CRM</p>
                            </div>
                        </div>
                        <nav className="hidden md:flex items-center gap-8">
                            <a href="#features" className="text-slate-300 hover:text-emerald-400 transition-colors text-sm">CRM imkoniyatlari</a>
                            <a href="#about" className="text-slate-300 hover:text-emerald-400 transition-colors text-sm">Biz haqimizda</a>
                            <a href="#pricing" className="text-slate-300 hover:text-emerald-400 transition-colors text-sm">Narxlar</a>
                            <a href="#contact" className="text-slate-300 hover:text-emerald-400 transition-colors text-sm">Kontakt</a>
                        </nav>
                        <div className="flex items-center gap-3">
                            <a href="#demo" className="hidden sm:block px-4 py-2 rounded-lg border border-emerald-500/50 text-emerald-400 font-medium hover:bg-emerald-500/10 transition-all text-sm">
                                Demo olish
                            </a>
                            <Link href="/login" className="px-6 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-medium hover:shadow-lg transition-all text-sm">
                                Kirish
                            </Link>
                        </div>
                    </div>
                </div>
            </header>

            <div className="relative z-10">
                {/* Hero Section */}
                <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-6">
                                <Sparkles size={16} className="text-emerald-400" />
                                <span className="text-sm text-emerald-400 font-medium">Zamonaviy CRM yechimi</span>
                            </div>
                            <h2 className="text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                                Ta'lim markazlari uchun <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-500">ishonchli CRM</span> yechimi
                            </h2>
                            <p className="text-xl text-slate-300 mb-8">
                                Biz bilan ish jarayonlarini soddalashtiring, o'quvchilar bilan aloqani mustahkamlang va o'sishga erishing.
                            </p>
                            <div className="flex flex-wrap gap-4">
                                <a href="#pricing" className="group px-8 py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold hover:shadow-xl transition-all flex items-center gap-2">
                                    Narxlarni ko'rish
                                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                </a>
                                <a href="https://t.me/shahriyorjs" target="_blank" rel="noopener noreferrer" className="px-8 py-4 rounded-xl border-2 border-white/20 text-white font-semibold hover:bg-white/10 transition-all">
                                    Bepul konsultatsiya olish
                                </a>
                            </div>
                            <div className="mt-12 flex flex-wrap gap-6 items-center">
                                <div className="flex items-center gap-2">
                                    <div className="flex -space-x-2">
                                        {[...Array(3)].map((_, i) => (
                                            <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 border-2 border-slate-900 flex items-center justify-center">
                                                <Star size={14} className="text-white fill-white" />
                                            </div>
                                        ))}
                                    </div>
                                    <span className="text-sm text-slate-300">50+ mamnun mijozlar</span>
                                </div>
                                <div className="h-8 w-px bg-white/10" />
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 size={20} className="text-emerald-400" />
                                    <span className="text-sm text-slate-300">24/7 qo'llab-quvvatlash</span>
                                </div>
                            </div>
                        </div>

                        <div className={`relative transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                            <div className="rounded-2xl border border-white/10 bg-slate-800/50 backdrop-blur p-8 shadow-2xl hover:shadow-emerald-500/20 transition-all group">
                                <div className="aspect-video bg-gradient-to-br from-emerald-500/30 via-blue-500/20 to-purple-500/30 rounded-xl flex items-center justify-center mb-6 relative overflow-hidden">
                                    <BookOpen size={100} className="text-emerald-400/70 group-hover:scale-110 transition-transform duration-500" />
                                </div>
                                <div className="grid grid-cols-3 gap-4 text-center">
                                    <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 hover:scale-110 transition-transform">
                                        <Users className="mx-auto mb-2 text-emerald-400" size={24} />
                                        <div className="text-2xl font-bold text-white">500+</div>
                                        <div className="text-xs text-slate-400">O'quvchilar</div>
                                    </div>
                                    <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 hover:scale-110 transition-transform">
                                        <BarChart3 className="mx-auto mb-2 text-blue-400" size={24} />
                                        <div className="text-2xl font-bold text-white">95%</div>
                                        <div className="text-xs text-slate-400">Samaradorlik</div>
                                    </div>
                                    <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20 hover:scale-110 transition-transform">
                                        <Clock className="mx-auto mb-2 text-purple-400" size={24} />
                                        <div className="text-2xl font-bold text-white">24/7</div>
                                        <div className="text-xs text-slate-400">Qo'llab-quvvatlash</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features */}
                <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                    <div className="text-center mb-16">
                        <h3 className="text-4xl font-bold text-white mb-4">CRM imkoniyatlari</h3>
                        <p className="text-xl text-slate-300">Biznesingizni yangi bosqichga olib chiqing</p>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[
                            { icon: Headset, title: 'Operator paneli', desc: "Qo'ng'iroqlarni boshqarish va samarali muloqot" },
                            { icon: Users, title: "O'quvchilar boshqaruvi", desc: "To'liq ma'lumotlar bazasi va hisobotlar" },
                            { icon: BarChart3, title: 'Analitika', desc: "Real vaqtda statistika" },
                            { icon: CheckCircle2, title: 'Davomat nazorati', desc: 'Avtomatik davomat hisobi' },
                            { icon: Clock, title: 'Dars jadvali', desc: 'Qulay dars jadvali tizimi' },
                            { icon: Building2, title: "Ko'p filiallar", desc: 'Bir markazdan boshqaring' }
                        ].map((f, i) => (
                            <div key={i} className="group p-6 rounded-2xl border border-white/10 bg-slate-800/30 backdrop-blur hover:bg-slate-800/50 transition-all hover:-translate-y-2 hover:shadow-2xl cursor-pointer">
                                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-all shadow-lg">
                                    <f.icon size={28} />
                                </div>
                                <h4 className="text-xl font-semibold text-white mb-2 group-hover:text-emerald-400 transition-colors">{f.title}</h4>
                                <p className="text-slate-400">{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* About */}
                <section id="about" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                    <div className="text-center mb-16">
                        <h3 className="text-4xl font-bold text-white mb-4">Biz haqimizda</h3>
                        <p className="text-xl text-slate-300 max-w-3xl mx-auto">
                            OneLMS - ta'lim sohasida zamonaviy texnologiyalarni joriy qiluvchi innovatsion CRM tizimi
                        </p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            { icon: Shield, title: 'Xavfsizlik', desc: 'Zamonaviy shifrlash texnologiyalari', gradient: 'from-emerald-500 to-emerald-600' },
                            { icon: Zap, title: 'Tezkorlik', desc: 'Tez ishlash va samarali jarayonlar', gradient: 'from-blue-500 to-blue-600' },
                            { icon: TrendingUp, title: 'O\'sish', desc: 'Biznesingizni rivojlantirish vositalari', gradient: 'from-purple-500 to-purple-600' }
                        ].map((item, i) => (
                            <div key={i} className="text-center p-8 rounded-2xl border border-white/10 bg-slate-800/30 backdrop-blur hover:bg-slate-800/50 transition-all hover:-translate-y-2 group">
                                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${item.gradient} flex items-center justify-center text-white mx-auto mb-4 group-hover:scale-110 transition-all shadow-lg`}>
                                    <item.icon size={32} />
                                </div>
                                <h4 className="text-xl font-semibold text-white mb-2 group-hover:text-emerald-400 transition-colors">{item.title}</h4>
                                <p className="text-slate-400">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Pricing */}
                <section id="pricing" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                    <div className="text-center mb-12">
                        <h3 className="text-4xl font-bold text-white mb-4">Har qanday ta'lim markazi uchun shaffof narxlar</h3>
                        <p className="text-xl text-slate-300 mb-8">Muassasangizning hajmiga mos rejani tanlang</p>

                        <div className="inline-flex gap-2 p-1.5 rounded-xl bg-slate-800/50 border border-white/10">
                            {[
                                { value: 1, label: '1 Oy' },
                                { value: 3, label: '3 Oy' },
                                { value: 6, label: '6 Oy' },
                                { value: 12, label: '12 Oy' }
                            ].map((period) => (
                                <button
                                    key={period.value}
                                    onClick={() => setSelectedPeriod(period.value as 1 | 3 | 6 | 12)}
                                    className={`px-6 py-2.5 rounded-lg font-medium transition-all ${selectedPeriod === period.value
                                        ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg'
                                        : 'text-slate-300 hover:text-white'
                                        }`}
                                >
                                    {period.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6 max-w-7xl mx-auto">
                        {pricingPlans.map((plan, idx) => (
                            <div
                                key={idx}
                                className={`p-6 rounded-2xl border ${plan.popular
                                    ? 'border-emerald-500 bg-gradient-to-b from-slate-800/90 to-slate-800/70 shadow-2xl scale-105'
                                    : 'border-white/10 bg-slate-800/50'
                                    } backdrop-blur relative hover:scale-110 transition-all cursor-pointer group`}
                            >
                                {plan.popular && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-xs font-semibold">
                                        Eng mashhur
                                    </div>
                                )}
                                <div className="text-center mb-4">
                                    <h4 className="text-lg font-bold text-white mb-1 group-hover:text-emerald-400 transition-colors">{plan.name}</h4>
                                    <p className="text-xs text-slate-400 mb-3">{plan.range}</p>
                                    <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-600 mb-1">
                                        {plan.custom ? "Biz bilan bog'laning" : plan.prices[selectedPeriod].toLocaleString('en-US').replace(/,/g, ' ')}
                                    </div>
                                    {!plan.custom && (
                                        <div className="text-slate-400 text-xs">so'm/{selectedPeriod === 1 ? 'oyiga' : `${selectedPeriod} oy`}</div>
                                    )}
                                </div>
                                <p className="text-sm text-slate-300 text-center mb-4 min-h-[3rem]">{plan.description}</p>
                                <a href="#demo" className={`block w-full py-2.5 rounded-xl text-center font-medium transition-all text-sm ${plan.popular
                                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:shadow-xl'
                                    : 'border border-white/20 text-white hover:bg-white/10'
                                    }`}>
                                    Rejani tanlash
                                </a>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Demo Form */}
                <section id="demo" className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                    <div className="rounded-2xl border border-white/10 bg-slate-800/50 backdrop-blur p-8 md:p-12 shadow-2xl">
                        <div className="text-center mb-8">
                            <h3 className="text-3xl font-bold text-white mb-3">Bepul demo versiyasini sinab ko'ring</h3>
                            <p className="text-slate-300">Ma'lumotlaringizni qoldiring, biz siz bilan bog'lanamiz</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    <Building2 size={16} className="inline mr-2" />
                                    Markaz nomi
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.centerName}
                                    onChange={(e) => setFormData({ ...formData, centerName: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-600/60 bg-slate-700/50 text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                                    placeholder="O'quv markazi nomi"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    <Users size={16} className="inline mr-2" />
                                    Ism va familiya
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.contactPerson}
                                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-600/60 bg-slate-700/50 text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                                    placeholder="Aloqa uchun mas'ul shaxs"
                                />
                            </div>

                            <div className="grid md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        <Phone size={16} className="inline mr-2" />
                                        Telefon
                                    </label>
                                    <input
                                        type="tel"
                                        required
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-600/60 bg-slate-700/50 text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                                        placeholder="+998 90 123 45 67"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        <Mail size={16} className="inline mr-2" />
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        required
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-600/60 bg-slate-700/50 text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                                        placeholder="example@mail.com"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold hover:shadow-2xl transition-all disabled:opacity-60 flex items-center justify-center gap-2 group"
                            >
                                {loading ? (
                                    <>
                                        <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                        </svg>
                                        Yuborilmoqda...
                                    </>
                                ) : (
                                    <>
                                        Demo so'rovini yuborish
                                        <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </section>

                {/* Contact */}
                <section id="contact" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                    <div className="text-center">
                        <h3 className="text-4xl font-bold text-white mb-4">Kontakt</h3>
                        <p className="text-xl text-slate-300 mb-8">Savollaringiz bormi? Biz bilan bog'laning!</p>
                        <div className="flex flex-wrap justify-center gap-6">
                            <a href="tel:+998901234567" className="flex items-center gap-3 px-6 py-4 rounded-xl bg-slate-800/50 border border-white/10 hover:bg-slate-800/70 hover:border-emerald-500/50 transition-all group">
                                <Phone size={20} className="text-emerald-400 group-hover:scale-110 transition-transform" />
                                <span className="text-slate-300 group-hover:text-white">+998 90 123 45 67</span>
                            </a>
                            <a href="mailto:info@onelms.uz" className="flex items-center gap-3 px-6 py-4 rounded-xl bg-slate-800/50 border border-white/10 hover:bg-slate-800/70 hover:border-emerald-500/50 transition-all group">
                                <Mail size={20} className="text-emerald-400 group-hover:scale-110 transition-transform" />
                                <span className="text-slate-300 group-hover:text-white">info@onelms.uz</span>
                            </a>
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <footer className="border-t border-white/10 bg-slate-900/50 backdrop-blur">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                                    <BookOpen size={16} className="text-white" />
                                </div>
                                <span className="text-slate-400">&copy; 2026 OneLMS. Barcha huquqlar himoyalangan.</span>
                            </div>
                            <div className="flex items-center gap-6">
                                <a href="#features" className="text-slate-400 hover:text-emerald-400 transition-colors text-sm">Imkoniyatlar</a>
                                <a href="#pricing" className="text-slate-400 hover:text-emerald-400 transition-colors text-sm">Narxlar</a>
                                <a href="#contact" className="text-slate-400 hover:text-emerald-400 transition-colors text-sm">Kontakt</a>
                            </div>
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    );
}
