'use client';

import { Building2, Package, ChefHat, Calendar, TrendingUp, TrendingDown } from 'lucide-react';
import Badge from '@/components/ui/badge';

const DashboardMetrics = ({ stats }) => {
    const metrics = [
        {
            title: 'Total UD',
            value: stats?.totalUD || 0,
            icon: Building2,
            iconBg: 'bg-brand-100 dark:bg-brand-500/10',
            iconColor: 'text-brand-600 dark:text-brand-400',
        },
        {
            title: 'Total Barang',
            value: stats?.totalBarang || 0,
            icon: Package,
            iconBg: 'bg-success-100 dark:bg-success-500/10',
            iconColor: 'text-success-600 dark:text-success-400',
        },
        {
            title: 'Total Dapur',
            value: stats?.totalDapur || 0,
            icon: ChefHat,
            iconBg: 'bg-warning-100 dark:bg-warning-500/10',
            iconColor: 'text-warning-600 dark:text-warning-400',
        },
        {
            title: 'Total Periode',
            value: stats?.totalPeriode || 0,
            icon: Calendar,
            iconBg: 'bg-orange-100 dark:bg-orange-500/10',
            iconColor: 'text-orange-600 dark:text-orange-400',
        },
    ];

    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6">
            {metrics.map((metric, index) => {
                const Icon = metric.icon;
                return (
                    <div
                        key={index}
                        className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6"
                    >
                        <div className={`flex items-center justify-center w-12 h-12 rounded-xl ${metric.iconBg}`}>
                            <Icon className={`w-6 h-6 ${metric.iconColor}`} />
                        </div>

                        <div className="flex items-end justify-between mt-5">
                            <div>
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                    {metric.title}
                                </span>
                                <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
                                    {metric.value.toLocaleString()}
                                </h4>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default DashboardMetrics;
