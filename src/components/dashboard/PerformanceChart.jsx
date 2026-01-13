'use client';

import { useState, useEffect } from 'react';

import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from 'recharts';
import { TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

const PerformanceChart = ({ data = [], viewType = 'daily' }) => {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div className="bg-white dark:bg-white/[0.03] rounded-2xl border border-gray-200 dark:border-gray-800 p-4 md:p-6 h-full min-h-[400px] mx-2 md:mx-0">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                        Performa Keuangan
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Tren Penjualan vs Keuntungan {viewType === 'daily' ? 'Harian' : 'Bulanan'}
                    </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </div>
            </div>

            <div className="h-[350px] w-full">
                {data.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                        Tidak ada data performa
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                            data={data}
                            margin={{ top: 10, right: 10, left: isMobile ? -30 : 0, bottom: 0 }}
                        >
                            <defs>
                                <linearGradient id="colorJual" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorUntung" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.1} />
                                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" opacity={0.5} />
                            <XAxis
                                dataKey="date"
                                tick={{ fontSize: 10, fill: '#6b7280' }}
                                axisLine={false}
                                tickLine={false}
                                minTickGap={30}
                            />
                            <YAxis
                                tick={{ fontSize: 10, fill: '#6b7280' }}
                                axisLine={false}
                                tickLine={false}
                                tickFormatter={(value) => `Rp${value / 1000}k`}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                    borderRadius: '12px',
                                    border: 'none',
                                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                                }}
                                formatter={(value) => formatCurrency(value)}
                            />
                            <Legend verticalAlign="top" height={36} />
                            <Area
                                type="monotone"
                                dataKey="penjualan"
                                name="Total Penjualan"
                                stroke="#3b82f6"
                                fillOpacity={1}
                                fill="url(#colorJual)"
                                strokeWidth={2}
                            />
                            <Area
                                type="monotone"
                                dataKey="keuntungan"
                                name="Total Keuntungan"
                                stroke="#22c55e"
                                fillOpacity={1}
                                fill="url(#colorUntung)"
                                strokeWidth={2}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
};

export default PerformanceChart;
