import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { User, Shield, CreditCard, Bell, X, Check, Key, DollarSign } from 'lucide-react';
import { useCurrencyInput } from '../hooks/useCurrencyInput';

export default function ProfileModal({ isOpen, onClose, profile, setProfile, currency, setCurrency, showToast, showConfirm }) {
  const [activeTab, setActiveTab] = useState('account');
  const [paydayDate, setPaydayDate] = useState(1);
  const [emailNotif, setEmailNotif] = useState(true);
  const [pushNotif, setPushNotif] = useState(true);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [email, setEmail] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [oauthAvatar, setOauthAvatar] = useState('');

  const { displayValue: incomeDisplay, rawValue: incomeRaw, handleChange: handleIncomeChange, handleBlur: handleIncomeBlur, setValue: setIncomeValue } = useCurrencyInput(currency);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setEmail(user.email || '');
        const platformPic = user.user_metadata?.avatar_url || user.user_metadata?.picture || '';
        setOauthAvatar(platformPic);

        const currentPic = profile?.avatar_url || user.user_metadata?.custom_avatar_url || user.user_metadata?.avatar_url || user.user_metadata?.picture || '';
        setAvatarUrl(currentPic);

        const savedIncome = localStorage.getItem(`user_monthly_income_${user.id}`);
        if (savedIncome !== null && savedIncome !== undefined) {
          setIncomeValue(parseFloat(savedIncome));
        } else if (profile && profile.monthly_income !== undefined) {
          setIncomeValue(profile.monthly_income || 0);
        }
      }
    });

    if (profile) {
      setPaydayDate(profile.payday_date || 1);
      setEmailNotif(profile.email_notif !== false);
      setPushNotif(profile.push_notif !== false);
      if (profile.avatar_url) setAvatarUrl(profile.avatar_url);
      if (profile.monthly_income !== undefined && profile.monthly_income !== null) {
        setIncomeValue(profile.monthly_income || 0);
      }
    }
  }, [profile, isOpen]);

  if (!isOpen) return null;

  const handleSavePreferences = async () => {
    setLoading(true);
    setSuccessMsg('');
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

      const parsedIncome = parseFloat(incomeRaw || '0');
      const updatedProfile = {
        user_id: user.id,
        payday_date: parseInt(paydayDate),
        email_notif: emailNotif,
        push_notif: pushNotif,
        monthly_income: parsedIncome,
        avatar_url: avatarUrl
      };

      // 1. Sync to Supabase Auth Cloud User Metadata (Persists cross-device)
      await supabase.auth.updateUser({
        data: {
          avatar_url: avatarUrl,
          custom_avatar_url: avatarUrl,
          monthly_income: parsedIncome,
          payday_date: parseInt(paydayDate),
          email_notif: emailNotif,
          push_notif: pushNotif
        }
      });

      // 2. Local Storage Backup
      localStorage.setItem(`user_monthly_income_${user.id}`, parsedIncome.toString());

      // 3. Upsert to Supabase profiles DB table
      const { error } = await supabase.from('profiles').upsert(updatedProfile);
      if (error) {
        delete updatedProfile.monthly_income;
        delete updatedProfile.avatar_url;
        await supabase.from('profiles').upsert(updatedProfile);
        updatedProfile.monthly_income = parsedIncome;
        updatedProfile.avatar_url = avatarUrl;
      }

      setProfile(updatedProfile);
      setSuccessMsg('Pengaturan profil berhasil disimpan!');
      if (showToast) showToast('Profil & foto berhasil diperbarui!', 'success');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (error) {
      if (showToast) showToast('Gagal menyimpan profil: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    const doReset = async () => {
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin,
        });
        if (error) throw error;
        setSuccessMsg('Tautan reset password telah dikirim ke email Anda.');
        if (showToast) showToast('Tautan reset password terkirim!', 'info');
      } catch (err) {
        if (showToast) showToast('Gagal reset password: ' + err.message, 'error');
      }
    };

    if (showConfirm) {
      showConfirm(
        'Ubah Password Akun',
        `Kirim tautan reset kata sandi ke email ${email}?`,
        doReset
      );
    } else {
      doReset();
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card" style={{ maxWidth: '600px', width: '100%', padding: 0, overflow: 'hidden' }}>
        
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <User size={20} color="var(--accent-color)" />
            Pusat Profil & Pengaturan
          </h2>
          <button onClick={onClose} className="btn-delete" style={{ padding: '0.25rem' }}>
            <X size={20} />
          </button>
        </div>

        {/* Modal Layout (Tabs + Content) */}
        <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', minHeight: '350px' }} className="profile-modal-grid">
          
          {/* Tabs Menu */}
          <div style={{ background: 'rgba(255,255,255,0.01)', borderRight: '1px solid var(--border-color)', padding: '1rem 0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <button 
              className={`profile-tab-item ${activeTab === 'account' ? 'active' : ''}`}
              onClick={() => setActiveTab('account')}
            >
              <Shield size={16} />
              <span>Akun & Foto</span>
            </button>
            <button 
              className={`profile-tab-item ${activeTab === 'financial' ? 'active' : ''}`}
              onClick={() => setActiveTab('financial')}
            >
              <CreditCard size={16} />
              <span>Finansial</span>
            </button>
            <button 
              className={`profile-tab-item ${activeTab === 'notif' ? 'active' : ''}`}
              onClick={() => setActiveTab('notif')}
            >
              <Bell size={16} />
              <span>Notifikasi</span>
            </button>
          </div>

          {/* Tab Content Panel */}
          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* TAB 1: ACCOUNT & SECURITY */}
              {activeTab === 'account' && (
                <div>
                  <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: 600 }}>Foto & Informasi Akun</h3>
                  
                  {/* Avatar Preview & Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem', padding: '0.85rem', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                    <div style={{ width: '54px', height: '54px', borderRadius: '50%', overflow: 'hidden', background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="Foto Profil" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.style.display = 'none'; }} />
                      ) : (
                        <span style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0b0f19' }}>
                          {email ? email[0].toUpperCase() : 'U'}
                        </span>
                      )}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Foto Profil Akun</span>
                      {oauthAvatar && avatarUrl !== oauthAvatar && (
                        <button
                          type="button"
                          onClick={() => setAvatarUrl(oauthAvatar)}
                          style={{ background: 'rgba(6, 182, 212, 0.1)', border: '1px solid #06b6d4', color: '#06b6d4', fontSize: '0.725rem', padding: '0.25rem 0.5rem', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          Reset ke Foto Login Platform (Google/GitHub)
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                    <label>URL Foto Profil (Bisa Diubah)</label>
                    <input 
                      type="url" 
                      placeholder="https://example.com/foto.jpg" 
                      value={avatarUrl} 
                      onChange={(e) => setAvatarUrl(e.target.value)} 
                    />
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', marginTop: '0.25rem' }}>
                      Otomatis ditarik dari platform login (Google/GitHub), atau masukkan URL gambar sendiri.
                    </span>
                  </div>

                  <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                    <label>Email Pengguna</label>
                    <input type="text" value={email} disabled style={{ opacity: 0.7 }} />
                  </div>

                  <button 
                    onClick={handleResetPassword} 
                    className="btn-toggle active"
                    style={{ padding: '0.6rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}
                  >
                    <Key size={14} /> Ubah Password Akun
                  </button>
                </div>
              )}

              {/* TAB 2: FINANCIAL PREFERENCES */}
              {activeTab === 'financial' && (
                <div>
                  <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: 600 }}>Preferensi Finansial</h3>

                  <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <DollarSign size={14} color="var(--income-color)" /> Penghasilan Bersih Bulanan ({currency})
                    </label>
                    <input 
                      type="text" 
                      inputMode="numeric"
                      placeholder="e.g. 10.000.000"
                      value={incomeDisplay}
                      onChange={handleIncomeChange}
                      onBlur={handleIncomeBlur}
                      style={{ fontWeight: 600 }}
                    />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginTop: '0.25rem' }}>
                      Digunakan sebagai acuan alokasi keuangan 50-5-30-15 (Pokok, Bebas, Investasi, Darurat).
                    </span>
                  </div>

                  <div className="form-group">
                    <label>Tanggal Siklus Gajian (Payday Cycle)</label>
                    <input 
                      type="number" 
                      min="1" 
                      max="31" 
                      value={paydayDate} 
                      onChange={(e) => setPaydayDate(e.target.value)} 
                    />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginTop: '0.25rem' }}>
                      Perhitungan anggaran bulanan akan dimulai dari tanggal ini setiap bulannya.
                    </span>
                  </div>

                  <div className="form-group" style={{ marginTop: '1rem' }}>
                    <label>Valuta Utama</label>
                    <select 
                      value={currency} 
                      onChange={(e) => setCurrency(e.target.value)} 
                      className="currency-select"
                      style={{ width: '100%', marginTop: '0.25rem' }}
                    >
                      <option value="IDR">IDR (Rp)</option>
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="SGD">SGD ($)</option>
                    </select>
                  </div>
                </div>
              )}

              {/* TAB 3: NOTIFICATIONS */}
              {activeTab === 'notif' && (
                <div>
                  <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: 600 }}>Pusat Notifikasi</h3>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={emailNotif} 
                        onChange={(e) => setEmailNotif(e.target.checked)} 
                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                      />
                      <div>
                        <strong>Notifikasi Email</strong>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>
                          Kirim rekapan tagihan jatuh tempo ke email saya.
                        </span>
                      </div>
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={pushNotif} 
                        onChange={(e) => setPushNotif(e.target.checked)} 
                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                      />
                      <div>
                        <strong>Notifikasi Web Push</strong>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>
                          Tampilkan banner pengingat di browser.
                        </span>
                      </div>
                    </label>
                  </div>
                </div>
              )}

            </div>

            {/* Bottom Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
              <div style={{ color: 'var(--income-color)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                {successMsg && <><Check size={16} /> {successMsg}</>}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={onClose} className="btn-toggle" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                  Tutup
                </button>
                <button 
                  onClick={handleSavePreferences} 
                  disabled={loading} 
                  className="btn-submit" 
                  style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', width: 'auto' }}
                >
                  {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
