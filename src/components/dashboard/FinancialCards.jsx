'use client';

import { DollarSign, ShoppingCart, TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

const FinancialCards = ({ stats }) => {
    const cards = [
        {
            title: 'Total Penjualan',
            value: stats?.totalPenjualan || 0,
            icon: DollarSign,
            gradient: 'from-brand-500 to-brand-600',
        },
        {
            title: 'Total Modal',
            value: stats?.totalModal || 0,
            icon: ShoppingCart,
            gradient: 'from-purple-500 to-purple-600',
        },
        {
            title: 'Total Keuntungan',
            value: stats?.totalKeuntungan || 0,
            icon: TrendingUp,
            gradient: 'from-success-500 to-success-600',
        },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {cards.map((card, index) => {
                const Icon = card.icon;
                return (
                    <div
                        key={index}
                        className={`bg-gradient-to-br ${card.gradient} rounded-2xl p-6 text-white`}
                    >
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                                <Icon className="w-5 h-5" />
                            </div>
                            <span className="font-medium text-white/90">{card.title}</span>
                        </div>
                        <p className="text-2xl md:text-3xl font-bold">
                            {formatCurrency(card.value)}
                        </p>
                    </div>
                );
            })}
        </div>
    );
};

export default FinancialCards;
