import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Download, FileSpreadsheet, FileJson, FileText, Mail, Loader2 } from 'lucide-react';
import emailjs from '@emailjs/browser';
import { supabase } from '../supabaseClient';

export default function ExportData({ transactions, balance, cashBalance, cashlessBalance, formatIDR, showToast }) {
  const [sendingEmail, setSendingEmail] = useState(false);

  const generatePDFDoc = () => {
    const doc = new jsPDF();
    const today = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

    // Title & Header Info
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(139, 92, 246); // Brand primary color (purple)
    doc.text('LAPORAN KEUANGAN PERSONAL', 14, 20);

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Tanggal Cetak: ${today}`, 14, 26);
    doc.text('Aplikasi: Money Management', 14, 31);

    // Divider line
    doc.setDrawColor(226, 232, 240);
    doc.line(14, 35, 196, 35);

    // Balance Summary Box
    doc.setFillColor(15, 23, 42); // slate 900
    doc.rect(14, 40, 182, 32, 'F');
    
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(148, 163, 184); // secondary
    doc.text('RINGKASAN SALDO SAAT INI', 20, 48);

    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text(`Total: ${formatIDR(balance)}`, 20, 58);
    
    doc.setFontSize(10);
    doc.setTextColor(245, 158, 11); // orange
    doc.text(`Cash: ${formatIDR(cashBalance)}`, 20, 66);
    
    doc.setTextColor(16, 185, 129); // green
    doc.text(`Cashless: ${formatIDR(cashlessBalance)}`, 90, 66);

    // Transaction History Header
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text('RIWAYAT TRANSAKSI TERAKHIR', 14, 82);

    // Prepare table columns and rows
    const tableColumn = ['Tanggal', 'Deskripsi', 'Kategori', 'Metode', 'Jenis', 'Nominal'];
    const tableRows = transactions.map(t => [
      t.date,
      t.title,
      t.category,
      t.payment_method === 'cashless' ? 'Cashless' : 'Cash',
      t.type === 'income' ? 'Masuk' : t.type === 'expense' ? 'Keluar' : t.type === 'deposit' ? 'Simpan' : t.type === 'withdraw' ? 'Tarik' : 'Transfer',
      formatIDR(t.amount)
    ]);

    // Render Table using jsPDF-AutoTable
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 87,
      theme: 'striped',
      headStyles: { fillColor: [139, 92, 246] },
      styles: { fontSize: 8, font: 'Helvetica' },
      columnStyles: {
        5: { fontStyle: 'bold', halign: 'right' }
      }
    });

    return doc;
  };

  // 1. Export to CSV
  const exportToCSV = () => {
    const headers = ['Tanggal', 'Judul', 'Jenis', 'Kategori', 'Metode Pembayaran', 'Nominal'];
    const rows = transactions.map(t => [
      t.date,
      t.title,
      t.type === 'income' ? 'Pemasukan' : t.type === 'expense' ? 'Pengeluaran' : t.type === 'deposit' ? 'Setoran Tabungan' : t.type === 'withdraw' ? 'Penarikan Tabungan' : 'Transfer',
      t.category,
      t.payment_method || 'cash',
      t.amount
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(val => `"${val}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Laporan_Keuangan_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 2. Export to JSON
  const exportToJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(transactions, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', dataStr);
    link.setAttribute('download', `Backup_Data_${new Date().toISOString().split('T')[0]}.json`);
    link.click();
  };

  // 3. Export to PDF (Local Download)
  const exportToPDF = () => {
    const doc = generatePDFDoc();
    doc.save(`Laporan_Keuangan_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // 4. Kirim Laporan Keuangan ke Email Pengguna (Tanpa Pemicu Unduh Lokal)
  const handleSendPDFEmail = async () => {
    setSendingEmail(true);
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user || !user.email) {
        throw new Error('Email pengguna tidak ditemukan');
      }

      const today = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

      // Check for EmailJS config in environment
      const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
      const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
      const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

      if (serviceId && templateId && publicKey) {
        const doc = generatePDFDoc();
        const pdfDataUri = doc.output('datauristring');
        await emailjs.send(
          serviceId,
          templateId,
          {
            to_email: user.email,
            to_name: user.email.split('@')[0],
            report_date: today,
            total_balance: formatIDR(balance),
            cash_balance: formatIDR(cashBalance),
            cashless_balance: formatIDR(cashlessBalance),
            pdf_attachment: pdfDataUri
          },
          publicKey
        );
      } else {
        // FormSubmit multipart/form-data — satu-satunya cara kirim file attachment
        const doc = generatePDFDoc();
        const pdfBlob = doc.output('blob');
        const filename = `Laporan_Keuangan_${new Date().toISOString().split('T')[0]}.pdf`;
        const pdfFile = new File([pdfBlob], filename, { type: 'application/pdf' });

        const formData = new FormData();
        formData.append('_subject', `[Money Management] Laporan Keuangan PDF - ${today}`);
        formData.append('_captcha', 'false');
        formData.append('_template', 'table');
        formData.append('Penerima', user.email);
        formData.append('Tanggal Cetak', today);
        formData.append('Total Saldo Utama', formatIDR(balance));
        formData.append('Saldo Cash', formatIDR(cashBalance));
        formData.append('Saldo Cashless', formatIDR(cashlessBalance));
        formData.append('Jumlah Transaksi', `${transactions.length} catatan`);
        formData.append('Status', 'Terverifikasi & Diterbitkan');
        // Lampiran PDF fisik — FormSubmit field 'attachment'
        formData.append('attachment', pdfFile, filename);

        // FormData harus dikirim ke endpoint NON-ajax (bukan /ajax/) supaya attachment diteruskan
        const res = await fetch(`https://formsubmit.co/${user.email}`, {
          method: 'POST',
          body: formData
        });

        // FormSubmit non-ajax redirect ke halaman terima kasih — tidak ada JSON response
        // Selama tidak throw, dianggap berhasil

        await supabase.from('profiles').upsert({
          user_id: user.id,
          email_notif: true
        });
      }

      if (showToast) {
        showToast(`Laporan keuangan berhasil dikirimkan ke email ${user.email}!`, 'success');
      }
    } catch (err) {
      if (showToast) {
        showToast('Gagal mengirim email: ' + err.message, 'error');
      }
    } finally {
      setSendingEmail(false);
    }
  };

  return (
    <div className="card">
      <h2 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Download size={20} color="var(--accent-color)" />
        Ekspor & Cadangkan Data
      </h2>
      <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: '1.4' }}>
        Unduh atau kirim otomatis seluruh catatan keuangan Anda ke email yang tertaut untuk analisis spreadsheet, arsip cadangan, atau cetak laporan PDF resmi.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <button onClick={handleSendPDFEmail} disabled={sendingEmail} className="btn-toggle active" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'rgba(59, 130, 246, 0.05)', borderColor: '#3b82f6', color: '#3b82f6' }}>
          {sendingEmail ? <Loader2 size={24} className="spin" /> : <Mail size={24} />}
          <strong style={{ fontSize: '0.9rem' }}>{sendingEmail ? 'Mengirim...' : 'Kirim Ke Email'}</strong>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Kirim Ringkasan Laporan Ke Email</span>
        </button>

        <button onClick={exportToPDF} className="btn-toggle active" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'rgba(239, 68, 68, 0.05)', borderColor: 'var(--expense-color)', color: 'var(--expense-color)' }}>
          <FileText size={24} />
          <strong style={{ fontSize: '0.9rem' }}>Unduh PDF</strong>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Format Laporan Cetak Resmi</span>
        </button>

        <button onClick={exportToCSV} className="btn-toggle active" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'rgba(16, 185, 129, 0.05)', borderColor: 'var(--income-color)', color: 'var(--income-color)' }}>
          <FileSpreadsheet size={24} />
          <strong style={{ fontSize: '0.9rem' }}>Ekspor CSV</strong>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Buka di Excel / Spreadsheet</span>
        </button>

        <button onClick={exportToJSON} className="btn-toggle active" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'rgba(139, 92, 246, 0.05)', borderColor: 'var(--accent-color)', color: 'var(--accent-color)' }}>
          <FileJson size={24} />
          <strong style={{ fontSize: '0.9rem' }}>Cadangkan JSON</strong>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>File Backup Restore Supabase</span>
        </button>
      </div>
    </div>
  );
}
