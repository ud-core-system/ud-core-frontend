'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { dashboardAPI, periodeAPI, udAPI, transaksiAPI, barangAPI } from '@/lib/api';
import { getErrorMessage } from '@/lib/utils';
import { useToast } from '@/contexts/ToastContext';
import DashboardMetrics from '@/components/dashboard/DashboardMetrics';
import FinancialCards from '@/components/dashboard/FinancialCards';
import RecentTransactions from '@/components/dashboard/RecentTransactions';
import QuickActions from '@/components/dashboard/QuickActions';
import DashboardFilters from '@/components/dashboard/DashboardFilters';
import TopItemsChart from '@/components/dashboard/TopItemsChart';
import PerformanceChart from '@/components/dashboard/PerformanceChart';
import SalesDistributionChart from '@/components/dashboard/SalesDistributionChart';

export default function DashboardPage() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);
    const [recentTransactions, setRecentTransactions] = useState([]);
    const [salesByUD, setSalesByUD] = useState([]);

    // Filter State
    const [periodeList, setPeriodeList] = useState([]);
    const [udList, setUdList] = useState([]);
    const [filterPeriode, setFilterPeriode] = useState('');
    const [filterUD, setFilterUD] = useState('');

    // Chart Data State
    const [topItemsData, setTopItemsData] = useState([]);
    const [performanceData, setPerformanceData] = useState([]);
    const [distributionData, setDistributionData] = useState([]);

    const fetchOptions = useCallback(async () => {
        try {
            const [periodeRes, udRes] = await Promise.all([
                periodeAPI.getAll({ limit: 100 }),
                udAPI.getAll({ limit: 100 }),
            ]);
            if (periodeRes.data.success) setPeriodeList(periodeRes.data.data);
            if (udRes.data.success) setUdList(udRes.data.data);
        } catch (error) {
            console.error('Failed to fetch filter options:', error);
        }
    }, []);

    const processChartData = (transactions, allBarang, allUD) => {
        const itemMap = {};
        const dailyMap = {};
        const udMap = {};
        const barangLookup = new Map(allBarang.map(b => [b._id, b]));
        const udLookup = new Map(allUD.map(u => [u._id, u]));

        transactions.forEach(trx => {
            const date = trx.tanggal.split('T')[0];
            if (!dailyMap[date]) {
                dailyMap[date] = { date, penjualan: 0, keuntungan: 0 };
            }

            trx.items?.forEach(item => {
                const bId = item.barang_id?._id || item.barang_id;
                const uId = item.ud_id?._id || item.ud_id;

                // Skip if filtered by UD and doesn't match
                if (filterUD && uId !== filterUD) return;

                const barang = barangLookup.get(bId);
                const itemName = item.nama_barang || barang?.nama_barang || 'Unknown Item';
                const ud = udLookup.get(uId);
                const udName = ud?.nama_ud || 'Unknown UD';

                // Top Items
                if (!itemMap[itemName]) itemMap[itemName] = 0;
                itemMap[itemName] += (item.subtotal_jual || 0);

                // Daily Performance
                dailyMap[date].penjualan += (item.subtotal_jual || 0);
                dailyMap[date].keuntungan += (item.keuntungan || 0);

                // UD Distribution
                if (!udMap[udName]) udMap[udName] = 0;
                udMap[udName] += (item.subtotal_jual || 0);
            });
        });

        // Format Top Items
        const formattedTopItems = Object.entries(itemMap)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 10);

        // Format Performance (Sorted by date)
        const formattedPerformance = Object.values(dailyMap)
            .sort((a, b) => new Date(a.date) - new Date(b.date));

        // Format Distribution
        const formattedDistribution = Object.entries(udMap)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);

        setTopItemsData(formattedTopItems);
        setPerformanceData(formattedPerformance);
        setDistributionData(formattedDistribution);
    };

    const fetchDashboardData = useCallback(async () => {
        try {
            setLoading(true);
            const params = {
                periode_id: filterPeriode || undefined,
                ud_id: filterUD || undefined
            };

            const [summaryRes, recentRes, salesRes, trxRes, barangRes] = await Promise.all([
                dashboardAPI.getSummary(params),
                dashboardAPI.getRecent({ limit: 5 }),
                dashboardAPI.getSalesByUD(params),
                transaksiAPI.getAll({ ...params, status: 'completed', limit: 1000 }),
                barangAPI.getAll({ limit: 1000 })
            ]);

            if (summaryRes.data.success) {
                setStats(summaryRes.data.data);
            }
            if (recentRes.data.success) {
                setRecentTransactions(recentRes.data.data);
            }
            if (salesRes.data.success) {
                setSalesByUD(salesRes.data.data);
            }

            if (trxRes.data.success && barangRes.data.success) {
                // To get items, we need to fetch details for each transaction if the broad list doesn't have them
                // For efficiency in dashboard, we'll try to use what's available or fetch if needed
                const detailedTransactions = await Promise.all(
                    trxRes.data.data.slice(0, 50).map(async (trx) => {
                        const detailRes = await transaksiAPI.getById(trx._id);
                        return detailRes.data.success ? detailRes.data.data : trx;
                    })
                );
                processChartData(detailedTransactions, barangRes.data.data, udList);
            }
        } catch (error) {
            toast.error(getErrorMessage(error));
        } finally {
            setLoading(false);
        }
    }, [filterPeriode, filterUD, udList, toast]);

    useEffect(() => {
        fetchOptions();
    }, [fetchOptions]);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    if (loading && !stats) {
        return (
            <div className="flex items-center justify-center h-[50vh]">
                <div className="text-center">
                    <Loader2 className="w-10 h-10 text-brand-500 animate-spin mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400">Memuat data dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-12 gap-4 md:gap-6 pb-20 lg:pb-8 px-1">
            {/* Page Header */}
            <div className="col-span-12 px-2">
                <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white uppercase tracking-tight">Dashboard Analitik</h1>
                <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Pantau performa bisnis Anda secara real-time.
                </p>
            </div>

            {/* Filters */}
            <div className="col-span-12">
                <DashboardFilters
                    periodeList={periodeList}
                    udList={udList}
                    filterPeriode={filterPeriode}
                    setFilterPeriode={setFilterPeriode}
                    filterUD={filterUD}
                    setFilterUD={setFilterUD}
                    onApply={fetchDashboardData}
                />
            </div>

            {/* Metrics Cards */}
            <div className="col-span-12">
                <DashboardMetrics stats={stats} />
            </div>

            {/* Performance Chart */}
            <div className="col-span-12 lg:col-span-8">
                <PerformanceChart data={performanceData} />
            </div>

            {/* Distribution Chart */}
            <div className="col-span-12 lg:col-span-4">
                <SalesDistributionChart data={distributionData} />
            </div>

            {/* Financial Cards */}
            <div className="col-span-12">
                <FinancialCards stats={stats} />
            </div>

            {/* Top Items & Recent Transactions */}
            <div className="col-span-12 lg:col-span-7">
                <TopItemsChart data={topItemsData} />
            </div>

            <div className="col-span-12 lg:col-span-5">
                <RecentTransactions transactions={recentTransactions} />
            </div>

            {/* Quick Actions */}
            <div className="col-span-12">
                <QuickActions />
            </div>
        </div>
    );
}
