import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { RoomListingView } from './components/renter/RoomListingView';
import { RoomDetailModal } from './components/renter/RoomDetailModal';
import { LandlordDashboard } from './components/landlord/LandlordDashboard';
import { TenantPortal } from './components/tenant/TenantPortal';
import { Room } from './types';
import {
  Home,
  ShieldCheck,
  Building2,
  Heart,
  Phone,
  Mail,
  MapPin,
} from 'lucide-react';

const MainContent: React.FC = () => {
  const { role, setRole } = useApp();
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [bookingDirectly, setBookingDirectly] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      
      {/* Top Navbar */}
      <Navbar />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {role === 'renter' && (
          <RoomListingView
            onSelectRoom={room => {
              setSelectedRoom(room);
              setBookingDirectly(false);
            }}
            onBookAppointment={room => {
              setSelectedRoom(room);
              setBookingDirectly(true);
            }}
          />
        )}

        {role === 'landlord' && <LandlordDashboard />}

        {role === 'tenant' && <TenantPortal />}
      </main>

      {/* Room Detail Modal for Renters */}
      {selectedRoom && (
        <RoomDetailModal
          room={selectedRoom}
          onClose={() => setSelectedRoom(null)}
          openBookingDirectly={bookingDirectly}
        />
      )}

      {/* Footer */}
      <footer className="mt-auto bg-slate-900 text-slate-400 text-xs border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            
            {/* Brand */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-white font-extrabold text-base">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                  <Home className="w-4 h-4" />
                </div>
                <span>NhaTro<span className="text-blue-500">Hub</span></span>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed">
                Giải pháp số hóa toàn diện dành cho chủ nhà trọ và người đi thuê phòng tại Việt Nam.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3">
                Chức Năng Nhanh
              </h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <button onClick={() => setRole('renter')} className="hover:text-white transition-colors">
                    Tìm kiếm phòng trọ &amp; Căn hộ mini
                  </button>
                </li>
                <li>
                  <button onClick={() => setRole('landlord')} className="hover:text-white transition-colors">
                    Quản lý dãy trọ &amp; Tính tiền điện nước
                  </button>
                </li>
                <li>
                  <button onClick={() => setRole('tenant')} className="hover:text-white transition-colors">
                    Tra cứu hóa đơn &amp; Quét mã VietQR
                  </button>
                </li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3">
                Khu Vực Phủ Sóng
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-400">
                <li>TP. Hồ Chí Minh (Bình Thạnh, Q.10, Q.7, Thủ Đức...)</li>
                <li>Hà Nội (Cầu Giấy, Đống Đa, Nam Từ Liêm...)</li>
                <li>Đà Nẵng &amp; Các thành phố lớn</li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3">
                Hỗ Trợ Chủ Nhà Trọ
              </h4>
              <div className="space-y-1.5 text-xs text-slate-400">
                <p>Hotline: <strong className="text-white">0908 123 456</strong></p>
                <p>Zalo hỗ trợ: <strong className="text-white">0908123456</strong></p>
                <p>Giờ làm việc: 8:00 - 21:00 (Hàng ngày)</p>
              </div>
            </div>

          </div>

          <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-500 text-[11px]">
            <div>
              © 2026 NhaTroHub. Phát triển cho cộng đồng nhà trọ và sinh viên, người đi làm.
            </div>
            <div className="flex items-center gap-1">
              <span>Được xây dựng với chuẩn VietQR &amp; Quản trị thông minh</span>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
};

export default App;
