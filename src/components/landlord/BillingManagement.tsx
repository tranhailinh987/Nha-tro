import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Bill, Room } from '../../types';
import { formatVND, formatNumber, formatDate } from '../../utils/formatters';
import { BillReceiptModal } from './BillReceiptModal';
import {
  Zap,
  Droplets,
  Plus,
  Receipt,
  CheckCircle2,
  AlertCircle,
  Copy,
  Printer,
  Trash2,
  Search,
  Filter,
  ArrowUpRight,
  Calculator,
  MessageSquare,
} from 'lucide-react';

export const BillingManagement: React.FC = () => {
  const {
    buildings,
    rooms,
    tenants,
    bills,
    createBill,
    markBillPaid,
    deleteBill,
    selectedBuildingId,
  } = useApp();

  // Active view modal
  const [selectedBillForReceipt, setSelectedBillForReceipt] = useState<Bill | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'unpaid' | 'paid'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedBillId, setCopiedBillId] = useState<string | null>(null);

  // New Bill Form State
  const [formRoomId, setFormRoomId] = useState('');
  const [formMonthYear, setFormMonthYear] = useState('10/2026');
  const [formPrevElectric, setFormPrevElectric] = useState<number>(0);
  const [formCurrElectric, setFormCurrElectric] = useState<number>(0);
  const [formPrevWater, setFormPrevWater] = useState<number>(0);
  const [formCurrWater, setFormCurrWater] = useState<number>(0);
  const [formWaterPeople, setFormWaterPeople] = useState<number>(1);
  const [formParkingCount, setFormParkingCount] = useState<number>(1);
  const [formOtherFee, setFormOtherFee] = useState<number>(0);
  const [formOtherFeeNote, setFormOtherFeeNote] = useState<string>('');
  const [formDiscount, setFormDiscount] = useState<number>(0);
  const [formNotes, setFormNotes] = useState<string>('');

  // Selected room for bill creation
  const selectedRoomForCreate = rooms.find(r => r.id === formRoomId);
  const selectedTenantForCreate = tenants.find(t => t.roomId === formRoomId);

  // When room is picked in form, auto fill previous reading from existing latest bill
  const handlePickRoom = (roomId: string) => {
    setFormRoomId(roomId);
    const room = rooms.find(r => r.id === roomId);
    if (!room) return;

    // Find previous bill if any
    const prevBills = bills.filter(b => b.roomId === roomId);
    if (prevBills.length > 0) {
      const lastBill = prevBills[0];
      setFormPrevElectric(lastBill.currElectric);
      setFormCurrElectric(lastBill.currElectric + 120);
      setFormPrevWater(lastBill.currWater);
      setFormCurrWater(lastBill.currWater + 5);
    } else {
      setFormPrevElectric(1000);
      setFormCurrElectric(1120);
      setFormPrevWater(50);
      setFormCurrWater(55);
    }
  };

  // Filter bills
  const filteredBills = bills.filter(b => {
    if (selectedBuildingId !== 'all' && b.buildingId !== selectedBuildingId) return false;
    if (filterStatus !== 'all' && b.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        b.roomNumber.toLowerCase().includes(q) ||
        b.tenantName.toLowerCase().includes(q) ||
        b.buildingName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Calculate stats
  const totalAmountDue = filteredBills.reduce((acc, b) => acc + b.totalAmount, 0);
  const totalPaid = filteredBills.filter(b => b.status === 'paid').reduce((acc, b) => acc + b.totalAmount, 0);
  const totalUnpaid = filteredBills.filter(b => b.status === 'unpaid').reduce((acc, b) => acc + b.totalAmount, 0);

  // Compute live calculations for modal
  const calcElectricKwh = Math.max(0, formCurrElectric - formPrevElectric);
  const calcElectricTotal = calcElectricKwh * (selectedRoomForCreate?.electricityRate || 3800);

  const isWaterByPerson = selectedRoomForCreate?.waterRateType === 'per_person';
  const calcWaterUsage = isWaterByPerson ? formWaterPeople : Math.max(0, formCurrWater - formPrevWater);
  const calcWaterTotal = calcWaterUsage * (selectedRoomForCreate?.waterRate || 20000);

  const calcParkingTotal = formParkingCount * (selectedRoomForCreate?.parkingFee || 120000);
  const calcRoomPrice = selectedRoomForCreate?.price || 0;
  const calcInternetFee = selectedRoomForCreate?.internetFee || 0;
  const calcGarbageFee = selectedRoomForCreate?.garbageFee || 0;

  const calcTotalAmount =
    calcRoomPrice +
    calcElectricTotal +
    calcWaterTotal +
    calcInternetFee +
    calcGarbageFee +
    calcParkingTotal +
    formOtherFee -
    formDiscount;

  const handleCreateBillSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoomForCreate) {
      alert('Vui lòng chọn phòng để lập hóa đơn');
      return;
    }

    createBill({
      roomId: selectedRoomForCreate.id,
      roomNumber: selectedRoomForCreate.roomNumber,
      buildingId: selectedRoomForCreate.buildingId,
      buildingName: selectedRoomForCreate.buildingName,
      tenantName: selectedTenantForCreate?.fullName || 'Khách thuê',
      tenantPhone: selectedTenantForCreate?.phone || '',
      monthYear: formMonthYear,
      createdAt: new Date().toISOString().split('T')[0],
      roomPrice: calcRoomPrice,
      prevElectric: formPrevElectric,
      currElectric: formCurrElectric,
      electricKwh: calcElectricKwh,
      electricRate: selectedRoomForCreate.electricityRate,
      electricTotal: calcElectricTotal,
      prevWater: isWaterByPerson ? 0 : formPrevWater,
      currWater: isWaterByPerson ? 0 : formCurrWater,
      waterUsage: calcWaterUsage,
      waterRate: selectedRoomForCreate.waterRate,
      waterRateType: selectedRoomForCreate.waterRateType,
      waterTotal: calcWaterTotal,
      internetFee: calcInternetFee,
      garbageFee: calcGarbageFee,
      parkingCount: formParkingCount,
      parkingFee: selectedRoomForCreate.parkingFee,
      parkingTotal: calcParkingTotal,
      otherFee: formOtherFee,
      otherFeeNote: formOtherFeeNote,
      discount: formDiscount,
      totalAmount: calcTotalAmount,
      status: 'unpaid',
      notes: formNotes || `Tiền trọ tháng ${formMonthYear}`,
    });

    setShowCreateModal(false);
    setFormRoomId('');
  };

  const copyZaloMessage = (b: Bill) => {
    const text = `[HÓA ĐƠN TIỀN TRỌ THÁNG ${b.monthYear}]
Kính gửi: ${b.tenantName} - Phòng ${b.roomNumber} (${b.buildingName})
- Tiền phòng: ${formatNumber(b.roomPrice)} đ
- Tiền điện (${b.electricKwh} số x ${formatNumber(b.electricRate)}đ): ${formatNumber(b.electricTotal)} đ
- Tiền nước (${b.waterUsage} ${b.waterRateType === 'per_m3' ? 'm3' : 'người'}): ${formatNumber(b.waterTotal)} đ
- Dịch vụ (Wifi, rác, xe): ${formatNumber(b.internetFee + b.garbageFee + b.parkingTotal)} đ
=> TỔNG CỘNG: ${formatNumber(b.totalAmount)} đ.
Vui lòng quét mã VietQR hoặc chuyển khoản trước ngày 05. Xin cảm ơn bạn!`;

    navigator.clipboard.writeText(text);
    setCopiedBillId(b.id);
    setTimeout(() => setCopiedBillId(null), 2500);
  };

  // Rooms that have occupants
  const occupiedRooms = rooms.filter(r => r.status === 'occupied' || tenants.some(t => t.roomId === r.id));

  return (
    <div className="space-y-6">
      
      {/* Top Controls & Financial Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block">Tổng Doanh Thu Cần Thu</span>
          <span className="text-xl font-black text-slate-900 block mt-1">
            {formatVND(totalAmountDue)}
          </span>
          <span className="text-[11px] text-slate-400 font-medium">({filteredBills.length} hóa đơn kỳ này)</span>
        </div>

        <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200 shadow-xs">
          <span className="text-xs font-semibold text-emerald-700 block">Đã Thu Thành Công</span>
          <span className="text-xl font-black text-emerald-900 block mt-1">
            {formatVND(totalPaid)}
          </span>
          <span className="text-[11px] text-emerald-700 font-medium">
            {filteredBills.filter(b => b.status === 'paid').length} phòng đã đóng tiền
          </span>
        </div>

        <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200 shadow-xs">
          <span className="text-xs font-semibold text-amber-800 block">Còn Nợ / Chưa Thu</span>
          <span className="text-xl font-black text-amber-900 block mt-1">
            {formatVND(totalUnpaid)}
          </span>
          <span className="text-[11px] text-amber-700 font-medium">
            {filteredBills.filter(b => b.status === 'unpaid').length} phòng chưa thanh toán
          </span>
        </div>
      </div>

      {/* Action Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        
        {/* Search & Status Filters */}
        <div className="flex flex-1 flex-col sm:flex-row items-center gap-2">
          <div className="w-full sm:w-64 flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo số phòng, tên khách..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-transparent outline-none"
            />
          </div>

          <div className="flex items-center gap-1 w-full sm:w-auto">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                filterStatus === 'all'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Tất cả ({bills.length})
            </button>
            <button
              onClick={() => setFilterStatus('unpaid')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                filterStatus === 'unpaid'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-slate-100 text-amber-800 hover:bg-slate-200'
              }`}
            >
              Chưa thu ({bills.filter(b => b.status === 'unpaid').length})
            </button>
            <button
              onClick={() => setFilterStatus('paid')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                filterStatus === 'paid'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-emerald-800 hover:bg-slate-200'
              }`}
            >
              Đã thu ({bills.filter(b => b.status === 'paid').length})
            </button>
          </div>
        </div>

        {/* Create Bill Button */}
        <button
          onClick={() => {
            setShowCreateModal(true);
            if (occupiedRooms.length > 0 && !formRoomId) {
              handlePickRoom(occupiedRooms[0].id);
            }
          }}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Nhập Điện Nước &amp; Lập Hóa Đơn</span>
        </button>

      </div>

      {/* Bills Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
              <tr>
                <th className="p-3.5">Phòng / Dãy</th>
                <th className="p-3.5">Khách Thuê</th>
                <th className="p-3.5">Kỳ Thu</th>
                <th className="p-3.5">Tiền Phòng</th>
                <th className="p-3.5">Điện / Nước</th>
                <th className="p-3.5">Tổng Tiền</th>
                <th className="p-3.5">Trạng Thái</th>
                <th className="p-3.5 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredBills.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    Không có hóa đơn nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredBills.map(b => (
                  <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                    
                    {/* Room */}
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900 text-sm">
                        Phòng {b.roomNumber}
                      </div>
                      <div className="text-[11px] text-slate-500 line-clamp-1">
                        {b.buildingName}
                      </div>
                    </td>

                    {/* Tenant */}
                    <td className="p-3.5">
                      <div className="font-semibold text-slate-800">{b.tenantName}</div>
                      <div className="text-[11px] text-slate-500">{b.tenantPhone}</div>
                    </td>

                    {/* Month */}
                    <td className="p-3.5">
                      <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                        {b.monthYear}
                      </span>
                    </td>

                    {/* Rent */}
                    <td className="p-3.5 font-semibold text-slate-800">
                      {formatNumber(b.roomPrice)} đ
                    </td>

                    {/* Electric / Water */}
                    <td className="p-3.5">
                      <div className="flex items-center gap-1 text-slate-700">
                        <Zap className="w-3 h-3 text-amber-500" />
                        <span>{b.electricKwh} số ({formatNumber(b.electricTotal)} đ)</span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-700 mt-0.5">
                        <Droplets className="w-3 h-3 text-blue-500" />
                        <span>{b.waterUsage} {b.waterRateType === 'per_m3' ? 'm³' : 'người'} ({formatNumber(b.waterTotal)} đ)</span>
                      </div>
                    </td>

                    {/* Total Amount */}
                    <td className="p-3.5">
                      <div className="font-black text-slate-900 text-sm">
                        {formatVND(b.totalAmount)}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="p-3.5">
                      {b.status === 'paid' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3 h-3" /> Đã thu
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                          <AlertCircle className="w-3 h-3" /> Chưa thu
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* View Receipt */}
                        <button
                          onClick={() => setSelectedBillForReceipt(b)}
                          className="p-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                          title="Xem & in phiếu thu có mã VietQR"
                        >
                          <Receipt className="w-4 h-4" />
                        </button>

                        {/* Copy Zalo format */}
                        <button
                          onClick={() => copyZaloMessage(b)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            copiedBillId === b.id
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                          title="Sao chép nội dung gửi Zalo cho khách"
                        >
                          {copiedBillId === b.id ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : (
                            <MessageSquare className="w-4 h-4" />
                          )}
                        </button>

                        {/* Mark Paid Quick */}
                        {b.status === 'unpaid' && (
                          <button
                            onClick={() => markBillPaid(b.id, 'bank_transfer')}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition-colors"
                            title="Xác nhận đã nhận thanh toán"
                          >
                            Đã Thu
                          </button>
                        )}

                        {/* Delete */}
                        <button
                          onClick={() => {
                            if (window.confirm(`Xóa hóa đơn phòng ${b.roomNumber} kỳ ${b.monthYear}?`)) {
                              deleteBill(b.id);
                            }
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Xóa hóa đơn"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bill Receipt Modal */}
      {selectedBillForReceipt && (
        <BillReceiptModal
          bill={selectedBillForReceipt}
          onClose={() => setSelectedBillForReceipt(null)}
          onMarkPaid={(id, method) => {
            markBillPaid(id, method);
            setSelectedBillForReceipt(null);
          }}
        />
      )}

      {/* Modal Lập Hóa Đơn Mới */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-base">
                  Nhập Điện Nước &amp; Tạo Hóa Đơn Tháng
                </h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateBillSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
              
              {/* Room & Period Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Chọn phòng thuê <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formRoomId}
                    onChange={e => handlePickRoom(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="">-- Chọn phòng trọ --</option>
                    {rooms.map(r => {
                      const t = tenants.find(tenant => tenant.roomId === r.id);
                      return (
                        <option key={r.id} value={r.id}>
                          Phòng {r.roomNumber} - {r.buildingName} {t ? `(${t.fullName})` : '(Trống)'}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Kỳ hóa đơn (Tháng/Năm) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formMonthYear}
                    onChange={e => setFormMonthYear(e.target.value)}
                    placeholder="10/2026"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none font-semibold text-blue-700"
                  />
                </div>
              </div>

              {selectedRoomForCreate && (
                <>
                  {/* Electricity Section */}
                  <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                        <Zap className="w-4 h-4 text-amber-600" />
                        <span>Chỉ Số Điện Sinh Hoạt (Đơn giá: {formatNumber(selectedRoomForCreate.electricityRate)} đ/kWh)</span>
                      </span>
                      <span className="text-xs font-black text-amber-900">
                        {calcElectricKwh} kWh = {formatVND(calcElectricTotal)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                          Số điện cũ (kỳ trước)
                        </label>
                        <input
                          type="number"
                          value={formPrevElectric}
                          onChange={e => setFormPrevElectric(Number(e.target.value))}
                          className="w-full text-xs p-2 rounded-xl border border-slate-300 bg-white"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                          Số điện mới (kỳ này)
                        </label>
                        <input
                          type="number"
                          value={formCurrElectric}
                          onChange={e => setFormCurrElectric(Number(e.target.value))}
                          className="w-full text-xs p-2 rounded-xl border border-slate-300 bg-white font-bold text-amber-800"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Water Section */}
                  <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                        <Droplets className="w-4 h-4 text-blue-600" />
                        <span>Chỉ Số Nước Sinh Hoạt ({isWaterByPerson ? `Theo đầu người: ${formatNumber(selectedRoomForCreate.waterRate)} đ/người` : `Đồng hồ nước: ${formatNumber(selectedRoomForCreate.waterRate)} đ/m³`})</span>
                      </span>
                      <span className="text-xs font-black text-blue-900">
                        {calcWaterUsage} {isWaterByPerson ? 'người' : 'm³'} = {formatVND(calcWaterTotal)}
                      </span>
                    </div>

                    {isWaterByPerson ? (
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                          Số lượng người ở tại phòng
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={formWaterPeople}
                          onChange={e => setFormWaterPeople(Number(e.target.value))}
                          className="w-full text-xs p-2 rounded-xl border border-slate-300 bg-white font-bold text-blue-800"
                        />
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                            Số nước cũ (kỳ trước)
                          </label>
                          <input
                            type="number"
                            value={formPrevWater}
                            onChange={e => setFormPrevWater(Number(e.target.value))}
                            className="w-full text-xs p-2 rounded-xl border border-slate-300 bg-white"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                            Số nước mới (kỳ này)
                          </label>
                          <input
                            type="number"
                            value={formCurrWater}
                            onChange={e => setFormCurrWater(Number(e.target.value))}
                            className="w-full text-xs p-2 rounded-xl border border-slate-300 bg-white font-bold text-blue-800"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Vehicles, Other Fees & Discount */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                        Số xe máy ({formatNumber(selectedRoomForCreate.parkingFee)}đ/xe)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formParkingCount}
                        onChange={e => setFormParkingCount(Number(e.target.value))}
                        className="w-full text-xs p-2 rounded-xl border border-slate-300 bg-white"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                        Phí phát sinh (nếu có)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formOtherFee}
                        onChange={e => setFormOtherFee(Number(e.target.value))}
                        className="w-full text-xs p-2 rounded-xl border border-slate-300 bg-white"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                        Giảm trừ / Khuyến mãi (đ)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formDiscount}
                        onChange={e => setFormDiscount(Number(e.target.value))}
                        className="w-full text-xs p-2 rounded-xl border border-slate-300 bg-white"
                      />
                    </div>
                  </div>

                  {/* Realtime Total Summary */}
                  <div className="p-4 rounded-2xl bg-slate-900 text-white flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-400 block font-medium">TỔNG HÓA ĐƠN THÁNG</span>
                      <span className="text-xl font-black text-amber-400 block mt-0.5">
                        {formatVND(calcTotalAmount)}
                      </span>
                    </div>

                    <div className="text-right text-[11px] text-slate-300 space-y-0.5">
                      <div>Tiền phòng: {formatNumber(calcRoomPrice)} đ</div>
                      <div>Dịch vụ (Wifi, rác, xe): {formatNumber(calcInternetFee + calcGarbageFee + calcParkingTotal)} đ</div>
                    </div>
                  </div>
                </>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={!selectedRoomForCreate}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold shadow-xs flex items-center gap-1.5"
                >
                  <Receipt className="w-4 h-4" />
                  <span>Xác Nhận Xuất Hóa Đơn</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
