// Device language detector and translation dictionary
export const getDeviceLanguage = () => {
  if (typeof window === 'undefined' || !window.navigator) return 'id';
  const navLang = (navigator.language || navigator.userLanguage || 'id').toLowerCase();
  return navLang.startsWith('en') ? 'en' : 'id';
};

export const translations = {
  id: {
    // Navigation
    dashboard: 'Dashboard',
    transactions: 'Transaksi',
    budgets: 'Budgets',
    analytics: 'Analisis',
    reminders: 'Tagihan & Cicilan',

    // Dashboard Cards
    totalBalance: 'Total Saldo',
    vsLastMonth: 'vs bulan lalu',
    currentMonth: 'Bulan Ini',
    income: 'Pemasukan',
    expenses: 'Pengeluaran',
    saved: 'Ditabung',
    quickActions: 'Aksi Cepat',
    addTx: 'Tambah Transaksi',
    sendMoney: 'Transfer',
    payBills: 'Bayar Tagihan',
    cashWallet: 'Dompet Cash',
    bankAccount: 'Rekening Bank',
    netBalance: 'Saldo Bersih',
    manageWallets: 'Kelola Dompet',
    incomeVsExpenses: 'Pemasukan & Pengeluaran',
    spendingByCategory: 'Pengeluaran per Kategori',
    recentActivity: 'Aktivitas Terbaru',
    viewAll: 'Lihat Semua',
    noTransactions: 'Belum ada catatan keuangan.',
    paydayCycle: 'Siklus Gajian',
    
    // Notifications & Profile
    billReminders: 'Pengingat Tagihan',
    billsUnit: 'Tagihan',
    noUpcomingBills: 'Tidak ada tagihan mendekati jatuh tempo (H-5). 👍',
    payNow: 'Bayar Sekarang di Tagihan & Cicilan →',
    yourAccount: 'Akun Anda',
    mainCurrency: 'Valuta Utama',
    language: 'Bahasa',
    autoDevice: 'Otomatis (Perangkat)',
    indonesian: 'Bahasa Indonesia',
    english: 'Inggris',
    profileSettings: 'Pengaturan Profil',
    resetData: 'Reset Data',
    deleteAccount: 'Hapus Akun',
    logout: 'Keluar',

    // Actions & Form
    add: 'Tambah',
    pay: 'Bayar',
    payInstallment: 'Bayar Cicilan',
    paid: 'Lunas',
    overdue: 'Terlewat',
    dueIn: 'Hari Lagi',
    today: 'Hari Ini',
    delete: 'Hapus',
    cancel: 'Batal',
    submit: 'Simpan',
    all: 'Semua',
    transfer: 'Transfer'
  },
  en: {
    // Navigation
    dashboard: 'Dashboard',
    transactions: 'Transactions',
    budgets: 'Budgets',
    analytics: 'Analytics',
    reminders: 'Bills & Installments',

    // Dashboard Cards
    totalBalance: 'Total Balance',
    vsLastMonth: 'vs last month',
    currentMonth: 'Current Month',
    income: 'Income',
    expenses: 'Expenses',
    saved: 'Saved',
    quickActions: 'Quick Actions',
    addTx: 'Add Tx',
    sendMoney: 'Transfer',
    payBills: 'Pay Bills',
    cashWallet: 'Cash Wallet',
    bankAccount: 'Bank Account',
    netBalance: 'Net Balance',
    manageWallets: 'Manage Wallets',
    incomeVsExpenses: 'Income & Expenses',
    spendingByCategory: 'Spending by Category',
    recentActivity: 'Recent Activity',
    viewAll: 'View All',
    noTransactions: 'No financial records yet.',
    paydayCycle: 'Payday Cycle',
    
    // Notifications & Profile
    billReminders: 'Bill Reminders (H-5)',
    billsUnit: 'Bills',
    noUpcomingBills: 'No upcoming bills due (H-5). 👍',
    payNow: 'Pay Now in Bills & Installments →',
    yourAccount: 'Your Account',
    mainCurrency: 'Primary Currency',
    language: 'Language',
    autoDevice: 'Auto (Device)',
    indonesian: 'Bahasa Indonesia',
    english: 'English',
    profileSettings: 'Profile Settings',
    resetData: 'Reset Data',
    deleteAccount: 'Delete Account',
    logout: 'Logout',

    // Actions & Form
    add: 'Add',
    pay: 'Pay',
    payInstallment: 'Pay Installment',
    paid: 'Paid',
    overdue: 'Overdue',
    dueIn: 'Days Left',
    today: 'Today',
    delete: 'Delete',
    cancel: 'Cancel',
    submit: 'Save',
    all: 'All',
    transfer: 'Transfer'
  }
};

export const getTranslation = (lang, key) => {
  const activeLang = lang === 'auto' ? getDeviceLanguage() : (lang || getDeviceLanguage());
  const dict = translations[activeLang] || translations.id;
  return dict[key] || translations.id[key] || key;
};
