import React from 'react';
import { Bill, Building } from '../../types';
import { useApp } from '../../context/AppContext';
import { formatVND, formatNumber, formatDate, generateVietQrUrl } from '../../utils/formatters';
import {
  X,
  Printer,
  CheckCircle2,
  Share2,
  QrCode,
  Building2,
  Calendar,
  Zap,
  Droplets,
  DollarSign,
  Download,
} from 'lucide-react';

interface BillReceiptModalProps {
  bill: Bill;
  onClose: () => void;
  onMarkPaid?: (id: string, method: 'bank_transfer' | 'cash') => void;
}

export const BillReceiptModal: React.FC<BillReceiptModalProps> = ({
  bill,
  onClose,
  onMarkPaid,
}) => {
  const { buildings } = useApp();
  const building = buildings.find(b => b.id === bill.buildingId) || buildings[0];

  const vietQrUrl = generateVietQrUrl({
    bankName: building?.bankName || 'Vietcombank',
    accountNumber: building?.bankAccount || '1023849201',
    accountName: building?.bankAccountName || 'NGUYEN VAN HUNG',
    amount: bill.totalAmount,
    description: `P${bill.roomNumber} TIEN TRO THANG ${bill.monthYear.replace('/', '')}`,
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[94vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 print:max-w-none print:shadow-none print:rounded-none">
        
        {/* Header - Not printed */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 print:hidden">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 text-base">Phiếu Thu / Hóa Đơn Tiền Trọ</span>
            <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
              bill.status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
            }`}>
              {bill.status === 'paid' ? 'Đã Thanh Toán' : 'Chưa Thanh Toán'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>In Phiếu Thu</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Invoice Printable Area */}
        <div id="printable-invoice" className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 text-slate-800">
          
          {/* Top Title */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-200">
            <div>
              <div className="text-xl font-extrabold text-blue-900 uppercase tracking-tight">
                {bill.buildingName}
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                {building?.address || 'Khu trọ cao cấp'}
              </p>
              <p className="text-xs text-slate-600">
                Hotline / Zalo: <strong>{building?.landlordPhone}</strong> ({building?.landlordName})
              </p>
            </div>

            <div className="text-left sm:text-right">
              <div className="text-lg font-black text-slate-900">
                PHIẾU THU TIỀN TRỌ
              </div>
              <div className="text-xs font-semibold text-blue-600">
                Kỳ thu: Tháng {bill.monthYear}
              </div>
              <div className="text-[11px] text-slate-400">
                Mã HĐ: #{bill.id.toUpperCase()}
              </div>
            </div>
          </div>

          {/* Tenant & Room Details */}
          <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
            <div>
              <span className="text-slate-400 block font-medium">Khách thuê phòng:</span>
              <strong className="text-slate-900 text-sm block mt-0.5">{bill.tenantName}</strong>
              <span className="text-slate-600">SĐT: {bill.tenantPhone}</span>
            </div>

            <div>
              <span className="text-slate-400 block font-medium">Thông tin phòng:</span>
              <strong className="text-slate-900 text-sm block mt-0.5">Phòng số: {bill.roomNumber}</strong>
              <span className="text-slate-600">Ngày lập phiếu: {formatDate(bill.createdAt)}</span>
            </div>
          </div>

          {/* Breakdown Table */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">Khoản Mục Thu</th>
                  <th className="p-3 text-center">Chỉ Số / Số Lượng</th>
                  <th className="p-3 text-right">Đơn Giá</th>
                  <th className="p-3 text-right">Thành Tiền</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium text-slate-700">
                
                {/* Tiền phòng */}
                <tr>
                  <td className="p-3 font-semibold text-slate-900">1. Tiền thuê phòng trọ</td>
                  <td className="p-3 text-center text-slate-500">1 tháng</td>
                  <td className="p-3 text-right">{formatNumber(bill.roomPrice)} đ</td>
                  <td className="p-3 text-right font-bold text-slate-900">{formatNumber(bill.roomPrice)} đ</td>
                </tr>

                {/* Tiền điện */}
                <tr>
                  <td className="p-3">
                    <div className="font-semibold text-slate-900 flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5 text-amber-500" />
                      <span>2. Tiền điện sinh hoạt</span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      (Mới: {bill.currElectric} - Cũ: {bill.prevElectric})
                    </div>
                  </td>
                  <td className="p-3 text-center font-semibold text-slate-800">{bill.electricKwh} kWh (số)</td>
                  <td className="p-3 text-right">{formatNumber(bill.electricRate)} đ</td>
                  <td className="p-3 text-right font-bold text-slate-900">{formatNumber(bill.electricTotal)} đ</td>
                </tr>

                {/* Tiền nước */}
                <tr>
                  <td className="p-3">
                    <div className="font-semibold text-slate-900 flex items-center gap-1">
                      <Droplets className="w-3.5 h-3.5 text-blue-500" />
                      <span>3. Tiền nước sinh hoạt</span>
                    </div>
                    {bill.waterRateType === 'per_m3' && (
                      <div className="text-[11px] text-slate-500">
                        (Mới: {bill.currWater} - Cũ: {bill.prevWater})
                      </div>
                    )}
                  </td>
                  <td className="p-3 text-center font-semibold text-slate-800">
                    {bill.waterUsage} {bill.waterRateType === 'per_m3' ? 'm³' : 'người'}
                  </td>
                  <td className="p-3 text-right">{formatNumber(bill.waterRate)} đ</td>
                  <td className="p-3 text-right font-bold text-slate-900">{formatNumber(bill.waterTotal)} đ</td>
                </tr>

                {/* Phí mạng internet */}
                {bill.internetFee > 0 && (
                  <tr>
                    <td className="p-3 font-medium">4. Wifi cáp quang</td>
                    <td className="p-3 text-center text-slate-500">1 phòng</td>
                    <td className="p-3 text-right">{formatNumber(bill.internetFee)} đ</td>
                    <td className="p-3 text-right font-semibold text-slate-900">{formatNumber(bill.internetFee)} đ</td>
                  </tr>
                )}

                {/* Phí rác */}
                {bill.garbageFee > 0 && (
                  <tr>
                    <td className="p-3 font-medium">5. Rác &amp; Vệ sinh hành lang</td>
                    <td className="p-3 text-center text-slate-500">1 phòng</td>
                    <td className="p-3 text-right">{formatNumber(bill.garbageFee)} đ</td>
                    <td className="p-3 text-right font-semibold text-slate-900">{formatNumber(bill.garbageFee)} đ</td>
                  </tr>
                )}

                {/* Phí giữ xe */}
                {bill.parkingTotal > 0 && (
                  <tr>
                    <td className="p-3 font-medium">6. Phí gửi xe máy ({bill.parkingCount} xe)</td>
                    <td className="p-3 text-center text-slate-500">{bill.parkingCount} xe</td>
                    <td className="p-3 text-right">{formatNumber(bill.parkingFee)} đ</td>
                    <td className="p-3 text-right font-semibold text-slate-900">{formatNumber(bill.parkingTotal)} đ</td>
                  </tr>
                )}

                {/* Phí khác hoặc giảm giá */}
                {bill.otherFee > 0 && (
                  <tr>
                    <td className="p-3 font-medium">7. Phí khác ({bill.otherFeeNote || 'Phát sinh'})</td>
                    <td className="p-3 text-center text-slate-500">-</td>
                    <td className="p-3 text-right">{formatNumber(bill.otherFee)} đ</td>
                    <td className="p-3 text-right font-semibold text-slate-900">{formatNumber(bill.otherFee)} đ</td>
                  </tr>
                )}

                {bill.discount > 0 && (
                  <tr className="text-emerald-700 bg-emerald-50/50">
                    <td className="p-3 font-semibold">Giảm trừ / Khuyến mãi</td>
                    <td className="p-3 text-center">-</td>
                    <td className="p-3 text-right">-{formatNumber(bill.discount)} đ</td>
                    <td className="p-3 text-right font-bold">-{formatNumber(bill.discount)} đ</td>
                  </tr>
                )}

              </tbody>
              <tfoot className="bg-slate-100 font-extrabold text-sm border-t-2 border-slate-300">
                <tr>
                  <td colSpan={3} className="p-3.5 text-right uppercase tracking-wider text-slate-900">
                    TỔNG CỘNG CẦN THANH TOÁN:
                  </td>
                  <td className="p-3.5 text-right text-base text-blue-700 font-black">
                    {formatVND(bill.totalAmount)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* QR Payment Block */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 flex flex-col sm:flex-row items-center gap-4">
            <div className="w-32 h-32 p-1.5 bg-white rounded-xl shadow-xs border border-slate-200 shrink-0">
              <img
                src={vietQrUrl}
                alt="VietQR Code"
                className="w-full h-full object-contain"
              />
            </div>

            <div className="flex-1 text-xs space-y-1 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-1 text-blue-800 font-bold text-sm">
                <QrCode className="w-4 h-4" />
                <span>Quét mã VietQR chuyển khoản nhanh 24/7</span>
              </div>
              <p className="text-slate-600">
                Ngân hàng: <strong>{building?.bankName}</strong>
              </p>
              <p className="text-slate-600">
                Số tài khoản: <strong className="font-mono text-sm text-slate-900 tracking-wider">{building?.bankAccount}</strong>
              </p>
              <p className="text-slate-600">
                Tên chủ tài khoản: <strong>{building?.bankAccountName}</strong>
              </p>
              <p className="text-slate-500 text-[11px] pt-1">
                Nội dung CK: <span className="font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-slate-200">P{bill.roomNumber} TIEN TRO THANG {bill.monthYear.replace('/', '')}</span>
              </p>
            </div>
          </div>

          {/* Footer note */}
          <div className="text-[11px] text-slate-500 text-center italic border-t border-slate-200 pt-3">
            Vui lòng hoàn tất thanh toán trước ngày 05 hàng tháng. Xin cảm ơn quý khách đã tin tưởng và đồng hành cùng {bill.buildingName}!
          </div>

        </div>

        {/* Modal Actions - Not printed */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between print:hidden">
          <div className="text-xs text-slate-500">
            {bill.status === 'paid' ? (
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Đã thu ngày {formatDate(bill.paidDate)} ({bill.paymentMethod === 'bank_transfer' ? 'Chuyển khoản' : 'Tiền mặt'})
              </span>
            ) : (
              <span>Chưa ghi nhận thanh toán</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {bill.status === 'unpaid' && onMarkPaid && (
              <>
                <button
                  onClick={() => onMarkPaid(bill.id, 'cash')}
                  className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition-colors"
                >
                  Thu Tiền Mặt
                </button>
                <button
                  onClick={() => onMarkPaid(bill.id, 'bank_transfer')}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Xác Nhận Đã Chuyển Khoản</span>
                </button>
              </>
            )}

            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
            >
              Đóng
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
