import * as XLSX from 'xlsx-js-style';

/**
 * Format date to Indonesian long format
 * @param {string} dateStr 
 * @returns {string}
 */
export function formatTanggal(dateStr) {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
}

/**
 * Export Laporan to Excel with specialized styling
 * @param {Array} data - Grouped data by date
 * @param {string} periodeLabel - Label for the period
 */
export function exportLaporanExcel(data, periodeLabel) {
    const wb = XLSX.utils.book_new();
    const wsData = [];

    // ===== Judul =====
    wsData.push([`DATA PENJUALAN ${periodeLabel}`]);
    wsData.push([]); // spasi

    let currentRow = 2;
    let grandTotalJual = 0;
    let grandTotalModal = 0;
    let grandKeuntungan = 0;

    data.forEach(group => {
        // ===== Header Tanggal =====
        wsData.push([formatTanggal(group.tanggal)]);
        currentRow++;

        // ===== Header Tabel =====
        wsData.push([
            'No',
            'Nama Barang',
            'Qty',
            'Satuan',
            'Harga Jual Supplier',
            'Total Harga Jual Supplier',
            'Harga Modal Supplier',
            'Jumlah Modal Supplier',
            'Keuntungan'
        ]);
        currentRow++;

        let no = 1;
        let subtotalJual = 0;
        let subtotalModal = 0;
        let subtotalUntung = 0;

        group.items.forEach(item => {
            wsData.push([
                no++,
                item.nama || item.barang_id?.nama_barang || '-',
                item.qty,
                item.satuan || item.barang_id?.satuan || '-',
                item.hargaJual || item.harga_jual || 0,
                item.totalJual || item.subtotal_jual || 0,
                item.hargaModal || item.harga_modal || 0,
                item.totalModal || item.subtotal_modal || 0,
                item.keuntungan || 0
            ]);

            subtotalJual += (item.totalJual || item.subtotal_jual || 0);
            subtotalModal += (item.totalModal || item.subtotal_modal || 0);
            subtotalUntung += (item.keuntungan || 0);
            currentRow++;
        });

        // ===== Subtotal =====
        wsData.push([
            '',
            'TOTAL HARGA',
            '',
            '',
            '',
            subtotalJual,
            '',
            subtotalModal,
            subtotalUntung
        ]);
        currentRow += 2;

        grandTotalJual += subtotalJual;
        grandTotalModal += subtotalModal;
        grandKeuntungan += subtotalUntung;

        wsData.push([]); // spasi antar tanggal
    });

    // ===== Grand Total =====
    wsData.push([
        '',
        'GRAND TOTAL',
        '',
        '',
        '',
        grandTotalJual,
        '',
        grandTotalModal,
        grandKeuntungan
    ]);

    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // ===== Merge Judul =====
    ws['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 8 } }
    ];

    // ===== Lebar Kolom =====
    ws['!cols'] = [
        { wch: 5 },
        { wch: 35 },
        { wch: 8 },
        { wch: 10 },
        { wch: 20 },
        { wch: 25 },
        { wch: 20 },
        { wch: 25 },
        { wch: 15 },
    ];

    // ===== Styling =====
    Object.keys(ws).forEach(key => {
        if (!key.startsWith('!')) {
            ws[key].s = {
                alignment: { vertical: 'center' }
            };
        }
    });

    // Style Judul
    if (ws['A1']) {
        ws['A1'].s = {
            font: { bold: true, sz: 14 },
            alignment: { horizontal: 'center' }
        };
    }

    XLSX.utils.book_append_sheet(wb, ws, 'DATA PESANAN');
    XLSX.writeFile(wb, `Laporan_${periodeLabel.replace(/\s+/g, '_')}.xlsx`);
}
