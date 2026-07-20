graph TD
    %% Antarmuka Pengguna & Modul Entry
    User([Pengguna Antigravity]) --> Dashboard[Dasbor Utama Aplikasi]
    
    %% Cabang Fitur Utama
    Dashboard --> F1[1. Modul Budgeting & Target]
    Dashboard --> F2[2. Modul Otomatisasi & Pengingat]
    Dashboard --> F3[3. Modul Advanced Analytics]
    Dashboard --> F4[4. Multi-Akun & Konversi Valuta]
    Dashboard --> F5[5. Ekspor & Backup Data]

    %% Detail Fitur 1
    F1 --> F1_1[Budget Limiter per Kategori]
    F1 --> F1_2[Tabungan Khusus / Goals Tracker]
    F1_1 & F1_2 --> Engine[Mesin Kalkulasi Transaksi]

    %% Detail Fitur 2
    F2 --> F2_1[Pencatatan Otomatis Transaksi Berulang]
    F2 --> F2_2[Pengingat Tagihan & Notifikasi]
    F2_1 --> Engine
    F2_2 --> NotifService[Layanan Notifikasi Email/Web Push]

    %% Detail Fitur 3
    F3 --> F3_1[Laporan Arus Kas Income vs Expense]
    F3 --> F3_2[Prediksi Keuangan Berbasis AI/Tren]
    Engine --> F3_1
    Engine --> F3_2

    %% Detail Fitur 4
    F4 --> F4_1[Multi-Wallet Management]
    F4 --> F4_2[Konversi Mata Uang Otomatis API]
    F4_1 & F4_2 --> Engine

    %% Detail Fitur 5
    F5 --> F5_1[Ekspor Laporan CSV / Excel / PDF]
    Engine --> F5_1

    %% Penyimpanan Data
    Engine --> DB[(Database Transaksi & Profil Antigravity)]

    %% Styling Grafis
    style User fill:#2b6cb0,stroke:#1a365d,stroke-width:2px,color:#fff
    style Dashboard fill:#4a5568,stroke:#2d3748,stroke-width:2px,color:#fff
    style Engine fill:#2c5282,stroke:#1a365d,stroke-width:2px,color:#fff
    style DB fill:#2d3748,stroke:#1a365d,stroke-width:2px,color:#fff