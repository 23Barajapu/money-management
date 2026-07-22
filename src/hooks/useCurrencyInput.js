/**
 * useCurrencyInput — Auto-format nominal input sesuai mata uang aktif.
 *
 * Cara pakai:
 *   const { displayValue, rawValue, handleChange, handleBlur } = useCurrencyInput(currency);
 *
 * - `displayValue` : string terformat untuk ditampilkan di input (e.g. "1.500.000")
 * - `rawValue`     : number asli untuk dikirim ke server (e.g. 1500000)
 * - `handleChange` : event handler onChange input
 * - `handleBlur`   : event handler onBlur untuk re-format saat unfocus
 * - `reset()`      : kosongkan field setelah submit
 * - `setValue(n)`  : set nilai dari luar (e.g. edit mode)
 */

import { useState, useCallback } from 'react';

// Format number → string sesuai locale mata uang
function formatByCurrency(num, currency = 'IDR') {
  if (!num && num !== 0) return '';
  if (isNaN(num)) return '';

  if (currency === 'IDR') {
    // IDR: titik sebagai pemisah ribuan, tanpa desimal
    // e.g. 1500000 → "1.500.000"
    return new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(num);
  }

  // USD, EUR, SGD, dll: koma sebagai pemisah ribuan, titik desimal
  // e.g. 1500.50 → "1,500.50"
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(num);
}

// Bersihkan string terformat → angka murni
function parseFormatted(str, currency = 'IDR') {
  if (!str) return '';
  if (currency === 'IDR') {
    // Buang semua titik (pemisah ribuan IDR)
    return str.replace(/\./g, '').replace(/[^\d]/g, '');
  }
  // Buang semua koma (pemisah ribuan en-US), pertahankan titik desimal
  return str.replace(/,/g, '').replace(/[^\d.]/g, '');
}

export function useCurrencyInput(currency = 'IDR') {
  const [displayValue, setDisplayValue] = useState('');
  const [rawValue, setRawValue] = useState('');

  const handleChange = useCallback((e) => {
    const raw = parseFormatted(e.target.value, currency);

    if (raw === '' || raw === '.') {
      setDisplayValue(raw);
      setRawValue('');
      return;
    }

    const num = currency === 'IDR' ? parseInt(raw, 10) : parseFloat(raw);

    if (isNaN(num)) return;

    setRawValue(num.toString());

    // Jangan format ulang saat user masih mengetik desimal (misal "100.")
    if (currency !== 'IDR' && raw.endsWith('.')) {
      setDisplayValue(formatByCurrency(num, currency) + '.');
    } else {
      setDisplayValue(formatByCurrency(num, currency));
    }
  }, [currency]);

  const handleBlur = useCallback(() => {
    if (!rawValue) {
      setDisplayValue('');
      return;
    }
    const num = parseFloat(rawValue);
    if (!isNaN(num)) {
      setDisplayValue(formatByCurrency(num, currency));
    }
  }, [rawValue, currency]);

  const reset = useCallback(() => {
    setDisplayValue('');
    setRawValue('');
  }, []);

  const setValue = useCallback((num) => {
    if (num === '' || num === null || num === undefined) {
      setDisplayValue('');
      setRawValue('');
      return;
    }
    const n = parseFloat(num);
    setRawValue(n.toString());
    setDisplayValue(formatByCurrency(n, currency));
  }, [currency]);

  return { displayValue, rawValue, handleChange, handleBlur, reset, setValue };
}
