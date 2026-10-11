/**
 * Tiện ích định dạng ngày tháng chuẩn Việt Nam: Ngày/Tháng/Năm (DD/MM/YYYY)
 */

export function formatDateVN(dateInput: string | number | Date | null | undefined): string {
  if (!dateInput) return '';

  if (typeof dateInput === 'string') {
    const trimmed = dateInput.trim();
    if (!trimmed) return '';

    // Nếu đã ở dạng DD/MM/YYYY
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
      return trimmed;
    }

    // Nếu ở dạng YYYY-MM-DD hoặc YYYY-MM-DDTHH:mm:ss hoặc YYYY-MM-DD HH:mm:ss
    const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
      const [, y, m, d] = isoMatch;
      return `${d}/${m}/${y}`;
    }

    // Nếu ở dạng DD-MM-YYYY
    const dmyMatch = trimmed.match(/^(\d{2})-(\d{2})-(\d{4})/);
    if (dmyMatch) {
      const [, d, m, y] = dmyMatch;
      return `${d}/${m}/${y}`;
    }

    // Nếu chuỗi chứa ngày giờ JS hoặc toLocaleString
    const parsed = new Date(trimmed);
    if (!isNaN(parsed.getTime())) {
      const d = String(parsed.getDate()).padStart(2, '0');
      const m = String(parsed.getMonth() + 1).padStart(2, '0');
      const y = parsed.getFullYear();
      return `${d}/${m}/${y}`;
    }

    return trimmed;
  }

  const dateObj = typeof dateInput === 'number' ? new Date(dateInput) : dateInput;
  if (dateObj instanceof Date && !isNaN(dateObj.getTime())) {
    const d = String(dateObj.getDate()).padStart(2, '0');
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const y = dateObj.getFullYear();
    return `${d}/${m}/${y}`;
  }

  return String(dateInput);
}

/**
 * Định dạng ngày giờ: DD/MM/YYYY HH:mm
 */
export function formatDateTimeVN(dateInput: string | number | Date | null | undefined): string {
  if (!dateInput) return '';

  if (typeof dateInput === 'string') {
    const trimmed = dateInput.trim();
    if (!trimmed) return '';

    // Dạng YYYY-MM-DD HH:mm hoặc YYYY-MM-DDTHH:mm
    const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})/);
    if (match) {
      const [, y, m, d, hh, mm] = match;
      return `${d}/${m}/${y} ${hh}:${mm}`;
    }

    // Nếu chỉ có ngày YYYY-MM-DD
    const isoOnlyDate = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoOnlyDate) {
      const [, y, m, d] = isoOnlyDate;
      return `${d}/${m}/${y}`;
    }

    const parsed = new Date(trimmed);
    if (!isNaN(parsed.getTime())) {
      const d = String(parsed.getDate()).padStart(2, '0');
      const m = String(parsed.getMonth() + 1).padStart(2, '0');
      const y = parsed.getFullYear();
      const hh = String(parsed.getHours()).padStart(2, '0');
      const mm = String(parsed.getMinutes()).padStart(2, '0');
      return `${d}/${m}/${y} ${hh}:${mm}`;
    }

    return trimmed;
  }

  const dateObj = typeof dateInput === 'number' ? new Date(dateInput) : dateInput;
  if (dateObj instanceof Date && !isNaN(dateObj.getTime())) {
    const d = String(dateObj.getDate()).padStart(2, '0');
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const y = dateObj.getFullYear();
    const hh = String(dateObj.getHours()).padStart(2, '0');
    const mm = String(dateObj.getMinutes()).padStart(2, '0');
    return `${d}/${m}/${y} ${hh}:${mm}`;
  }

  return String(dateInput);
}
