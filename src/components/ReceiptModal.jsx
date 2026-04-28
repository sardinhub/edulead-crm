import React, { useState, useEffect, useRef } from 'react';
import { X, Printer, Download, Image } from 'lucide-react';
import html2canvas from 'html2canvas';

// Fungsi konversi angka ke terbilang Bahasa Indonesia
function angkaTerbilang(angka) {
  const satuan = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'];
  if (angka < 12) return satuan[angka];
  if (angka < 20) return satuan[angka - 10] + ' Belas';
  if (angka < 100) return satuan[Math.floor(angka / 10)] + ' Puluh' + (angka % 10 ? ' ' + satuan[angka % 10] : '');
  if (angka < 200) return 'Seratus' + (angka % 100 ? ' ' + angkaTerbilang(angka % 100) : '');
  if (angka < 1000) return satuan[Math.floor(angka / 100)] + ' Ratus' + (angka % 100 ? ' ' + angkaTerbilang(angka % 100) : '');
  if (angka < 2000) return 'Seribu' + (angka % 1000 ? ' ' + angkaTerbilang(angka % 1000) : '');
  if (angka < 1000000) return angkaTerbilang(Math.floor(angka / 1000)) + ' Ribu' + (angka % 1000 ? ' ' + angkaTerbilang(angka % 1000) : '');
  if (angka < 1000000000) return angkaTerbilang(Math.floor(angka / 1000000)) + ' Juta' + (angka % 1000000 ? ' ' + angkaTerbilang(angka % 1000000) : '');
  if (angka < 1000000000000) return angkaTerbilang(Math.floor(angka / 1000000000)) + ' Miliar' + (angka % 1000000000 ? ' ' + angkaTerbilang(angka % 1000000000) : '');
  return String(angka);
}

export default function ReceiptModal({ student, onClose, picStaff }) {
  const printRef = useRef(null);
  const [form, setForm] = useState({
    noKwitansi: '',
    angkatan: '',
    totalBiaya: '',
    uangSebanyak: '',
    untukPembayaran: '',
    jatuhTempo: '',
    metode: 'TRANSFER BANK',
    penerima: 'SRI RAHAYU',
    programStudi: 'AVSEC',
  });

  useEffect(() => {
    if (student) {
      setForm(f => ({
        ...f,
        untukPembayaran: student.status_pembayaran || '',
        uangSebanyak: String(student.nominal_pembayaran || ''),
      }));
    }
  }, [student]);

  if (!student) return null;

  const uangSebanyak = Number(form.uangSebanyak || 0);
  const totalBiaya = Number(form.totalBiaya || 0);
  const sisaBayar = totalBiaya > 0 ? totalBiaya - uangSebanyak : 0;
  const tglBayar = student.tanggal_daftar || student.created_at?.split('T')[0] || '';
  const terbilang = uangSebanyak > 0 ? angkaTerbilang(uangSebanyak) + ' Rupiah' : '';
  const programStudi = form.programStudi;

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const printWindow = window.open('', '_blank', 'width=560,height=790');
    printWindow.document.write(`<!DOCTYPE html><html><head><title>Kwitansi - ${student.nama}</title>
<style>
  @page { size: A5 portrait; margin: 8mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 10px; color: #1a1a2e; padding: 10px; }
  .receipt { max-width: 500px; margin: auto; }
  .header { display: flex; align-items: center; gap: 16px; margin-bottom: 4px; }
  .header img { height: 55px; width: auto; }
  .header-title { background: #1a1a5e; color: white; padding: 8px 28px; font-size: 15px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; }
  .header-no { margin-left: auto; display: flex; align-items: center; gap: 6px; font-weight: bold; font-size: 12px; }
  .header-no span { color: #fff; background: #1a1a5e; padding: 4px 10px; border-radius: 4px; font-size: 11px; }
  .header-no input { border: 1.5px solid #1a1a5e; padding: 4px 10px; width: 100px; font-weight: bold; text-align: center; }
  .program { text-align: center; font-weight: 900; font-size: 14px; letter-spacing: 1px; margin: 8px 0 14px; color: #1a1a5e; }
  .form-section { border: 1.5px solid #ccc; border-radius: 6px; padding: 14px 18px; margin-bottom: 14px; }
  .form-row { display: flex; align-items: center; gap: 8px; margin-bottom: 7px; font-size: 11.5px; }
  .form-row label { font-weight: 700; min-width: 120px; white-space: nowrap; }
  .form-row .val { flex: 1; border-bottom: 1.5px solid #bbb; padding: 2px 6px; min-height: 18px; font-weight: 600; }
  .form-row .val-short { width: 100px; border-bottom: 1.5px solid #bbb; padding: 2px 6px; min-height: 18px; font-weight: 600; text-align: center; }
  .form-row .label-mid { font-weight: 700; margin-left: 12px; white-space: nowrap; }
  .tbl { width: 100%; border-collapse: collapse; margin-bottom: 4px; font-size: 10.5px; }
  .tbl th { background: #1a1a5e; color: #fff; padding: 6px 8px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; border: 1px solid #1a1a5e; }
  .tbl td { padding: 6px 8px; border: 1px solid #ccc; vertical-align: top; }
  .tbl .warn { background: #eef; }
  .tbl .warn-title { background: #1a1a5e; color: #fff; font-weight: 800; text-align: center; padding: 4px; text-transform: uppercase; }
  .sign-row { display: flex; justify-content: space-between; }
  .sign-col { text-align: center; min-width: 120px; }
  .sign-col .name { font-weight: 900; margin-top: 50px; text-decoration: underline; }
  .footer { text-align: center; margin-top: 10px; font-size: 10px; color: #888; letter-spacing: 2px; }
  ul { padding-left: 14px; margin: 0; }
  ul li { margin-bottom: 2px; font-size: 10px; }
  .metode-box { text-align: center; padding-top: 8px; }
  .metode-label { font-size: 10px; color: #666; }
  .metode-val { font-weight: 900; font-size: 12px; }
</style></head><body>`);
    printWindow.document.write(content.innerHTML);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); }, 400);
  };

  const handleDownloadPNG = async () => {
    const content = printRef.current;
    if (!content) return;
    const canvas = await html2canvas(content, {
      scale: 3,
      useCORS: true,
      backgroundColor: '#ffffff',
    });
    const link = document.createElement('a');
    link.download = `Kwitansi_${student.nama.replace(/\s+/g, '_')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* Toolbar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <Printer className="w-5 h-5 text-indigo-600" /> Preview Kwitansi
          </h2>
          <div className="flex items-center gap-2">
            <button onClick={handleDownloadPNG} className="px-5 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-emerald-700 transition-all shadow-md">
              <Image className="w-4 h-4" /> Simpan PNG
            </button>
            <button onClick={handlePrint} className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-md">
              <Printer className="w-4 h-4" /> Cetak
            </button>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-all">
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>
        </div>

        {/* Form Input (tidak tercetak) */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 grid grid-cols-2 md:grid-cols-3 gap-3">
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase">No. Kwitansi</label>
            <input value={form.noKwitansi} onChange={e => setForm({ ...form, noKwitansi: e.target.value })} className="w-full mt-1 px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-200" placeholder="001/KW/2026" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase">Angkatan</label>
            <input value={form.angkatan} onChange={e => setForm({ ...form, angkatan: e.target.value })} className="w-full mt-1 px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-200" placeholder="2026" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase">Uang Sebanyak (Rp)</label>
            <input type="number" value={form.uangSebanyak} onChange={e => setForm({ ...form, uangSebanyak: e.target.value })} className="w-full mt-1 px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-200" placeholder="6650000" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase">Total Biaya Program</label>
            <input type="number" value={form.totalBiaya} onChange={e => setForm({ ...form, totalBiaya: e.target.value })} className="w-full mt-1 px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-200" placeholder="15000000" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase">Untuk Pembayaran</label>
            <input value={form.untukPembayaran} onChange={e => setForm({ ...form, untukPembayaran: e.target.value })} className="w-full mt-1 px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-200" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase">Jatuh Tempo</label>
            <input type="date" value={form.jatuhTempo} onChange={e => setForm({ ...form, jatuhTempo: e.target.value })} className="w-full mt-1 px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-200" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase">Program Studi</label>
            <select value={form.programStudi} onChange={e => setForm({ ...form, programStudi: e.target.value })} className="w-full mt-1 px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-200 cursor-pointer">
              <option value="AVSEC">AVSEC</option>
              <option value="Ground Staff">Ground Staff</option>
              <option value="Flight Attendant">Flight Attendant</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase">Metode Bayar</label>
            <select value={form.metode} onChange={e => setForm({ ...form, metode: e.target.value })} className="w-full mt-1 px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-200 cursor-pointer">
              <option>TRANSFER BANK</option>
              <option>TUNAI</option>
              <option>LAINNYA</option>
            </select>
          </div>
        </div>

        {/* Receipt Preview (ini yang dicetak) */}
        <div className="p-6" ref={printRef}>
          <div className="receipt">
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '4px', marginTop: '24px' }}>
              <img src="/logo-trisakti.png" alt="Logo" style={{ height: '55px', width: 'auto' }} />
              <div style={{ background: '#1a1a5e', color: 'white', padding: '8px 28px', fontSize: '15px', fontWeight: 900, letterSpacing: '2px', textTransform: 'uppercase' }}>BUKTI PEMBAYARAN</div>
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', fontSize: '12px' }}>
                <span style={{ color: '#fff', background: '#1a1a5e', padding: '4px 10px', borderRadius: '4px', fontSize: '11px' }}>No.</span>
                <span style={{ border: '1.5px solid #1a1a5e', padding: '4px 14px', fontWeight: 900, minWidth: '80px', display: 'inline-block', textAlign: 'center' }}>{form.noKwitansi || '—'}</span>
              </div>
            </div>
            <div style={{ textAlign: 'center', fontWeight: 900, fontSize: '14px', letterSpacing: '1px', margin: '8px 0 14px', color: '#1a1a5e' }}>PROGRAM STUDI: {programStudi}</div>

            {/* Form Section */}
            <div style={{ border: '1.5px solid #ccc', borderRadius: '6px', padding: '16px 18px', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', fontSize: '11.5px' }}>
                <label style={{ fontWeight: 700, minWidth: '120px' }}>Sudah terima dari</label>
                <div style={{ flex: 1, borderBottom: '1.5px solid #bbb', padding: '4px 6px', fontWeight: 600 }}>{student.nama}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', fontSize: '11.5px' }}>
                <label style={{ fontWeight: 700, minWidth: '120px' }}>Asal Sekolah</label>
                <div style={{ flex: 1, borderBottom: '1.5px solid #bbb', padding: '4px 6px', fontWeight: 600 }}>{student.asal_sekolah}</div>
                <span style={{ fontWeight: 700, marginLeft: '12px' }}>Angkatan</span>
                <div style={{ width: '80px', borderBottom: '1.5px solid #bbb', padding: '4px 6px', fontWeight: 600, textAlign: 'center' }}>{form.angkatan || '—'}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', fontSize: '11.5px' }}>
                <label style={{ fontWeight: 700, minWidth: '120px' }}>Uang Sebanyak</label>
                <div style={{ width: '140px', borderBottom: '1.5px solid #bbb', padding: '4px 6px', fontWeight: 600 }}>Rp {uangSebanyak.toLocaleString('id-ID')}</div>
                <span style={{ fontWeight: 700, marginLeft: '12px' }}>Untuk Pembayaran</span>
                <div style={{ flex: 1, borderBottom: '1.5px solid #bbb', padding: '4px 6px', fontWeight: 600 }}>{form.untukPembayaran || '—'}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11.5px' }}>
                <label style={{ fontWeight: 700, minWidth: '120px' }}>Terbilang</label>
                <div style={{ flex: 1, borderBottom: '1.5px solid #bbb', padding: '4px 6px', fontWeight: 700, fontStyle: 'italic', textTransform: 'uppercase' }}>{terbilang || '—'}</div>
              </div>
            </div>

            {/* Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10.5px', marginBottom: '4px' }}>
              <thead>
                <tr>
                  <th style={{ background: '#1a1a5e', color: '#fff', padding: '6px 8px', fontWeight: 800, border: '1px solid #1a1a5e', textTransform: 'uppercase' }}>Total Biaya</th>
                  <th style={{ background: '#1a1a5e', color: '#fff', padding: '6px 8px', fontWeight: 800, border: '1px solid #1a1a5e', textTransform: 'uppercase' }}>Dibayar</th>
                  <th style={{ background: '#1a1a5e', color: '#fff', padding: '6px 8px', fontWeight: 800, border: '1px solid #1a1a5e', textTransform: 'uppercase' }}>Sisa Pembayaran</th>
                  <th style={{ background: '#fff', padding: '6px 8px', fontWeight: 800, border: '1px solid #ccc', fontStyle: 'italic' }}>Tanggal Pembayaran</th>
                  <th style={{ background: '#fff', padding: '6px 8px', fontWeight: 800, border: '1px solid #ccc' }}>{tglBayar ? new Date(tglBayar).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase() : '—'}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: '6px 8px', border: '1px solid #ccc', textAlign: 'center', fontWeight: 700 }}>Rp {totalBiaya > 0 ? totalBiaya.toLocaleString('id-ID') : '—'}</td>
                  <td style={{ padding: '6px 8px', border: '1px solid #ccc', textAlign: 'center', fontWeight: 700 }}>Rp {uangSebanyak.toLocaleString('id-ID')}</td>
                  <td style={{ padding: '6px 8px', border: '1px solid #ccc', textAlign: 'center', fontWeight: 900 }}>{sisaBayar <= 0 && totalBiaya > 0 ? 'LUNAS' : (sisaBayar > 0 ? `Rp ${sisaBayar.toLocaleString('id-ID')}` : '—')}</td>
                  <td colSpan={2} style={{ border: '1px solid #ccc' }}></td>
                </tr>
                <tr>
                  <td colSpan={2} style={{ border: '1px solid #ccc', padding: 0, verticalAlign: 'top' }}>
                    <div style={{ background: '#1a1a5e', color: '#fff', fontWeight: 800, textAlign: 'center', padding: '4px', textTransform: 'uppercase', fontSize: '10px' }}>Perhatian</div>
                    <ul style={{ padding: '6px 6px 6px 22px', margin: 0, fontSize: '9.5px', lineHeight: '1.5', listStyleType: 'disc', fontStyle: 'italic' }}>
                      <li>Uang yang sudah dibayarkan tidak dapat ditarik Kembali</li>
                      <li>Bukti ini disimpan dengan baik dan harus diperlihatkan pada pembayaran berikutnya</li>
                      <li>Semua jenis pembayaran melalui rekening BRI Lembaga Pendidikan Triesakti Indonesia dengan No. Rekening: <strong>2085-01-000301-565</strong></li>
                      <li>Kwitansi digital ini memiliki kekuatan hukum yang sah sebagai pengganti bukti pembayaran kertas</li>
                    </ul>
                  </td>
                  <td style={{ border: '1px solid #ccc', verticalAlign: 'top', padding: 0 }}>
                    <div style={{ background: '#1a1a5e', color: '#fff', fontWeight: 800, textAlign: 'center', padding: '4px', textTransform: 'uppercase', fontSize: '10px' }}>Jatuh Tempo</div>
                    <div style={{ textAlign: 'center', padding: '8px', fontWeight: 700, fontSize: '11px' }}>
                      {form.jatuhTempo ? new Date(form.jatuhTempo).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
                    </div>
                    <div style={{ textAlign: 'center', paddingTop: '8px' }}>
                      <div style={{ fontSize: '9px', color: '#666' }}>Metode Pembayaran</div>
                      <div style={{ fontWeight: 900, fontSize: '12px' }}>{form.metode}</div>
                    </div>
                  </td>
                  <td style={{ border: '1px solid #ccc', verticalAlign: 'top', padding: '8px', textAlign: 'center' }}>
                    <div style={{ fontWeight: 700, marginBottom: '4px' }}>Penyetor,</div>
                    <div style={{ height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                    </div>
                    <div style={{ borderTop: '1px solid #aaa', paddingTop: '4px', fontWeight: 600, fontSize: '10px' }}>({student.nama})</div>
                  </td>
                  <td style={{ border: '1px solid #ccc', verticalAlign: 'top', padding: '8px', textAlign: 'center' }}>
                    <div style={{ fontWeight: 700, marginBottom: '4px' }}>Penerima,</div>
                    <div style={{ height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <img src="/ttd-stempel.png" alt="TTD & Stempel" style={{ height: '80px', width: 'auto', objectFit: 'contain' }} />
                    </div>
                    <div style={{ fontWeight: 900, textDecoration: 'underline' }}>{form.penerima}</div>
                  </td>
                </tr>
              </tbody>
            </table>
            <div style={{ textAlign: 'center', marginTop: '10px', fontSize: '10px', color: '#888', letterSpacing: '2px' }}>--- Register by {(picStaff || student.pic_staff || '').toUpperCase()} ---</div>
          </div>
        </div>
      </div>
    </div>
  );
}
