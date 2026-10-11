import { ManagementNode, MonthlyInvoice, RentalContract } from '../types/rental';

/**
 * Chuyển đổi chuỗi tháng/năm 'MM/YYYY' (VD: '09/2026', '11/2026') thành số nguyên để so sánh thứ tự thời gian.
 * Ví dụ: '09/2026' -> 2026 * 12 + 9 = 24321
 */
export const parseMonthYear = (monthYear: string): number => {
  if (!monthYear) return 0;
  const parts = monthYear.trim().split('/');
  if (parts.length === 2) {
    const m = parseInt(parts[0], 10);
    const y = parseInt(parts[1], 10);
    if (!isNaN(m) && !isNaN(y)) {
      return y * 12 + m;
    }
  }
  return 0;
};

/**
 * Lấy danh mục bảng giá của thiết bị.
 * Tự động tổng hợp từ priceCatalog, priceHistory và monthlyPriceSchedule để luôn có danh sách đầy đủ nhất.
 */
export const getDevicePriceCatalog = (device: ManagementNode) => {
  if (device.priceCatalog && device.priceCatalog.length > 0) {
    return [...device.priceCatalog].sort((a, b) => parseMonthYear(b.effectiveFromMonthYear) - parseMonthYear(a.effectiveFromMonthYear));
  }

  // Tự động suy ra từ priceHistory nếu chưa khởi tạo priceCatalog
  if (device.priceHistory && device.priceHistory.length > 0) {
    return device.priceHistory.map((h, idx) => ({
      catalogId: h.recordId || idx + 1,
      effectiveFromMonthYear: h.effectiveMonthYear,
      monthlyRentalPrice: h.newPrice,
      note: h.reason || (h.oldPrice ? `Điều chỉnh từ ${h.oldPrice.toLocaleString('vi-VN')} đ` : 'Giá ban đầu'),
      createdAt: h.changedAt,
      createdByName: h.changedByName
    })).sort((a, b) => parseMonthYear(b.effectiveFromMonthYear) - parseMonthYear(a.effectiveFromMonthYear));
  }

  // Fallback từ monthlyRentalPrice
  return [{
    catalogId: 1,
    effectiveFromMonthYear: '08/2026',
    monthlyRentalPrice: device.monthlyRentalPrice || 0,
    note: 'Đơn giá thuê thiết bị ban đầu',
    createdAt: device.createdAt || '2026-08-01',
    createdByName: 'Quản lý hệ thống'
  }];
};

/**
 * LẤY GIÁ MỚI NHẤT CỦA THIẾT BỊ ĐỂ TÍNH VÀO HÓA ĐƠN THEO THÁNG:
 * Quy tắc:
 * 1. Tìm trong danh mục bảng giá (hoặc lịch sử giá) mức giá có hiệu lực mới nhất <= targetMonthYear.
 * 2. Ví dụ: Nếu tính tháng 09/2026, giá mới nhất lúc đó là 70.000đ.
 * 3. Nếu sang tháng 11/2026, thiết bị đã điều chỉnh lên 82.000đ thì lấy 82.000đ.
 */
export const getDeviceLatestPriceForMonth = (
  device: ManagementNode,
  targetMonthYear: string
): number => {
  const targetVal = parseMonthYear(targetMonthYear);

  // 1. Kiểm tra priceCatalog nếu có
  if (device.priceCatalog && device.priceCatalog.length > 0) {
    const validEntries = device.priceCatalog
      .filter((entry) => parseMonthYear(entry.effectiveFromMonthYear) <= targetVal)
      .sort((a, b) => parseMonthYear(b.effectiveFromMonthYear) - parseMonthYear(a.effectiveFromMonthYear));

    if (validEntries.length > 0) {
      return validEntries[0].monthlyRentalPrice;
    }
  }

  // 2. Kiểm tra priceHistory
  if (device.priceHistory && device.priceHistory.length > 0) {
    const validHistory = device.priceHistory
      .filter((h) => parseMonthYear(h.effectiveMonthYear) <= targetVal)
      .sort((a, b) => parseMonthYear(b.effectiveMonthYear) - parseMonthYear(a.effectiveMonthYear));

    if (validHistory.length > 0) {
      return validHistory[0].newPrice;
    }
  }

  // 3. Kiểm tra monthlyPriceSchedule
  if (device.monthlyPriceSchedule) {
    if (device.monthlyPriceSchedule[targetMonthYear] !== undefined) {
      return device.monthlyPriceSchedule[targetMonthYear];
    }
    const pastMonths = Object.keys(device.monthlyPriceSchedule)
      .filter((my) => parseMonthYear(my) <= targetVal)
      .sort((a, b) => parseMonthYear(b) - parseMonthYear(a));

    if (pastMonths.length > 0) {
      return device.monthlyPriceSchedule[pastMonths[0]];
    }
  }

  return device.monthlyRentalPrice || (!device.isShared ? (device.unitPrice || 0) : 0);
};

/**
 * Lấy mức giá mới nhất hiện hành của thiết bị (mức giá đang có hiệu lực mới nhất trong danh mục)
 */
export const getDeviceCurrentLatestPrice = (device: ManagementNode): number => {
  const catalog = getDevicePriceCatalog(device);
  if (catalog.length > 0) {
    return catalog[0].monthlyRentalPrice;
  }
  return device.monthlyRentalPrice || (!device.isShared ? (device.unitPrice || 0) : 0);
};

/**
 * Tạo chi tiết thiết bị phòng kèm đơn giá mới nhất của tháng tính tiền:
 */
export const buildDeviceBreakdownForMonth = (
  roomDevices: ManagementNode[],
  targetMonthYear: string
) => {
  return roomDevices.map((d) => {
    const latestPrice = getDeviceLatestPriceForMonth(d, targetMonthYear);
    return {
      deviceNodeId: d.nodeId,
      deviceCode: d.nodeCode,
      deviceName: d.nodeName,
      monthlyPrice: latestPrice,
      category: d.deviceCategory,
      snapshotAppliedAt: new Date().toISOString().split('T')[0]
    };
  });
};
