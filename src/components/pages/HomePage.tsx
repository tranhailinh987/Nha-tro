import React, { useState } from 'react';
import { 
  Building2, 
  DoorClosed, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Zap, 
  ShieldCheck, 
  Users, 
  LogIn, 
  UserPlus, 
  SlidersHorizontal, 
  Check, 
  X, 
  FileText, 
  ArrowRight, 
  BookmarkCheck,
  MapPin,
  Flame,
  HelpCircle,
  Eye,
  Plus,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Tag,
  Camera,
  CreditCard
} from 'lucide-react';
import { 
  User, 
  ManagementNode, 
  RentalContract, 
  BuildingPost, 
  RoomReservation 
} from '../../types/rental';
import { 
  DevicePhotoModal, 
  getDeviceCategoryIcon, 
  getDevicePhotoUrl 
} from '../DevicePhotoModal';
import { formatDateVN } from '../../utils/dateUtils';

interface HomePageProps {
  currentUser: User | null;
  nodes: ManagementNode[];
  contracts: RentalContract[];
  posts: BuildingPost[];
  reservations: RoomReservation[];
  expiringLeadDays: number;
  onSetExpiringLeadDays: (days: number) => void;
  onOpenLoginModal: () => void;
  onOpenRegisterModal: () => void;
  onRequestReservation: (roomNodeId: number, expectedCheckIn: string) => void;
  onConfirmReservation: (reservationId: number) => void;
  onRejectReservation: (reservationId: number) => void;
  onOpenAddBuildingModal?: () => void;
  onOpenAddRoomModal?: (buildingId?: number) => void;
  onDeleteRoom?: (roomNodeId: number) => void;
  onUpdateRoomPrice?: (roomNodeId: number, newPrice: number, priceNote?: string) => void;
  onNavigate?: (page: 'home' | 'about' | 'reviews' | 'dashboard') => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  currentUser,
  nodes,
  contracts,
  posts,
  reservations,
  expiringLeadDays,
  onSetExpiringLeadDays,
  onOpenLoginModal,
  onOpenRegisterModal,
  onRequestReservation,
  onConfirmReservation,
  onRejectReservation,
  onOpenAddBuildingModal,
  onOpenAddRoomModal,
  onDeleteRoom,
  onUpdateRoomPrice,
  onNavigate
}) => {
  // Modal xác nhận giữ phòng
  const [selectedRoomToReserve, setSelectedRoomToReserve] = useState<ManagementNode | null>(null);
  const [expectedCheckInDate, setExpectedCheckInDate] = useState<string>('2026-10-01');
  const [reservationSuccessAlert, setReservationSuccessAlert] = useState(false);

  // Modal ấn định giá thời điểm cho phòng
  const [editingPriceRoom, setEditingPriceRoom] = useState<ManagementNode | null>(null);
  const [editPriceValue, setEditPriceValue] = useState<number>(4500000);
  const [editPriceNote, setEditPriceNote] = useState<string>('Giá mùa cao điểm tháng 9/2026');

  // Sắp xếp theo giá & Lọc tòa nhà
  const [priceSort, setPriceSort] = useState<'DEFAULT' | 'ASC' | 'DESC'>('DEFAULT');
  const [buildingFilter, setBuildingFilter] = useState<number | 'ALL'>('ALL');

  // Modal đọc chi tiết bài viết
  const [selectedPost, setSelectedPost] = useState<BuildingPost | null>(null);

  // Modal xem ảnh thiết bị cụ thể dành cho khách xem phòng
  const [selectedDeviceForPhoto, setSelectedDeviceForPhoto] = useState<{
    device: ManagementNode;
    roomName?: string;
    buildingName?: string;
  } | null>(null);

  // Modal xem trọn bộ thiết bị & tiện nghi của một phòng
  const [inspectingRoom, setInspectingRoom] = useState<{
    room: ManagementNode;
    buildingName: string;
    reasonText?: string;
  } | null>(null);

  // Lọc tất cả các node loại ROOM (typeId === 3)
  const allRooms = nodes.filter((n) => n.typeId === 3);

  // Helper tính số ngày còn lại đến khi hết hạn hợp đồng
  const getDaysRemaining = (endDateStr: string): number => {
    const today = new Date('2026-09-27'); // Thời gian hệ thống hiện tại
    const end = new Date(endDateStr);
    const diffTime = end.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Helper tìm tòa nhà gốc
  const getRootBuilding = (roomNode: ManagementNode): ManagementNode | null => {
    let curr: ManagementNode | undefined = roomNode;
    while (curr && curr.parentNodeId !== null) {
      curr = nodes.find((n) => n.nodeId === curr?.parentNodeId);
    }
    return curr || null;
  };

  // Xác định danh sách phòng đủ điều kiện cho giữ phòng / đặt trước:
  // 1) Tất cả các phòng chưa có người thuê (không có hợp đồng ACTIVE)
  // 2) Các phòng sắp hết hạn hợp đồng trong vòng N ngày (số ngày do quản lý ấn định)
  // VÀ chưa có người được quản lý xác nhận (CONFIRMED)
  const eligibleRooms = allRooms.map((room) => {
    const activeContract = contracts.find(
      (c) => c.roomNodeId === room.nodeId && c.status === 'ACTIVE'
    );

    // Kiểm tra xem phòng có yêu cầu giữ phòng đang PENDING không
    const pendingReservation = reservations.find(
      (r) => r.roomNodeId === room.nodeId && r.status === 'PENDING'
    );

    // Kiểm tra xem phòng đã có yêu cầu được CONFIRMED chưa
    const confirmedReservation = reservations.find(
      (r) => r.roomNodeId === room.nodeId && r.status === 'CONFIRMED'
    );

    // Tìm tên tòa nhà cha của phòng này
    const parentBuilding = getRootBuilding(room);

    // Nếu không có hợp đồng active và chưa ai confirm -> Phòng trống hoàn toàn
    if (!activeContract && !confirmedReservation) {
      return {
        room,
        isEligible: true,
        reason: 'ROOM_VACANT' as const,
        reasonText: 'Phòng trống 100% (Chưa có người thuê)',
        daysRemaining: 0,
        contractEndDate: null,
        pendingReservation,
        buildingId: parentBuilding?.nodeId || 0,
        buildingName: parentBuilding?.nodeName || 'Tòa nhà'
      };
    }

    // Nếu có hợp đồng active, kiểm tra ngày hết hạn
    if (activeContract && !confirmedReservation) {
      const daysLeft = getDaysRemaining(activeContract.endDateContract);
      if (daysLeft > 0 && daysLeft <= expiringLeadDays) {
        return {
          room,
          isEligible: true,
          reason: 'CONTRACT_EXPIRING_SOON' as const,
          reasonText: `Hợp đồng cũ sắp hết hạn (Còn ${daysLeft} ngày - Hết hạn: ${formatDateVN(activeContract.endDateContract)})`,
          daysRemaining: daysLeft,
          contractEndDate: activeContract.endDateContract,
          pendingReservation,
          buildingId: parentBuilding?.nodeId || 0,
          buildingName: parentBuilding?.nodeName || 'Tòa nhà'
        };
      }
    }

    return {
      room,
      isEligible: false,
      reason: null,
      reasonText: 'Đang có khách thuê dài hạn (Chưa đến hạn giữ phòng)',
      daysRemaining: null,
      contractEndDate: activeContract?.endDateContract || null,
      pendingReservation: null,
      buildingId: parentBuilding?.nodeId || 0,
      buildingName: parentBuilding?.nodeName || 'Tòa nhà'
    };
  }).filter((item) => item.isEligible);

  // Lọc theo tòa nhà & Sắp xếp theo giá Tăng dần / Giảm dần
  const displayedEligibleRooms = eligibleRooms
    .filter((item) => {
      if (buildingFilter !== 'ALL' && item.buildingId !== buildingFilter) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      const pA = a.room.unitPrice || 0;
      const pB = b.room.unitPrice || 0;
      if (priceSort === 'ASC') return pA - pB;
      if (priceSort === 'DESC') return pB - pA;
      return 0;
    });

  // Xử lý gửi yêu cầu giữ phòng
  const handleConfirmHoldRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoomToReserve) return;

    onRequestReservation(selectedRoomToReserve.nodeId, expectedCheckInDate);
    setSelectedRoomToReserve(null);
    setReservationSuccessAlert(true);
    setTimeout(() => setReservationSuccessAlert(false), 4000);
  };

  // Lọc các phòng người dùng hiện tại đang giữ chỗ
  const myReservations = currentUser 
    ? reservations.filter((r) => r.userId === currentUser.userId)
    : [];

  const allBuildings = nodes.filter((n) => n.parentNodeId === null);
  const isManagerOrAdmin = currentUser && (currentUser.roleId === 1 || currentUser.roleId === 2);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* 1. HERO BANNER CHÍNH CỦA TRANG CHỦ */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-950 via-slate-900 to-indigo-950 border border-blue-500/30 p-6 sm:p-10 shadow-2xl">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 text-xs font-bold text-blue-400 bg-blue-500/10 border border-blue-500/30 px-3 py-1 rounded-full uppercase tracking-wider">
            <Building2 className="w-3.5 h-3.5" />
            Mô Hình Chuỗi 100 Nhà Trọ Công Nghệ IoT Thông Minh
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Nơi Thuê Trọ An Ninh, Minh Bạch &amp; Tiện Nghi Bậc Nhất
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Hệ thống quản lý tích hợp thiết bị IoT (mở cổng từ xa, máy giặt tự động, trạm sạc xe điện thông minh). 
            Định danh cư dân bằng CCCD và địa chỉ thực tế, đánh giá 2 chiều minh bạch được khóa bảo chứng sau khi trả phòng.
          </p>

          {/* CTA Dành cho người chưa đăng nhập hoặc đã đăng nhập */}
          {!currentUser ? (
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={onOpenLoginModal}
                className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm shadow-xl shadow-blue-600/30 transition-all flex items-center gap-2 active:scale-95"
              >
                <LogIn className="w-4 h-4" />
                <span>Đăng Nhập Để Giữ Phòng</span>
              </button>

              <button
                onClick={onOpenRegisterModal}
                className="px-6 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs sm:text-sm border border-slate-700 transition-all flex items-center gap-2"
              >
                <UserPlus className="w-4 h-4 text-emerald-400" />
                <span>Chưa Có Tài Khoản? Đăng Ký Ngay</span>
              </button>
            </div>
          ) : (
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <div className="bg-slate-900/90 border border-blue-500/40 p-3 rounded-2xl flex items-center gap-3 text-xs">
                <div className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 font-bold">
                  ✓
                </div>
                <div>
                  <div className="text-white font-semibold">
                    Đã đăng nhập: <strong className="text-blue-300">{currentUser.fullName}</strong>
                  </div>
                  <div className="text-emerald-400 text-[11px]">
                    {currentUser.roleId === 3 
                      ? 'Khách thuê phòng • Có thể xem ngay bảng kê hóa đơn hàng tháng' 
                      : 'Được quyền Giữ Phòng / Đặt Trước trực tuyến bên dưới'}
                  </div>
                </div>
              </div>

              {/* Nút Xem Hóa Đơn & Bảng Điều Khiển Nhanh cho Khách Thuê */}
              {currentUser.roleId === 3 && onNavigate && (
                <button
                  type="button"
                  onClick={() => onNavigate('dashboard')}
                  className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm shadow-xl shadow-emerald-600/30 transition-all flex items-center gap-2 active:scale-95 ring-2 ring-emerald-400/50"
                >
                  <CreditCard className="w-4 h-4 text-white" />
                  <span>Xem Hóa Đơn &amp; Phòng Của Tôi</span>
                </button>
              )}

              {/* Nút Thêm Tòa Nhà: Chỉ Quản lý Cấp 1 & 2 mới có quyền */}
              {onOpenAddBuildingModal && isManagerOrAdmin && (
                <button
                  onClick={onOpenAddBuildingModal}
                  className="px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm shadow-xl shadow-blue-600/30 transition-all flex items-center gap-2 active:scale-95"
                >
                  <Building2 className="w-4 h-4" />
                  <span>+ Thêm Tòa Nhà Mới (Quyền Quản Lý)</span>
                </button>
              )}

              {/* Nút Thêm Phòng: Chỉ Quản lý Cấp 1 & 2 mới có quyền */}
              {onOpenAddRoomModal && isManagerOrAdmin && (
                <button
                  onClick={() => onOpenAddRoomModal()}
                  className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm shadow-xl shadow-emerald-600/30 transition-all flex items-center gap-2 active:scale-95 ring-1 ring-emerald-400/50"
                >
                  <DoorClosed className="w-4 h-4" />
                  <span>+ Thêm Phòng Mới (Quyền Quản Lý)</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Trang trí background */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-blue-600/10 to-transparent pointer-events-none" />
      </section>

      {/* Thông báo giữ phòng thành công */}
      {reservationSuccessAlert && (
        <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500/60 text-emerald-200 flex items-center gap-3 text-xs shadow-lg animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <div>
            <strong>Đã gửi yêu cầu giữ phòng thành công!</strong> Yêu cầu đã chuyển sang trạng thái <strong>Chờ Quản lý xác nhận</strong>. Sau khi Quản lý duyệt, phòng sẽ chính thức được loại khỏi danh sách giữ phòng và tạo hợp đồng cho bạn.
          </div>
        </div>
      )}

      {/* 2. KHU VỰC: DANH SÁCH CÁC TÒA NHÀ TRONG CHUỖI & THÊM TÒA NHÀ MỚI */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/90 p-5 rounded-2xl border border-slate-800 shadow-md">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs text-blue-400 font-bold bg-blue-500/10 border border-blue-500/30 px-2.5 py-0.5 rounded-full mb-1">
              <Building2 className="w-3.5 h-3.5" />
              Mục Quản Lý Tòa Nhà Trọ
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              Các Tòa Nhà Trong Chuỗi ({allBuildings.length} Tòa Nhà)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Mỗi tòa nhà là một nút gốc (Root Node) tích hợp địa chỉ thực tế, trạm sạc xe điện, cổng từ vân tay và máy giặt IoT.
            </p>
          </div>

          {/* Nút Thêm Tòa Nhà & Thêm Phòng */}
          <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
            {onOpenAddBuildingModal && isManagerOrAdmin && (
              <button
                onClick={onOpenAddBuildingModal}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-blue-600/30 flex items-center gap-1.5 transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>+ Thêm Tòa Nhà Mới</span>
              </button>
            )}

            {onOpenAddRoomModal && isManagerOrAdmin && (
              <button
                onClick={() => onOpenAddRoomModal()}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-600/30 flex items-center gap-1.5 transition-all active:scale-95"
                title="Tạo nhà xong mới tạo phòng - Ấn định mức giá theo từng thời điểm"
              >
                <DoorClosed className="w-4 h-4" />
                <span>+ Thêm Phòng Mới</span>
              </button>
            )}

            {!isManagerOrAdmin && (
              <div className="text-[11px] text-slate-400 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                <span>Chỉ Quản lý Cấp 1 &amp; 2 mới có quyền thêm nhà và phòng</span>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {allBuildings.map((building) => {
            const buildingFloors = nodes.filter((n) => n.parentNodeId === building.nodeId && n.typeId === 2);
            const floorIds = buildingFloors.map((f) => f.nodeId);
            const buildingRooms = nodes.filter(
              (n) => n.typeId === 3 && (floorIds.includes(n.parentNodeId || 0) || n.parentNodeId === building.nodeId)
            );
            const vacantCount = buildingRooms.filter((r) => !contracts.some((c) => c.roomNodeId === r.nodeId && c.status === 'ACTIVE')).length;

            return (
              <div
                key={building.nodeId}
                className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-blue-500/50 transition-all flex flex-col justify-between gap-3 shadow-lg group"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-mono text-xs bg-blue-950 text-blue-300 border border-blue-800 px-2 py-0.5 rounded font-bold">
                      {building.nodeCode}
                    </span>
                    <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                      {vacantCount} phòng trống
                    </span>
                  </div>

                  <h3 className="font-bold text-white text-base group-hover:text-blue-400 transition-colors">
                    {building.nodeName}
                  </h3>

                  <div className="text-xs text-slate-300 flex items-start gap-1.5 bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80">
                    <MapPin className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span className="leading-snug">
                      Địa chỉ: <strong>{building.addressOrLocation || 'Đang cập nhật'}</strong>
                    </span>
                  </div>

                  {/* Tiện ích tòa nhà */}
                  <div className="flex flex-wrap gap-1.5 text-[10px] text-slate-300">
                    <span className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700">
                      🚪 Cổng từ vân tay
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700">
                      ⚡ Trạm sạc xe điện
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700">
                      🫧 Máy giặt IoT
                    </span>
                  </div>
                </div>

                {/* Footer Card: Quy mô & Nút Thêm Phòng Vào Nhà Này */}
                <div className="pt-3 border-t border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Quy mô: <strong>{buildingFloors.length} tầng</strong> • <strong>{buildingRooms.length} phòng</strong></span>
                    <span className="text-emerald-400 font-semibold text-[11px] flex items-center gap-1">
                      <Check className="w-3 h-3" /> Đang vận hành
                    </span>
                  </div>

                  {/* Nút Thêm Phòng Vào Nhà Này - Đáp ứng đúng "Tạo nhà xong mới tạo phòng" */}
                  {onOpenAddRoomModal && (
                    <button
                      onClick={() => onOpenAddRoomModal(building.nodeId)}
                      className={`w-full py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
                        isManagerOrAdmin
                          ? 'bg-gradient-to-r from-emerald-600/20 to-teal-600/20 hover:from-emerald-600/30 hover:to-teal-600/30 border border-emerald-500/40 text-emerald-300 hover:text-white shadow-sm'
                          : 'bg-slate-800/60 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200'
                      }`}
                      title={`Thêm phòng mới trực tiếp vào ${building.nodeName}`}
                    >
                      <DoorClosed className="w-3.5 h-3.5 text-emerald-400" />
                      <span>+ Thêm Phòng Vào Tòa Nhà Này</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. KHU VỰC GIỮ PHÒNG / ĐẶT TRƯỚC (CHO PHÉP SẮP XẾP THEO GIÁ TĂNG DẦN / GIẢM DẦN) */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/80 p-5 rounded-2xl border border-slate-800">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs text-amber-400 font-bold bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 rounded-full mb-1">
              <BookmarkCheck className="w-3.5 h-3.5" />
              Nghiệp Vụ Giữ Phòng Đặt Trước
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              Danh Sách Phòng Mở Đặt Trước &amp; Giữ Chỗ
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Bao gồm <strong>toàn bộ phòng trống chưa có người thuê</strong> và <strong>phòng sắp hết hạn hợp đồng trong vòng {expiringLeadDays} ngày</strong>.
            </p>
          </div>

          {/* Công cụ dành cho Quản lý tòa nhà hoặc Admin: Ấn định số ngày sắp hết hạn & Nút Thêm Phòng */}
          <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
            {isManagerOrAdmin && (
              <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-xl border border-slate-800 text-xs">
                <SlidersHorizontal className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-slate-400 text-[11px]">Hạn báo trước:</span>
                <select
                  value={expiringLeadDays}
                  onChange={(e) => onSetExpiringLeadDays(Number(e.target.value))}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white font-mono text-xs outline-none focus:border-blue-500"
                >
                  <option value={15}>15 ngày</option>
                  <option value={30}>30 ngày (Chuẩn)</option>
                  <option value={45}>45 ngày</option>
                  <option value={60}>60 ngày</option>
                </select>
              </div>
            )}

            {onOpenAddRoomModal && isManagerOrAdmin && (
              <button
                onClick={() => onOpenAddRoomModal()}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-600/30 flex items-center gap-1.5 transition-all active:scale-95"
                title="Thêm phòng mới vào danh sách"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Thêm Phòng Mới</span>
              </button>
            )}
          </div>
        </div>

        {/* Thanh công cụ Sắp Xếp Theo Giá & Bộ Lọc Tòa Nhà Dành Cho Người Dùng */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-900/90 p-4 rounded-2xl border border-slate-800 text-xs">
          {/* Nút bấm sắp xếp giá: Tăng dần / Giảm dần / Mặc định */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <ArrowUpDown className="w-4 h-4 text-emerald-400" />
              Sắp xếp theo giá:
            </span>
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setPriceSort('DEFAULT')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  priceSort === 'DEFAULT' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Mặc định
              </button>
              <button
                type="button"
                onClick={() => setPriceSort('ASC')}
                className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 transition-all ${
                  priceSort === 'ASC' 
                    ? 'bg-emerald-600 text-white shadow-md' 
                    : 'text-slate-400 hover:text-emerald-400'
                }`}
                title="Sắp xếp phòng từ giá thấp đến cao"
              >
                <ArrowUp className="w-3.5 h-3.5" />
                <span>Giá Tăng Dần</span>
              </button>
              <button
                type="button"
                onClick={() => setPriceSort('DESC')}
                className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 transition-all ${
                  priceSort === 'DESC' 
                    ? 'bg-emerald-600 text-white shadow-md' 
                    : 'text-slate-400 hover:text-emerald-400'
                }`}
                title="Sắp xếp phòng từ giá cao đến thấp"
              >
                <ArrowDown className="w-3.5 h-3.5" />
                <span>Giá Giảm Dần</span>
              </button>
            </div>

            {priceSort !== 'DEFAULT' && (
              <span className="text-[11px] text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-lg font-mono">
                ✓ Đang xếp: {priceSort === 'ASC' ? 'Thấp đến Cao' : 'Cao đến Thấp'}
              </span>
            )}
          </div>

          {/* Lọc theo tòa nhà */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Tòa nhà:</span>
            <select
              value={buildingFilter}
              onChange={(e) => setBuildingFilter(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
              className="bg-slate-950 border border-slate-800 text-white text-xs px-3 py-1.5 rounded-xl outline-none focus:border-blue-500"
            >
              <option value="ALL">Tất cả ({allBuildings.length} tòa nhà)</option>
              {allBuildings.map((b) => (
                <option key={b.nodeId} value={b.nodeId}>
                  {b.nodeName}
                </option>
              ))}
            </select>
            <span className="text-slate-400 font-mono text-[11px]">
              ({displayedEligibleRooms.length} phòng)
            </span>
          </div>
        </div>

        {/* Danh sách phòng mở đặt trước */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayedEligibleRooms.map(({ room, reason, reasonText, daysRemaining, pendingReservation, buildingName }) => {
            const isPendingHold = !!pendingReservation;

            return (
              <div 
                key={room.nodeId}
                className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between gap-4 shadow-lg group"
              >
                <div className="space-y-3">
                  {/* Badge Trạng thái phòng */}
                  <div className="flex justify-between items-start gap-2">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                      reason === 'ROOM_VACANT'
                        ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60'
                        : 'bg-amber-950/80 text-amber-300 border-amber-700/60'
                    }`}>
                      {reason === 'ROOM_VACANT' ? '⚡ Phòng Trống' : `⏳ Sắp Trống (${daysRemaining} ngày)`}
                    </span>

                    {isPendingHold && (
                      <span className="text-[10px] bg-purple-950 text-purple-300 border border-purple-800 px-2 py-0.5 rounded-full font-semibold animate-pulse">
                        Đang chờ duyệt
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="font-bold text-white text-base group-hover:text-blue-400 transition-colors">
                      {room.nodeName}
                    </h3>
                    <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                      <Building2 className="w-3.5 h-3.5 text-blue-400" />
                      <span>{buildingName} • Mã: [{room.nodeCode}]</span>
                    </div>

                    {/* Ghi chú giá thời điểm nếu có */}
                    {room.pricePeriodNote && (
                      <div className="mt-1.5 inline-flex items-center gap-1 text-[10px] text-amber-300 bg-amber-950/70 border border-amber-800/80 px-2 py-0.5 rounded-md font-medium">
                        <Tag className="w-3 h-3 text-amber-400 flex-shrink-0" />
                        <span>{room.pricePeriodNote}</span>
                      </div>
                    )}
                  </div>

                  {/* Lý do mở đặt trước */}
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 text-[11px] text-slate-300 space-y-1">
                    <div className="text-slate-400">Lý do mở giữ chỗ:</div>
                    <div className="font-medium text-amber-300/90">{reasonText}</div>
                  </div>

                  {/* Giá thuê và cọc */}
                  <div className="flex justify-between items-center text-xs pt-1">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Giá thuê phòng</span>
                      <span className="font-mono text-base font-bold text-emerald-400">
                        {(room.unitPrice || 4500000).toLocaleString('vi-VN')} đ/tháng
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 block text-[10px]">Tiền cọc phòng</span>
                      <span className="font-mono text-xs font-semibold text-slate-300">
                        {(room.depositAmount || 4500000).toLocaleString('vi-VN')} đ
                      </span>
                    </div>
                  </div>

                  {/* LIỆT KÊ TRANG THIẾT BỊ ĐI CÙNG PHÒNG - BẤM VÀO ĐỂ XEM ẢNH THỰC TẾ */}
                  {(() => {
                    const roomDevices = nodes.filter(
                      (n) => n.typeId >= 4 && (n.roomNodeId === room.nodeId || n.parentNodeId === room.nodeId)
                    );

                    return (
                      <div className="pt-2 border-t border-slate-800/80 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                            Trang thiết bị phòng ({roomDevices.length}):
                          </span>
                          <span className="text-[10px] text-blue-400 font-medium flex items-center gap-1">
                            <Camera className="w-3 h-3 text-blue-400" />
                            Bấm xem ảnh
                          </span>
                        </div>

                        {roomDevices.length === 0 ? (
                          <div className="text-[11px] text-slate-500 italic p-2 rounded-xl bg-slate-950/60 border border-slate-800/60 text-center">
                            Trang bị cơ bản (Đang cập nhật thiết bị chi tiết)
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-1.5">
                            {roomDevices.slice(0, 4).map((dev) => (
                              <button
                                key={dev.nodeId}
                                type="button"
                                onClick={() => setSelectedDeviceForPhoto({
                                  device: dev,
                                  roomName: room.nodeName,
                                  buildingName
                                })}
                                className="p-1.5 px-2 rounded-xl bg-slate-950/90 hover:bg-slate-800 border border-slate-800 hover:border-blue-500/70 text-left transition-all group/dev flex items-center justify-between gap-1.5 active:scale-95 shadow-sm"
                                title={`Bấm xem ảnh chụp thực tế: ${dev.nodeName}`}
                              >
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <span className="text-base flex-shrink-0">{getDeviceCategoryIcon(dev)}</span>
                                  <div className="truncate">
                                    <div className="text-[11px] font-semibold text-slate-200 group-hover/dev:text-blue-300 truncate">
                                      {dev.nodeName.split(' ')[0]} {dev.nodeName.split(' ')[1] || ''}
                                    </div>
                                    <div className="text-[9px] text-slate-400 truncate font-mono">
                                      [{dev.nodeCode}]
                                    </div>
                                  </div>
                                </div>
                                <Camera className="w-3.5 h-3.5 text-slate-500 group-hover/dev:text-blue-400 flex-shrink-0" />
                              </button>
                            ))}
                          </div>
                        )}

                        {roomDevices.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setInspectingRoom({ room, buildingName, reasonText })}
                            className="w-full py-1.5 px-2 rounded-xl bg-slate-950 hover:bg-slate-800/90 border border-slate-800 hover:border-blue-500/50 text-blue-300 hover:text-white font-semibold text-[11px] flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95"
                          >
                            <Eye className="w-3.5 h-3.5 text-blue-400" />
                            <span>Xem toàn bộ {roomDevices.length} thiết bị &amp; ảnh chụp phòng</span>
                          </button>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* Nút hành động */}
                <div className="pt-3 border-t border-slate-800">
                  {!currentUser ? (
                    <button
                      onClick={onOpenLoginModal}
                      className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-all flex items-center justify-center gap-1.5"
                    >
                      <LogIn className="w-3.5 h-3.5 text-blue-400" />
                      <span>Đăng nhập để giữ phòng</span>
                    </button>
                  ) : isPendingHold ? (
                    <div className="w-full py-2.5 rounded-xl bg-purple-950/40 border border-purple-800/60 text-center text-xs text-purple-300 font-medium">
                      Đã có khách gửi yêu cầu (Đang chờ Quản lý xác nhận)
                    </div>
                  ) : (
                    <button
                      onClick={() => setSelectedRoomToReserve(room)}
                      className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-all shadow-md shadow-blue-600/20 flex items-center justify-center gap-1.5 active:scale-95"
                    >
                      <BookmarkCheck className="w-4 h-4" />
                      <span>Bấm Giữ Phòng Này</span>
                    </button>
                  )}

                  {/* Công cụ dành cho Quản lý cấp 1 và 2: Bớt phòng & Ấn định giá thời điểm */}
                  {isManagerOrAdmin && (
                    <div className="flex items-center gap-1.5 pt-2 mt-2 border-t border-slate-800/80">
                      {onUpdateRoomPrice && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingPriceRoom(room);
                            setEditPriceValue(room.unitPrice || 4500000);
                            setEditPriceNote(room.pricePeriodNote || 'Giá mùa cao điểm tháng 9/2026');
                          }}
                          className="flex-1 py-1.5 px-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 font-semibold text-[11px] flex items-center justify-center gap-1 transition-colors"
                          title="Ấn định mức giá khác nhau tùy thuộc các thời điểm khác nhau"
                        >
                          <Tag className="w-3 h-3 text-amber-400" />
                          <span>Ấn định giá</span>
                        </button>
                      )}

                      {onDeleteRoom && (
                        <button
                          type="button"
                          onClick={() => onDeleteRoom(room.nodeId)}
                          className="py-1.5 px-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 font-semibold text-[11px] flex items-center justify-center gap-1 transition-colors"
                          title="Bớt phòng khỏi tòa nhà (Quản lý có thể thêm hoặc bớt phòng)"
                        >
                          <span>Bớt phòng</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. BẢNG QUẢN LÝ YÊU CẦU GIỮ PHÒNG (Dành cho Quản lý & Admins để xác nhận duyệt hoặc từ chối) */}
      {currentUser && (currentUser.roleId === 1 || currentUser.roleId === 2) && (
        <section className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-400" />
                Duyệt Yêu Cầu Giữ Phòng Của Khách (Quyền Quản Lý Tòa Nhà)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Khi Quản lý bấm <strong>"Xác nhận duyệt hợp đồng"</strong>, phòng sẽ chính thức bị <strong>loại khỏi danh sách giữ phòng</strong> và tạo hợp đồng cư trú cho khách.
              </p>
            </div>
            <span className="text-xs font-mono bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-amber-400">
              {reservations.filter((r) => r.status === 'PENDING').length} yêu cầu chờ duyệt
            </span>
          </div>

          <div className="space-y-3">
            {reservations.filter((r) => r.status === 'PENDING').length === 0 ? (
              <div className="p-6 rounded-2xl bg-slate-950/60 border border-slate-800 text-center text-xs text-slate-400">
                Hiện không có yêu cầu giữ phòng nào đang chờ duyệt.
              </div>
            ) : (
              reservations.filter((r) => r.status === 'PENDING').map((res) => (
                <div 
                  key={res.reservationId}
                  className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{res.roomName}</span>
                      <span className="text-[10px] bg-blue-950 text-blue-300 border border-blue-800 px-2 py-0.5 rounded">
                        {res.buildingName}
                      </span>
                    </div>
                    <div className="text-slate-300">
                      Khách đặt: <strong>{res.userName}</strong> • SĐT: <strong>{res.userPhone}</strong> • CCCD: <strong className="font-mono">{res.userCitizenId}</strong>
                    </div>
                    <div className="text-emerald-400 flex items-center gap-1 text-[11px]">
                      <MapPin className="w-3 h-3 flex-shrink-0" />
                      <span>Địa chỉ thường trú: {res.userAddress}</span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Ngày dự kiến nhận phòng: <strong className="text-amber-300">{formatDateVN(res.expectedCheckInDate)}</strong> • Giá thuê: {res.monthlyRent.toLocaleString('vi-VN')} đ/tháng
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onRejectReservation(res.reservationId)}
                      className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-rose-900/60 text-slate-300 hover:text-rose-200 font-semibold text-xs transition-colors flex items-center gap-1"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Từ Chối</span>
                    </button>
                    <button
                      onClick={() => onConfirmReservation(res.reservationId)}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-1.5 active:scale-95"
                    >
                      <Check className="w-4 h-4" />
                      <span>Xác Nhận Duyệt (Loại Khỏi Danh Sách Giữ)</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      )}

      {/* 4. KHU VỰC BÀI VIẾT GIỚI THIỆU TÒA NHÀ & TIỆN ÍCH */}
      <section className="space-y-4">
        <div className="flex justify-between items-center bg-slate-900/80 p-5 rounded-2xl border border-slate-800">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs text-cyan-400 font-bold bg-cyan-500/10 border border-cyan-500/30 px-2.5 py-0.5 rounded-full mb-1">
              <FileText className="w-3.5 h-3.5" />
              Bản Tin &amp; Tiện Ích
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white">
              Bài Viết Giới Thiệu Tòa Nhà &amp; Tiện Ích Nổi Bật
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Cập nhật thông tin dịch vụ, nội quy và không gian sống tiện nghi tại chuỗi 100 tòa nhà.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {posts.map((post) => (
            <div 
              key={post.postId}
              className="rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl flex flex-col justify-between hover:border-slate-700 transition-all group"
            >
              <div className="relative h-48 overflow-hidden bg-slate-950">
                <img 
                  src={post.coverImage} 
                  alt={post.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur border border-slate-800 px-3 py-1 rounded-full text-[11px] font-semibold text-blue-400">
                  {post.buildingName}
                </div>
              </div>

              <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="text-[11px] text-slate-400 flex justify-between">
                    <span>Đăng bởi: <strong>{post.authorName}</strong> ({post.authorRole})</span>
                    <span>{formatDateVN(post.createdAt)}</span>
                  </div>
                  <h3 className="font-bold text-white text-base leading-snug group-hover:text-cyan-400 transition-colors">
                    {post.title}
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">
                    {post.summary}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-800 flex justify-between items-center">
                  <button
                    onClick={() => setSelectedPost(post)}
                    className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 transition-colors"
                  >
                    <span>Đọc toàn văn bài viết</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Modal Giữ Phòng Cho Khách Đã Đăng Nhập */}
      {selectedRoomToReserve && currentUser && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <BookmarkCheck className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-white text-base">Xác Nhận Đặt Trước &amp; Giữ Phòng</h3>
              </div>
              <button 
                onClick={() => setSelectedRoomToReserve(null)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmHoldRoom} className="space-y-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-blue-950/40 border border-blue-800/50 space-y-1.5">
                <div className="font-bold text-white text-sm">{selectedRoomToReserve.nodeName}</div>
                <div className="text-slate-300">
                  Giá thuê: <strong className="text-emerald-400 font-mono">{(selectedRoomToReserve.unitPrice || 4500000).toLocaleString('vi-VN')} đ/tháng</strong>
                </div>
                <div className="text-slate-400 text-[11px]">
                  Tiền cọc giữ chỗ: {(selectedRoomToReserve.depositAmount || 4500000).toLocaleString('vi-VN')} đ (Được khấu trừ vào hợp đồng chính thức)
                </div>
              </div>

              {/* Thông tin người đặt tự động điền từ tài khoản đăng nhập */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5 text-slate-300">
                <div className="font-semibold text-slate-200">Thông tin người giữ phòng:</div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Họ và tên:</span>
                  <span className="font-bold text-white">{currentUser.fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Số CCCD định danh:</span>
                  <span className="font-mono text-slate-200">{currentUser.citizenId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Số điện thoại:</span>
                  <span className="font-mono text-slate-200">{currentUser.phoneNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Địa chỉ thường trú:</span>
                  <span className="text-emerald-300">{currentUser.address}</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Ngày dự kiến đến nhận phòng:</label>
                <input
                  type="date"
                  value={expectedCheckInDate}
                  onChange={(e) => setExpectedCheckInDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800/40 text-[11px] text-amber-300/90 leading-relaxed">
                * Quy tắc nghiệp vụ: Yêu cầu của bạn sẽ được gửi tới Quản lý tòa nhà để kiểm duyệt. Phòng vẫn sẽ được giữ trong danh sách chờ cho đến khi Quản lý xác nhận chấp thuận thì mới hoàn tất tạo hợp đồng.
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedRoomToReserve(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg shadow-blue-600/30"
                >
                  Gửi Yêu Cầu Giữ Phòng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Đọc Toàn Văn Bài Viết */}
      {selectedPost && (
        <div 
          onClick={() => setSelectedPost(null)}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-start border-b border-slate-800 pb-3">
              <div>
                <span className="text-[11px] text-blue-400 font-semibold">{selectedPost.buildingName}</span>
                <h3 className="font-bold text-white text-lg leading-tight mt-0.5">{selectedPost.title}</h3>
                <div className="text-[11px] text-slate-400 mt-1">
                  Đăng ngày: {formatDateVN(selectedPost.createdAt)} • Tác giả: {selectedPost.authorName} ({selectedPost.authorRole})
                </div>
              </div>
              <button 
                onClick={() => setSelectedPost(null)}
                className="text-slate-400 hover:text-white text-sm p-1 bg-slate-800 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="rounded-2xl overflow-hidden h-52 bg-slate-950">
              <img src={selectedPost.coverImage} alt={selectedPost.title} className="w-full h-full object-cover" />
            </div>

            <div className="space-y-3 text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-line">
              <p className="font-medium text-slate-300 italic bg-slate-950 p-3 rounded-xl border border-slate-800">
                "{selectedPost.summary}"
              </p>
              <p>{selectedPost.content}</p>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedPost(null)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Quản lý Ấn Định Mức Giá Khác Nhau Tùy Thuộc Từng Thời Điểm */}
      {editingPriceRoom && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Tag className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Ấn Định Mức Giá Theo Thời Điểm</h3>
                  <p className="text-xs text-slate-400">{editingPriceRoom.nodeName} ({editingPriceRoom.nodeCode})</p>
                </div>
              </div>
              <button 
                onClick={() => setEditingPriceRoom(null)} 
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (onUpdateRoomPrice) {
                  onUpdateRoomPrice(editingPriceRoom.nodeId, Number(editPriceValue), editPriceNote);
                }
                setEditingPriceRoom(null);
              }}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Mức Giá Mới (VNĐ/tháng):</label>
                <input
                  type="number"
                  required
                  step={100000}
                  value={editPriceValue}
                  onChange={(e) => setEditPriceValue(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-emerald-400 font-mono font-bold text-sm outline-none focus:border-amber-500"
                />
                <div className="text-[11px] text-slate-400 mt-1 font-mono">
                  = {Number(editPriceValue).toLocaleString('vi-VN')} đ/tháng
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Thời Điểm / Giai Đoạn Áp Dụng:</label>
                <input
                  type="text"
                  required
                  value={editPriceNote}
                  onChange={(e) => setEditPriceNote(e.target.value)}
                  placeholder="Ví dụ: Giá mùa cao điểm tháng 9/2026, Giá mùa hè giảm 10%..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-500"
                />
                <div className="flex flex-wrap gap-1.5 mt-1.5 text-[10px]">
                  {['Giá mùa cao điểm tháng 9/2026', 'Giá mùa hè giảm 10%', 'Giá ưu đãi tân sinh viên', 'Giá tiêu chuẩn cố định'].map(item => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setEditPriceNote(item)}
                      className="text-amber-400 underline underline-offset-2"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-300">
                💡 Theo quy định: Người quản lý Cấp 1 &amp; Cấp 2 có quyền ấn định giá theo các thời điểm khác nhau. Giá mới sẽ hiển thị trực tiếp cho khách thuê giữ phòng.
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingPriceRoom(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 text-white font-bold shadow-lg"
                >
                  Lưu Ấn Định Giá
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL XEM TRỌN BỘ TRANG THIẾT BỊ ĐI CÙNG PHÒNG DÀNH CHO KHÁCH XEM PHÒNG */}
      {inspectingRoom && (() => {
        const targetRoom = inspectingRoom.room;
        const targetRoomDevices = nodes.filter(
          (n) => n.typeId >= 4 && (n.roomNodeId === targetRoom.nodeId || n.parentNodeId === targetRoom.nodeId)
        );
        const targetBuilding = getRootBuilding(targetRoom);
        const targetBuildingSharedDevices = nodes.filter(
          (n) => n.typeId >= 4 && n.isShared === true && (
            n.buildingNodeId === targetBuilding?.nodeId || 
            n.parentNodeId === targetBuilding?.nodeId ||
            nodes.some(p => p.nodeId === n.parentNodeId && p.parentNodeId === targetBuilding?.nodeId)
          )
        );

        return (
          <div 
            className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 z-50 animate-in fade-in duration-200"
            onClick={(e) => {
              if (e.target === e.currentTarget) setInspectingRoom(null);
            }}
          >
            <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
              
              {/* Header Modal */}
              <div className="p-4 px-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-400">
                    <DoorClosed className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-white text-base sm:text-lg">
                        {targetRoom.nodeName}
                      </h3>
                      <span className="text-[11px] font-mono bg-blue-950 text-blue-300 border border-blue-800 px-2 py-0.5 rounded font-bold">
                        {targetRoom.nodeCode}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Trực thuộc: <strong>{inspectingRoom.buildingName}</strong> • Giá thuê: <strong className="text-emerald-400 font-mono">{(targetRoom.unitPrice || 4500000).toLocaleString('vi-VN')} đ/tháng</strong>
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setInspectingRoom(null)}
                  className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body Danh sách thiết bị */}
              <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
                
                {/* Banner hướng dẫn cho khách xem phòng */}
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-950/60 to-indigo-950/40 border border-blue-500/30 flex items-center gap-3 text-xs text-blue-200 shadow-sm">
                  <Camera className="w-5 h-5 text-blue-400 flex-shrink-0" />
                  <div>
                    <span className="font-bold text-white">Khách xem phòng chú ý:</span> Bấm vào từng thiết bị dưới đây để <strong>xem ảnh chụp thực tế</strong>, tem bảo hành chính hãng và vị trí lắp đặt cụ thể trong phòng trước khi quyết định giữ chỗ.
                  </div>
                </div>

                {/* 1. Thiết bị riêng bàn giao trong phòng */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-white text-sm flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      Trang Thiết Bị Bàn Giao Trong Phòng ({targetRoomDevices.length} Thiết Bị)
                    </h4>
                    <span className="text-[11px] text-emerald-400 font-semibold bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-full">
                      Miễn phí 100% theo tiền thuê
                    </span>
                  </div>

                  {targetRoomDevices.length === 0 ? (
                    <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 text-center text-xs text-slate-400">
                      Chưa có thiết bị nào được gán cho phòng này.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {targetRoomDevices.map((dev) => {
                        const photoUrl = getDevicePhotoUrl(dev);
                        const icon = getDeviceCategoryIcon(dev);

                        return (
                          <div
                            key={dev.nodeId}
                            className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-blue-500/50 transition-all flex flex-col justify-between gap-3 shadow-md group"
                          >
                            <div className="flex gap-3">
                              {/* Thumbnail ảnh thực tế */}
                              <div 
                                onClick={() => setSelectedDeviceForPhoto({
                                  device: dev,
                                  roomName: targetRoom.nodeName,
                                  buildingName: inspectingRoom.buildingName
                                })}
                                className="w-20 h-20 rounded-xl overflow-hidden bg-slate-900 border border-slate-800 flex-shrink-0 relative cursor-pointer group-hover:border-blue-500/60 shadow-inner"
                                title="Bấm phóng lớn ảnh chụp thiết bị này"
                              >
                                <img
                                  src={photoUrl}
                                  alt={dev.nodeName}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                />
                                <div className="absolute inset-0 bg-black/30 group-hover:bg-transparent transition-colors flex items-center justify-center">
                                  <Camera className="w-4 h-4 text-white drop-shadow" />
                                </div>
                              </div>

                              {/* Thông tin thiết bị */}
                              <div className="min-w-0 flex-1 space-y-1">
                                <div className="flex items-center gap-1">
                                  <span className="text-base">{icon}</span>
                                  <span className="font-bold text-white text-xs leading-snug line-clamp-2">
                                    {dev.nodeName}
                                  </span>
                                </div>

                                <div className="text-[10px] text-slate-400 font-mono">
                                  Mã: {dev.nodeCode}
                                </div>

                                <div className="text-[10px] text-slate-300 truncate">
                                  📍 {dev.addressOrLocation || 'Trong phòng'}
                                </div>

                                <div className="flex items-center gap-1.5 pt-0.5">
                                  <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded border ${
                                    dev.currentCondition === 0
                                      ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                                      : 'bg-rose-950 text-rose-300 border-rose-800'
                                  }`}>
                                    {dev.currentCondition === 0 ? '✓ Đang hoạt động tốt' : '⚠️ Bảo dưỡng'}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Nút bấm xem ảnh phóng to */}
                            <button
                              type="button"
                              onClick={() => setSelectedDeviceForPhoto({
                                device: dev,
                                roomName: targetRoom.nodeName,
                                buildingName: inspectingRoom.buildingName
                              })}
                              className="w-full py-1.5 px-3 rounded-xl bg-slate-900 hover:bg-blue-600 text-slate-300 hover:text-white font-semibold text-xs transition-all flex items-center justify-center gap-1.5 border border-slate-800 hover:border-blue-500 shadow-sm active:scale-95"
                            >
                              <Camera className="w-3.5 h-3.5 text-blue-400 group-hover:text-white" />
                              <span>Bấm Xem Ảnh Phóng Lớn</span>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 2. Tiện ích dùng chung tòa nhà */}
                {targetBuildingSharedDevices.length > 0 && (
                  <div className="space-y-3 pt-3 border-t border-slate-800">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-white text-sm flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-purple-400" />
                        Tiện Ích &amp; Thiết Bị Dùng Chung Tòa Nhà ({targetBuildingSharedDevices.length})
                      </h4>
                      <span className="text-[11px] text-purple-300 font-semibold bg-purple-950/60 border border-purple-800/60 px-2 py-0.5 rounded-full">
                        🏢 Khu vực công cộng
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {targetBuildingSharedDevices.map((dev) => {
                        const photoUrl = getDevicePhotoUrl(dev);
                        const icon = getDeviceCategoryIcon(dev);

                        return (
                          <div
                            key={dev.nodeId}
                            className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 shadow-sm hover:border-purple-500/50 transition-all"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <img
                                src={photoUrl}
                                alt={dev.nodeName}
                                className="w-12 h-12 rounded-xl object-cover border border-slate-800 flex-shrink-0"
                              />
                              <div className="min-w-0">
                                <div className="text-xs font-bold text-white truncate flex items-center gap-1">
                                  <span>{icon}</span>
                                  <span className="truncate">{dev.nodeName}</span>
                                </div>
                                <div className="text-[10px] text-slate-400 truncate">
                                  {dev.addressOrLocation || 'Khu công cộng tòa nhà'}
                                </div>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => setSelectedDeviceForPhoto({
                                device: dev,
                                buildingName: inspectingRoom.buildingName
                              })}
                              className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-purple-300 text-[11px] font-semibold flex items-center gap-1 border border-slate-800 flex-shrink-0"
                            >
                              <Camera className="w-3 h-3" />
                              <span>Xem ảnh</span>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

              </div>

              {/* Footer Modal */}
              <div className="p-4 px-5 border-t border-slate-800 bg-slate-950/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-xs text-slate-400">
                  Phòng: <strong className="text-white">{targetRoom.nodeName}</strong> • Tiền cọc: <strong className="text-slate-200">{(targetRoom.depositAmount || 4500000).toLocaleString('vi-VN')} đ</strong>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setInspectingRoom(null)}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
                  >
                    Đóng
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const roomToReserve = targetRoom;
                      setInspectingRoom(null);
                      if (!currentUser) {
                        onOpenLoginModal();
                      } else {
                        setSelectedRoomToReserve(roomToReserve);
                      }
                    }}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 flex items-center gap-1.5 transition-all active:scale-95"
                  >
                    <BookmarkCheck className="w-4 h-4" />
                    <span>Giữ Phòng Này Ngay</span>
                  </button>
                </div>
              </div>

            </div>
          </div>
        );
      })()}

      {/* MODAL XEM ẢNH CHỤP THỰC TẾ CHI TIẾT TỪNG THIẾT BỊ */}
      <DevicePhotoModal
        isOpen={!!selectedDeviceForPhoto}
        device={selectedDeviceForPhoto?.device || null}
        buildingName={selectedDeviceForPhoto?.buildingName}
        roomName={selectedDeviceForPhoto?.roomName}
        onClose={() => setSelectedDeviceForPhoto(null)}
      />
    </div>
  );
};
