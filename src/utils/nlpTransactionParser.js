/**
 * Smart Rule-Based & Regex Natural Language Transaction Parser (Client-Side)
 * Ekstraksi otomatis tipe, nominal, kategori, dompet, tanggal, dan deskripsi dari kalimat teks bebas.
 */

// Kamus kategori pengeluaran dan pemasukan
const CATEGORY_KEYWORDS = [
  // Pemasukan
  { category: 'Gaji Utama', type: 'income', keywords: ['gaji', 'payroll', 'salary', 'upah', 'honor', 'sallary'] },
  { category: 'Bonus & Tunjangan', type: 'income', keywords: ['bonus', 'thr', 'tunjangan', 'insentif', 'tips', 'tip'] },
  { category: 'Hasil Investasi', type: 'income', keywords: ['dividen', 'bunga', 'reksadana', 'cuan', 'profit', 'yield', 'saham'] },
  { category: 'Bisnis / Sampingan', type: 'income', keywords: ['jualan', 'omset', 'freelance', 'proyek', 'side hustle', 'klien', 'client'] },

  // Pengeluaran - Kebutuhan Pokok (Needs 50%)
  { category: 'Makanan Dasar', type: 'expense', keywords: ['makan', 'nasi', 'ayam', 'warteg', 'padang', 'sembako', 'beras', 'telur', 'sayur', 'dapur', 'sarapan', 'lunch', 'dinner', 'indomaret', 'alfamart', 'supermarket'] },
  { category: 'Sewa & Cicilan Rumah', type: 'expense', keywords: ['kos', 'kost', 'sewa', 'kontrakan', 'apartemen', 'kpr'] },
  { category: 'Utilitas & Tagihan', type: 'expense', keywords: ['listrik', 'pln', 'token', 'pdam', 'air', 'wifi', 'indihome', 'biznet', 'internet', 'pulsa', 'kuota', 'telkomsel', 'indosat', 'xl', 'iuran', 'kebersihan', 'gas'] },
  { category: 'Transportasi', type: 'expense', keywords: ['bensin', 'pertalite', 'pertamax', 'solar', 'bbm', 'parkir', 'tol', 'gojek', 'goride', 'gocar', 'grab', 'krl', 'mrt', 'busway', 'transjakarta', 'ojol', 'kereta', 'service', 'oli'] },
  { category: 'Kesehatan & Asuransi', type: 'expense', keywords: ['obat', 'dokter', 'apotek', 'klinik', 'rs', 'rumah sakit', 'bpjs', 'asuransi', 'vitamin', 'medis'] },

  // Pengeluaran - Keinginan & Gaya Hidup (Wants 30%)
  { category: 'Dining Out & Jajan', type: 'expense', keywords: ['kopi', 'coffee', 'cafe', 'kafe', 'starbucks', 'kenangan', 'janji jiwa', 'jajan', 'snack', 'boba', 'gofood', 'grabfood', 'shopeefood', 'mcd', 'kfc', 'hokben', 'resto', 'nongkrong'] },
  { category: 'Hiburan & Streaming', type: 'expense', keywords: ['nonton', 'bioskop', 'xxi', 'cgv', 'netflix', 'spotify', 'youtube', 'disney', 'game', 'steam', 'topup game', 'mlbb', 'playstation', 'liburan', 'wisata', 'tiket'] },
  { category: 'Hobi & Fashion', type: 'expense', keywords: ['baju', 'kaos', 'celana', 'sepatu', 'tas', 'jaket', 'jersey', 'buku', 'skincare', 'makeup', 'parfum', 'salon', 'barbershop', 'gym', 'badminton', 'futsal'] },
  { category: 'Belanja Gaya Hidup', type: 'expense', keywords: ['shopee', 'tokopedia', 'tokped', 'lazada', 'tiktok shop', 'belanja', 'gadget', 'aksesoris', 'headphone', 'casing', 'dekorasi'] },

  // Investasi & Tabungan
  { category: 'ETF & Saham', type: 'expense', keywords: ['saham', 'reksadana', 'bibit', 'bareksa', 'stockbit', 'ajaib', 'ipot'] },
  { category: 'Emas & Crypto', type: 'expense', keywords: ['emas', 'antam', 'crypto', 'bitcoin', 'usdt', 'binance', 'tokocrypto', 'pintu'] },
  { category: 'Edukasi & Kursus', type: 'expense', keywords: ['kursus', 'course', 'buku', 'bootcamp', 'seminar', 'webinar', 'udemy'] },
  { category: 'Tabungan Darurat', type: 'expense', keywords: ['dana darurat', 'tabungan', 'simpan'] },
];

/**
 * Parsing nominal angka dari string teks
 */
export function extractAmount(text) {
  if (!text) return { amount: 0, matchedStr: '' };

  const cleanText = text.toLowerCase();

  // Pattern 1: Jutaan (e.g. "1.5jt", "2 jt", "10juta", "2.5 juta", "1,5 million")
  const millionMatch = cleanText.match(/(?:rp\.?\s*)?(\d+(?:[.,]\d+)?)\s*(?:jt|juta|million|m\b)/i);
  if (millionMatch) {
    const num = parseFloat(millionMatch[1].replace(',', '.'));
    if (!isNaN(num)) {
      return { amount: Math.round(num * 1000000), matchedStr: millionMatch[0] };
    }
  }

  // Pattern 2: Ribuan (e.g. "25k", "25rb", "50 ribu", "100ribu", "2.5k", "15 thousand")
  const thousandMatch = cleanText.match(/(?:rp\.?\s*)?(\d+(?:[.,]\d+)?)\s*(?:rb|k|ribu|thousand)\b/i);
  if (thousandMatch) {
    const num = parseFloat(thousandMatch[1].replace(',', '.'));
    if (!isNaN(num)) {
      return { amount: Math.round(num * 1000), matchedStr: thousandMatch[0] };
    }
  }

  // Pattern 3: Format Rupiah lengkap (e.g. "Rp 25.000", "Rp. 150.000,00", "rp50000")
  const rpMatch = cleanText.match(/rp\.?\s*(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?|\d+)/i);
  if (rpMatch) {
    const rawDigits = rpMatch[1].replace(/\./g, '').replace(',', '.');
    const num = parseFloat(rawDigits);
    if (!isNaN(num) && num > 0) {
      return { amount: num, matchedStr: rpMatch[0] };
    }
  }

  // Pattern 4: Angka polos 4 digit atau lebih (e.g. "25000", "150000")
  const rawNumMatch = cleanText.match(/\b(\d{4,12})\b/);
  if (rawNumMatch) {
    const num = parseInt(rawNumMatch[1], 10);
    if (!isNaN(num) && num > 0) {
      return { amount: num, matchedStr: rawNumMatch[0] };
    }
  }

  return { amount: 0, matchedStr: '' };
}

/**
 * Mencocokkan dompet dari teks dengan daftar dompet user
 */
export function matchWallets(text, wallets = []) {
  if (!wallets || wallets.length === 0) return { sourceWallet: null, targetWallet: null, matchedStrings: [] };

  const cleanText = text.toLowerCase();
  const matchedStrings = [];

  // Cari apakah ada pola transfer: "dari [walletA] ke [walletB]" atau "[walletA] ke [walletB]"
  for (const wFrom of wallets) {
    const fromName = wFrom.name.toLowerCase();
    for (const wTo of wallets) {
      if (wFrom.id === wTo.id) continue;
      const toName = wTo.name.toLowerCase();

      // Pattern: "dari BCA ke GoPay" atau "BCA ke GoPay"
      const transferRegex = new RegExp(`(?:dari\\s+)?(${fromName})\\s+(?:ke|to|menuju)\\s+(${toName})`, 'i');
      const match = cleanText.match(transferRegex);
      if (match) {
        matchedStrings.push(match[0]);
        return { sourceWallet: wFrom, targetWallet: wTo, matchedStrings };
      }
    }
  }

  // Helper jarak karakter sederhana (Levenshtein distance ringan)
  const isFuzzyMatch = (str1, str2) => {
    const s1 = str1.toLowerCase().replace(/[^a-z0-9]/g, '');
    const s2 = str2.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (s1 === s2) return true;
    if (s1.length < 3 || s2.length < 3) return false;
    if (s1.includes(s2) || s2.includes(s1)) return true;
    // Cek perbedaan maksimal 1-2 karakter
    let diff = 0;
    let i = 0, j = 0;
    while (i < s1.length && j < s2.length) {
      if (s1[i] !== s2[j]) {
        diff++;
        if (s1.length > s2.length) i++;
        else if (s2.length > s1.length) j++;
        else { i++; j++; }
      } else {
        i++; j++;
      }
    }
    diff += (s1.length - i) + (s2.length - j);
    return diff <= (s1.length >= 6 ? 2 : 1);
  };

  // Single wallet match: "pakai BCA", "di GoPay", "via Mandiri", "tunai", atau sebut nama dompetnya
  let matchedWallet = null;

  // Urutkan nama dompet dari terpanjang agar nama yang lebih spesifik diprioritaskan
  const sortedWallets = [...wallets].sort((a, b) => b.name.length - a.name.length);

  for (const w of sortedWallets) {
    const wName = w.name.toLowerCase();
    // 1. Exact / Regex match
    const walletRegex = new RegExp(`\\b(?:pakai|pake|via|dari|di|ke|masuk)?\\s*(${wName})\\b`, 'i');
    const match = cleanText.match(walletRegex);
    if (match) {
      matchedWallet = w;
      matchedStrings.push(match[0]);
      break;
    }

    // 2. Alias pencocokan umum (Cash / Tunai)
    if (w.type === 'cash' && (cleanText.includes('cash') || cleanText.includes('tunai'))) {
      matchedWallet = w;
      matchedStrings.push(cleanText.includes('tunai') ? 'tunai' : 'cash');
      break;
    }

    // 3. Fuzzy match per kata dalam kalimat (misal "seabnk" -> "seabank")
    const words = cleanText.split(/\s+/);
    for (const word of words) {
      const cleanWord = word.replace(/^(?:pakai|pake|via|dari|di|ke|masuk)/, '');
      if (cleanWord.length >= 3 && isFuzzyMatch(cleanWord, wName)) {
        matchedWallet = w;
        matchedStrings.push(word);
        break;
      }
    }
    if (matchedWallet) break;
  }

  return { sourceWallet: matchedWallet, targetWallet: null, matchedStrings };
}

/**
 * Deteksi tanggal dari teks
 */
export function extractDate(text) {
  if (!text) return { date: new Date().toISOString().split('T')[0], matchedStr: '' };

  const cleanText = text.toLowerCase();
  const today = new Date();

  if (cleanText.includes('kemarin')) {
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    return { date: yesterday.toISOString().split('T')[0], matchedStr: 'kemarin' };
  }

  if (cleanText.includes('lusa')) {
    const lusa = new Date(today);
    lusa.setDate(lusa.getDate() - 2);
    return { date: lusa.toISOString().split('T')[0], matchedStr: 'lusa' };
  }

  // Pattern "tgl 15" atau "tanggal 25"
  const dateMatch = cleanText.match(/\b(?:tgl|tanggal)\s*(\d{1,2})\b/i);
  if (dateMatch) {
    const day = parseInt(dateMatch[1], 10);
    if (day >= 1 && day <= 31) {
      const targetDate = new Date(today.getFullYear(), today.getMonth(), day);
      return { date: targetDate.toISOString().split('T')[0], matchedStr: dateMatch[0] };
    }
  }

  return { date: today.toISOString().split('T')[0], matchedStr: '' };
}

/**
 * Main Natural Language Parser Function
 */
export function parseTransactionText(rawText, wallets = []) {
  if (!rawText || !rawText.trim()) {
    return {
      isValid: false,
      type: 'expense',
      title: '',
      amount: 0,
      category: 'Makanan Dasar',
      walletId: '',
      destinationWalletId: '',
      date: new Date().toISOString().split('T')[0],
      sourceWalletName: '',
      targetWalletName: '',
      confidence: 0
    };
  }

  const text = rawText.trim();
  const lowerText = text.toLowerCase();

  // 1. Ekstraksi Nominal
  const { amount, matchedStr: amountStr } = extractAmount(text);

  // 2. Deteksi Transfer
  const isTransferKeyword = /\b(transfer|tf|pindah\s*saldo|kirim\s*saldo|topup|top\s*up)\b/i.test(lowerText);
  const { sourceWallet, targetWallet, matchedStrings: walletStrings } = matchWallets(text, wallets);

  // 3. Scan Kategori & Kata Kunci Secara Menyeluruh
  let detectedCategoryItem = null;
  let categoryMatchedStr = '';

  for (const item of CATEGORY_KEYWORDS) {
    for (const kw of item.keywords) {
      const regex = new RegExp(`\\b${kw}\\b`, 'i');
      if (regex.test(lowerText)) {
        detectedCategoryItem = item;
        categoryMatchedStr = kw;
        break;
      }
    }
    if (detectedCategoryItem) break;
  }

  // 4. Deteksi Tipe (Income vs Expense vs Transfer)
  let type = 'expense';
  if (isTransferKeyword || (sourceWallet && targetWallet)) {
    type = 'transfer';
  } else if (detectedCategoryItem && detectedCategoryItem.type === 'income') {
    type = 'income';
  } else {
    const isIncome = /\b(gaji|gajian|payroll|salary|sallary|dapat|dapet|terima|bonus|thr|pemasukan|income|cuan|dividen|dividend|cashback|refund|hasil\s*jualan|tf\s*masuk|transfer\s*masuk|uang\s*masuk|masuk\s*ke)\b/i.test(lowerText);
    const isExpense = /\b(beli|bayar|jajan|checkout|makan|ngopi|bensin|parkir|belanja|sewa|iuran|tagihan)\b/i.test(lowerText);

    if (isIncome && !isExpense) {
      type = 'income';
    } else {
      type = 'expense';
    }
  }

  // 5. Penetapan Kategori Final
  let matchedCategory = 'Makanan Dasar';
  if (type === 'income') {
    matchedCategory = detectedCategoryItem ? detectedCategoryItem.category : 'Gaji Utama';
  } else if (type === 'transfer') {
    matchedCategory = 'Transfer';
  } else {
    matchedCategory = detectedCategoryItem ? detectedCategoryItem.category : 'Makanan Dasar';
  }

  // 6. Deteksi Tanggal
  const { date, matchedStr: dateStr } = extractDate(text);

  // 6. Default Fallback Wallet jika tidak ditemukan
  let finalSourceWallet = sourceWallet;
  let finalTargetWallet = targetWallet;

  if (!finalSourceWallet && wallets.length > 0) {
    // Cari dompet yang ada saldo untuk pengeluaran/transfer, atau dompet pertama
    const funded = wallets.filter(w => (w.balance || 0) > 0);
    finalSourceWallet = funded.length > 0
      ? funded.reduce((max, w) => ((w.balance || 0) > (max.balance || 0) ? w : max), funded[0])
      : wallets[0];
  }

  if (type === 'transfer' && !finalTargetWallet && wallets.length > 1) {
    finalTargetWallet = wallets.find(w => w.id !== finalSourceWallet?.id) || wallets[1];
  }

  // 7. Pembuatan Judul (Title) Bersih
  let cleanTitle = text;
  // Hapus amount string
  if (amountStr) {
    cleanTitle = cleanTitle.replace(new RegExp(amountStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), '');
  }
  // Hapus string wallet
  walletStrings.forEach(ws => {
    cleanTitle = cleanTitle.replace(new RegExp(ws.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), '');
  });
  // Hapus date string
  if (dateStr) {
    cleanTitle = cleanTitle.replace(new RegExp(dateStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), '');
  }
  // Hapus kata penghubung umum yang tertinggal di awal/akhir
  cleanTitle = cleanTitle
    .replace(/\b(pakai|pake|via|dari|ke|di|masuk|buat|untuk|sebesar|seharga|dengan)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Jika title kosong setelah dibersihkan, fallback ke kategori atau tipe
  if (!cleanTitle) {
    cleanTitle = type === 'transfer'
      ? `Transfer ${finalSourceWallet?.name || ''} ke ${finalTargetWallet?.name || ''}`.trim()
      : (matchedCategory !== 'Lain-lain' ? matchedCategory : (type === 'income' ? 'Pemasukan' : 'Pengeluaran'));
  } else {
    // Kapitalisasi huruf pertama
    cleanTitle = cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1);
  }

  const isValid = amount > 0;

  return {
    isValid,
    type,
    title: cleanTitle,
    amount,
    category: type === 'transfer' ? (finalTargetWallet?.id || 'Transfer') : matchedCategory,
    walletId: finalSourceWallet?.id || '',
    destinationWalletId: finalTargetWallet?.id || '',
    sourceWalletName: finalSourceWallet?.name || '',
    targetWalletName: finalTargetWallet?.name || '',
    date,
    rawText
  };
}
