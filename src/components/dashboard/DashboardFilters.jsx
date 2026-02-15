'use client';

import { Calendar, Building2, Filter } from 'lucide-react';
import SearchableSelect from '@/components/ui/SearchableSelect';

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
                    <SearchableSelect
                        options={[{ value: '', label: 'Semua Periode' }, ...periodeList.map(p => ({
                            value: p._id,
                            label: p.nama_periode
                        }))]}
                        value={filterPeriode}
                        onChange={(e) => setFilterPeriode(e.target.value)}
                        placeholder="Pilih Periode"
                        searchPlaceholder="Cari periode..."
                    />
                </div>

                <div className="flex-1">
                    <label className="block text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-2">
                        <Building2 className="w-3.5 h-3.5" />
                        Unit Dagang (UD)
                    </label>
                    <SearchableSelect
                        options={[{ value: '', label: 'Semua UD' }, ...udList.map(ud => ({
                            value: ud._id,
                            label: `${ud.nama_ud} (${ud.kode_ud})`
                        }))]}
                        value={filterUD}
                        onChange={(e) => setFilterUD(e.target.value)}
                        placeholder="Pilih UD"
                        searchPlaceholder="Cari Unit Dagang..."
                    />
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
