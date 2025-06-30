// File: netlify/functions/deleteSheet.js

const { google } = require('googleapis');

async function getAuthAndSheets() {
    const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
    const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: 'https://www.googleapis.com/auth/spreadsheets',
    });
    const sheets = google.sheets({ version: 'v4', auth });
    return sheets;
}

exports.handler = async function (event) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { transactionId } = JSON.parse(event.body);
        const spreadsheetId = process.env.GOOGLE_SHEET_ID;
        const sheets = await getAuthAndSheets();

        // 1. Dapatkan metadata sheet untuk menemukan sheetId
        const sheetMeta = await sheets.spreadsheets.get({ spreadsheetId });
        const sheetId = sheetMeta.data.sheets.find(s => s.properties.title === 'Sheet1').properties.sheetId;

        // 2. Baca semua data untuk menemukan index baris
        const range = 'Sheet1!F:F'; // Cukup baca kolom ID
        const response = await sheets.spreadsheets.values.get({ spreadsheetId, range });
        const rows = response.data.values || [];
        const rowIndex = rows.findIndex(row => row[0] === transactionId);

        if (rowIndex === -1) {
            return { statusCode: 404, body: JSON.stringify({ error: 'Transaction ID not found in sheet.' }) };
        }

        // 3. Hapus baris yang ditemukan
        await sheets.spreadsheets.batchUpdate({
            spreadsheetId,
            resource: {
                requests: [{
                    deleteDimension: {
                        range: {
                            sheetId: sheetId,
                            dimension: 'ROWS',
                            startIndex: rowIndex,
                            endIndex: rowIndex + 1,
                        },
                    },
                }],
            },
        });

        return { statusCode: 200, body: JSON.stringify({ message: 'Data berhasil dihapus!' }) };

    } catch (error) {
        console.error('Error deleting from sheet:', error);
        return { statusCode: 500, body: JSON.stringify({ error: 'Gagal menghapus data dari sheet.' }) };
    }
};
