import React, { useState } from 'react';
import { 
  Building2, 
  Users, 
  MapPin, 
  FileCode2, 
  UserPlus, 
  ShieldCheck, 
  Smartphone, 
  CreditCard,
  ChevronDown,
  Database,
  LogIn,
  LogOut,
  Home,
  Info,
  MessageSquare,
  LayoutDashboard,
  DoorClosed
} from 'lucide-react';
import { User, RoleType } from '../types/rental';

export type PageId = 'home' | 'about' | 'reviews' | 'dashboard';

interface NavbarProps {
  activePage: PageId;
  onNavigate: (page: PageId) => void;
  currentUser: User | null;
  allUsers: User[];
  onSelectUser: (user: User) => void;
  onLogout: () => void;
  onOpenLoginModal: () => void;
  onOpenRegisterModal: () => void;
  onOpenSqlModal: () => void;
  isSqlConnected?: boolean;
  onOpenSqlConnectionModal?: () => void;
  onOpenAddBuildingModal?: () => void;
  onOpenAddRoomModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activePage,
  onNavigate,
  currentUser,
  allUsers,
  onSelectUser,
  onLogout,
  onOpenLoginModal,
  onOpenRegisterModal,
  onOpenSqlModal,
  isSqlConnected,
  onOpenSqlConnectionModal,
  onOpenAddBuildingModal,
  onOpenAddRoomModal
}) => {
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const getRoleBadge = (roleId?: RoleType) => {
    switch (roleId) {
      case 1:
        return { label: 'Admins (Cấp 1)', bg: 'bg-purple-950/80 text-purple-300 border-purple-700/60' };
      case 2:
        return { label: 'Quản lý (Cấp 2)', bg: 'bg-blue-950/80 text-blue-300 border-blue-700/60' };
      case 3:
        return { label: 'Khách thuê (Cấp 3)', bg: 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60' };
      default:
        return { label: 'Khách vãng lai', bg: 'bg-slate-800 text-slate-300 border-slate-700' };
    }
  };

  const badge = getRoleBadge(currentUser?.roleId);

  return (
    <header className="border-b border-slate-800 bg-slate-900/95 backdrop-blur sticky top-0 z-40">
      {/* Top Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Logo and Brand */}
        <div 
          onClick={() => onNavigate('home')}
          className="flex items-center gap-3 cursor-pointer select-none"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base sm:text-lg text-white tracking-tight">
                Quản Lý 100 Nhà Trọ
              </span>
              <span className="text-[11px] bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-semibold px-2 py-0.5 rounded-full hidden sm:inline-block">
                IoT &amp; Đa Cấp
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden md:block">
              Mô hình Cây Đa Cấp • Phân Quyền 3 Cấp • Đã có trường Address
            </p>
          </div>
        </div>

        {/* Navigation Tabs (Trang chủ, Giới thiệu, Nhận định, Bảng điều khiển) */}
        <nav className="hidden lg:flex items-center gap-1 bg-slate-950 p-1 rounded-2xl border border-slate-800 text-xs">
          <button
            onClick={() => onNavigate('home')}
            className={`px-3.5 py-1.5 rounded-xl font-semibold transition-all flex items-center gap-1.5 ${
              activePage === 'home'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            <span>Trang Chủ</span>
          </button>

          <button
            onClick={() => onNavigate('about')}
            className={`px-3.5 py-1.5 rounded-xl font-semibold transition-all flex items-center gap-1.5 ${
              activePage === 'about'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            <span>Giới Thiệu</span>
          </button>

          <button
            onClick={() => onNavigate('reviews')}
            className={`px-3.5 py-1.5 rounded-xl font-semibold transition-all flex items-center gap-1.5 ${
              activePage === 'reviews'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Nhận Định</span>
          </button>

          {currentUser && (
            <button
              onClick={() => onNavigate('dashboard')}
              className={`px-3.5 py-1.5 rounded-xl font-semibold transition-all flex items-center gap-1.5 ${
                activePage === 'dashboard'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>{currentUser.roleId === 3 ? 'Hóa Đơn & Phòng' : 'Bảng Điều Khiển'}</span>
            </button>
          )}
        </nav>

        {/* Action Buttons & Authentication */}
        <div className="flex items-center gap-2">
          {/* Nút Thêm Tòa Nhà - Nổi Bật */}
          {onOpenAddBuildingModal && (
            <button
              onClick={onOpenAddBuildingModal}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                currentUser && (currentUser.roleId === 1 || currentUser.roleId === 2)
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-md shadow-blue-600/25'
                  : 'bg-slate-800/90 hover:bg-slate-700 text-blue-300 border border-blue-500/40'
              }`}
              title={currentUser && (currentUser.roleId === 1 || currentUser.roleId === 2)
                ? "Thêm tòa nhà mới vào hệ thống chuỗi nhà trọ (Quyền Quản Lý Cấp 1 & 2)"
                : "Thêm Tòa Nhà (Chức năng dành cho Quản Lý Cấp 1 & 2)"}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">+ Thêm Tòa Nhà</span>
              <span className="sm:hidden">+ Tòa Nhà</span>
            </button>
          )}

          {/* Nút Thêm Phòng - Trực Tiếp Trên Navbar */}
          {onOpenAddRoomModal && (
            <button
              onClick={onOpenAddRoomModal}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                currentUser && (currentUser.roleId === 1 || currentUser.roleId === 2)
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md shadow-emerald-600/25 ring-1 ring-emerald-400/40'
                  : 'bg-slate-800/90 hover:bg-slate-700 text-emerald-300 border border-emerald-500/40'
              }`}
              title={currentUser && (currentUser.roleId === 1 || currentUser.roleId === 2)
                ? "Thêm phòng mới vào tòa nhà & ấn định giá theo thời điểm (Quyền Quản Lý Cấp 1 & 2)"
                : "Thêm Phòng (Chức năng dành cho Quản Lý Cấp 1 & 2)"}
            >
              <DoorClosed className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">+ Thêm Phòng</span>
              <span className="sm:hidden">+ Phòng</span>
            </button>
          )}

          {/* Nút Kết Nối SQL Server */}
          <button
            onClick={onOpenSqlConnectionModal}
            className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              isSqlConnected 
                ? 'bg-emerald-950/80 border-emerald-600/80 text-emerald-300 shadow-emerald-500/20 shadow' 
                : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-cyan-500 hover:text-white'
            }`}
            title="Kiểm tra & Cấu hình kết nối MS SQL Server"
          >
            <Database className={`w-3.5 h-3.5 ${isSqlConnected ? 'text-emerald-400' : 'text-cyan-400'}`} />
            <span className="hidden md:inline">
              {isSqlConnected ? 'SQL Server: Online' : 'Kết Nối SQL'}
            </span>
            <span className={`w-2 h-2 rounded-full ${isSqlConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
          </button>

          {/* Chưa đăng nhập */}
          {!currentUser ? (
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenLoginModal}
                className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white shadow-md shadow-blue-600/20 flex items-center gap-1.5 transition-all active:scale-95"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Đăng Nhập</span>
              </button>

              <button
                onClick={onOpenRegisterModal}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-all"
              >
                <UserPlus className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Đăng Ký</span>
              </button>
            </div>
          ) : (
            /* Đã đăng nhập */
            <div className="flex items-center gap-2">
              <div className="relative">
                <button
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-all text-left text-xs"
                >
                  <div className="w-6 h-6 rounded-lg bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400 font-bold">
                    {currentUser.roleId === 1 ? 'A' : currentUser.roleId === 2 ? 'M' : 'T'}
                  </div>
                  <div className="hidden sm:block">
                    <div className="font-semibold text-white leading-tight">{currentUser.fullName}</div>
                    <div className="text-[10px] text-slate-400">{badge.label}</div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {/* Dropdown Menu */}
                {showUserDropdown && (
                  <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-3 py-2 border-b border-slate-800/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex justify-between items-center">
                      <span>Chuyển đổi tài khoản:</span>
                      <button
                        onClick={onLogout}
                        className="text-[10px] text-rose-400 hover:text-rose-300 flex items-center gap-1"
                      >
                        <LogOut className="w-3 h-3" />
                        Đăng xuất
                      </button>
                    </div>

                    <div className="max-h-60 overflow-y-auto space-y-1 mt-1 text-xs">
                      {allUsers.map((user) => {
                        const rBadge = getRoleBadge(user.roleId);
                        return (
                          <button
                            key={user.userId}
                            onClick={() => {
                              onSelectUser(user);
                              setShowUserDropdown(false);
                            }}
                            className={`w-full text-left p-2 rounded-xl transition-all flex flex-col gap-0.5 ${
                              currentUser.userId === user.userId
                                ? 'bg-blue-600/15 border border-blue-500/40 text-white'
                                : 'hover:bg-slate-800/70 text-slate-300'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-white">{user.fullName}</span>
                              <span className={`text-[10px] px-2 py-0.5 rounded border ${rBadge.bg}`}>
                                {rBadge.label}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              CCCD: {user.citizenId} • SĐT: {user.phoneNumber}
                            </div>
                            <div className="text-[10px] text-emerald-400 truncate flex items-center gap-1">
                              <MapPin className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">{user.address}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Nút Đăng xuất nhanh */}
              <button
                onClick={onLogout}
                className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-rose-400 transition-colors"
                title="Đăng xuất tài khoản để trải nghiệm vai trò khách vãng lai"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Navigation Tabs (Dành cho màn hình nhỏ) */}
      <div className="lg:hidden flex items-center justify-around border-t border-slate-800 bg-slate-950/80 px-2 py-2 text-xs">
        <button
          onClick={() => onNavigate('home')}
          className={`px-3 py-1.5 rounded-xl font-medium flex items-center gap-1 ${
            activePage === 'home' ? 'bg-blue-600 text-white' : 'text-slate-400'
          }`}
        >
          <Home className="w-3.5 h-3.5" />
          <span>Trang Chủ</span>
        </button>

        <button
          onClick={() => onNavigate('about')}
          className={`px-3 py-1.5 rounded-xl font-medium flex items-center gap-1 ${
            activePage === 'about' ? 'bg-blue-600 text-white' : 'text-slate-400'
          }`}
        >
          <Info className="w-3.5 h-3.5" />
          <span>Giới Thiệu</span>
        </button>

        <button
          onClick={() => onNavigate('reviews')}
          className={`px-3 py-1.5 rounded-xl font-medium flex items-center gap-1 ${
            activePage === 'reviews' ? 'bg-blue-600 text-white' : 'text-slate-400'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Nhận Định</span>
        </button>

        {currentUser && (
          <button
            onClick={() => onNavigate('dashboard')}
            className={`px-3 py-1.5 rounded-xl font-medium flex items-center gap-1 ${
              activePage === 'dashboard' ? 'bg-indigo-600 text-white' : 'text-slate-400'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>{currentUser.roleId === 3 ? 'Hóa Đơn & Phòng' : 'Quản Trị'}</span>
          </button>
        )}
      </div>

      {/* Profile Bar: Hiển thị nếu đã đăng nhập */}
      {currentUser && (
        <div className="bg-slate-950/70 border-t border-slate-800/80 px-4 sm:px-6 py-2">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-4 flex-wrap">
              <span className="text-white font-medium flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-blue-400" />
                Tài khoản: <strong className="text-blue-300">{currentUser.fullName}</strong>
              </span>
              <span className="text-slate-400 font-mono flex items-center gap-1">
                <CreditCard className="w-3 h-3 text-purple-400" />
                CCCD: <strong className="text-slate-200">{currentUser.citizenId}</strong>
              </span>
              <span className="text-slate-400 font-mono flex items-center gap-1">
                <Smartphone className="w-3 h-3 text-cyan-400" />
                SĐT: <strong className="text-slate-200">{currentUser.phoneNumber}</strong>
              </span>
              <span className="text-emerald-400 flex items-center gap-1 bg-emerald-950/40 border border-emerald-500/30 px-2 py-0.5 rounded-lg">
                <MapPin className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span>Địa chỉ thường trú: </span>
                <strong className="text-emerald-200">{currentUser.address}</strong>
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className={`px-2 py-0.5 rounded border text-[11px] font-semibold ${badge.bg}`}>
                {badge.label}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Quick Role Switcher Bar - Giúp chuyển nhanh vai trò để kiểm tra chức năng Thêm Nhà / Thêm Phòng */}
      <div className="bg-slate-900/90 border-t border-slate-800/80 px-4 sm:px-6 py-2 text-[11px]">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="font-bold text-white bg-blue-600/30 border border-blue-500/40 px-2 py-0.5 rounded text-[10px] uppercase">
              Chuyển nhanh vai trò:
            </span>
            <span className="hidden md:inline text-slate-400">
              Kiểm tra tính năng Thêm Nhà, Thêm/Bớt Phòng, Ấn định giá &amp; Giữ phòng theo 3 cấp:
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Admin Cấp 1 */}
            {allUsers.filter(u => u.roleId === 1).slice(0, 1).map(u => (
              <button
                key={u.userId}
                onClick={() => onSelectUser(u)}
                className={`px-2.5 py-1 rounded-xl transition-all flex items-center gap-1 font-medium ${
                  currentUser?.userId === u.userId
                    ? 'bg-purple-600 text-white shadow-sm ring-2 ring-purple-400 font-bold'
                    : 'bg-slate-800/90 hover:bg-slate-800 text-purple-300 border border-purple-500/40'
                }`}
                title="Admin Cấp 1: Toàn quyền thêm tòa nhà, thêm/bớt phòng, ấn định giá mọi thời điểm, phân công quản lý"
              >
                <span>👑 Cấp 1: {u.fullName} (Admin)</span>
              </button>
            ))}

            {/* Quản lý Cấp 2 */}
            {allUsers.filter(u => u.roleId === 2).slice(0, 1).map(u => (
              <button
                key={u.userId}
                onClick={() => onSelectUser(u)}
                className={`px-2.5 py-1 rounded-xl transition-all flex items-center gap-1 font-medium ${
                  currentUser?.userId === u.userId
                    ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-400 font-bold'
                    : 'bg-slate-800/90 hover:bg-slate-800 text-blue-300 border border-blue-500/40'
                }`}
                title="Quản lý Cấp 2: Thêm tòa nhà, thêm/bớt phòng & ấn định giá trong phạm vi tòa nhà mình quản lý"
              >
                <span>🏢 Cấp 2: {u.fullName} (Quản lý)</span>
              </button>
            ))}

            {/* Khách thuê Cấp 3 */}
            {allUsers.filter(u => u.roleId === 3).slice(0, 1).map(u => (
              <button
                key={u.userId}
                onClick={() => onSelectUser(u)}
                className={`px-2.5 py-1 rounded-xl transition-all flex items-center gap-1 font-medium ${
                  currentUser?.userId === u.userId
                    ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-400 font-bold'
                    : 'bg-slate-800/90 hover:bg-slate-800 text-emerald-300 border border-emerald-500/40'
                }`}
                title="Khách thuê Cấp 3: Giữ phòng, xem phòng theo giá tăng/giảm dần, không có quyền thêm nhà/phòng"
              >
                <span>👤 Cấp 3: {u.fullName} (Khách thuê)</span>
              </button>
            ))}

            {/* Khách vãng lai */}
            <button
              onClick={onLogout}
              className={`px-2.5 py-1 rounded-xl transition-all flex items-center gap-1 font-medium ${
                !currentUser
                  ? 'bg-slate-700 text-white shadow-sm ring-2 ring-slate-400 font-bold'
                  : 'bg-slate-800/90 hover:bg-slate-800 text-slate-400 border border-slate-700'
              }`}
              title="Khách vãng lai (Chưa đăng nhập): Xem thông tin, giữ phòng"
            >
              <span>🌐 Khách Vãng Lai</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
