export function formatVND(amount: number): string {
  if (isNaN(amount)) return '0 ₫';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(val: number): string {
  if (isNaN(val)) return '0';
  return new Intl.NumberFormat('vi-VN').format(val);
}

export function formatDate(dateString?: string): string {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

export function generateVietQrUrl(params: {
  bankName: string;
  accountNumber: string;
  accountName: string;
  amount: number;
  description: string;
}): string {
  // Normalize bank code for VietQR (MB, VCB, TCB, VPB, ICB, ACB, etc.)
  const bankMap: Record<string, string> = {
    'MBBank': 'MB',
    'Vietcombank': 'VCB',
    'Techcombank': 'TCB',
    'VPBank': 'VPB',
    'VietinBank': 'ICB',
    'BIDV': 'BIDV',
    'ACB': 'ACB',
    'TPBank': 'TPB',
    'Sacombank': 'STB',
    'HDBank': 'HDB',
  };

  const bankCode = bankMap[params.bankName] || 'MB';
  const cleanAcc = encodeURIComponent(params.accountNumber.replace(/\s+/g, ''));
  const cleanName = encodeURIComponent(params.accountName);
  const cleanDesc = encodeURIComponent(params.description.slice(0, 50));
  const amount = Math.max(0, Math.round(params.amount));

  return `https://img.vietqr.io/image/${bankCode}-${cleanAcc}-compact2.png?amount=${amount}&addInfo=${cleanDesc}&accountName=${cleanName}`;
}
