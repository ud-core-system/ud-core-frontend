'use client';

import { useAuth } from '@/contexts/AuthContext';
import { User, Mail, Shield, Calendar, Loader2, Building2 } from 'lucide-react';

export default function ProfilePage() {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="p-4 sm:p-6 max-w-4xl mx-auto animate-fade-in">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Profil Saya</h1>

            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
                {/* Header/Cover color */}
                <div className="h-32 bg-gradient-to-r from-brand-500 to-brand-700"></div>

                <div className="px-6 pb-8">
                    <div className="relative flex flex-col sm:flex-row sm:items-end gap-5 -mt-12 mb-8">
                        {/* Avatar */}
                        <div className="w-24 h-24 rounded-2xl bg-white dark:bg-gray-900 p-1 shadow-theme-lg">
                            <div className="w-full h-full rounded-xl bg-brand-500 flex items-center justify-center text-white text-3xl font-bold">
                                {user?.username?.charAt(0).toUpperCase()}
                            </div>
                        </div>

                        <div className="flex-1">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                {user?.username}
                            </h2>
                            <p className="text-gray-500 dark:text-gray-400 capitalize">
                                {user?.role?.replace('_', ' ')}
                            </p>
                        </div>
                    </div>

                    <div className="grid gap-6 sm:grid-cols-2">
                        {/* Account Info */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Detail Akun</h3>

                            <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800/50 transition-all hover:border-brand-100 dark:hover:border-brand-900/50">
                                <div className="w-10 h-10 rounded-lg bg-white dark:bg-gray-800 flex items-center justify-center shadow-theme-xs text-brand-500 border border-gray-100 dark:border-gray-700">
                                    <User className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Username</p>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user?.username || '-'}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800/50 transition-all hover:border-brand-100 dark:hover:border-brand-900/50">
                                <div className="w-10 h-10 rounded-lg bg-white dark:bg-gray-800 flex items-center justify-center shadow-theme-xs text-brand-500 border border-gray-100 dark:border-gray-700">
                                    <Mail className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Email</p>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user?.email || '-'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Permissions/Status */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Hak Akses & Organisasi</h3>

                            <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800/50 transition-all hover:border-brand-100 dark:hover:border-brand-900/50">
                                <div className="w-10 h-10 rounded-lg bg-white dark:bg-gray-800 flex items-center justify-center shadow-theme-xs text-brand-500 border border-gray-100 dark:border-gray-700">
                                    <Shield className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Role</p>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">{user?.role?.replace('_', ' ')}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800/50 transition-all hover:border-brand-100 dark:hover:border-brand-900/50">
                                <div className="w-10 h-10 rounded-lg bg-white dark:bg-gray-800 flex items-center justify-center shadow-theme-xs text-brand-500 border border-gray-100 dark:border-gray-700">
                                    <Building2 className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Unit Dagang (UD)</p>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                        {user?.ud_id?.nama_ud || (user?.role === 'superuser' || user?.role === 'admin' ? 'Semua Unit' : '-')}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Account Status Card - Full Width */}
                        <div className="sm:col-span-2">
                            <div className="flex items-center justify-between p-4 rounded-xl bg-success-50 dark:bg-success-500/10 border border-success-100 dark:border-success-500/20">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-white dark:bg-gray-800 flex items-center justify-center shadow-theme-xs text-success-500 border border-gray-100 dark:border-gray-700">
                                        <Calendar className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-success-700 dark:text-success-400 font-semibold uppercase tracking-wider">Status Akun</p>
                                        <p className="text-sm font-bold text-success-900 dark:text-success-300">Aktif & Terverifikasi</p>
                                    </div>
                                </div>
                                <div className="hidden sm:block">
                                    <span className="px-3 py-1 rounded-full bg-success-500 text-white text-xs font-bold uppercase tracking-widest shadow-sm shadow-success-500/30">
                                        Online
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Additional Info Section */}
            <div className="mt-8 grid gap-6 sm:grid-cols-2">
                <div className="bg-brand-50/50 dark:bg-brand-900/10 rounded-2xl border border-brand-100 dark:border-brand-800 p-6">
                    <h3 className="text-sm font-semibold text-brand-800 dark:text-brand-300 uppercase tracking-wider mb-2">Informasi Keamanan</h3>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                        Akun Anda dilindungi dengan enkripsi tingkat lanjut. Untuk mengubah password atau detail lainnya, silakan hubungi administrator sistem.
                    </p>
                </div>
                <div className="bg-orange-50/50 dark:bg-orange-900/10 rounded-2xl border border-orange-100 dark:border-orange-800 p-6">
                    <h3 className="text-sm font-semibold text-orange-800 dark:text-orange-300 uppercase tracking-wider mb-2">Catatan Sistem</h3>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                        Terakhir kali akun Anda diperbarui pada hari ini. Pastikan email Anda tetap aktif untuk menerima notifikasi penting.
                    </p>
                </div>
            </div>
        </div>
    );
}
