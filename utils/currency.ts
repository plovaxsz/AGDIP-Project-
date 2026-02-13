export const formatIDR = (value: number, short: boolean = false): string => {
  if (value === 0) return "IDR 0";
  
  if (short) {
    // For Miliar / Triliun shortcuts
    if (Math.abs(value) >= 1_000_000_000_000) { // Triliun
      return `IDR ${(value / 1_000_000_000_000).toLocaleString('id-ID', { maximumFractionDigits: 2 })} T`;
    }
    if (Math.abs(value) >= 1_000_000_000) { // Miliar
      return `IDR ${(value / 1_000_000_000).toLocaleString('id-ID', { maximumFractionDigits: 2 })} M`;
    }
    if (Math.abs(value) >= 1_000_000) { // Juta
      return `IDR ${(value / 1_000_000).toLocaleString('id-ID', { maximumFractionDigits: 2 })} Jt`;
    }
  }

  // Standard Indonesian Format (e.g., 1.500.000,00)
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};