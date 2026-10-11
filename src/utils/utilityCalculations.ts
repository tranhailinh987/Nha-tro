import { RentalContract, Roommate } from '../types/rental';

/**
 * Kiểm tra xem kỳ hóa đơn targetMonthYear ('MM/YYYY') có phải là tháng thu phí tạm trú tạm vắng hay không.
 * Quy tắc:
 * - Bắt đầu thu từ tháng khách bắt đầu ở (Tháng đầu tiên, monthDiff = 0).
 * - Trong 11 tháng tiếp theo (hết 12 tháng), không thu nữa (isBillingMonth = false).
 * - Sau mỗi 12 tháng (monthDiff = 12, 24, 36, ...), hệ thống sẽ tính phí tạm trú tiếp vào hóa đơn của tháng đó (isBillingMonth = true).
 */
export function checkIsResidenceFeeBillingMonth(
  startDateStr: string,
  targetMonthYear: string
): {
  isBillingMonth: boolean;
  monthsSinceStart: number;
  cycleYear: number;
  startMonthYearStr: string;
  note: string;
} {
  if (!startDateStr || !targetMonthYear) {
    return {
      isBillingMonth: true,
      monthsSinceStart: 0,
      cycleYear: 1,
      startMonthYearStr: targetMonthYear || '',
      note: 'Kỳ thu phí tạm trú năm thứ 1'
    };
  }

  // Parse targetMonthYear ("MM/YYYY")
  const targetParts = targetMonthYear.split('/');
  const targetM = parseInt(targetParts[0], 10) || 1;
  const targetY = parseInt(targetParts[1], 10) || 2026;

  // Parse startDateStr ("YYYY-MM-DD", "DD/MM/YYYY" or "MM/YYYY")
  let startY: number;
  let startM: number;
  if (startDateStr.includes('-')) {
    const parts = startDateStr.split('-');
    startY = parseInt(parts[0], 10) || 2026;
    startM = parseInt(parts[1], 10) || 1;
  } else if (startDateStr.includes('/')) {
    const parts = startDateStr.split('/');
    if (parts.length === 3) {
      // DD/MM/YYYY
      startM = parseInt(parts[1], 10) || 1;
      startY = parseInt(parts[2], 10) || 2026;
    } else {
      // MM/YYYY
      startM = parseInt(parts[0], 10) || 1;
      startY = parseInt(parts[1], 10) || 2026;
    }
  } else {
    startY = targetY;
    startM = targetM;
  }

  const startMonthYearStr = `${startM.toString().padStart(2, '0')}/${startY}`;
  const monthsSinceStart = (targetY - startY) * 12 + (targetM - startM);

  if (monthsSinceStart < 0) {
    return {
      isBillingMonth: true,
      monthsSinceStart: 0,
      cycleYear: 1,
      startMonthYearStr,
      note: `Bắt đầu ở kỳ ${targetMonthYear} - Thu phí tạm trú Năm 1`
    };
  }

  const isBillingMonth = monthsSinceStart % 12 === 0;
  const cycleYear = Math.floor(monthsSinceStart / 12) + 1;

  if (isBillingMonth) {
    const note = cycleYear === 1
      ? `Tháng đầu tiên bắt đầu ở (${startMonthYearStr}) • Thu phí tạm trú Năm thứ 1`
      : `Hết 12 tháng kể từ kỳ ${startMonthYearStr} (tháng thứ ${monthsSinceStart + 1}) • Tự động thu phí tạm trú Năm thứ ${cycleYear}`;
    return {
      isBillingMonth: true,
      monthsSinceStart,
      cycleYear,
      startMonthYearStr,
      note
    };
  } else {
    const monthsRemainingInCycle = 12 - (monthsSinceStart % 12);
    const note = `Đang trong chu kỳ 12 tháng của Năm thứ ${cycleYear} (Đã thu tại kỳ ${startMonthYearStr}, còn ${monthsRemainingInCycle} tháng nữa đến kỳ thu tiếp)`;
    return {
      isBillingMonth: false,
      monthsSinceStart,
      cycleYear,
      startMonthYearStr,
      note
    };
  }
}

/**
 * Tính số người ở thực tế trong phòng dựa trên Hợp đồng và danh sách Người cùng phòng (Roommates).
 */
export function getRoomOccupantCount(contract?: RentalContract | null, roommates?: Roommate[]): number {
  if (!contract) return 1;
  if (contract.occupantCount && contract.occupantCount > 0) {
    return contract.occupantCount;
  }
  const relatedRoommates = roommates ? roommates.filter((r) => r.contractId === contract.contractId) : [];
  // 1 khách thuê chính + số người cùng phòng
  return 1 + relatedRoommates.length;
}
