import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function Toast({ message, type = 'info', onClose }) {
  if (!message) return null;

  const getIcon = () => {
    switch (type) {
      case 'success': return <CheckCircle2 size={18} color="var(--income-color)" />;
      case 'error': return <AlertCircle size={18} color="var(--expense-color)" />;
      case 'warning': return <AlertCircle size={18} color="#f59e0b" />;
      default: return <Info size={18} color="var(--accent-color)" />;
    }
  };

  const getBorderColor = () => {
    switch (type) {
      case 'success': return 'var(--income-color)';
      case 'error': return 'var(--expense-color)';
      case 'warning': return '#f59e0b';
      default: return 'var(--accent-color)';
    }
  };

  return (
    <div 
      style={{
        position: 'fixed',
        bottom: '1.5rem',
        right: '1.5rem',
        zIndex: 3000,
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        background: '#0b0f19',
        border: `1px solid ${getBorderColor()}`,
        borderRadius: '0.75rem',
        padding: '0.85rem 1.25rem',
        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.7)',
        color: 'var(--text-primary)',
        maxWidth: '400px',
        fontSize: '0.875rem',
        animation: 'toastSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      {getIcon()}
      <span style={{ flex: 1 }}>{message}</span>
      {onClose && (
        <button 
          onClick={onClose} 
          style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', padding: '0.2rem' }}
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
