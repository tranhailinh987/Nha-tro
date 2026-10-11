import React from 'react';
import { useApp, UserRole } from '../context/AppContext';
import {
  Home,
  Building2,
  Users,
  Search,
  RotateCcw,
  ShieldCheck,
  PhoneCall,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { role, setRole, resetToSampleData, rooms, bills, incidents } = useApp();

  const emptyRooms = rooms.filter(r => r.status === 'available').length;
  const unpaidBills = bills.filter(b => b.status === 'unpaid').length;
  const pendingIncidents = incidents.filter(i => i.status !== 'resolved').length;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Home className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xl tracking-tight text-slate-900">
                  NhaTro<span className="text-blue-600">Hub</span>
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  VN
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Hệ thống quản lý &amp; tìm kiếm phòng trọ thông minh
              </p>
            </div>
          </div>

          {/* Role Navigation Pills */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200/80">
            <button
              onClick={() => setRole('renter')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                role === 'renter'
                  ? 'bg-white text-blue-600 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>Tìm Phòng Trọ</span>
              {emptyRooms > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-bold">
                  {emptyRooms}
                </span>
              )}
            </button>

            <button
              onClick={() => setRole('landlord')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                role === 'landlord'
                  ? 'bg-white text-blue-600 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Quản Lý Nhà Trọ</span>
              {unpaidBills > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-100 text-amber-800 font-bold">
                  {unpaidBills}
                </span>
              )}
            </button>

            <button
              onClick={() => setRole('tenant')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                role === 'tenant'
                  ? 'bg-white text-blue-600 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Cổng Khách Thuê</span>
            </button>
          </div>

          {/* Right utility buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (window.confirm('Khôi phục toàn bộ dữ liệu mẫu (dãy trọ, phòng, khách thuê, hóa đơn)?')) {
                  resetToSampleData();
                }
              }}
              title="Khôi phục dữ liệu mẫu ban đầu"
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg text-xs transition-colors flex items-center gap-1"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden md:inline text-xs">Reset mẫu</span>
            </button>

            <div className="hidden lg:flex items-center gap-1.5 pl-2 border-l border-slate-200 text-xs text-slate-600 font-medium">
              <PhoneCall className="w-3.5 h-3.5 text-blue-600" />
              <span>Hotline: <strong className="text-slate-900">0908 123 456</strong></span>
            </div>
          </div>

        </div>
      </div>
    </header>
  );
};
