import React from 'react';
import { HelpCircle, X } from 'lucide-react';

export default function ConfirmModal({ isOpen, title = 'Konfirmasi Operasi', message, onConfirm, onCancel, confirmText = 'Ya, Lanjutkan', cancelText = 'Batal', isDanger = false }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-card" style={{ maxWidth: '420px', width: '100%', padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: isDanger ? 'var(--expense-color)' : 'var(--text-primary)' }}>
            <HelpCircle size={20} color={isDanger ? 'var(--expense-color)' : 'var(--accent-color)'} />
            {title}
          </h3>
          <button onClick={onCancel} className="btn-delete" style={{ padding: '0.2rem' }}>
            <X size={18} />
          </button>
        </div>

        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: '0 0 1.5rem 0', lineHeight: 1.5 }}>
          {message}
        </p>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button onClick={onCancel} className="btn-toggle" style={{ padding: '0.55rem 1rem', fontSize: '0.85rem' }}>
            {cancelText}
          </button>
          <button 
            onClick={onConfirm} 
            className="btn-submit" 
            style={{ 
              padding: '0.55rem 1rem', 
              fontSize: '0.85rem', 
              width: 'auto',
              background: isDanger ? 'var(--expense-color)' : 'var(--accent-color)'
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
