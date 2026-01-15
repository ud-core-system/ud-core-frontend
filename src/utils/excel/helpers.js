export const applyRowStyle = (row, style) => {
    row.eachCell({ includeEmpty: true }, (cell) => {
        // Merge style properties carefully
        if (style.font) cell.font = { ...cell.font, ...style.font };
        if (style.alignment) cell.alignment = { ...cell.alignment, ...style.alignment };
        if (style.fill) cell.fill = { ...cell.fill, ...style.fill };
        if (style.border) cell.border = { ...cell.border, ...style.border };
    });
};

export const setCurrency = (cell) => {
    cell.numFmt = '"Rp"#,##0';
};

export const formatDateShort = (dateString) => {
    if (!dateString) return '-';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    } catch (e) {
        return dateString;
    }
};

export const formatIndoDate = (dateString) => {
    if (!dateString) return '-';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    } catch (e) {
        return dateString;
    }
};
