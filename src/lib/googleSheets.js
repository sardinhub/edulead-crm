/**
 * Google Sheets Integration Helper
 * 
 * SETUP INSTRUCTIONS:
 * 1. Buat Google Cloud Project: https://console.cloud.google.com
 * 2. Enable Google Sheets API
 * 3. Buat Service Account dan download JSON credentials
 * 4. Share spreadsheet dengan service account email
 * 5. Tambahkan VITE_GOOGLE_SHEETS_ID dan credentials di .env.local
 * 
 * Untuk keamanan, integrasi ini sebaiknya melalui Supabase Edge Function
 * sehingga service account credentials tidak terekspos di frontend.
 * 
 * Endpoint: POST /functions/v1/sync-to-sheets
 */

const SHEETS_SYNC_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sync-to-sheets`;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Sync satu laporan ke Google Sheets
 * @param {Object} reportData - Data laporan aktivitas
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function syncReportToSheets(reportData) {
  // Jika Edge Function belum di-setup, skip dengan graceful warning
  if (!import.meta.env.VITE_ENABLE_SHEETS_SYNC) {
    console.info('📊 Google Sheets sync dinonaktifkan. Set VITE_ENABLE_SHEETS_SYNC=true untuk mengaktifkan.');
    return { success: true, skipped: true };
  }

  try {
    const payload = {
      timestamp: new Date().toISOString(),
      staff_name: reportData.staff_name,
      report_date: reportData.report_date,
      leads_followed_up: reportData.leads_followed_up,
      leads_responded: reportData.leads_responded,
      leads_converted: reportData.leads_converted,
      response_rate: reportData.leads_followed_up > 0
        ? ((reportData.leads_responded / reportData.leads_followed_up) * 100).toFixed(1)
        : '0',
      conversion_rate: reportData.leads_followed_up > 0
        ? ((reportData.leads_converted / reportData.leads_followed_up) * 100).toFixed(1)
        : '0',
      response_notes: reportData.response_notes || '-',
      follow_up_actions: reportData.follow_up_actions || '-',
      obstacles: reportData.obstacles || '-',
      next_day_plan: reportData.next_day_plan || '-',
    };

    const response = await fetch(SHEETS_SYNC_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ANON_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.warn('⚠️ Sheets sync gagal:', errText);
      return { success: false, error: errText };
    }

    console.log('✅ Data berhasil disync ke Google Sheets');
    return { success: true };
  } catch (err) {
    console.warn('⚠️ Sheets sync error:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Format data laporan menjadi array row untuk Google Sheets
 * Urutan kolom: Timestamp | Staff | Tanggal | Follow-up | Respon | Konversi | Rate Respon | Rate Konversi | Catatan | Tindakan | Hambatan | Rencana
 */
export function formatReportAsSheetRow(reportData) {
  const responseRate = reportData.leads_followed_up > 0
    ? ((reportData.leads_responded / reportData.leads_followed_up) * 100).toFixed(1) + '%'
    : '0%';
  const conversionRate = reportData.leads_followed_up > 0
    ? ((reportData.leads_converted / reportData.leads_followed_up) * 100).toFixed(1) + '%'
    : '0%';

  return [
    new Date().toLocaleString('id-ID'),
    reportData.staff_name,
    reportData.report_date,
    reportData.leads_followed_up,
    reportData.leads_responded,
    reportData.leads_converted,
    responseRate,
    conversionRate,
    reportData.response_notes || '-',
    reportData.follow_up_actions || '-',
    reportData.obstacles || '-',
    reportData.next_day_plan || '-',
  ];
}
