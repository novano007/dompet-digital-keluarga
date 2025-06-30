// File: netlify/functions/updateSheet.js

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
        const { transactionId, newData } = JSON.parse(event.body);
        const spreadsheetId = process.env.GOOGLE_SHEET_ID;
        const sheets = await getAuthAndSheets();

        // 1. Baca semua data dari sheet untuk menemukan baris yang cocok
        const range = 'Sheet1!A:F';
        const response = await sheets.spreadsheets.values.get({ spreadsheetId, range });
        const rows = response.data.values || [];

        // Cari index baris yang memiliki ID Transaksi yang cocok (di kolom ke-6, atau index 5)
        const rowIndex = rows.findIndex(row => row[5] === transactionId);

        if (rowIndex === -1) {
            return { statusCode: 404, body: JSON.stringify({ error: 'Transaction ID not found in sheet.' }) };
        }

        // 2. Update baris yang ditemukan (ingat, sheet index dimulai dari 1, bukan 0)
        const updateRange = `Sheet1!A${rowIndex + 1}:E${rowIndex + 1}`;
        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: updateRange,
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: [[newData.date, newData.description, newData.category, newData.amount, newData.user]],
            },
        });

        return { statusCode: 200, body: JSON.stringify({ message: 'Data berhasil diperbarui!' }) };

    } catch (error) {
        console.error('Error updating sheet:', error);
        return { statusCode: 500, body: JSON.stringify({ error: 'Gagal memperbarui data di sheet.' }) };
    }
};