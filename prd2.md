graph TD
    User([Pengguna Antigravity]) --> Dashboard[Dasbor Utama Aplikasi]
    User --> ProfileCenter[Pusat Profil & Pengaturan]
    
    %% Relasi Pusat Profil
    ProfileCenter --> P1[1. Informasi Akun & Keamanan]
    ProfileCenter --> P2[2. Preferensi Finansial]
    ProfileCenter --> P3[3. Pusat Notifikasi]
    
    %% Dampak Preferensi Finansial ke Engine
    P2 -->|Mata Uang Utama & Siklus Gajian| Engine[Mesin Kalkulasi Transaksi]
    P3 -->|Pengaturan Push/Email| NotifService[Layanan Notifikasi Email/Web Push]
    
    %% Alur Utama (Fitur Sebelumnya)
    Dashboard --> F1[Modul Budgeting & Target]
    Dashboard --> F2[Modul Otomatisasi & Pengingat]
    Dashboard --> F3[Modul Advanced Analytics]
    Dashboard --> F4[Multi-Akun & Konversi Valuta]
    
    F1 & F2 & F4 --> Engine
    Engine --> F3
    Engine --> DB[(Database)]
    
    style User fill:#2b6cb0,stroke:#1a365d,stroke-width:2px,color:#fff
    style ProfileCenter fill:#dd6b20,stroke:#9c4221,stroke-width:2px,color:#fff
    style Engine fill:#2c5282,stroke:#1a365d,stroke-width:2px,color:#fff