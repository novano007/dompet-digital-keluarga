// File: netlify/functions/addToSheet.js

const { google } = require('googleapis');

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    // Sekarang kita juga menerima transactionId
    const { date, description, category, amount, user, transactionId } = JSON.parse(event.body);

    const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: 'https://www.googleapis.com/auth/spreadsheets',
    });

    const sheets = google.sheets({ version: 'v4', auth });

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Sheet1!A:F', // Perbarui range hingga kolom F
      valueInputOption: 'USER_ENTERED',
      resource: {
        // Tambahkan transactionId di akhir
        values: [[date, description, category, amount, user, transactionId]],
      },
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Data berhasil ditambahkan!' }),
    };

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Gagal menambahkan data ke sheet.' }),
    };
  }
};
