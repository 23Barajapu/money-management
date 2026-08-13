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
    interactiveIncomes: 'Interaktif: Pemasukan dan Kategori',
    thisYear: 'Tahun Ini',
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
    transfer: 'Transfer',

    // Warnings & Validation
    walletInsufficient: 'Saldo dompet "{wallet}" tidak mencukupi!',
    walletAlmostEmpty: 'Transaksi ini hampir menghabiskan seluruh saldo dompet "{wallet}".',
    allocationExceeded: 'Transaksi ini akan melebihi sisa alokasi {bucket} bulan ini!',
    allocationAlmostEmpty: 'Perhatian: Sisa alokasi {bucket} hampir habis.',
    selectWalletFirst: 'Pilih sumber/tujuan dana terlebih dahulu!',
    invalidAmount: 'Masukkan nominal yang valid',

    // Savings Modal
    depositTo: 'Setor ke',
    withdrawFrom: 'Tarik dari',
    nominalAmount: 'Nominal',
    fundSource: 'Sumber Dana',
    fundDestination: 'Tujuan Dana',
    selectWallet: '-- Pilih Dompet --',
    cash: 'Tunai (Cash)',
    confirm: 'Konfirmasi'
  },
  en: {
    // Navigation
    dashboard: 'Dashboard',
    transactions: 'Transaksi',
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
    interactiveIncomes: 'Interactive Incomes and categories',
    thisYear: 'This Year',
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
    transfer: 'Transfer',

    // Warnings & Validation
    walletInsufficient: 'Wallet balance "{wallet}" is insufficient!',
    walletAlmostEmpty: 'This transaction will almost empty your "{wallet}" balance.',
    allocationExceeded: 'This will exceed your {bucket} allocation limit this month!',
    allocationAlmostEmpty: 'Warning: Your {bucket} allocation is running low.',
    selectWalletFirst: 'Please select a fund source/destination first!',
    invalidAmount: 'Please enter a valid amount',

    // Savings Modal
    depositTo: 'Deposit to',
    withdrawFrom: 'Withdraw from',
    nominalAmount: 'Amount',
    fundSource: 'Fund Source',
    fundDestination: 'Fund Destination',
    selectWallet: '-- Select Wallet --',
    cash: 'Cash',
    confirm: 'Confirm'
  }
};

export const getTranslation = (lang, key) => {
  const activeLang = lang === 'auto' ? getDeviceLanguage() : (lang || getDeviceLanguage());
  const dict = translations[activeLang] || translations.id;
  return dict[key] || translations.id[key] || key;
};
