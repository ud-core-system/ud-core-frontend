'use client';

import { Calendar, Building2, Filter } from 'lucide-react';

const DashboardFilters = ({
    periodeList = [],
    udList = [],
    filterPeriode,
    setFilterPeriode,
    filterUD,
    setFilterUD,
    onApply
}) => {
    return (
        <div className="bg-white dark:bg-white/[0.03] rounded-2xl border border-gray-200 dark:border-gray-800 p-4 md:p-6 mb-4 md:mb-6 mx-2 md:mx-0">
            <div className="flex flex-col md:flex-row md:items-end gap-3 md:gap-4">
                <div className="flex-1">
                    <label className="block text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5" />
                        Periode
                    </label>
                    <select
                        value={filterPeriode}
                        onChange={(e) => setFilterPeriode(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all dark:text-white text-sm"
                    >
                        <option value="">Semua Periode</option>
                        {periodeList.map((p) => (
                            <option key={p._id} value={p._id}>
                                {p.nama_periode}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex-1">
                    <label className="block text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-2">
                        <Building2 className="w-3.5 h-3.5" />
                        Unit Dagang (UD)
                    </label>
                    <select
                        value={filterUD}
                        onChange={(e) => setFilterUD(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all dark:text-white text-sm"
                    >
                        <option value="">Semua UD</option>
                        {udList.map((ud) => (
                            <option key={ud._id} value={ud._id}>
                                {ud.nama_ud} ({ud.kode_ud})
                            </option>
                        ))}
                    </select>
                </div>

                <button
                    onClick={onApply}
                    className="flex items-center justify-center gap-2 px-6 py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-xl transition-all shadow-lg shadow-brand-500/25 active:scale-95 text-sm md:text-base mt-2 md:mt-0"
                >
                    <Filter className="w-4 h-4 md:w-5 h-5" />
                    Terapkan Filter
                </button>
            </div>
        </div>
    );
};

export default DashboardFilters;
