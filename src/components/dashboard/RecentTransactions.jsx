'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '@/components/ui/table';
import Badge from '@/components/ui/badge';
import { formatCurrency, formatDateTime, getStatusClass } from '@/lib/utils';

const RecentTransactions = ({ transactions = [] }) => {
    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'completed':
            case 'selesai':
                return 'success';
            case 'pending':
            case 'menunggu':
                return 'warning';
            case 'cancelled':
            case 'dibatalkan':
                return 'error';
            default:
                return 'default';
        }
    };

    return (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-4 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 mx-2 md:mx-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
                <div>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                        Transaksi Terbaru
                    </h3>
                </div>

                <Link
                    href="/admin/transaksi"
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
                >
                    Lihat Semua
                    <ArrowRight className="w-4 h-4" />
                </Link>
            </div>

            <div className="max-w-full">
                {transactions.length === 0 ? (
                    <div className="py-8 text-center text-gray-500 dark:text-gray-400">
                        Belum ada transaksi
                    </div>
                ) : (
                    <>
                        {/* Mobile View: Card List */}
                        <div className="md:hidden flex flex-col gap-3">
                            {transactions.map((trx) => (
                                <div key={trx._id} className="p-3 border border-gray-100 dark:border-gray-800 rounded-xl bg-gray-50/50 dark:bg-gray-800/30">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <p className="font-bold text-gray-900 dark:text-white text-sm">
                                                {trx.kode_transaksi}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                {formatDateTime(trx.tanggal)}
                                            </p>
                                        </div>
                                        <Badge color={getStatusColor(trx.status)} size="sm">
                                            {trx.status}
                                        </Badge>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-600 dark:text-gray-400">
                                            {trx.dapur_id?.nama_dapur || '-'}
                                        </span>
                                        <span className="font-semibold text-brand-600 dark:text-brand-400">
                                            {formatCurrency(trx.total_harga_jual)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Desktop View: Table */}
                        <div className="hidden md:block overflow-x-auto">
                            <Table>
                                <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
                                    <TableRow>
                                        <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                                            Kode
                                        </TableCell>
                                        <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                                            Dapur
                                        </TableCell>
                                        <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                                            Total
                                        </TableCell>
                                        <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                                            Status
                                        </TableCell>
                                    </TableRow>
                                </TableHeader>

                                <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {transactions.map((trx) => (
                                        <TableRow key={trx._id}>
                                            <TableCell className="py-3">
                                                <div>
                                                    <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                                                        {trx.kode_transaksi}
                                                    </p>
                                                    <span className="text-gray-500 text-theme-xs dark:text-gray-400">
                                                        {formatDateTime(trx.tanggal)}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                                                {trx.dapur_id?.nama_dapur || '-'}
                                            </TableCell>
                                            <TableCell className="py-3 font-medium text-gray-800 text-theme-sm dark:text-white/90">
                                                {formatCurrency(trx.total_harga_jual)}
                                            </TableCell>
                                            <TableCell className="py-3">
                                                <Badge color={getStatusColor(trx.status)} size="sm">
                                                    {trx.status}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default RecentTransactions;
