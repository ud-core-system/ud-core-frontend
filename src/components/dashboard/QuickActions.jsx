'use client';

import Link from 'next/link';
import { ShoppingCart, BarChart3, Package, Building2 } from 'lucide-react';

const QuickActions = ({ variant = 'grid' }) => {
    const actions = [
        {
            title: 'Input',
            fullTitle: 'Input Transaksi',
            href: '/admin/transaksi/new',
            icon: ShoppingCart,
            bgColor: 'bg-brand-50 dark:bg-brand-500/10',
            hoverBgColor: 'hover:bg-brand-100 dark:hover:bg-brand-500/20',
            iconColor: 'text-brand-600 dark:text-brand-400',
            textColor: 'text-brand-900 dark:text-brand-300',
        },
        {
            title: 'Laporan',
            fullTitle: 'Buat Laporan',
            href: '/admin/laporan',
            icon: BarChart3,
            bgColor: 'bg-success-50 dark:bg-success-500/10',
            hoverBgColor: 'hover:bg-success-100 dark:hover:bg-success-500/20',
            iconColor: 'text-success-600 dark:text-success-400',
            textColor: 'text-success-900 dark:text-success-300',
        },
        {
            title: 'Barang',
            fullTitle: 'Kelola Barang',
            href: '/admin/barang',
            icon: Package,
            bgColor: 'bg-purple-50 dark:bg-purple-500/10',
            hoverBgColor: 'hover:bg-purple-100 dark:hover:bg-purple-500/20',
            iconColor: 'text-purple-600 dark:text-purple-400',
            textColor: 'text-purple-900 dark:text-purple-300',
        },
        {
            title: 'UD',
            fullTitle: 'Kelola UD',
            href: '/admin/ud',
            icon: Building2,
            bgColor: 'bg-orange-50 dark:bg-orange-500/10',
            hoverBgColor: 'hover:bg-orange-100 dark:hover:bg-orange-500/20',
            iconColor: 'text-orange-600 dark:text-orange-400',
            textColor: 'text-orange-900 dark:text-orange-300',
        },
    ];

    if (variant === 'bottom-bar') {
        return (
            <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 px-2 py-2 pb-safe-area-inset-bottom mobile-bottom-bar">
                <div className="flex justify-around items-center max-w-lg mx-auto">
                    {actions.map((action, index) => {
                        const Icon = action.icon;
                        return (
                            <Link
                                key={index}
                                href={action.href}
                                className="flex flex-col items-center justify-center min-w-[64px] py-1 px-2 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                            >
                                <Icon className={`w-6 h-6 mb-1 ${action.iconColor}`} />
                                <span className="text-[10px] font-medium text-gray-600 dark:text-gray-400">
                                    {action.title}
                                </span>
                            </Link>
                        );
                    })}
                </div>
            </div>
        );
    }

    return (
        <div className="hidden lg:block rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">
                Aksi Cepat
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {actions.map((action, index) => {
                    const Icon = action.icon;
                    return (
                        <Link
                            key={index}
                            href={action.href}
                            className={`flex flex-col items-center p-4 rounded-xl transition-all duration-200 group ${action.bgColor} ${action.hoverBgColor}`}
                        >
                            <Icon className={`w-8 h-8 mb-2 ${action.iconColor} group-hover:scale-110 transition-transform`} />
                            <span className={`text-sm font-medium text-center ${action.textColor}`}>
                                {action.fullTitle}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
};

export default QuickActions;
