'use client';

import { useState, useEffect } from 'react';
import {
    FileBarChart2,
    Download,
    FileText,
    FileSpreadsheet,
    Loader2,
    Filter,
    Calendar,
    ChefHat,
} from 'lucide-react';
import { transaksiAPI, periodeAPI, dapurAPI, udAPI, barangAPI } from '@/lib/api';
import DatePicker from '@/components/ui/DatePicker';
import { useToast } from '@/contexts/ToastContext';
import { getErrorMessage, formatCurrency, formatDateShort, toDateInputValue, toLocalDate } from '@/lib/utils';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { exportLaporanExcel } from '@/utils/dapurexcelpdf/exportLaporan';

export default function LaporanDapurPage() {
    const { toast } = useToast();

    // Options
    const [periodeList, setPeriodeList] = useState([]);
    const [dapurList, setDapurList] = useState([]);
    const [udList, setUdList] = useState([]);
    const [barangList, setBarangList] = useState([]);

    // Filters
    const [filterPeriode, setFilterPeriode] = useState('');
    const [filterDapur, setFilterDapur] = useState('');
    const [filterTanggal, setFilterTanggal] = useState(null);

    // Data
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);

    useEffect(() => {
        fetchOptions();
    }, []);

    useEffect(() => {
        setFilterTanggal(null);
    }, [filterPeriode]);

    const fetchOptions = async () => {
        try {
            const [periodeRes, dapurRes, udRes, barangRes] = await Promise.all([
                periodeAPI.getAll({ limit: 50 }),
                dapurAPI.getAll({ limit: 100 }),
                udAPI.getAll({ limit: 100 }),
                barangAPI.getAll({ limit: 1000 }),
            ]);

            if (periodeRes.data.success) setPeriodeList(periodeRes.data.data);
            if (dapurRes.data.success) setDapurList(dapurRes.data.data);
            if (udRes.data.success) setUdList(udRes.data.data);
            if (barangRes.data.success) setBarangList(barangRes.data.data);
        } catch (error) {
            console.error('Failed to fetch options:', error);
        }
    };


    const fetchTransactions = async () => {
        if (!filterDapur) {
            toast.warning('Silakan pilih dapur terlebih dahulu');
            return;
        }

        try {
            setLoading(true);
            const params = {
                limit: 1000,
                status: 'completed',
                periode_id: filterPeriode || undefined,
                dapur_id: filterDapur || undefined,
            };
            const response = await transaksiAPI.getAll(params);
            if (response.data.success) {
                const selectedPeriode = filterPeriode ? periodeList.find(p => p._id === filterPeriode) : null;

                // Fetch full details for each transaction
                const detailedTransactions = (await Promise.all(
                    response.data.data.map(async (trx) => {
                        const detailRes = await transaksiAPI.getById(trx._id);
                        return detailRes.data.success ? detailRes.data.data : trx;
                    })
                )).filter(trx => {
                    const isCompleted = trx.status === 'completed';
                    if (!selectedPeriode) return isCompleted;

                    const trxDate = toLocalDate(trx.tanggal);
                    const startDate = toLocalDate(selectedPeriode.tanggal_mulai);
                    const endDate = toLocalDate(selectedPeriode.tanggal_selesai);

                    const isInRange = trxDate >= startDate && trxDate <= endDate;
                    const matchesDate = filterTanggal ? trxDate === toLocalDate(filterTanggal) : true;

                    return isCompleted && isInRange && matchesDate;
                });
                setTransactions(detailedTransactions);
                toast.success(`Ditemukan ${detailedTransactions.length} transaksi`);
            }
        } catch (error) {
            toast.error(getErrorMessage(error));
        } finally {
            setLoading(false);
        }
    };

    const getItemsByUD = () => {
        const barangMap = new Map(barangList.map(b => [b._id, b]));
        const udMap = {};

        const udLookupMap = new Map(udList.map(u => [u._id, u]));

        transactions.forEach((trx) => {
            trx.items?.forEach((item) => {
                const bId = item.barang_id?._id || item.barang_id;
                const uId = item.ud_id?._id || item.ud_id;

                const barang = barangMap.get(bId);
                const ud = udLookupMap.get(uId);

                const udIdKey = uId || 'unknown';
                const udName = ud?.nama_ud || item.ud_id?.nama_ud || 'Unknown UD';
                const udKode = ud?.kode_ud || item.ud_id?.kode_ud || '';

                if (!udMap[udIdKey]) {
                    udMap[udIdKey] = {
                        _id: udIdKey,
                        nama_ud: udName,
                        kode_ud: udKode,
                        items: [],
                        totalJual: 0,
                        totalModal: 0,
                        totalKeuntungan: 0,
                    };
                }

                const actualJual = item.harga_jual ?? barang?.harga_jual;
                const actualModal = item.harga_modal ?? barang?.harga_modal;

                udMap[udIdKey].items.push({
                    ...item,
                    barang_id: barang || item.barang_id,
                    ud_id: ud || item.ud_id,
                    harga_jual: actualJual,
                    harga_modal: actualModal,
                    transaksi: trx.kode_transaksi,
                    dapur: trx.dapur_id?.nama_dapur,
                    tanggal: trx.tanggal,
                });
                udMap[udIdKey].totalJual += (item.subtotal_jual || 0);
                udMap[udIdKey].totalModal += (item.subtotal_modal || 0);
                udMap[udIdKey].totalKeuntungan += (item.keuntungan || 0);
            });
        });
        return Object.values(udMap);
    };

    const formatIndoDate = (date) => {
        return new Intl.DateTimeFormat('id-ID', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        }).format(new Date(date));
    };

    const generateExcel = async () => {
        if (transactions.length === 0) {
            toast.warning('Tidak ada data untuk dibuat laporan');
            return;
        }

        const itemsByUD = getItemsByUD();
        const period = filterPeriode ? periodeList.find(p => p._id === filterPeriode) : null;
        const periodName = period ? period.nama_periode : 'Semua Periode';
        const periodRange = period ? `(${formatDateShort(period.tanggal_mulai)} - ${formatDateShort(period.tanggal_selesai)})` : '';
        const selectedDapur = dapurList.find(d => d._id === filterDapur);
        const dapurLabel = selectedDapur ? `DAPUR: ${selectedDapur.nama_dapur.toUpperCase()}` : '';
        const tanggalLabel = filterTanggal ? `TANGGAL: ${formatDateShort(filterTanggal)}` : '';
        const periodeLabel = `${periodName.toUpperCase()} ${periodRange} ${dapurLabel} ${tanggalLabel}`;

        const totalJualAll = transactions.reduce((sum, trx) => sum + (trx.items?.reduce((s, i) => s + i.subtotal_jual, 0) || 0), 0);
        const totalModalAll = transactions.reduce((sum, trx) => sum + (trx.items?.reduce((s, i) => s + i.subtotal_modal, 0) || 0), 0);
        const totalUntungAll = transactions.reduce((sum, trx) => sum + (trx.items?.reduce((s, i) => s + i.keuntungan, 0) || 0), 0);

        setGenerating(true);
        try {
            const timestamp = new Date().toISOString().split('T')[0];
            const datePart = filterTanggal ? `_${toLocalDate(filterTanggal)}` : '';
            const fileName = `Laporan_Dapur_${selectedDapur?.nama_dapur.replace(/\s+/g, '_')}_${periodName.replace(/\s+/g, '_')}${datePart}_${timestamp}.xlsx`;

            await exportLaporanExcel({
                transactions,
                itemsByUD,
                dapurName: selectedDapur?.nama_dapur,
                periodName: periodName,
                periodRange: periodRange,
                selectedDate: filterTanggal ? formatDateShort(filterTanggal) : null,
                totalJualAll,
                totalModalAll,
                totalUntungAll,
                barangList,
                udList,
                fileName
            });

            toast.success('Laporan Excel berhasil dibuat');
        } catch (error) {
            toast.error('Gagal membuat laporan Excel');
            console.error(error);
        } finally {
            setGenerating(false);
        }
    };

    const generateRekapPDF = () => {
        if (transactions.length === 0) {
            toast.warning('Tidak ada data untuk dibuat laporan');
            return;
        }

        setGenerating(true);
        try {
            const doc = new jsPDF('l', 'mm', 'a4');
            const pageWidth = doc.internal.pageSize.getWidth();

            const period = filterPeriode ? periodeList.find(p => p._id === filterPeriode) : null;
            const periodName = period ? period.nama_periode : 'Semua Periode';
            const periodRange = period ? `(${formatDateShort(period.tanggal_mulai)} - ${formatDateShort(period.tanggal_selesai)})` : '';
            const selectedDapur = dapurList.find(d => d._id === filterDapur);
            const dateLabel = filterTanggal ? `TANGGAL: ${formatDateShort(filterTanggal).toUpperCase()}` : '';
            const periodeLabel = `${periodName.toUpperCase()} ${periodRange}`;
            const dapurLabel = `DAPUR: ${selectedDapur?.nama_dapur.toUpperCase()} ${dateLabel}`;
            const printTimestamp = `Dicetak pada: ${new Date().toLocaleString('id-ID')}`;

            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            doc.text(`LAPORAN REKAP DAPUR`, pageWidth / 2, 15, { align: 'center' });
            doc.setFontSize(12);
            doc.text(dapurLabel, pageWidth / 2, 22, { align: 'center' });
            doc.text(periodeLabel, pageWidth / 2, 28, { align: 'center' });

            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            doc.text(printTimestamp, pageWidth - 14, 10, { align: 'right' });

            const totalJualAll = transactions.reduce((sum, trx) => sum + (trx.items?.reduce((s, i) => s + i.subtotal_jual, 0) || 0), 0);
            const totalModalAll = transactions.reduce((sum, trx) => sum + (trx.items?.reduce((s, i) => s + i.subtotal_modal, 0) || 0), 0);
            const totalUntungAll = transactions.reduce((sum, trx) => sum + (trx.items?.reduce((s, i) => s + i.keuntungan, 0) || 0), 0);

            autoTable(doc, {
                startY: 35,
                head: [['Ringkasan Periode', 'Total Penjualan', 'Total Modal', 'Total Keuntungan']],
                body: [[
                    '',
                    formatCurrency(totalJualAll),
                    formatCurrency(totalModalAll),
                    formatCurrency(totalUntungAll)
                ]],
                theme: 'grid',
                styles: { fontSize: 10, fontStyle: 'bold' },
                headStyles: { fillColor: [71, 85, 105] },
            });

            const barangMap = new Map(barangList.map(b => [b._id, b]));
            const udLookupMap = new Map(udList.map(u => [u._id, u]));

            const groupedData = {};
            transactions.forEach(trx => {
                const dateKey = toLocalDate(trx.tanggal);
                if (!groupedData[dateKey]) groupedData[dateKey] = { tanggal: dateKey, uds: {} };

                trx.items?.forEach(item => {
                    const bId = item.barang_id?._id || item.barang_id;
                    const uId = item.ud_id?._id || item.ud_id;
                    const barang = barangMap.get(bId);
                    const ud = udLookupMap.get(uId);

                    const enrichedItem = {
                        ...item,
                        nama_barang: item.nama_barang || barang?.nama_barang || item.barang_id?.nama_barang,
                        satuan: item.satuan || barang?.satuan || item.barang_id?.satuan
                    };

                    const udId = uId || 'unknown';
                    const udName = ud?.nama_ud || item.ud_id?.nama_ud || 'Unknown UD';
                    if (!groupedData[dateKey].uds[udId]) {
                        groupedData[dateKey].uds[udId] = {
                            nama_ud: udName,
                            items: []
                        };
                    }
                    groupedData[dateKey].uds[udId].items.push(enrichedItem);
                });
            });

            const sortedDates = Object.keys(groupedData).sort((a, b) => new Date(b) - new Date(a));
            let currentY = doc.lastAutoTable.finalY + 10;

            sortedDates.forEach((dateKey, dateIdx) => {
                const dayData = groupedData[dateKey];
                const udGroups = dayData.uds;

                doc.setFontSize(11);
                doc.setFont('helvetica', 'bold');
                if (currentY > 180) {
                    doc.addPage();
                    currentY = 20;
                }
                doc.text(formatIndoDate(dateKey).toUpperCase(), 14, currentY);
                currentY += 5;

                const tableRows = [];
                const sortedUdIds = Object.keys(udGroups).sort((a, b) => udGroups[a].nama_ud.localeCompare(udGroups[b].nama_ud));

                let dateJual = 0;
                let dateModal = 0;
                let dateProfit = 0;

                sortedUdIds.forEach(udId => {
                    const group = udGroups[udId];
                    tableRows.push([
                        { content: group.nama_ud.toUpperCase(), colSpan: 9, styles: { fillColor: [241, 245, 249], fontStyle: 'bold' } }
                    ]);

                    let udJual = 0;
                    let udModal = 0;
                    let udProfit = 0;

                    group.items.forEach((item, idx) => {
                        tableRows.push([
                            idx + 1,
                            item.nama_barang || item.barang_id?.nama_barang || '-',
                            item.qty,
                            item.satuan || item.barang_id?.satuan || '-',
                            formatCurrency(item.harga_jual),
                            formatCurrency(item.subtotal_jual),
                            formatCurrency(item.harga_modal),
                            formatCurrency(item.subtotal_modal),
                            formatCurrency(item.keuntungan)
                        ]);
                        udJual += item.subtotal_jual;
                        udModal += item.subtotal_modal;
                        udProfit += item.keuntungan;
                    });

                    tableRows.push([
                        { content: `Subtotal ${group.nama_ud}`, colSpan: 5, styles: { halign: 'right', fontStyle: 'bold' } },
                        { content: formatCurrency(udJual), styles: { fontStyle: 'bold' } },
                        '',
                        { content: formatCurrency(udModal), styles: { fontStyle: 'bold' } },
                        { content: formatCurrency(udProfit), styles: { fontStyle: 'bold' } }
                    ]);

                    dateJual += udJual;
                    dateModal += udModal;
                    dateProfit += udProfit;
                });

                tableRows.push([
                    { content: `TOTAL ${formatDateShort(dateKey)}`, colSpan: 5, styles: { halign: 'right', fillColor: [226, 232, 240], fontStyle: 'bold' } },
                    { content: formatCurrency(dateJual), styles: { fillColor: [226, 232, 240], fontStyle: 'bold' } },
                    { content: '', styles: { fillColor: [226, 232, 240] } },
                    { content: formatCurrency(dateModal), styles: { fillColor: [226, 232, 240], fontStyle: 'bold' } },
                    { content: formatCurrency(dateProfit), styles: { fillColor: [226, 232, 240], fontStyle: 'bold' } }
                ]);

                autoTable(doc, {
                    startY: currentY,
                    head: [['No', 'Nama Barang', 'Qty', 'Sat', 'Harga Jual', 'Total Jual', 'Hrg Modal', 'Tot Modal', 'Untung']],
                    body: tableRows,
                    theme: 'grid',
                    styles: { fontSize: 8 },
                    headStyles: { fillColor: [59, 130, 246] },
                    columnStyles: {
                        0: { cellWidth: 10, halign: 'center' },
                        2: { cellWidth: 12, halign: 'center' },
                        3: { cellWidth: 15, halign: 'center' },
                        4: { halign: 'right' },
                        5: { halign: 'right' },
                        6: { halign: 'right' },
                        7: { halign: 'right' },
                        8: { halign: 'right' },
                    },
                    margin: { top: 20 },
                    didDrawPage: (data) => {
                        doc.setFontSize(8);
                        doc.setFont('helvetica', 'normal');
                        doc.text(`Halaman ${doc.internal.getNumberOfPages()}`, pageWidth - 14, doc.internal.pageSize.getHeight() - 10, { align: 'right' });
                        doc.text(printTimestamp, 14, doc.internal.pageSize.getHeight() - 10);
                    }
                });

                currentY = doc.lastAutoTable.finalY + 10;
            });

            if (currentY > 200) {
                doc.addPage();
                currentY = 20;
            }
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('GRAND TOTAL KESELURUHAN', 14, currentY);
            currentY += 8;

            autoTable(doc, {
                startY: currentY,
                body: [
                    ['Total Penjualan', formatCurrency(totalJualAll)],
                    ['Total Modal', formatCurrency(totalModalAll)],
                    ['Total Keuntungan', formatCurrency(totalUntungAll)]
                ],
                theme: 'plain',
                styles: { fontSize: 12, fontStyle: 'bold' },
                columnStyles: {
                    1: { halign: 'right' }
                }
            });

            const timestamp = new Date().toISOString().split('T')[0];
            doc.save(`Laporan_Dapur_${selectedDapur?.nama_dapur.replace(/\s+/g, '_')}_${periodName.replace(/\s+/g, '_')}_${timestamp}.pdf`);
            toast.success('Laporan PDF Rekap berhasil dibuat');
        } catch (error) {
            toast.error('Gagal membuat laporan PDF');
            console.error(error);
        } finally {
            setGenerating(false);
        }
    };

    const itemsByUD = getItemsByUD();
    const totalJual = transactions.reduce((sum, trx) => sum + (trx.items?.reduce((s, i) => s + i.subtotal_jual, 0) || 0), 0);
    const totalKeuntungan = transactions.reduce((sum, trx) => sum + (trx.items?.reduce((s, i) => s + i.keuntungan, 0) || 0), 0);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Laporan Dapur</h1>
                <p className="text-gray-500 mt-1">Generate laporan berdasarkan dapur dan periode</p>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200 p-4 md:p-6 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:items-end">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
                            <ChefHat className="w-4 h-4 text-gray-400" />
                            Pilih Dapur
                        </label>
                        <select
                            value={filterDapur}
                            onChange={(e) => setFilterDapur(e.target.value)}
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all appearance-none cursor-pointer text-sm"
                        >
                            <option value="">Pilih Dapur</option>
                            {dapurList.map((d) => (
                                <option key={d._id} value={d._id}>
                                    {d.nama_dapur}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            Pilih Periode
                        </label>
                        <select
                            value={filterPeriode}
                            onChange={(e) => setFilterPeriode(e.target.value)}
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all appearance-none cursor-pointer text-sm"
                        >
                            <option value="">Semua Periode</option>
                            {periodeList.map((p) => (
                                <option key={p._id} value={p._id}>
                                    {p.nama_periode} ({formatDateShort(p.tanggal_mulai)} - {formatDateShort(p.tanggal_selesai)})
                                </option>
                            ))}
                        </select>
                    </div>

                    {filterPeriode && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                Pilih Tanggal (Opsional)
                            </label>
                            <DatePicker
                                selected={filterTanggal}
                                onChange={(date) => setFilterTanggal(date)}
                                placeholder="Pilih tanggal & waktu"
                                showTimeSelect
                                dateFormat="Pp"
                                minDate={filterPeriode ? new Date(periodeList.find(p => p._id === filterPeriode)?.tanggal_mulai) : null}
                                maxDate={filterPeriode ? new Date(periodeList.find(p => p._id === filterPeriode)?.tanggal_selesai) : null}
                            />
                        </div>
                    )}

                    <button
                        onClick={fetchTransactions}
                        disabled={loading}
                        className="w-full px-6 py-2.5 bg-blue-600 text-white rounded-xl font-medium shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                    >
                        {loading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <Filter className="w-5 h-5" />
                        )}
                        Cari Data
                    </button>
                </div>
            </div>

            {transactions.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                        <p className="text-[10px] md:text-sm font-medium text-gray-500 uppercase tracking-widest">Total Transaksi</p>
                        <p className="text-xl md:text-2xl font-black text-gray-900 mt-1">{transactions.length}</p>
                    </div>
                    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                        <p className="text-[10px] md:text-sm font-medium text-gray-500 uppercase tracking-widest">Total Penjualan</p>
                        <p className="text-xl md:text-2xl font-black text-blue-600 mt-1">{formatCurrency(totalJual)}</p>
                    </div>
                    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                        <p className="text-[10px] md:text-sm font-medium text-gray-500 uppercase tracking-widest">Total Keuntungan</p>
                        <p className="text-xl md:text-2xl font-black text-green-600 mt-1">{formatCurrency(totalKeuntungan)}</p>
                    </div>
                </div>
            )}

            {itemsByUD.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                    <div className="p-4 md:p-5 border-b border-gray-100 flex items-center justify-between">
                        <h3 className="font-bold text-gray-900">Data per UD</h3>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{itemsByUD.length} Unit</span>
                    </div>

                    <div className="hidden lg:block overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50/50">
                                <tr>
                                    <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">UD</th>
                                    <th className="text-right px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Jumlah Item</th>
                                    <th className="text-right px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Total Jual</th>
                                    <th className="text-right px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Total Modal</th>
                                    <th className="text-right px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Total Untung</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {itemsByUD.map((ud) => (
                                    <tr key={ud._id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <p className="font-bold text-gray-900">{ud.nama_ud}</p>
                                            <p className="text-xs text-gray-500 font-medium">{ud.kode_ud}</p>
                                        </td>
                                        <td className="px-6 py-4 text-right font-medium text-gray-600">{ud.items.length}</td>
                                        <td className="px-6 py-4 text-right font-bold text-gray-900">{formatCurrency(ud.totalJual)}</td>
                                        <td className="px-6 py-4 text-right font-bold text-gray-900">{formatCurrency(ud.totalModal)}</td>
                                        <td className="px-6 py-4 text-right font-bold text-green-600">{formatCurrency(ud.totalKeuntungan)}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-gray-50/80 font-black">
                                <tr>
                                    <td className="px-6 py-4 text-right uppercase text-sm" colSpan={4}>TOTAL KEUNTUNGAN DAPUR</td>
                                    <td className="px-6 py-4 text-right text-lg text-green-700">{formatCurrency(totalKeuntungan)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    <div className="lg:hidden p-4 space-y-4 divide-y divide-gray-100 print:hidden">
                        {itemsByUD.map((ud) => (
                            <div key={`mobile-ud-${ud._id}`} className="pt-4 first:pt-0 space-y-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="font-black text-gray-900 uppercase tracking-tight">{ud.nama_ud}</h4>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{ud.kode_ud}</p>
                                    </div>
                                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-[10px] font-bold rounded-lg">{ud.items.length} Item</span>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Jual</p>
                                        <p className="text-sm font-black text-gray-900">{formatCurrency(ud.totalJual)}</p>
                                    </div>
                                    <div className="bg-green-50 rounded-xl p-3 border border-green-100">
                                        <p className="text-[10px] font-bold text-green-600/60 uppercase tracking-widest mb-1">Untung</p>
                                        <p className="text-sm font-black text-green-700">{formatCurrency(ud.totalKeuntungan)}</p>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center text-[10px] px-2">
                                    <span className="font-bold text-gray-400 uppercase">Total Modal</span>
                                    <span className="font-bold text-gray-600">{formatCurrency(ud.totalModal)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {transactions.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-200 p-5 md:p-6 shadow-sm">
                    <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Download className="w-4 h-4 text-gray-400" />
                        Generate Laporan
                    </h3>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <button
                            onClick={generateExcel}
                            disabled={generating}
                            className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl font-medium shadow-lg shadow-green-500/20
                       hover:bg-green-700 transition-all disabled:opacity-50 text-sm"
                        >
                            {generating ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <FileSpreadsheet className="w-5 h-5" />
                            )}
                            Excel Report
                        </button>
                        <button
                            onClick={generateRekapPDF}
                            disabled={generating}
                            className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-slate-700 text-white rounded-xl font-medium shadow-lg shadow-slate-500/20
                       hover:bg-slate-800 transition-all disabled:opacity-50 text-sm"
                        >
                            {generating ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <FileText className="w-5 h-5" />
                            )}
                            Rekap PDF
                        </button>
                    </div>
                </div>
            )}

            {!loading && transactions.length === 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                    <FileBarChart2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak Ada Data</h3>
                    <p className="text-gray-500">Pilih dapur and filter periode, kemudian klik "Cari Data"</p>
                </div>
            )}
        </div>
    );
}
