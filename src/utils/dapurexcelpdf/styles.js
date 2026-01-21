export const BORDER = {
    top: { style: 'thin' },
    left: { style: 'thin' },
    bottom: { style: 'thin' },
    right: { style: 'thin' }
};

export const STYLES = {
    title: {
        font: { bold: true, size: 14 },
        alignment: { horizontal: 'center', vertical: 'middle' }
    },

    dateTitle: {
        font: { bold: true },
        alignment: { vertical: 'middle' }
    },

    header: {
        font: { bold: true },
        alignment: { horizontal: 'center', vertical: 'middle' },
        fill: {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFF00' }
        },
        border: BORDER
    },

    yellowRow: {
        fill: {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFF99' }
        },
        border: BORDER
    },

    normalRow: {
        border: BORDER
    },

    orangeRow: {
        fill: {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFD699' }
        },
        border: BORDER
    },

    blueRow: {
        fill: {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: '9FE2FF' }
        },
        border: BORDER
    },

    totalRow: {
        font: { bold: true },
        border: BORDER,
        fill: {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'F2F2F2' }
        }
    },

    udHeader: {
        font: { bold: true, color: { argb: 'FFFFFF' } },
        fill: {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: '4472C4' }
        },
        alignment: { vertical: 'middle' },
        border: BORDER
    },

    subtotalRow: {
        font: { bold: true, italic: true },
        border: BORDER
    },

    divider: {
        border: {
            bottom: { style: 'thin' }
        }
    }
};
