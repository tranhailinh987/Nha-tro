import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatVND, formatNumber, formatDate, generateVietQrUrl } from '../../utils/formatters';
import { BillReceiptModal } from '../landlord/BillReceiptModal';
import {
  User,
  Home,
  QrCode,
  Zap,
  Droplets,
  Wifi,
  Trash2,
  Bike,
  CheckCircle2,
  AlertCircle,
  Wrench,
  Send,
  ShieldCheck,
  Phone,
  Clock,
  Sparkles,
} from 'lucide-react';

export const TenantPortal: React.FC = () => {
  const {
    rooms,
    buildings,
    tenants,
    bills,
    incidents,
    addIncident,
    markBillPaid,
  } = useApp();

  // Tenant picks their active room
  const [selectedTenantId, setSelectedTenantId] = useState<string>(tenants[0]?.id || '');
  const activeTenant = tenants.find(t => t.id === selectedTenantId) || tenants[0];
  const activeRoom = rooms.find(r => r.id === activeTenant?.roomId);
  const activeBuilding = buildings.find(b => b.id === activeRoom?.buildingId);

  // Latest bill for this room
  const roomBills = bills.filter(b => b.roomId === activeRoom?.id);
  const latestBill = roomBills[0];

  // Incident form
  const [showIncidentForm, setShowIncidentForm] = useState(false);
  const [incidentSuccess, setIncidentSuccess] = useState(false);
  const [incTitle, setIncTitle] = useState('');
  const [incDesc, setIncDesc] = useState('');
  const [incCategory, setIncCategory] = useState<'electricity' | 'water' | 'appliance' | 'other'>('appliance');

  // Receipt modal
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // VietQR for latest bill
  const vietQrUrl = latestBill && activeBuilding ? generateVietQrUrl({
    bankName: activeBuilding.bankName,
    accountNumber: activeBuilding.bankAccount,
    accountName: activeBuilding.bankAccountName,
    amount: latestBill.totalAmount,
    description: `P${latestBill.roomNumber} TIEN TRO THANG ${latestBill.monthYear.replace('/', '')}`,
  }) : '';

  const handleIncidentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRoom || !activeTenant) return;

    addIncident({
      roomId: activeRoom.id,
      roomNumber: activeRoom.roomNumber,
      buildingId: activeRoom.buildingId,
      title: incTitle.trim(),
      description: incDesc.trim(),
      category: incCategory,
      priority: 'high',
      status: 'pending',
      reportedBy: activeTenant.fullName,
      reportedPhone: activeTenant.phone,
    });

    setIncidentSuccess(true);
    setIncTitle('');
    setIncDesc('');
  };

  if (!activeTenant || !activeRoom) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
        <p className="text-slate-500 text-sm">Hiện chưa có dữ liệu khách thuê nào.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      
      {/* Top Tenant Selector Header */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 mb-1 border border-blue-200">
            <User className="w-3.5 h-3.5" />
            <span>Cổng Tự Phục Vụ Dành Cho Khách Đang Thuê Phòng</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Xin chào, {activeTenant.fullName}!
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Phòng <strong>{activeRoom.roomNumber}</strong> • {activeBuilding?.name} ({activeRoom.district})
          </p>
        </div>

        {/* Quick Tenant Switcher (For Demo & Testing) */}
        <div className="w-full sm:w-auto flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-500 whitespace-nowrap">Đổi phòng:</label>
          <select
            value={selectedTenantId}
            onChange={e => setSelectedTenantId(e.target.value)}
            className="w-full sm:w-60 text-xs font-bold p-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-800 outline-none"
          >
            {tenants.map(t => (
              <option key={t.id} value={t.id}>
                P.{t.roomNumber} - {t.fullName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Monthly Bill & Payment Block */}
      {latestBill ? (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-300 block">
                Hóa Đơn Tiền Trọ &amp; Điện Nước
              </span>
              <div className="text-3xl font-black text-white mt-1">
                Kỳ Tháng {latestBill.monthYear}
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Hạn đóng tiền: <strong>Ngày 05 hàng tháng</strong> • Cần đối soát xin liên hệ chủ trọ
              </p>
            </div>

            <div className="flex flex-col items-start sm:items-end gap-1">
              <span className="text-xs text-slate-300">Tổng số tiền cần thanh toán:</span>
              <span className="text-2xl sm:text-3xl font-black text-amber-400">
                {formatVND(latestBill.totalAmount)}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-bold mt-1 ${
                latestBill.status === 'paid' ? 'bg-emerald-500 text-white' : 'bg-amber-400 text-slate-900'
              }`}>
                {latestBill.status === 'paid' ? '✓ Đã Thanh Toán' : '● Chưa Thanh Toán'}
              </span>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            
            {/* Quick Usage Breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-slate-400 block font-medium">Tiền phòng trọ</span>
                <span className="text-base font-bold text-slate-900 block mt-1">
                  {formatVND(latestBill.roomPrice)}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200">
                <span className="text-amber-800 flex items-center gap-1 font-medium">
                  <Zap className="w-3.5 h-3.5" /> Điện ({latestBill.electricKwh} số)
                </span>
                <span className="text-base font-bold text-amber-950 block mt-1">
                  {formatVND(latestBill.electricTotal)}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200">
                <span className="text-blue-800 flex items-center gap-1 font-medium">
                  <Droplets className="w-3.5 h-3.5" /> Nước ({latestBill.waterUsage} {latestBill.waterRateType === 'per_m3' ? 'm³' : 'người'})
                </span>
                <span className="text-base font-bold text-blue-950 block mt-1">
                  {formatVND(latestBill.waterTotal)}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-slate-400 block font-medium">Phí dịch vụ chung</span>
                <span className="text-base font-bold text-slate-900 block mt-1">
                  {formatVND(latestBill.internetFee + latestBill.garbageFee + latestBill.parkingTotal)}
                </span>
              </div>
            </div>

            {/* QR Payment Code Section */}
            {latestBill.status === 'unpaid' ? (
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row items-center gap-6">
                <div className="w-40 h-40 p-2 bg-white rounded-2xl shadow-sm border border-slate-200 shrink-0">
                  <img
                    src={vietQrUrl}
                    alt="VietQR Chuyển Khoản"
                    className="w-full h-full object-contain"
                  />
                </div>

                <div className="flex-1 space-y-2 text-center md:text-left text-xs text-slate-700">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-800 font-bold text-xs">
                    <QrCode className="w-3.5 h-3.5" />
                    <span>Mở app ngân hàng / Momo quét mã VietQR để thanh toán</span>
                  </div>

                  <p className="pt-1">
                    Ngân hàng: <strong className="text-slate-900">{activeBuilding?.bankName}</strong>
                  </p>
                  <p>
                    Số tài khoản: <strong className="font-mono text-sm text-slate-900 tracking-wider">{activeBuilding?.bankAccount}</strong>
                  </p>
                  <p>
                    Chủ tài khoản: <strong>{activeBuilding?.bankAccountName}</strong>
                  </p>
                  <p>
                    Số tiền: <strong className="text-base text-blue-700">{formatVND(latestBill.totalAmount)}</strong>
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Nội dung chuyển khoản chuẩn: <span className="font-mono font-bold bg-white px-2 py-0.5 rounded border border-slate-200">P{latestBill.roomNumber} TIEN TRO THANG {latestBill.monthYear.replace('/', '')}</span>
                  </p>

                  <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-2">
                    <button
                      onClick={() => markBillPaid(latestBill.id, 'bank_transfer')}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Tôi Đã Chuyển Khoản Xong</span>
                    </button>

                    <button
                      onClick={() => setShowReceiptModal(true)}
                      className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-semibold transition-colors"
                    >
                      Xem Chi Tiết Phiếu Thu
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-emerald-900 text-sm">
                      Bạn đã hoàn tất thanh toán tiền phòng tháng {latestBill.monthYear}!
                    </h4>
                    <p className="text-xs text-emerald-700">
                      Cảm ơn bạn đã đóng tiền phòng đúng hạn. Chúc bạn có thời gian sinh sống vui vẻ và thoải mái.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowReceiptModal(true)}
                  className="px-4 py-2 bg-white text-emerald-800 border border-emerald-300 hover:bg-emerald-100 rounded-xl text-xs font-bold transition-colors shadow-2xs"
                >
                  Xem Lại Phiếu Thu
                </button>
              </div>
            )}

          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center">
          <p className="text-slate-500 text-sm">Chưa có hóa đơn nào phát sinh trong tháng này.</p>
        </div>
      )}

      {/* Incident / Maintenance Request Section */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-50 text-amber-700 rounded-xl">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">
                Báo Hỏng Đồ Đạc &amp; Yêu Cầu Sửa Chữa
              </h3>
              <p className="text-xs text-slate-500">
                Gặp sự cố về điện, nước, máy lạnh? Gửi ngay để chủ trọ cử thợ qua kiểm tra
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setShowIncidentForm(!showIncidentForm);
              setIncidentSuccess(false);
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
          >
            {showIncidentForm ? 'Đóng form' : '+ Báo Sự Cố Mới'}
          </button>
        </div>

        {/* Incident Form */}
        {showIncidentForm && (
          <div className="pt-2">
            {incidentSuccess ? (
              <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <h4 className="font-bold text-emerald-900 text-sm">Yêu cầu đã được gửi đến chủ nhà!</h4>
                <p className="text-xs text-emerald-700">
                  Chủ nhà đã nhận được thông báo và sẽ liên hệ với bạn trong thời gian sớm nhất.
                </p>
                <button
                  onClick={() => {
                    setShowIncidentForm(false);
                    setIncidentSuccess(false);
                  }}
                  className="mt-1 px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold"
                >
                  Hoàn tất
                </button>
              </div>
            ) : (
              <form onSubmit={handleIncidentSubmit} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Loại thiết bị gặp sự cố
                    </label>
                    <select
                      value={incCategory}
                      onChange={e => setIncCategory(e.target.value as any)}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
                    >
                      <option value="appliance">Thiết bị (Máy lạnh, quạt, bình nóng lạnh)</option>
                      <option value="water">Ống nước / Vòi sen / Toilet</option>
                      <option value="electricity">Điện / Bóng đèn / Ổ cắm</option>
                      <option value="other">Khác</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Tóm tắt sự cố <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="VD: Điều hòa chảy nước, vòi sen bị gãy ren..."
                      value={incTitle}
                      onChange={e => setIncTitle(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Mô tả chi tiết &amp; thời gian bạn có ở nhà để thợ ghé
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Mô tả hiện tượng và ghi chú khung giờ có người ở phòng để thợ đến sửa..."
                    value={incDesc}
                    onChange={e => setIncDesc(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowIncidentForm(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Gửi Yêu Cầu Cho Chủ Nhà</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Existing Incidents for this room */}
        <div className="space-y-2 pt-2">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Lịch Sử Báo Sự Cố Phòng {activeRoom.roomNumber}
          </h4>
          {incidents.filter(i => i.roomId === activeRoom.id).length === 0 ? (
            <p className="text-xs text-slate-400 italic">Không có sự cố nào đang báo hỏng.</p>
          ) : (
            incidents.filter(i => i.roomId === activeRoom.id).map(inc => (
              <div key={inc.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-slate-800">{inc.title}</div>
                  <div className="text-[11px] text-slate-500">Ngày báo: {formatDate(inc.createdAt)}</div>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                  inc.status === 'resolved' ? 'bg-emerald-100 text-emerald-800' :
                  inc.status === 'in_progress' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {inc.status === 'resolved' ? 'Đã giải quyết xong' :
                   inc.status === 'in_progress' ? 'Đang sửa chữa' : 'Chờ chủ nhà tiếp nhận'}
                </span>
              </div>
            ))
          )}
        </div>

      </div>

      {/* House Rules & Useful Guidelines */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
        <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-blue-600" />
          <span>Nội Quy &amp; Thông Tin Hữu Ích Khu Trọ</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-700">
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
            <strong className="text-slate-900 block font-bold">1. Giờ Giấc &amp; Ra Vào</strong>
            <p className="text-slate-600">
              Cửa chính ra vào bằng khóa vân tay 24/7. Vui lòng không cho người lạ đi theo vào dãy trọ khi mở cửa.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
            <strong className="text-slate-900 block font-bold">2. An Toàn PCCC &amp; Điện Nước</strong>
            <p className="text-slate-600">
              Tắt bếp và ngắt các thiết bị điện công suất lớn khi ra khỏi phòng. Bình chữa cháy đặt sẵn ở mỗi đầu hành lang.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
            <strong className="text-slate-900 block font-bold">3. Bãi Để Xe Máy</strong>
            <p className="text-slate-600">
              Xếp xe ngay ngắn theo vạch kẻ sơn trong hầm, khóa cổ cẩn thận. Bãi xe có camera an ninh 24/24.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
            <strong className="text-slate-900 block font-bold">4. Giữ Gìn Vệ Sinh &amp; Trật Tự</strong>
            <p className="text-slate-600">
              Bỏ rác đúng giờ tại điểm tập kết. Sau 22h30 vui lòng giữ trật tự chung, không mở loa to làm phiền các phòng bên cạnh.
            </p>
          </div>
        </div>

        {/* Landlord Contact */}
        <div className="pt-2 flex items-center justify-between text-xs text-slate-600 border-t border-slate-100">
          <div>
            Chủ nhà: <strong>{activeBuilding?.landlordName}</strong>
          </div>
          <a
            href={`tel:${activeBuilding?.landlordPhone?.replace(/\s+/g, '')}`}
            className="flex items-center gap-1.5 text-blue-600 font-bold hover:underline"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Gọi hotline: {activeBuilding?.landlordPhone}</span>
          </a>
        </div>
      </div>

      {/* Bill Receipt Modal */}
      {showReceiptModal && latestBill && (
        <BillReceiptModal
          bill={latestBill}
          onClose={() => setShowReceiptModal(false)}
          onMarkPaid={(id, method) => {
            markBillPaid(id, method);
            setShowReceiptModal(false);
          }}
        />
      )}

    </div>
  );
};
