import * as XLSX from 'xlsx-js-style';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Format number as Rupiah string (no symbol, just formatted number)
 */
function fmtRupiah(value) {
    if (value === null || value === undefined || value === '') return '-';
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
}

/**
 * Group and sort barang data by UD
 */
function groupByUD(allData) {
    const grouped = {};
    const sorted = [...allData].sort((a, b) => {
        const nameA = a.ud_id?.nama_ud || 'ZZZ';
        const nameB = b.ud_id?.nama_ud || 'ZZZ';
        return nameA.localeCompare(nameB);
    });

    sorted.forEach((item) => {
        const udId = item.ud_id?._id || 'others';
        if (!grouped[udId]) {
            grouped[udId] = {
                ud: item.ud_id,
                items: [],
            };
        }
        grouped[udId].items.push(item);
    });

    return Object.values(grouped).sort((a, b) => {
        const nameA = a.ud?.nama_ud || 'ZZZ';
        const nameB = b.ud?.nama_ud || 'ZZZ';
        return nameA.localeCompare(nameB);
    });
}

// ===== EXCEL =====
/**
 * Export all barang data to Excel (.xlsx), grouped by UD
 * @param {Array} allData - Array of barang objects
 */
export function exportBarangExcel(allData) {
    const groups = groupByUD(allData);
    const wb = XLSX.utils.book_new();
    const wsData = [];
    const merges = [];
    const styles = {}; // cell ref -> style
    let rowIdx = 0;

    const now = new Date().toLocaleDateString('id-ID', {
        day: 'numeric', month: 'long', year: 'numeric',
    });

    // ===== Judul =====
    wsData.push([`DATA MASTER BARANG`]);
    wsData.push([`Tanggal Cetak: ${now}`]);
    wsData.push([`Total Barang: ${allData.length}`]);
    wsData.push([]); // spasi
    rowIdx = 4;

    // Merge judul (A1:G3)
    merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: 6 } });
    merges.push({ s: { r: 1, c: 0 }, e: { r: 1, c: 6 } });
    merges.push({ s: { r: 2, c: 0 }, e: { r: 2, c: 6 } });

    const COLS = ['No', 'Nama Barang', 'Satuan', 'Harga Jual', 'Harga Modal', 'UD', 'Status'];
    const COL_WIDTHS = [5, 35, 10, 18, 18, 35, 10];

    let globalNo = 1;

    groups.forEach((group) => {
        const udName = group.ud?.nama_ud || 'Tanpa UD';
        const kodeUD = group.ud?.kode_ud ? ` (${group.ud.kode_ud})` : '';

        // ===== Header UD =====
        wsData.push([`${udName}${kodeUD} — ${group.items.length} Barang`]);
        merges.push({ s: { r: rowIdx, c: 0 }, e: { r: rowIdx, c: 6 } });

        // Style header UD
        const udHeaderRef = XLSX.utils.encode_cell({ r: rowIdx, c: 0 });
        styles[udHeaderRef] = {
            font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 11 },
            fill: { fgColor: { rgb: '2563EB' } }, // blue-600
            alignment: { vertical: 'center', horizontal: 'left', indent: 1 },
        };
        rowIdx++;

        // Header kolom tabel
        wsData.push(COLS);
        COLS.forEach((_, ci) => {
            const ref = XLSX.utils.encode_cell({ r: rowIdx, c: ci });
            styles[ref] = {
                font: { bold: true, sz: 10 },
                fill: { fgColor: { rgb: 'DBEAFE' } }, // blue-100
                alignment: { vertical: 'center', horizontal: 'center' },
                border: {
                    bottom: { style: 'thin', color: { rgb: '93C5FD' } },
                },
            };
        });
        rowIdx++;

        // Rows data
        group.items.forEach((item) => {
            const rowData = [
                globalNo++,
                item.nama_barang || '-',
                (item.satuan || '-').toUpperCase(),
                fmtRupiah(item.harga_jual),
                fmtRupiah(item.harga_modal || 0),
                item.ud_id?.nama_ud || '-',
                item.isActive ? 'Aktif' : 'Nonaktif',
            ];
            wsData.push(rowData);

            // Style status cell
            const statusRef = XLSX.utils.encode_cell({ r: rowIdx, c: 6 });
            styles[statusRef] = {
                font: { bold: true, color: { rgb: item.isActive ? '166534' : '374151' } },
                alignment: { vertical: 'center', horizontal: 'center' },
            };

            // Numbers align right
            [3, 4].forEach((ci) => {
                const ref = XLSX.utils.encode_cell({ r: rowIdx, c: ci });
                styles[ref] = {
                    alignment: { vertical: 'center', horizontal: 'right' },
                };
            });

            rowIdx++;
        });

        wsData.push([]); // spasi antar grup
        rowIdx++;
    });

    // ===== Grand Total =====
    wsData.push(['', `TOTAL KESELURUHAN: ${allData.length} barang dari ${groups.length} UD`]);
    merges.push({ s: { r: rowIdx, c: 1 }, e: { r: rowIdx, c: 6 } });
    const totalRef = XLSX.utils.encode_cell({ r: rowIdx, c: 1 });
    styles[totalRef] = {
        font: { bold: true, sz: 11 },
        fill: { fgColor: { rgb: 'F1F5F9' } },
        alignment: { vertical: 'center', horizontal: 'left' },
    };

    // Build sheet
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws['!merges'] = merges;
    ws['!cols'] = COL_WIDTHS.map((wch) => ({ wch }));
    ws['!rows'] = [
        { hpt: 36 }, // row 1: DATA MASTER BARANG
        { hpt: 20 }, // row 2: Tanggal Cetak
        { hpt: 20 }, // row 3: Total Barang
    ];

    // Apply title styles
    if (ws['A1']) {
        ws['A1'].s = {
            font: { bold: true, sz: 16, color: { rgb: '1E3A5F' } },
            alignment: { horizontal: 'center', vertical: 'center' },
        };
    }
    if (ws['A2']) {
        ws['A2'].s = {
            font: { sz: 10, color: { rgb: '6B7280' } },
            alignment: { horizontal: 'center', vertical: 'center' },
        };
    }
    if (ws['A3']) {
        ws['A3'].s = {
            font: { sz: 10, color: { rgb: '6B7280' } },
            alignment: { horizontal: 'center', vertical: 'center' },
        };
    }

    // Apply per-cell styles
    Object.keys(styles).forEach((ref) => {
        if (ws[ref]) {
            ws[ref].s = styles[ref];
        }
    });

    XLSX.utils.book_append_sheet(wb, ws, 'Data Barang');
    XLSX.writeFile(wb, `Data_Barang_${now.replace(/\s+/g, '_')}.xlsx`);
}

// ===== PDF =====
/**
 * Export all barang data to PDF, grouped by UD
 * @param {Array} allData - Array of barang objects
 */
export function exportBarangPDF(allData) {
    const groups = groupByUD(allData);
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    const now = new Date().toLocaleDateString('id-ID', {
        day: 'numeric', month: 'long', year: 'numeric',
    });

    // ===== Header =====
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 58, 95); // dark blue
    doc.text('DATA MASTER BARANG', doc.internal.pageSize.getWidth() / 2, 18, { align: 'center' });

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(107, 114, 128); // gray
    doc.text(`Tanggal Cetak: ${now}`, doc.internal.pageSize.getWidth() / 2, 24, { align: 'center' });
    doc.text(
        `Total: ${allData.length} barang dari ${groups.length} UD`,
        doc.internal.pageSize.getWidth() / 2,
        29,
        { align: 'center' }
    );

    // Separator line
    doc.setDrawColor(203, 213, 225);
    doc.line(15, 32, doc.internal.pageSize.getWidth() - 15, 32);

    let currentY = 36;
    let globalNo = 1;

    groups.forEach((group, gIdx) => {
        const udName = group.ud?.nama_ud || 'Tanpa UD';
        const kodeUD = group.ud?.kode_ud ? ` (${group.ud.kode_ud})` : '';

        // Check page space for section header
        if (currentY > doc.internal.pageSize.getHeight() - 30) {
            doc.addPage();
            currentY = 15;
        }

        // ===== Section Header UD =====
        doc.setFillColor(37, 99, 235); // blue-600
        doc.roundedRect(15, currentY, doc.internal.pageSize.getWidth() - 30, 7, 1.5, 1.5, 'F');
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text(`${udName}${kodeUD}  —  ${group.items.length} Barang`, 18, currentY + 5);
        currentY += 9;

        // Build table rows
        const tableRows = group.items.map((item) => [
            globalNo++,
            item.nama_barang || '-',
            (item.satuan || '-').toUpperCase(),
            fmtRupiah(item.harga_jual),
            fmtRupiah(item.harga_modal || 0),
            item.isActive ? 'Aktif' : 'Nonaktif',
        ]);

        autoTable(doc, {
            startY: currentY,
            head: [['No', 'Nama Barang', 'Satuan', 'Harga Jual', 'Harga Modal', 'Status']],
            body: tableRows,
            theme: 'grid',
            margin: { left: 15, right: 15 },
            styles: {
                fontSize: 8,
                cellPadding: { top: 2, bottom: 2, left: 3, right: 3 },
                lineColor: [203, 213, 225],
                lineWidth: 0.2,
                textColor: [31, 41, 55],
            },
            headStyles: {
                fillColor: [219, 234, 254], // blue-100
                textColor: [30, 64, 175], // blue-800
                fontStyle: 'bold',
                fontSize: 8,
                halign: 'center',
            },
            columnStyles: {
                0: { halign: 'center', cellWidth: 14 },
                1: { halign: 'left', cellWidth: 'auto' },
                2: { halign: 'center', cellWidth: 16 },
                3: { halign: 'right', cellWidth: 32 },
                4: { halign: 'right', cellWidth: 32 },
                5: { halign: 'center', cellWidth: 18 },
            },
            didParseCell: (data) => {
                if (data.column.index === 5 && data.section === 'body') {
                    const isActive = data.cell.raw === 'Aktif';
                    data.cell.styles.textColor = isActive ? [22, 101, 52] : [107, 114, 128];
                    data.cell.styles.fontStyle = 'bold';
                }
            },
            alternateRowStyles: {
                fillColor: [248, 250, 252], // slate-50
            },
        });

        currentY = doc.lastAutoTable.finalY + (gIdx < groups.length - 1 ? 6 : 3);
    });

    // ===== Footer on each page =====
    const totalPages = doc.internal.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(156, 163, 175); // gray-400
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        doc.text(`Halaman ${p} dari ${totalPages}`, pageWidth / 2, pageHeight - 8, { align: 'center' });
        doc.text('Data Master Barang — Sistem UD', 15, pageHeight - 8);
        doc.text(now, pageWidth - 15, pageHeight - 8, { align: 'right' });
    }

    doc.save(`Data_Barang_${now.replace(/\s+/g, '_')}.pdf`);
}
