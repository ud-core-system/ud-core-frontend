'use client';

import { BarChart3 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

const SalesByUD = ({ salesData = [] }) => {
    const maxSales = salesData.length > 0 ? salesData[0]?.totalJual || 1 : 1;

    return (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                    Penjualan per UD
                </h3>
                <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </div>
            </div>

            <div className="space-y-4">
                {salesData.length === 0 ? (
                    <div className="py-8 text-center text-gray-500 dark:text-gray-400">
                        Belum ada data penjualan
                    </div>
                ) : (
                    salesData.slice(0, 5).map((ud) => (
                        <div key={ud._id} className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                            <div className="flex items-center justify-between mb-3">
                                <div>
                                    <span className="font-medium text-gray-900 dark:text-white">
                                        {ud.nama_ud}
                                    </span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                                        ({ud.kode_ud})
                                    </span>
                                </div>
                                <span className="text-sm font-semibold text-success-600 dark:text-success-400">
                                    {formatCurrency(ud.totalKeuntungan)}
                                </span>
                            </div>

                            {/* Progress Bar */}
                            <div className="relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-2">
                                <div
                                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-brand-500 to-brand-400 rounded-full transition-all duration-500"
                                    style={{
                                        width: `${Math.min((ud.totalJual / maxSales) * 100, 100)}%`,
                                    }}
                                />
                            </div>

                            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                                <span>Penjualan: {formatCurrency(ud.totalJual)}</span>
                                <span>Qty: {ud.totalQty?.toLocaleString()}</span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default SalesByUD;
