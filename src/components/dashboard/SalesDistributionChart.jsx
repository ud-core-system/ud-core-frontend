'use client';
import { useState, useEffect } from 'react';
import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    ResponsiveContainer,
    Legend
} from 'recharts';
import { PieChart as PieChartIcon } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

const COLORS = [
    '#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e',
    '#f97316', '#eab308', '#22c55e', '#06b6d4'
];

const SalesDistributionChart = ({ data = [] }) => {
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
                        Distribusi Penjualan per UD
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Kontribusi pendapatan dari tiap unit
                    </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <PieChartIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </div>
            </div>

            <div className="h-[350px] w-full">
                {data.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                        Tidak ada data distribusi
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy={isMobile ? "40%" : "50%"}
                                innerRadius={isMobile ? 45 : 60}
                                outerRadius={isMobile ? 80 : 100}
                                fill="#8884d8"
                                paddingAngle={5}
                                dataKey="value"
                                nameKey="name"
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                    borderRadius: '12px',
                                    border: 'none',
                                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                                }}
                                formatter={(value) => formatCurrency(value)}
                            />
                            <Legend
                                layout={isMobile ? "horizontal" : "vertical"}
                                verticalAlign={isMobile ? "bottom" : "middle"}
                                align={isMobile ? "center" : "right"}
                                iconType="circle"
                                wrapperStyle={{
                                    fontSize: '11px',
                                    paddingTop: isMobile ? '20px' : '0'
                                }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
};

export default SalesDistributionChart;
