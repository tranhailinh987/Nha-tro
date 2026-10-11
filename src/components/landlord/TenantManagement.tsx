import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Tenant } from '../../types';
import { formatVND, formatDate } from '../../utils/formatters';
import {
  UserPlus,
  Phone,
  Mail,
  CreditCard,
  MapPin,
  Calendar,
  LogOut,
  Search,
  CheckCircle2,
  Bike,
  ShieldAlert,
} from 'lucide-react';

export const TenantManagement: React.FC = () => {
  const {
    tenants,
    rooms,
    buildings,
    addTenant,
    checkoutTenant,
    selectedBuildingId,
  } = useApp();

  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Form State
  const [formRoomId, setFormRoomId] = useState('');
  const [formFullName, setFormFullName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formIdCard, setFormIdCard] = useState('');
  const [formHometown, setFormHometown] = useState('');
  const [formJob, setFormJob] = useState('');
  const [formLicensePlate, setFormLicensePlate] = useState('');
  const [formStartDate, setFormStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [formContractMonths, setFormContractMonths] = useState(12);
  const [formDepositPaid, setFormDepositPaid] = useState(3800000);
  const [formNotes, setFormNotes] = useState('');

  const availableRooms = rooms.filter(r => r.status === 'available');

  const filteredTenants = tenants.filter(t => {
    if (selectedBuildingId !== 'all' && t.buildingId !== selectedBuildingId) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        t.fullName.toLowerCase().includes(q) ||
        t.phone.toLowerCase().includes(q) ||
        t.roomNumber.toLowerCase().includes(q) ||
        t.hometown.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleAddTenantSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetRoom = rooms.find(r => r.id === formRoomId);
    if (!targetRoom) {
      alert('Vui lòng chọn phòng để xếp khách vào');
      return;
    }

    addTenant({
      roomId: targetRoom.id,
      roomNumber: targetRoom.roomNumber,
      buildingId: targetRoom.buildingId,
      fullName: formFullName.trim(),
      phone: formPhone.trim(),
      email: formEmail.trim() || undefined,
      idCardNumber: formIdCard.trim(),
      hometown: formHometown.trim(),
      job: formJob.trim(),
      licensePlate: formLicensePlate.trim() || undefined,
      startDate: formStartDate,
      contractMonths: Number(formContractMonths),
      depositPaid: Number(formDepositPaid),
      notes: formNotes.trim() || undefined,
    });

    setShowAddModal(false);
    // Reset
    setFormFullName('');
    setFormPhone('');
    setFormRoomId('');
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo tên, SĐT, số phòng, quê quán..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-transparent outline-none"
          />
        </div>

        <button
          onClick={() => {
            if (availableRooms.length > 0) {
              setFormRoomId(availableRooms[0].id);
              setFormDepositPaid(availableRooms[0].deposit);
            }
            setShowAddModal(true);
          }}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2"
        >
          <UserPlus className="w-4 h-4" />
          <span>Thêm Khách Thuê Mới</span>
        </button>
      </div>

      {/* Tenants Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredTenants.length === 0 ? (
          <div className="col-span-full bg-white p-12 text-center rounded-2xl border border-dashed border-slate-300 text-slate-400">
            Không tìm thấy thông tin khách thuê nào.
          </div>
        ) : (
          filteredTenants.map(tenant => {
            const room = rooms.find(r => r.id === tenant.roomId);

            return (
              <div
                key={tenant.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-base">
                        {tenant.fullName}
                      </h3>
                      <div className="text-xs text-blue-600 font-semibold mt-0.5">
                        Phòng {tenant.roomNumber} • {room?.buildingName || 'Dãy trọ'}
                      </div>
                    </div>

                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                      Đang ở
                    </span>
                  </div>

                  {/* Details List */}
                  <div className="space-y-2 mt-4 text-xs text-slate-600 border-t border-slate-100 pt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5" /> Số điện thoại:
                      </span>
                      <strong className="text-slate-900">{tenant.phone}</strong>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5" /> CCCD/CMND:
                      </span>
                      <strong className="font-mono text-slate-800">{tenant.idCardNumber}</strong>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5" /> Quê quán:
                      </span>
                      <span>{tenant.hometown || '-'}</span>
                    </div>

                    {tenant.licensePlate && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 flex items-center gap-1.5">
                          <Bike className="w-3.5 h-3.5" /> Biển số xe:
                        </span>
                        <span className="font-mono font-semibold bg-slate-100 px-1.5 py-0.5 rounded">
                          {tenant.licensePlate}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" /> Bắt đầu thuê:
                      </span>
                      <span>{formatDate(tenant.startDate)} ({tenant.contractMonths} tháng)</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Tiền cọc giữ:</span>
                      <strong className="text-blue-700 font-bold">{formatVND(tenant.depositPaid)}</strong>
                    </div>

                    {tenant.notes && (
                      <div className="p-2 bg-slate-50 rounded-xl text-[11px] text-slate-500 italic mt-1">
                        "{tenant.notes}"
                      </div>
                    )}
                  </div>
                </div>

                {/* Checkout Tenant Button */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <a
                    href={`tel:${tenant.phone.replace(/\s+/g, '')}`}
                    className="flex-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold text-center transition-colors flex items-center justify-center gap-1"
                  >
                    <Phone className="w-3 h-3 text-blue-600" />
                    <span>Gọi Điện</span>
                  </a>

                  <button
                    onClick={() => {
                      if (window.confirm(`Xác nhận khách ${tenant.fullName} trả phòng ${tenant.roomNumber}? Tiền cọc sẽ được đối soát hoàn trả và phòng chuyển về trạng thái TRỐNG.`)) {
                        checkoutTenant(tenant.id);
                      }
                    }}
                    className="flex-1 py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition-colors flex items-center justify-center gap-1"
                  >
                    <LogOut className="w-3 h-3" />
                    <span>Trả Phòng</span>
                  </button>
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* Add Tenant Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-base">Thêm Khách Thuê Mới Vào Phòng</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleAddTenantSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Chọn phòng còn trống <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formRoomId}
                  onChange={e => {
                    setFormRoomId(e.target.value);
                    const r = rooms.find(rm => rm.id === e.target.value);
                    if (r) setFormDepositPaid(r.deposit);
                  }}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
                >
                  <option value="">-- Chọn phòng trống --</option>
                  {availableRooms.map(r => (
                    <option key={r.id} value={r.id}>
                      Phòng {r.roomNumber} - {r.buildingName} ({formatVND(r.price)}/tháng)
                    </option>
                  ))}
                </select>
                {availableRooms.length === 0 && (
                  <p className="text-[11px] text-amber-600 mt-1">
                    Hiện tất cả các phòng đều đã có người thuê. Vui lòng thêm phòng mới hoặc chuyển trạng thái phòng sang Còn trống trước.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Họ và tên khách thuê <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nguyễn Văn A"
                    value={formFullName}
                    onChange={e => setFormFullName(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Số điện thoại liên hệ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="09xx xxx xxx"
                    value={formPhone}
                    onChange={e => setFormPhone(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Số CCCD / CMND <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="079201004562"
                    value={formIdCard}
                    onChange={e => setFormIdCard(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Quê quán</label>
                  <input
                    type="text"
                    placeholder="Lâm Đồng, Đà Nẵng..."
                    value={formHometown}
                    onChange={e => setFormHometown(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Nghề nghiệp</label>
                  <input
                    type="text"
                    placeholder="Sinh viên ĐH..., Nhân viên..."
                    value={formJob}
                    onChange={e => setFormJob(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Biển số xe máy</label>
                  <input
                    type="text"
                    placeholder="59G1-123.45"
                    value={formLicensePlate}
                    onChange={e => setFormLicensePlate(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Ngày bắt đầu thuê</label>
                  <input
                    type="date"
                    value={formStartDate}
                    onChange={e => setFormStartDate(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Thời hạn hợp đồng (tháng)</label>
                  <input
                    type="number"
                    min="1"
                    value={formContractMonths}
                    onChange={e => setFormContractMonths(Number(e.target.value))}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Tiền cọc đã đóng (VNĐ)
                </label>
                <input
                  type="number"
                  step="50000"
                  value={formDepositPaid}
                  onChange={e => setFormDepositPaid(Number(e.target.value))}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white font-bold text-blue-700"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Ghi chú thêm</label>
                <input
                  type="text"
                  placeholder="Người ở gọn gàng, có xe máy..."
                  value={formNotes}
                  onChange={e => setFormNotes(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={!formRoomId}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold"
                >
                  Lưu Khách Thuê Mới
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
