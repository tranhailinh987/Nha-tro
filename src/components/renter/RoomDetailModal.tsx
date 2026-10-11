import React, { useState } from 'react';
import { Room, Building } from '../../types';
import { useApp } from '../../context/AppContext';
import { formatVND, formatNumber } from '../../utils/formatters';
import {
  X,
  MapPin,
  Maximize2,
  Check,
  Zap,
  Droplets,
  Wifi,
  Trash2,
  Bike,
  Phone,
  MessageCircle,
  Calendar,
  Clock,
  Send,
  CheckCircle,
  ShieldCheck,
  User,
} from 'lucide-react';

interface RoomDetailModalProps {
  room: Room;
  onClose: () => void;
  openBookingDirectly?: boolean;
}

export const RoomDetailModal: React.FC<RoomDetailModalProps> = ({
  room,
  onClose,
  openBookingDirectly = false,
}) => {
  const { buildings, addAppointment } = useApp();
  const building = buildings.find(b => b.id === room.buildingId);

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showBookingForm, setShowBookingForm] = useState(openBookingDirectly);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // Form State
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [viewingDate, setViewingDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [viewingTime, setViewingTime] = useState('17:30');
  const [notes, setNotes] = useState('');

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim() || !guestPhone.trim()) {
      alert('Vui lòng nhập họ tên và số điện thoại liên hệ');
      return;
    }

    addAppointment({
      roomId: room.id,
      roomNumber: room.roomNumber,
      buildingName: room.buildingName,
      guestName: guestName.trim(),
      guestPhone: guestPhone.trim(),
      guestEmail: guestEmail.trim() || undefined,
      viewingDate,
      viewingTime,
      notes: notes.trim() || undefined,
    });

    setBookingSuccess(true);
  };

  const amenitiesList = [
    { label: 'Máy lạnh / Điều hòa', active: room.amenities.airConditioner },
    { label: 'Gác lửng đúc kiên cố', active: room.amenities.mezzanine },
    { label: 'Ban công / Cửa sổ thoáng', active: room.amenities.balcony },
    { label: 'Máy nước nóng năng lượng / Ariston', active: room.amenities.waterHeater },
    { label: 'Tủ lạnh', active: room.amenities.fridge },
    { label: 'Máy giặt riêng / chung', active: room.amenities.washingMachine },
    { label: 'Vệ sinh khép kín trong phòng', active: room.amenities.privateBathroom },
    { label: 'Kệ bếp nấu ăn riêng', active: room.amenities.kitchenShelf },
    { label: 'Giờ giấc tự do 24/7 (Cửa vân tay)', active: room.amenities.freeHours },
    { label: 'Cho phép nuôi thú cưng', active: room.amenities.petsAllowed },
    { label: 'Wifi Internet cáp quang', active: room.amenities.wifi },
    { label: 'Camera an ninh hành lang & nhà xe', active: room.amenities.securityCamera },
    { label: 'Bãi để xe máy trong nhà', active: room.amenities.parking },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Chi Tiết Phòng {room.roomNumber} • {room.buildingName}
            </h2>
            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-blue-600" />
              <span>{room.address}, {room.district}, {room.city}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Image Showcase */}
          <div className="space-y-3">
            <div className="relative aspect-16/9 rounded-2xl overflow-hidden bg-slate-100 shadow-inner">
              <img
                src={room.images[activeImageIndex] || room.images[0]}
                alt="Room picture"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2.5 py-1 rounded-lg backdrop-blur-xs">
                Ảnh {activeImageIndex + 1} / {room.images.length}
              </div>
            </div>

            {room.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {room.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`relative w-20 h-14 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${
                      activeImageIndex === idx ? 'border-blue-600 ring-2 ring-blue-500/30' : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="thumb" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Core Numbers Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-2xl">
              <span className="text-xs text-blue-700 font-semibold block">Giá Thuê Phòng</span>
              <span className="text-lg font-black text-blue-900 block mt-0.5">
                {formatVND(room.price)}
              </span>
              <span className="text-[11px] text-blue-600 font-medium">/ tháng</span>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
              <span className="text-xs text-slate-500 font-semibold block">Tiền Cọc Giữ Chỗ</span>
              <span className="text-lg font-bold text-slate-800 block mt-0.5">
                {formatVND(room.deposit)}
              </span>
              <span className="text-[11px] text-slate-500 font-medium">1 tháng tiền phòng</span>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
              <span className="text-xs text-slate-500 font-semibold block">Diện Tích Sử Dụng</span>
              <span className="text-lg font-bold text-slate-800 block mt-0.5">
                {room.area} m²
              </span>
              <span className="text-[11px] text-slate-500 font-medium">Tối đa {room.maxOccupants} người</span>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
              <span className="text-xs text-slate-500 font-semibold block">Tầng &amp; Trạng Thái</span>
              <span className="text-lg font-bold text-slate-800 block mt-0.5">
                Tầng {room.floor}
              </span>
              <span className={`text-[11px] font-bold ${
                room.status === 'available' ? 'text-emerald-600' : 'text-slate-600'
              }`}>
                {room.status === 'available' ? '● Còn phòng trống' : '● ' + room.status}
              </span>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <h3 className="font-bold text-slate-900 text-sm">Mô Tả Chi Tiết</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-200">
              {room.description}
            </p>
          </div>

          {/* Transparent Utilities Fee Table */}
          <div className="space-y-2">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <span>Bảng Biểu Phí Dịch Vụ Minh Bạch</span>
              <span className="text-[11px] font-normal text-slate-500">(Không phát sinh chi phí ẩn)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2 text-slate-700">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span>Tiền điện</span>
                </div>
                <span className="font-bold text-slate-900">{formatNumber(room.electricityRate)} đ / kWh (số)</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2 text-slate-700">
                  <Droplets className="w-4 h-4 text-blue-500" />
                  <span>Tiền nước</span>
                </div>
                <span className="font-bold text-slate-900">
                  {formatNumber(room.waterRate)} đ / {room.waterRateType === 'per_m3' ? 'khối (m³)' : 'người/tháng'}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2 text-slate-700">
                  <Wifi className="w-4 h-4 text-indigo-500" />
                  <span>Wifi Internet</span>
                </div>
                <span className="font-bold text-slate-900">{formatNumber(room.internetFee)} đ / phòng/tháng</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2 text-slate-700">
                  <Trash2 className="w-4 h-4 text-emerald-500" />
                  <span>Rác &amp; Vệ sinh chung</span>
                </div>
                <span className="font-bold text-slate-900">{formatNumber(room.garbageFee)} đ / tháng</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 sm:col-span-2">
                <div className="flex items-center gap-2 text-slate-700">
                  <Bike className="w-4 h-4 text-rose-500" />
                  <span>Gửi xe máy (hầm xe có camera)</span>
                </div>
                <span className="font-bold text-slate-900">{formatNumber(room.parkingFee)} đ / xe/tháng</span>
              </div>
            </div>
          </div>

          {/* Full Amenities Checklist */}
          <div className="space-y-2">
            <h3 className="font-bold text-slate-900 text-sm">Danh Mục Tiện Nghi Trong &amp; Ngoài Phòng</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {amenitiesList.map((item, idx) => (
                <div
                  key={idx}
                  className={`flex items-center gap-2.5 p-2 rounded-xl transition-colors ${
                    item.active ? 'text-slate-800 bg-slate-50 font-medium' : 'text-slate-400 line-through'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                    item.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-400'
                  }`}>
                    {item.active ? <Check className="w-3 h-3 stroke-[3]" /> : <X className="w-3 h-3" />}
                  </div>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Landlord Contact Section */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider block">
                Thông Tin Chủ Nhà / Quản Lý
              </span>
              <div className="text-base font-bold text-slate-900 mt-0.5">
                {building?.landlordName || 'Chủ trọ'}
              </div>
              <p className="text-xs text-slate-600">
                SĐT / Zalo: <strong>{building?.landlordPhone || '0908 123 456'}</strong>
              </p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <a
                href={`tel:${building?.landlordPhone?.replace(/\s+/g, '') || '0908123456'}`}
                className="flex-1 sm:flex-none px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Gọi Trực Tiếp</span>
              </a>

              <a
                href={`https://zalo.me/${building?.landlordZalo || '0908123456'}`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 sm:flex-none px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-xs"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Nhắn Zalo</span>
              </a>
            </div>
          </div>

          {/* Schedule Viewing Section */}
          <div className="pt-2">
            {!showBookingForm ? (
              <button
                onClick={() => setShowBookingForm(true)}
                className="w-full py-3.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-sm font-bold transition-all shadow-md flex items-center justify-center gap-2"
              >
                <Calendar className="w-4 h-4 text-amber-400" />
                <span>Đặt Lịch Hẹn Đến Xem Phòng Này Trực Tiếp</span>
              </button>
            ) : bookingSuccess ? (
              <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
                <CheckCircle className="w-10 h-10 text-emerald-600 mx-auto" />
                <h4 className="font-bold text-emerald-900 text-base">Đặt Lịch Hẹn Thành Công!</h4>
                <p className="text-xs text-emerald-800 max-w-md mx-auto">
                  Chủ nhà đã nhận được yêu cầu hẹn xem phòng của bạn vào ngày <strong>{viewingDate} lúc {viewingTime}</strong>.
                  Chúng tôi sẽ gọi điện xác nhận trong vòng 15 phút.
                </p>
                <button
                  onClick={() => {
                    setBookingSuccess(false);
                    setShowBookingForm(false);
                  }}
                  className="mt-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700"
                >
                  Đóng &amp; Hoàn tất
                </button>
              </div>
            ) : (
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <span>Đặt Lịch Xem Phòng (Miễn Phí 100%)</span>
                  </h4>
                  <button
                    onClick={() => setShowBookingForm(false)}
                    className="text-xs text-slate-400 hover:text-slate-600"
                  >
                    Thu gọn
                  </button>
                </div>

                <form onSubmit={handleBookingSubmit} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                        Họ và tên của bạn <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Nguyễn Văn A"
                        value={guestName}
                        onChange={e => setGuestName(e.target.value)}
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                        Số điện thoại liên hệ <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="09xx xxx xxx"
                        value={guestPhone}
                        onChange={e => setGuestPhone(e.target.value)}
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                        Ngày muốn đến xem
                      </label>
                      <input
                        type="date"
                        value={viewingDate}
                        onChange={e => setViewingDate(e.target.value)}
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                        Khung giờ hẹn
                      </label>
                      <select
                        value={viewingTime}
                        onChange={e => setViewingTime(e.target.value)}
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      >
                        <option value="09:00">09:00 Sáng</option>
                        <option value="11:30">11:30 Trưa</option>
                        <option value="14:00">14:00 Chiều</option>
                        <option value="17:30">17:30 Chiều</option>
                        <option value="19:00">19:00 Tối</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                      Ghi chú thêm (Số lượng người ở, khi nào dọn vào, nuôi pet...)
                    </label>
                    <input
                      type="text"
                      placeholder="VD: Dự kiến dọn vào cuối tháng, ở 2 người..."
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div className="pt-1 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowBookingForm(false)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Xác Nhận Đặt Lịch Hẹn</span>
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
