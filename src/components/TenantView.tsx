import React, { useState, useEffect } from 'react';
import { 
  Home, 
  DoorClosed, 
  KeyRound, 
  Zap, 
  Sparkles, 
  Wrench, 
  Star, 
  Lock, 
  Users, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Flame, 
  HelpCircle, 
  CreditCard, 
  Smartphone, 
  MapPin, 
  Building2,
  FileText,
  Key,
  Camera,
  Eye,
  Wifi,
  TrendingUp,
  History,
  Calendar,
  DollarSign,
  ArrowRight,
  X,
  ShieldCheck
} from 'lucide-react';
import { 
  User, 
  RentalContract, 
  Roommate, 
  MonthlyInvoice, 
  ManagementNode, 
  DeviceIssueReport, 
  TwoWayReview, 
  BuildingPost 
} from '../types/rental';
import { 
  DevicePhotoModal, 
  getDeviceCategoryIcon, 
  getDevicePhotoUrl 
} from './DevicePhotoModal';
import { formatDateVN, formatDateTimeVN } from '../utils/dateUtils';

interface TenantViewProps {
  currentUser: User;
  contracts: RentalContract[];
  roommates: Roommate[];
  invoices: MonthlyInvoice[];
  nodes: ManagementNode[];
  issues: DeviceIssueReport[];
  reviews: TwoWayReview[];
  posts: BuildingPost[];
  onOpenGate: (buildingNodeId: number) => void;
  onActivateSharedDevice: (deviceNodeId: number, deviceName: string, cost: number, durationMinutes: number) => void;
  onSubmitIssue: (issue: { nodeId: number; issueType: 'DAMAGED' | 'DIRTY' | 'DIFFICULT_TO_USE'; description: string }) => void;
  onSubmitReview: (review: { contractId: number; targetUserId: number; rating: number; comment: string }) => void;
  activeSharedSession: { deviceName: string; remainingMinutes: number } | null;
  gateUnlocked: boolean;
}

export const TenantView: React.FC<TenantViewProps> = ({
  currentUser,
  contracts,
  roommates,
  invoices,
  nodes,
  issues,
  reviews,
  posts,
  onOpenGate,
  onActivateSharedDevice,
  onSubmitIssue,
  onSubmitReview,
  activeSharedSession,
  gateUnlocked
}) => {
  // Lọc các hợp đồng mà người dùng này đứng tên (1 người có thể thuê nhiều phòng đồng thời)
  const userContracts = contracts.filter((c) => c.primaryTenantUserId === currentUser.userId);
  
  // Phòng đang chọn xem
  const [selectedContractId, setSelectedContractId] = useState<number>(
    userContracts[0]?.contractId || 1
  );

  const currentContract = userContracts.find((c) => c.contractId === selectedContractId) || userContracts[0];

  // Hóa đơn của phòng này (hỗ trợ chuyển đổi giữa các tháng: 09/2026, 01/2027...)
  const roomInvoices = invoices.filter((inv) => inv.contractId === currentContract?.contractId);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(null);
  const currentInvoice = roomInvoices.find((inv) => inv.invoiceId === selectedInvoiceId) || roomInvoices[0];

  // Xem lịch sử biến động giá của thiết bị phòng đang chọn
  const [selectedDeviceForHistory, setSelectedDeviceForHistory] = useState<ManagementNode | null>(null);

  // Người cùng ở phòng này
  const currentRoommates = roommates.filter((r) => r.contractId === currentContract?.contractId);

  // State các tab con trong màn hình khách thuê
  const [activeTab, setActiveTab] = useState<'room' | 'invoices' | 'sharedDevices' | 'issues' | 'reviews' | 'posts' | 'changePwd'>('room');

  // Form báo hỏng thiết bị
  const [selectedDeviceNodeId, setSelectedDeviceNodeId] = useState<number>(11);
  const [issueType, setIssueType] = useState<'DAMAGED' | 'DIRTY' | 'DIFFICULT_TO_USE'>('DAMAGED');
  const [issueDesc, setIssueDesc] = useState('');
  const [issueSubmittedAlert, setIssueSubmittedAlert] = useState(false);
  const [deviceScopeFilter, setDeviceScopeFilter] = useState<'ALL' | 'ROOM' | 'SHARED'>('ALL');

  // Form đánh giá quản lý
  const [ratingStar, setRatingStar] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmittedAlert, setReviewSubmittedAlert] = useState(false);

  // Đổi mật khẩu
  const [oldPwd, setOldPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [pwdChangedAlert, setPwdChangedAlert] = useState(false);

  // Modal xem ảnh thiết bị thực tế
  const [selectedDeviceForPhoto, setSelectedDeviceForPhoto] = useState<ManagementNode | null>(null);

  // 1. Thiết bị trong CHÍNH PHÒNG khách thuê đang ở
  const roomDevices = nodes.filter((n) => 
    n.typeId >= 4 && (n.roomNodeId === currentContract?.roomNodeId || n.parentNodeId === currentContract?.roomNodeId)
  );

  // 2. Thiết bị DÙNG CHUNG (CÔNG CỘNG) của tòa nhà mà phòng đó thuộc về
  const sharedBuildingDevices = nodes.filter((n) => 
    n.typeId >= 4 && (
      n.isShared === true && (
        n.buildingNodeId === currentContract?.buildingNodeId ||
        n.parentNodeId === currentContract?.buildingNodeId ||
        nodes.some(p => p.nodeId === n.parentNodeId && (p.parentNodeId === currentContract?.buildingNodeId || p.nodeId === currentContract?.buildingNodeId))
      )
    )
  );

  // Máy giặt riêng trong phòng (nếu phòng có máy giặt riêng)
  const privateWashingMachine = roomDevices.find(
    (d) => d.typeId === 4 || d.deviceCategory === 'WASHING_MACHINE' || d.nodeName.toLowerCase().includes('máy giặt')
  );

  // Danh sách thiết bị khách thuê có quyền sử dụng & báo hỏng (không bao gồm thiết bị của các phòng khác!)
  const eligibleTenantDevices = deviceScopeFilter === 'ROOM' 
    ? roomDevices 
    : deviceScopeFilter === 'SHARED' 
    ? sharedBuildingDevices 
    : [...roomDevices, ...sharedBuildingDevices];

  // Tự động chọn thiết bị đầu tiên hợp lệ nếu thiết bị hiện tại không thuộc phòng hoặc tòa nhà này
  useEffect(() => {
    if (eligibleTenantDevices.length > 0) {
      const exists = eligibleTenantDevices.some(d => d.nodeId === selectedDeviceNodeId);
      if (!exists) {
        setSelectedDeviceNodeId(eligibleTenantDevices[0].nodeId);
      }
    }
  }, [currentContract?.contractId, deviceScopeFilter]);

  const handleIssueSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueDesc.trim()) return;
    const targetDev = eligibleTenantDevices.find(d => d.nodeId === Number(selectedDeviceNodeId));
    onSubmitIssue({
      nodeId: Number(selectedDeviceNodeId),
      issueType,
      description: `[${targetDev?.isShared ? 'Thiết bị dùng chung tòa nhà' : `Phòng ${currentContract?.roomName}`}] ${issueDesc}`
    });
    setIssueSubmittedAlert(true);
    setIssueDesc('');
    setTimeout(() => setIssueSubmittedAlert(false), 4000);
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewComment.trim() || !currentContract) return;
    onSubmitReview({
      contractId: currentContract.contractId,
      targetUserId: 4, // Quản lý Lê Văn Hoàng
      rating: ratingStar,
      comment: reviewComment
    });
    setReviewSubmittedAlert(true);
    setReviewComment('');
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPwd.length < 6) return;
    setPwdChangedAlert(true);
    setOldPwd('');
    setNewPwd('');
    setTimeout(() => setPwdChangedAlert(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Selector: 1 Người Dùng Thuê Nhiều Phòng Đồng Thời */}
      {userContracts.length > 0 && (
        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Home className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm">Các Phòng Đang Thuê</span>
                <span className="text-[10px] bg-blue-950 text-blue-400 border border-blue-800 px-2 py-0.5 rounded-full font-semibold">
                  1 khách thuê nhiều phòng
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Bạn đang đứng tên hợp đồng {userContracts.length} phòng. Bấm để chuyển đổi phòng:
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {userContracts.map((c) => (
              <button
                key={c.contractId}
                onClick={() => setSelectedContractId(c.contractId)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all border ${
                  currentContract?.contractId === c.contractId
                    ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/30'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {c.roomName}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tabs Điều Hướng Khách Thuê */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto text-xs sm:text-sm">
        <button
          onClick={() => setActiveTab('room')}
          className={`px-3.5 py-2 rounded-xl font-medium transition-all flex items-center gap-1.5 ${
            activeTab === 'room' ? 'bg-blue-600 text-white shadow' : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <Home className="w-4 h-4" />
          Phòng & Mở Cổng
        </button>

        <button
          onClick={() => setActiveTab('invoices')}
          className={`px-3.5 py-2 rounded-xl font-medium transition-all flex items-center gap-1.5 ${
            activeTab === 'invoices' ? 'bg-emerald-600 text-white shadow ring-2 ring-emerald-400/40' : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          Hóa Đơn Hàng Tháng
        </button>

        <button
          onClick={() => setActiveTab('sharedDevices')}
          className={`px-3.5 py-2 rounded-xl font-medium transition-all flex items-center gap-1.5 ${
            activeTab === 'sharedDevices' ? 'bg-blue-600 text-white shadow' : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <Zap className="w-4 h-4" />
          Dùng Thiết Bị Chung
        </button>

        <button
          onClick={() => setActiveTab('issues')}
          className={`px-3.5 py-2 rounded-xl font-medium transition-all flex items-center gap-1.5 ${
            activeTab === 'issues' ? 'bg-amber-600 text-white shadow' : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <Wrench className="w-4 h-4" />
          Báo Hỏng / Bẩn / Khó Dùng
        </button>

        <button
          onClick={() => setActiveTab('reviews')}
          className={`px-3.5 py-2 rounded-xl font-medium transition-all flex items-center gap-1.5 ${
            activeTab === 'reviews' ? 'bg-purple-600 text-white shadow' : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <Star className="w-4 h-4" />
          Đánh Giá Quản Lý (Khóa sau gửi)
        </button>

        <button
          onClick={() => setActiveTab('posts')}
          className={`px-3.5 py-2 rounded-xl font-medium transition-all flex items-center gap-1.5 ${
            activeTab === 'posts' ? 'bg-cyan-600 text-white shadow' : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4" />
          Bản Tin & Tiện Ích
        </button>

        <button
          onClick={() => setActiveTab('changePwd')}
          className={`px-3.5 py-2 rounded-xl font-medium transition-all flex items-center gap-1.5 ${
            activeTab === 'changePwd' ? 'bg-slate-800 text-white shadow' : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <Key className="w-4 h-4" />
          Đổi Mật Khẩu
        </button>
      </div>

      {/* 1. TAB PHÒNG & MỞ CỔNG */}
      {activeTab === 'room' && (
        <div className="space-y-6">
          {/* Quick Action: Mở Cổng Ra Vào */}
          <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-950/70 via-slate-900 to-indigo-950/50 border border-blue-500/30 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
            <div className="space-y-2 text-center sm:text-left">
              <div className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider font-bold text-blue-400 bg-blue-500/10 border border-blue-500/30 px-3 py-1 rounded-full">
                <KeyRound className="w-3.5 h-3.5" />
                Quyền Ra Vào: Đang Hiệu Lực
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white">
                Cổng An Ninh Thông Minh ({currentContract?.buildingName || 'Tòa Nhà 01'})
              </h3>
              <p className="text-xs text-slate-300 max-w-xl">
                Bạn và {currentRoommates.length} người cùng phòng đã đăng ký CCCD được cấp quyền mở cổng từ xa.
                Chốt điện sẽ tự động đóng lại sau 4 giây để đảm bảo an ninh.
              </p>
            </div>

            <div>
              <button
                type="button"
                onClick={() => onOpenGate(currentContract?.buildingNodeId || 1)}
                disabled={gateUnlocked}
                className={`px-8 py-4 rounded-2xl font-bold text-sm flex items-center gap-3 shadow-2xl transition-all ${
                  gateUnlocked
                    ? 'bg-emerald-600 text-white ring-4 ring-emerald-500/40 shadow-emerald-500/40'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-500/30 active:scale-95'
                }`}
              >
                <DoorClosed className={`w-6 h-6 ${gateUnlocked ? 'animate-bounce' : ''}`} />
                <span>{gateUnlocked ? 'CỔNG ĐANG MỞ (4s)...' : 'MỞ CỔNG TỪ XA'}</span>
              </button>
            </div>
          </div>

          {/* Chi tiết Hợp đồng: Ngày theo HĐ vs Ngày Thực Tế */}
          {currentContract && (
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div>
                  <h4 className="font-bold text-white text-base flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-blue-400" />
                    Thông Tin Hợp Đồng Thuê {currentContract.roomName}
                  </h4>
                  <p className="text-xs text-slate-400">
                    Người ký hợp đồng chính: <strong>{currentContract.primaryTenantName}</strong>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800">
                    Đang Hoạt Động
                  </span>
                </div>
              </div>

              {/* Lịch sử Ngày Hợp Đồng vs Ngày Thực Tế */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="font-bold text-blue-400 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    1. Thời Hạn Trên Hợp Đồng Pháp Lý:
                  </div>
                  <div className="space-y-1 text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Ngày bắt đầu hợp đồng:</span>
                      <span className="font-mono font-bold text-white">{formatDateVN(currentContract.startDateContract)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Ngày kết thúc hợp đồng:</span>
                      <span className="font-mono font-bold text-white">{formatDateVN(currentContract.endDateContract)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Tiền cọc phòng đã đóng:</span>
                      <span className="font-mono font-bold text-emerald-400">
                        {currentContract.depositAmount.toLocaleString('vi-VN')} đ
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    2. Lịch Sử Đến & Trả Phòng Thực Tế:
                  </div>
                  <div className="space-y-1 text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Ngày nhận phòng thực tế:</span>
                      <span className="font-mono font-bold text-emerald-300">
                        {formatDateVN(currentContract.actualCheckInDate)} (Đến trước/đúng hạn)
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Ngày trả phòng thực tế:</span>
                      <span className="font-mono text-slate-400">
                        {currentContract.actualCheckOutDate ? formatDateVN(currentContract.actualCheckOutDate) : 'Đang cư trú (Chưa trả)'}
                      </span>
                    </div>
                    {currentContract.notes && (
                      <div className="text-[11px] text-amber-400/90 bg-amber-950/30 p-1.5 rounded border border-amber-900/40">
                        Ghi chú: {currentContract.notes}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Bảng kê Tiền Phòng & Điện Nước Tháng Này */}
          {currentInvoice && (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-bold text-white text-sm flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-emerald-400" />
                    Hóa Đơn Tháng {currentInvoice.monthYear} - Tổng Chi Phí: {currentInvoice.totalAmount.toLocaleString('vi-VN')} đ
                  </h4>
                  <button
                    type="button"
                    onClick={() => setActiveTab('invoices')}
                    className="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 text-xs font-semibold border border-emerald-500/40 transition-colors flex items-center gap-1 active:scale-95"
                  >
                    <span>Xem Bảng Kê Chi Tiết Toàn Bộ Kỳ Hóa Đơn</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Chuyển đổi giữa các kỳ hóa đơn hàng tháng */}
                {roomInvoices.length > 1 && (
                  <div className="flex items-center gap-1.5 overflow-x-auto p-1 bg-slate-950 rounded-xl border border-slate-800">
                    <span className="text-[11px] text-slate-400 px-2 font-medium">Kỳ hóa đơn:</span>
                    {roomInvoices.map((inv) => (
                      <button
                        key={inv.invoiceId}
                        type="button"
                        onClick={() => setSelectedInvoiceId(inv.invoiceId)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                          currentInvoice.invoiceId === inv.invoiceId
                            ? 'bg-emerald-600 text-white shadow ring-2 ring-emerald-400/40'
                            : 'text-slate-400 hover:text-white hover:bg-slate-900'
                        }`}
                      >
                        Tháng {inv.monthYear} {inv.monthYear === '01/2027' ? '(Giá mới)' : ''}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3 text-xs">
                {/* 1. Tiền phòng */}
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex justify-between text-slate-400">
                    <span>Tiền thuê phòng</span>
                    <Home className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="text-xl font-bold font-mono text-white">
                    {currentInvoice.roomRent.toLocaleString('vi-VN')} đ
                  </div>
                  <div className="text-[11px] text-slate-400">Đơn giá hợp đồng</div>
                </div>

                {/* 2. Tiền điện */}
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex justify-between text-slate-400">
                    <span>Tiền điện</span>
                    <Zap className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="text-xl font-bold font-mono text-amber-400">
                    {((currentInvoice.currElectric - currentInvoice.prevElectric) * currentInvoice.electricRate).toLocaleString('vi-VN')} đ
                  </div>
                  <div className="text-[11px] text-slate-400 flex justify-between">
                    <span>{currentInvoice.currElectric - currentInvoice.prevElectric} kWh (@{currentInvoice.electricRate.toLocaleString('vi-VN')}đ)</span>
                  </div>
                </div>

                {/* 3. Tiền nước */}
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex justify-between text-slate-400">
                    <span>Tiền nước lạnh</span>
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div className="text-xl font-bold font-mono text-cyan-400">
                    {((currentInvoice.currWater - currentInvoice.prevWater) * currentInvoice.waterRate).toLocaleString('vi-VN')} đ
                  </div>
                  <div className="text-[11px] text-slate-400 flex justify-between">
                    <span>{currentInvoice.currWater - currentInvoice.prevWater} m³ (@{currentInvoice.waterRate.toLocaleString('vi-VN')}đ)</span>
                  </div>
                </div>

                {/* 4. Phí vệ sinh */}
                <div className="p-4 rounded-2xl bg-slate-900 border border-emerald-500/30 space-y-2">
                  <div className="flex justify-between text-slate-400">
                    <span className="text-emerald-300 font-medium">Phí vệ sinh</span>
                    <Users className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-xl font-bold font-mono text-emerald-400">
                    {(currentInvoice.sanitationFee ?? ((currentInvoice.occupantCount || 1) * (currentInvoice.sanitationFeePerPerson || 30000))).toLocaleString('vi-VN')} đ
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {currentInvoice.occupantCount || 1} người × {(currentInvoice.sanitationFeePerPerson || 30000).toLocaleString('vi-VN')} đ
                  </div>
                </div>

                {/* 5. Phí tạm trú tạm vắng */}
                <div className={`p-4 rounded-2xl bg-slate-900 border ${currentInvoice.residenceFee && currentInvoice.residenceFee > 0 ? 'border-indigo-500/40 bg-indigo-950/20' : 'border-slate-800'} space-y-2`}>
                  <div className="flex justify-between text-slate-400">
                    <span className={currentInvoice.residenceFee && currentInvoice.residenceFee > 0 ? 'text-indigo-300 font-medium' : 'text-slate-400'}>
                      Phí tạm trú (Năm)
                    </span>
                    <ShieldCheck className={`w-4 h-4 ${currentInvoice.residenceFee && currentInvoice.residenceFee > 0 ? 'text-indigo-400' : 'text-slate-500'}`} />
                  </div>
                  <div className={`text-xl font-bold font-mono ${currentInvoice.residenceFee && currentInvoice.residenceFee > 0 ? 'text-indigo-400' : 'text-slate-400'}`}>
                    {(currentInvoice.residenceFee || 0).toLocaleString('vi-VN')} đ
                  </div>
                  <div className="text-[11px] text-slate-400 truncate" title={currentInvoice.residenceFeeNote || 'Chu kỳ 12 tháng'}>
                    {currentInvoice.residenceFee && currentInvoice.residenceFee > 0 
                      ? `${currentInvoice.occupantCount || 1} người/năm` 
                      : (currentInvoice.residenceFeeNote || 'Miễn thu (chu kỳ 12T)')}
                  </div>
                </div>

                {/* 6. Tiền thuê thiết bị phòng theo tháng */}
                <div className="p-4 rounded-2xl bg-slate-900 border border-teal-500/30 space-y-2">
                  <div className="flex justify-between text-slate-400">
                    <span className="text-teal-300 font-semibold">Thiết bị phòng</span>
                    <Wifi className="w-4 h-4 text-teal-400" />
                  </div>
                  <div className="text-xl font-bold font-mono text-teal-400">
                    {(currentInvoice.roomDeviceRentalCost || 0).toLocaleString('vi-VN')} đ
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Bảng giá Tháng {currentInvoice.monthYear}
                  </div>
                </div>

                {/* 7. Dịch vụ dùng chung & Rác */}
                <div className="p-4 rounded-2xl bg-slate-900 border border-purple-500/30 space-y-2">
                  <div className="flex justify-between text-slate-400">
                    <span className="text-purple-300">Dùng chung &amp; Rác</span>
                    <DollarSign className="w-4 h-4 text-purple-400" />
                  </div>
                  <div className="text-xl font-bold font-mono text-purple-400">
                    {(currentInvoice.sharedDeviceCost + currentInvoice.internetAndTrash).toLocaleString('vi-VN')} đ
                  </div>
                  <div className="text-[11px] text-purple-300 font-medium">
                    Giặt/Sạc &amp; Rác mạng
                  </div>
                </div>
              </div>

              {/* Bảng chi tiết tiền thuê thiết bị phòng trong tháng này nếu có */}
              {((currentInvoice.roomDeviceRentalCost && currentInvoice.roomDeviceRentalCost > 0) || (currentInvoice.deviceBreakdown && currentInvoice.deviceBreakdown.length > 0)) && (
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-emerald-900/40 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-emerald-300 flex items-center gap-1.5">
                      <Wifi className="w-3.5 h-3.5" />
                      <span>Chi tiết tiền thuê thiết bị phòng Tháng {currentInvoice.monthYear} (Dựa trên bảng giá từng tháng):</span>
                    </div>
                    <span className="text-slate-400 text-[11px]">
                      Ví dụ: Cục phát WiFi, điều hòa, tủ lạnh...
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                    {(currentInvoice.deviceBreakdown || []).map((devItem) => (
                      <div key={devItem.deviceNodeId} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                        <span className="font-medium text-slate-200 truncate mr-2">{devItem.deviceName}</span>
                        <span className="font-mono font-bold text-emerald-400 whitespace-nowrap">
                          {devItem.monthlyPrice.toLocaleString('vi-VN')} đ/tháng
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Danh sách người cùng ở phòng này */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="font-bold text-white text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-400" />
                Danh Sách Người Cùng Ở Trong Phòng (1 Phòng Nhiều Người)
              </h4>
              <span className="text-xs text-slate-400">
                Tổng cộng: {currentRoommates.length + 1} người
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {/* Người ký HĐ */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-start">
                <div>
                  <div className="font-semibold text-white flex items-center gap-1.5">
                    {currentUser.fullName}
                    <span className="text-[10px] bg-blue-950 text-blue-300 border border-blue-800 px-1.5 rounded">
                      Chủ hợp đồng
                    </span>
                  </div>
                  <div className="text-slate-400 font-mono mt-0.5">
                    CCCD: {currentUser.citizenId} • SĐT: {currentUser.phoneNumber}
                  </div>
                  <div className="text-emerald-400 flex items-center gap-1 mt-1 text-[11px]">
                    <MapPin className="w-3 h-3 flex-shrink-0" />
                    <span>Địa chỉ thường trú: {currentUser.address}</span>
                  </div>
                </div>
                <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded font-medium">
                  Được mở cổng
                </span>
              </div>

              {/* Người ở cùng */}
              {currentRoommates.map((rm) => (
                <div key={rm.roommateId} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-start">
                  <div>
                    <div className="font-semibold text-white flex items-center gap-1.5">
                      {rm.fullName}
                      <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 rounded">
                        {rm.relationship}
                      </span>
                    </div>
                    <div className="text-slate-400 font-mono mt-0.5">
                      CCCD: {rm.citizenId} • SĐT: {rm.phoneNumber}
                    </div>
                    <div className="text-emerald-400 flex items-center gap-1 mt-1 text-[11px]">
                      <MapPin className="w-3 h-3 flex-shrink-0" />
                      <span>Địa chỉ: {rm.address}</span>
                    </div>
                  </div>
                  <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded font-medium">
                    {rm.hasGateAccess ? 'Được mở cổng' : 'Chưa cấp quyền'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 4. TRANG THIẾT BỊ BÀN GIAO ĐI CÙNG PHÒNG BẠN */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  Trang Thiết Bị Bàn Giao Đi Cùng {currentContract?.roomName} ({roomDevices.length} Thiết Bị)
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Bấm vào từng thiết bị bên dưới để <strong>xem ảnh chụp thực tế</strong>, tem bảo hành và hướng dẫn kỹ thuật.
                </p>
              </div>

              <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-3 py-1 rounded-full self-start sm:self-auto">
                ✓ Thiết bị bàn giao tại phòng
              </span>
            </div>

            {roomDevices.length === 0 ? (
              <div className="p-6 rounded-xl bg-slate-950 border border-slate-800 text-center text-xs text-slate-400">
                Chưa có thiết bị nào được ghi nhận cho phòng này.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {roomDevices.map((dev) => {
                  const photoUrl = getDevicePhotoUrl(dev);
                  const icon = getDeviceCategoryIcon(dev);

                  return (
                    <div
                      key={dev.nodeId}
                      className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-blue-500/50 transition-all flex flex-col justify-between gap-3 shadow-md group"
                    >
                      <div className="flex gap-3">
                        {/* Thumbnail */}
                        <div
                          onClick={() => setSelectedDeviceForPhoto(dev)}
                          className="w-16 h-16 rounded-xl overflow-hidden bg-slate-900 border border-slate-800 flex-shrink-0 cursor-pointer relative group-hover:border-blue-500/60"
                          title="Bấm xem ảnh chụp thực tế"
                        >
                          <img
                            src={photoUrl}
                            alt={dev.nodeName}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent flex items-center justify-center">
                            <Camera className="w-3.5 h-3.5 text-white drop-shadow" />
                          </div>
                        </div>

                        {/* Thông tin */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1">
                            <span className="text-sm">{icon}</span>
                            <span className="font-bold text-white text-xs truncate">
                              {dev.nodeName}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            Mã: [{dev.nodeCode}]
                          </div>
                          <div className="text-[10px] text-slate-300 truncate mt-0.5">
                            📍 {dev.addressOrLocation || 'Trong phòng'}
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-1.5">
                            <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded border ${
                              dev.currentCondition === 0
                                ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                                : 'bg-rose-950 text-rose-300 border-rose-800'
                            }`}>
                              {dev.currentCondition === 0 ? '✓ Hoạt động tốt' : '⚠️ Bảo dưỡng'}
                            </span>

                            {/* Giá thuê theo tháng */}
                            {(() => {
                              const price = (dev.monthlyRentalPrice !== undefined && Number(dev.monthlyRentalPrice) > 0)
                                ? Number(dev.monthlyRentalPrice)
                                : (!dev.isShared && dev.unitPrice !== undefined && Number(dev.unitPrice) > 0)
                                  ? Number(dev.unitPrice)
                                  : 0;
                              return price > 0 ? (
                                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-0.5">
                                  <DollarSign className="w-2.5 h-2.5" />
                                  {price.toLocaleString('vi-VN')} đ/tháng
                                </span>
                              ) : (
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-700">
                                  Miễn phí đi kèm phòng (0 đ)
                                </span>
                              );
                            })()}
                          </div>
                        </div>
                      </div>

                      {/* Nút bấm xem ảnh, Xem biến động giá & Báo hỏng */}
                      <div className="flex items-center gap-1.5 pt-1.5 border-t border-slate-900">
                        <button
                          type="button"
                          onClick={() => setSelectedDeviceForPhoto(dev)}
                          className="flex-1 py-1.5 px-2 rounded-xl bg-slate-900 hover:bg-blue-600 text-slate-300 hover:text-white font-semibold text-[11px] transition-all flex items-center justify-center gap-1 border border-slate-800 hover:border-blue-500"
                        >
                          <Camera className="w-3 h-3 text-blue-400 group-hover:text-white" />
                          <span>Xem Ảnh</span>
                        </button>

                        {/* Nút Xem Biến Động Giá nếu thiết bị có lịch sử giá hoặc bảng giá */}
                        {((dev.priceHistory && dev.priceHistory.length > 0) || (dev.monthlyPriceSchedule && Object.keys(dev.monthlyPriceSchedule).length > 0) || (dev.monthlyRentalPrice && dev.monthlyRentalPrice > 0)) && (
                          <button
                            type="button"
                            onClick={() => setSelectedDeviceForHistory(dev)}
                            className="py-1.5 px-2.5 rounded-xl bg-slate-900 hover:bg-emerald-950/70 text-emerald-400 hover:text-emerald-300 font-semibold text-[11px] transition-all flex items-center gap-1 border border-slate-800 hover:border-emerald-700"
                            title="Xem lịch sử điều chỉnh & biến động giá thuê thiết bị"
                          >
                            <TrendingUp className="w-3 h-3 text-emerald-400" />
                            <span>Biến Động Giá</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedDeviceNodeId(dev.nodeId);
                            setActiveTab('issues');
                          }}
                          className="py-1.5 px-2 rounded-xl bg-slate-900 hover:bg-amber-950/60 text-slate-400 hover:text-amber-300 font-medium text-[11px] transition-all border border-slate-800 hover:border-amber-800"
                          title="Báo sự cố thiết bị này"
                        >
                          <Wrench className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. TAB QUẢN TRỊ TIỀN PHÒNG & HÓA ĐƠN QUA CÁC THÁNG (DÀNH CHO KHÁCH THUÊ ĐĂNG NHẬP) */}
      {activeTab === 'invoices' && (
        <div className="space-y-6">
          {/* Header & Giải thích cơ chế chốt sổ lưu trữ bất biến */}
          <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-950/70 via-slate-900 to-slate-950 border border-emerald-500/30 shadow-xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Quản Trị Hóa Đơn & Lưu Trữ Bất Biến
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-white">
                  Quản Trị Tiền Phòng & Hóa Đơn Qua Các Tháng ({currentContract?.roomName})
                </h3>
              </div>

              <div className="text-right">
                <span className="text-xs text-slate-400 block">Số lượng kỳ hóa đơn:</span>
                <span className="text-lg font-bold font-mono text-emerald-400">
                  {roomInvoices.length} kỳ lưu trữ
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-900/60 text-xs text-slate-300 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <strong className="text-emerald-300">Cơ chế lưu trữ & duyệt hóa đơn:</strong>
                <p>
                  Khi tính tiền phòng hàng tháng, hệ thống lấy <strong>giá mới nhất</strong> của thiết bị trong danh mục bảng giá để tính vào hóa đơn. 
                  Khi <strong>Người Quản Trị duyệt hóa đơn</strong>, hệ thống sẽ lưu cố định hóa đơn đó gồm <strong>tháng, năm và đơn giá thuê thiết bị đã chốt của tháng đấy</strong>. 
                  Do đó, đến Tháng 11 hoặc các tháng sau này, bạn có thể xem lại nguyên trạng hóa đơn của các tháng trước (Tháng 9: WiFi 70.000đ; Tháng 11: WiFi 82.000đ) mà <strong>không cần phải tính lại toàn bộ</strong>!
                </p>
              </div>
            </div>
          </div>

          {/* Bảng tổng hợp & So sánh hóa đơn qua các tháng */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-400" />
                  Bảng Kê Hóa Đơn Tiền Phòng Qua Các Tháng (Lịch Sử Không Bị Tính Lại)
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Bấm vào từng kỳ hóa đơn bên dưới để xem chi tiết đơn giá từng thiết bị và chỉ số điện nước đã chốt sổ.
                </p>
              </div>

              {/* Selector tháng */}
              <div className="flex items-center gap-1.5 overflow-x-auto p-1 bg-slate-950 rounded-xl border border-slate-800">
                {roomInvoices.map((inv) => (
                  <button
                    key={inv.invoiceId}
                    type="button"
                    onClick={() => setSelectedInvoiceId(inv.invoiceId)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                      currentInvoice?.invoiceId === inv.invoiceId
                        ? 'bg-emerald-600 text-white shadow ring-2 ring-emerald-400/40'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900'
                    }`}
                  >
                    <span>Kỳ {inv.monthYear}</span>
                    {inv.isApproved && <span className="text-[10px] text-emerald-300">✓ Đã Chốt</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Bảng so sánh ngang các kỳ hóa đơn */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/50">
                    <th className="p-3">Kỳ Hóa Đơn</th>
                    <th className="p-3">Tiền Phòng</th>
                    <th className="p-3">Đơn Giá WiFi (Bảng Giá Tháng)</th>
                    <th className="p-3">Tổng Thuê Thiết Bị</th>
                    <th className="p-3">Điện & Nước</th>
                    <th className="p-3">Dùng Chung & Rác</th>
                    <th className="p-3">Tổng Hóa Đơn</th>
                    <th className="p-3">Duyệt & Chốt Sổ</th>
                    <th className="p-3">Thanh Toán</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {roomInvoices.map((inv) => {
                    const wifiItem = inv.deviceBreakdown?.find(d => d.deviceName.toLowerCase().includes('wifi') || d.deviceCode?.includes('WIFI'));
                    const isSelected = currentInvoice?.invoiceId === inv.invoiceId;

                    return (
                      <tr 
                        key={inv.invoiceId}
                        onClick={() => setSelectedInvoiceId(inv.invoiceId)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-emerald-950/30' : 'hover:bg-slate-950/40'
                        }`}
                      >
                        <td className="p-3 font-bold font-mono text-white">
                          Tháng {inv.monthYear}
                          {inv.monthYear === '11/2026' && (
                            <span className="ml-1 text-[9px] px-1.5 py-0.5 rounded bg-blue-900 text-blue-200 font-normal">
                              Giá WiFi mới
                            </span>
                          )}
                        </td>
                        <td className="p-3 font-mono text-slate-300">
                          {inv.roomRent.toLocaleString('vi-VN')} đ
                        </td>
                        <td className="p-3 font-mono font-bold text-emerald-400">
                          {wifiItem ? `${wifiItem.monthlyPrice.toLocaleString('vi-VN')} đ/tháng` : '0 đ'}
                        </td>
                        <td className="p-3 font-mono text-emerald-400 font-semibold">
                          {(inv.roomDeviceRentalCost || 0).toLocaleString('vi-VN')} đ
                        </td>
                        <td className="p-3 font-mono text-slate-300">
                          {(((inv.currElectric - inv.prevElectric) * inv.electricRate) + ((inv.currWater - inv.prevWater) * inv.waterRate)).toLocaleString('vi-VN')} đ
                        </td>
                        <td className="p-3 font-mono text-slate-400">
                          {(inv.sharedDeviceCost + inv.internetAndTrash).toLocaleString('vi-VN')} đ
                        </td>
                        <td className="p-3 font-mono font-bold text-white text-sm">
                          {inv.totalAmount.toLocaleString('vi-VN')} đ
                        </td>
                        <td className="p-3">
                          {inv.isApproved ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800 whitespace-nowrap">
                              ✓ Đã Duyệt Chốt Sổ
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800 whitespace-nowrap">
                              ⏳ Dự Thảo Chờ Duyệt
                            </span>
                          )}
                        </td>
                        <td className="p-3">
                          {inv.status === 'PAID' ? (
                            <span className="text-emerald-400 font-bold font-mono">ĐÃ THANH TOÁN</span>
                          ) : (
                            <span className="text-amber-400 font-bold font-mono">CHƯA THANH TOÁN</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Chi tiết Hóa đơn được chọn xem */}
          {currentInvoice && (
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-5 shadow-2xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-lg font-bold text-white">
                      Chi Tiết Hóa Đơn Tháng {currentInvoice.monthYear} - {currentInvoice.roomName}
                    </h4>
                    {currentInvoice.isApproved ? (
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Đã Duyệt &amp; Chốt Sổ
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-950 text-amber-300 border border-amber-800">
                        Dự Thảo Chờ Duyệt
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">
                    {currentInvoice.isApproved 
                      ? `Hóa đơn đã được chốt sổ bởi ${currentInvoice.approvedByName || 'Người Quản Trị'} vào lúc ${formatDateTimeVN(currentInvoice.approvedAt) || 'cuối tháng'}. Toàn bộ đơn giá thiết bị và số tiền được bảo lưu vĩnh viễn không tính lại.`
                      : 'Hóa đơn đang ở trạng thái dự thảo, hệ thống cập nhật giá thiết bị mới nhất theo danh mục bảng giá.'}
                  </p>
                </div>

                <div className="text-right">
                  <div className="text-xs text-slate-400">Tổng Tiền Phải Trả:</div>
                  <div className="text-2xl font-bold font-mono text-emerald-400">
                    {currentInvoice.totalAmount.toLocaleString('vi-VN')} đ
                  </div>
                </div>
              </div>

              {/* 7 Thẻ tổng quan chi tiết chi phí hóa đơn */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3 text-xs">
                {/* 1. Tiền phòng */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <div className="text-slate-400 flex justify-between">
                    <span>Tiền thuê phòng:</span>
                    <Home className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="text-lg font-bold font-mono text-white">
                    {currentInvoice.roomRent.toLocaleString('vi-VN')} đ
                  </div>
                  <div className="text-[11px] text-slate-500">Đơn giá hợp đồng</div>
                </div>

                {/* 2. Tiền điện */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <div className="text-slate-400 flex justify-between">
                    <span>Tiền điện:</span>
                    <Zap className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="text-lg font-bold font-mono text-amber-400">
                    {((currentInvoice.currElectric - currentInvoice.prevElectric) * currentInvoice.electricRate).toLocaleString('vi-VN')} đ
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {currentInvoice.currElectric - currentInvoice.prevElectric} kWh (Cũ: {currentInvoice.prevElectric} - Mới: {currentInvoice.currElectric})
                  </div>
                </div>

                {/* 3. Tiền nước */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <div className="text-slate-400 flex justify-between">
                    <span>Tiền nước:</span>
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div className="text-lg font-bold font-mono text-cyan-400">
                    {((currentInvoice.currWater - currentInvoice.prevWater) * currentInvoice.waterRate).toLocaleString('vi-VN')} đ
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {currentInvoice.currWater - currentInvoice.prevWater} m³ (Cũ: {currentInvoice.prevWater} - Mới: {currentInvoice.currWater})
                  </div>
                </div>

                {/* 4. Phí vệ sinh (tính trên đầu người/tháng) */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-emerald-500/30 space-y-1.5">
                  <div className="text-slate-400 flex justify-between">
                    <span className="text-emerald-300 font-medium">Phí vệ sinh:</span>
                    <Users className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-lg font-bold font-mono text-emerald-400">
                    {(currentInvoice.sanitationFee ?? ((currentInvoice.occupantCount || 1) * (currentInvoice.sanitationFeePerPerson || 30000))).toLocaleString('vi-VN')} đ
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {currentInvoice.occupantCount || 1} người × {(currentInvoice.sanitationFeePerPerson || 30000).toLocaleString('vi-VN')} đ/tháng
                  </div>
                </div>

                {/* 5. Phí tạm trú tạm vắng (tính trên đầu người mỗi năm, chu kỳ 12 tháng) */}
                <div className={`p-4 rounded-2xl bg-slate-950 border ${currentInvoice.residenceFee && currentInvoice.residenceFee > 0 ? 'border-indigo-500/40 bg-indigo-950/20' : 'border-slate-800'} space-y-1.5`}>
                  <div className="text-slate-400 flex justify-between">
                    <span className={currentInvoice.residenceFee && currentInvoice.residenceFee > 0 ? 'text-indigo-300 font-medium' : 'text-slate-400'}>
                      Phí tạm trú (Năm):
                    </span>
                    <ShieldCheck className={`w-4 h-4 ${currentInvoice.residenceFee && currentInvoice.residenceFee > 0 ? 'text-indigo-400' : 'text-slate-500'}`} />
                  </div>
                  <div className={`text-lg font-bold font-mono ${currentInvoice.residenceFee && currentInvoice.residenceFee > 0 ? 'text-indigo-400' : 'text-slate-400'}`}>
                    {(currentInvoice.residenceFee || 0).toLocaleString('vi-VN')} đ
                  </div>
                  <div className="text-[11px] text-slate-400 truncate" title={currentInvoice.residenceFeeNote || 'Chu kỳ 12 tháng từ tháng dọn vào ở'}>
                    {currentInvoice.residenceFee && currentInvoice.residenceFee > 0 
                      ? `${currentInvoice.occupantCount || 1} người × ${(currentInvoice.residenceFeePerPerson || 100000).toLocaleString('vi-VN')} đ/năm`
                      : (currentInvoice.residenceFeeNote || 'Miễn thu tháng này (trong chu kỳ 12 tháng)')}
                  </div>
                </div>

                {/* 6. Thuê thiết bị phòng chốt sổ */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-teal-500/30 space-y-1.5">
                  <div className="text-slate-400 flex justify-between">
                    <span className="text-teal-300 font-medium">Thiết bị phòng:</span>
                    <Wifi className="w-4 h-4 text-teal-400" />
                  </div>
                  <div className="text-lg font-bold font-mono text-teal-400">
                    {(currentInvoice.roomDeviceRentalCost || 0).toLocaleString('vi-VN')} đ
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Bảng giá Tháng {currentInvoice.monthYear}
                  </div>
                </div>

                {/* 7. Thiết bị chung & Rác */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-purple-500/30 space-y-1.5">
                  <div className="text-slate-400 flex justify-between">
                    <span className="text-purple-300 font-medium">Dùng chung &amp; Rác:</span>
                    <DollarSign className="w-4 h-4 text-purple-400" />
                  </div>
                  <div className="text-lg font-bold font-mono text-purple-400">
                    {(currentInvoice.sharedDeviceCost + currentInvoice.internetAndTrash).toLocaleString('vi-VN')} đ
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Giặt/Sạc: {currentInvoice.sharedDeviceCost.toLocaleString('vi-VN')}đ • Rác: {currentInvoice.internetAndTrash.toLocaleString('vi-VN')}đ
                  </div>
                </div>
              </div>

              {/* BẢNG CHI TIẾT ĐƠN GIÁ THUÊ THIẾT BỊ ĐÃ CHỐT CỦA THÁNG ĐÓ */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="font-bold text-white text-xs flex items-center gap-2">
                    <Wifi className="w-4 h-4 text-emerald-400" />
                    <span>Danh Mục Đơn Giá Thuê Thiết Bị Của Tháng {currentInvoice.monthYear} (Đã Lưu Bất Biến Khi Duyệt):</span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {currentInvoice.isApproved ? '✓ Đơn giá đã khóa, không bị tính lại khi xem ở các tháng sau' : 'Đơn giá lấy mức mới nhất hiện tại'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {(currentInvoice.deviceBreakdown && currentInvoice.deviceBreakdown.length > 0 ? currentInvoice.deviceBreakdown : []).map((devItem) => {
                    const originalNode = nodes.find(n => n.nodeId === devItem.deviceNodeId);

                    return (
                      <div
                        key={devItem.deviceNodeId}
                        className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-bold text-white text-xs truncate" title={devItem.deviceName}>
                              {devItem.deviceName}
                            </span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono">
                              {devItem.deviceCode || 'DEV'}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-1">
                            Đơn giá thuê chốt của Tháng {currentInvoice.monthYear}:
                          </div>
                          <div className="text-base font-bold font-mono text-emerald-400 mt-0.5">
                            {devItem.monthlyPrice.toLocaleString('vi-VN')} đ/tháng
                          </div>
                        </div>

                        {originalNode && (
                          <button
                            type="button"
                            onClick={() => setSelectedDeviceForHistory(originalNode)}
                            className="w-full py-1.5 px-2 rounded-xl bg-slate-950 hover:bg-emerald-950/70 text-emerald-400 hover:text-emerald-300 font-semibold text-[11px] transition-all flex items-center justify-center gap-1 border border-slate-800 hover:border-emerald-700"
                          >
                            <TrendingUp className="w-3 h-3 text-emerald-400" />
                            <span>Xem Danh Mục Bảng Giá Thiết Bị</span>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. TAB DÙNG THIẾT BỊ CHUNG */}
      {activeTab === 'sharedDevices' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              Kích Hoạt Sử Dụng Thiết Bị Dùng Chung Trong Nhà
            </h3>
            <p className="text-xs text-slate-400">
              Đúng theo thống nhất: <strong>Không cần nạp ví trả trước</strong>, chi phí kích hoạt được bảo chứng bằng tiền cọc phòng và sẽ tự động cộng dồn vào hóa đơn cuối tháng của {currentContract?.roomName}.
            </p>
          </div>

          {/* Thông báo máy giặt riêng nếu phòng có trang bị */}
          {privateWashingMachine && (
            <div className="p-4 rounded-2xl bg-blue-950/70 border border-blue-500/50 flex items-start gap-3 text-xs text-blue-200">
              <div className="w-9 h-9 rounded-xl bg-blue-600/30 border border-blue-400/50 flex items-center justify-center text-blue-300 font-bold flex-shrink-0 text-lg">
                🧺
              </div>
              <div className="space-y-0.5">
                <div className="font-bold text-white text-sm flex items-center gap-2">
                  <span>Phòng {currentContract?.roomName} đã có máy giặt riêng: {privateWashingMachine.nodeName}</span>
                  <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-700 px-2 py-0.5 rounded-full font-semibold">
                    ✓ Dùng miễn phí tại phòng
                  </span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Bạn có thể giặt quần áo hàng ngày ngay tại phòng hoàn toàn miễn phí. Máy giặt sấy chung công suất lớn ở sảnh/sân thượng bên dưới phục vụ thêm khi bạn cần giặt chăn ga mền gối hoặc sấy khô nhanh!
                </p>
              </div>
            </div>
          )}

          {/* Thiết bị đang chạy */}
          {activeSharedSession && (
            <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/50 flex items-center justify-between text-xs text-emerald-300 animate-in fade-in">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
                <span>
                  Đang kích hoạt cấp nguồn cho: <strong>{activeSharedSession.deviceName}</strong>. Rơ-le IoT đang mở.
                </span>
              </div>
              <span className="font-mono text-sm text-emerald-400 font-bold bg-slate-950 px-3 py-1 rounded-xl border border-emerald-800">
                {activeSharedSession.remainingMinutes} phút còn lại
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Máy giặt chung */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">Tầng 1 sảnh</span>
                  <h4 className="font-bold text-white text-base mt-1">Máy Giặt Chung Electrolux 11kg</h4>
                </div>
                <span className="text-xs font-bold text-emerald-400 font-mono">15.000 đ/lần</span>
              </div>
              <p className="text-xs text-slate-400">
                Kích hoạt rơ-le cấp nguồn điện cho máy giặt trong chu trình 45 phút.
              </p>
              <button
                type="button"
                onClick={() => onActivateSharedDevice(3, 'Máy Giặt Chung Electrolux 11kg', 15000, 45)}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold text-xs text-white transition-all shadow-md active:scale-95"
              >
                Bật Máy Giặt Chung (Cộng 15.000đ vào phòng)
              </button>
            </div>

            {/* Trạm sạc xe điện */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">Tầng hầm xe</span>
                  <h4 className="font-bold text-white text-base mt-1">Trạm Sạc Xe Điện 3.5kW</h4>
                </div>
                <span className="text-xs font-bold text-amber-400 font-mono">4.000 đ/kWh</span>
              </div>
              <p className="text-xs text-slate-400">
                Sạc xe máy điện VinFast/Yadea hoặc xe đạp điện. Tự ngắt khi pin đầy hoặc tối đa 3 tiếng.
              </p>
              <button
                type="button"
                onClick={() => onActivateSharedDevice(4, 'Trạm Sạc Xe Điện Thông Minh 3.5kW', 30000, 180)}
                className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 font-semibold text-xs text-white transition-all shadow-md active:scale-95"
              >
                Kích Hoạt Trạm Sạc (Cộng dồn phòng)
              </button>
            </div>

            {/* Điện thoại công cộng sảnh */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">Sảnh đón khách</span>
                  <h4 className="font-bold text-white text-base mt-1">Điện Thoại Sảnh Nội Bộ</h4>
                </div>
                <span className="text-xs font-bold text-cyan-400 font-mono">1.000 đ/phút</span>
              </div>
              <p className="text-xs text-slate-400">
                Gọi liên lạc nội bộ lên các phòng hoặc quay số khẩn cấp tới ban quản lý tòa nhà.
              </p>
              <button
                type="button"
                onClick={() => onActivateSharedDevice(5, 'Điện Thoại Sảnh Nội Bộ', 1000, 10)}
                className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 font-semibold text-xs text-white transition-all shadow-md active:scale-95"
              >
                Mở Đường Dây Điện Thoại
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. TAB BÁO HỎNG / BẨN / KHÓ DÙNG */}
      {activeTab === 'issues' && (
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs text-amber-400 font-bold bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 rounded-full mb-1">
                <Wrench className="w-3.5 h-3.5" />
                Hệ Thống Phân Định Thiết Bị Chuẩn Xác
              </div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Báo Cáo Tình Trạng Thiết Bị (Trong Phòng &amp; Dùng Chung)
              </h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Đang xem phòng: <strong className="text-blue-300">{currentContract?.roomName}</strong> ({currentContract?.buildingName}).
              </p>
              <div className="mt-2 p-3 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs flex items-start gap-2.5">
                <span className="text-base flex-shrink-0">🎯</span>
                <div className="space-y-0.5">
                  <div className="font-bold text-white text-xs">
                    Chống nhầm lẫn thiết bị tuyệt đối:
                  </div>
                  <p className="text-[11px] text-amber-100/90 leading-relaxed">
                    Tòa nhà có 30 phòng tương ứng 30 điều hòa, nhưng hệ thống <strong>chỉ lọc hiển thị đúng thiết bị trong Phòng {currentContract?.roomName} của bạn</strong> và <strong>thiết bị dùng chung (công cộng) của tòa nhà</strong> (như máy giặt chung T1, trạm sạc, cổng từ). Bạn không bao giờ bị lẫn lộn giữa 30 điều hòa của 30 phòng khác!
                  </p>
                </div>
              </div>
            </div>

            {issueSubmittedAlert && (
              <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/50 flex items-center gap-2 text-xs text-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>Báo cáo đã gửi thành công! Quản lý tòa nhà đã nhận được thông báo để xử lý.</span>
              </div>
            )}

            {/* Bộ lọc phạm vi thiết bị: Tất cả / Trong phòng / Dùng chung */}
            <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setDeviceScopeFilter('ALL')}
                className={`flex-1 py-1.5 px-3 rounded-xl font-semibold transition-all ${
                  deviceScopeFilter === 'ALL'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Tất Cả ({roomDevices.length + sharedBuildingDevices.length} thiết bị)
              </button>
              <button
                type="button"
                onClick={() => setDeviceScopeFilter('ROOM')}
                className={`flex-1 py-1.5 px-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-1.5 ${
                  deviceScopeFilter === 'ROOM'
                    ? 'bg-emerald-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>🏠 Trong Phòng Bạn ({roomDevices.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setDeviceScopeFilter('SHARED')}
                className={`flex-1 py-1.5 px-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-1.5 ${
                  deviceScopeFilter === 'SHARED'
                    ? 'bg-purple-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>🏢 Dùng Chung Tòa Nhà ({sharedBuildingDevices.length})</span>
              </button>
            </div>

            {/* Lưới chọn nhanh thiết bị 1-chạm (Quick Click Selector) */}
            <div className="space-y-1.5">
              <div className="text-[11px] text-slate-400 font-medium flex justify-between items-center">
                <span>Chọn nhanh thiết bị bên dưới (Bấm để tự điền vào đơn):</span>
                <span className="text-emerald-400 font-mono text-[10px]">
                  Đang chọn: {eligibleTenantDevices.find(d => d.nodeId === selectedDeviceNodeId)?.nodeName || 'Chưa chọn'}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto pr-1">
                {eligibleTenantDevices.map((dev) => {
                  const isSelected = dev.nodeId === selectedDeviceNodeId;
                  const isShared = dev.isShared === true;
                  return (
                    <button
                      key={dev.nodeId}
                      type="button"
                      onClick={() => setSelectedDeviceNodeId(dev.nodeId)}
                      className={`p-3 rounded-2xl border text-left transition-all relative flex flex-col justify-between gap-1.5 ${
                        isSelected
                          ? 'bg-blue-600/20 border-blue-500 text-white ring-2 ring-blue-500/50 shadow-md'
                          : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-950'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <span className="text-lg">
                          {dev.typeId === 11 || dev.deviceCategory === 'AIR_COND' ? '❄️' :
                           dev.typeId === 12 || dev.deviceCategory === 'FRIDGE' ? '🧊' :
                           dev.typeId === 13 || dev.deviceCategory === 'WATER_HEATER' ? '♨️' :
                           dev.typeId === 4 || dev.deviceCategory === 'WASHING_MACHINE' ? '🧺' :
                           dev.typeId === 8 || dev.deviceCategory === 'SECURITY_GATE' ? '🚪' :
                           dev.typeId === 5 || dev.deviceCategory === 'EV_CHARGER' ? '⚡' : '⏱️'}
                        </span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                          isShared 
                            ? 'bg-purple-950 text-purple-300 border border-purple-800' 
                            : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        }`}>
                          {isShared ? 'Dùng Chung' : 'Phòng Bạn'}
                        </span>
                      </div>
                      <div>
                        <div className="font-bold text-xs truncate" title={dev.nodeName}>
                          {dev.nodeName}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono truncate">
                          Mã: [{dev.nodeCode}]
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <form onSubmit={handleIssueSubmit} className="space-y-4 text-xs pt-2 border-t border-slate-800">
              {/* Phân loại sự cố: Hư hỏng / Hay bẩn / Khó sử dụng */}
              <div>
                <label className="block text-slate-300 font-medium mb-1.5">Phân loại sự cố thiết bị:</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setIssueType('DAMAGED')}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      issueType === 'DAMAGED'
                        ? 'bg-rose-950/80 border-rose-500 text-rose-200 font-bold shadow'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Flame className="w-4 h-4 mx-auto mb-1 text-rose-400" />
                    Hư hỏng
                  </button>
                  <button
                    type="button"
                    onClick={() => setIssueType('DIRTY')}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      issueType === 'DIRTY'
                        ? 'bg-orange-950/80 border-orange-500 text-orange-200 font-bold shadow'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Sparkles className="w-4 h-4 mx-auto mb-1 text-orange-400" />
                    Hay bẩn
                  </button>
                  <button
                    type="button"
                    onClick={() => setIssueType('DIFFICULT_TO_USE')}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      issueType === 'DIFFICULT_TO_USE'
                        ? 'bg-amber-950/80 border-amber-500 text-amber-200 font-bold shadow'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <HelpCircle className="w-4 h-4 mx-auto mb-1 text-amber-400" />
                    Khó sử dụng
                  </button>
                </div>
              </div>

              {/* Chọn thiết bị phân nhóm optgroup rõ ràng */}
              <div>
                <label className="block text-slate-300 font-medium mb-1.5">Thiết bị đang báo cáo:</label>
                <select
                  value={selectedDeviceNodeId}
                  onChange={(e) => setSelectedDeviceNodeId(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white font-medium outline-none focus:border-blue-500"
                >
                  <optgroup label={`🏠 THIẾT BỊ TRONG PHÒNG BẠN (${currentContract?.roomName})`}>
                    {roomDevices.map((d) => (
                      <option key={d.nodeId} value={d.nodeId}>
                        [Trong Phòng] {d.nodeName} ({d.nodeCode})
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label={`🏢 THIẾT BỊ DÙNG CHUNG TÒA NHÀ (${currentContract?.buildingName})`}>
                    {sharedBuildingDevices.map((d) => (
                      <option key={d.nodeId} value={d.nodeId}>
                        [Dùng Chung Tòa Nhà] {d.nodeName} ({d.nodeCode}) - {d.addressOrLocation || 'Khu công cộng'}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {/* Mô tả sự cố */}
              <div>
                <label className="block text-slate-300 font-medium mb-1.5">Mô tả chi tiết hiện tượng:</label>
                <textarea
                  rows={3}
                  value={issueDesc}
                  onChange={(e) => setIssueDesc(e.target.value)}
                  placeholder="Ví dụ: Điều hòa không phả hơi mát, máy giặt rung lắc mạnh khi vắt, tủ lạnh đóng tuyết..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-blue-500 placeholder-slate-500"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold transition-all shadow-lg active:scale-95"
              >
                Gửi Báo Cáo Thiết Bị
              </button>
            </form>
          </div>

          {/* Lịch sử báo cáo của khách */}
          <div className="space-y-3">
            <h4 className="font-bold text-white text-sm">Các Phản Ánh Bạn Đã Gửi:</h4>
            <div className="space-y-2">
              {issues.map((iss) => (
                <div key={iss.reportId} className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-semibold text-white">{iss.deviceName}</span>
                      <div className="text-[11px] text-slate-400 mt-0.5">Vị trí: {iss.location}</div>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                      iss.status === 'RESOLVED' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-amber-950 text-amber-400 border border-amber-800'
                    }`}>
                      {iss.status === 'RESOLVED' ? 'Đã khắc phục xong' : 'Đang xử lý'}
                    </span>
                  </div>
                  <p className="text-slate-300 bg-slate-950/60 p-2 rounded-lg border border-slate-800/60">{iss.description}</p>
                  <div className="text-[11px] text-slate-500 flex justify-between pt-1 border-t border-slate-800/80">
                    <span>Gửi lúc: {formatDateTimeVN(iss.reportedAt)}</span>
                    {iss.warrantyInfo && <span className="text-cyan-400 font-mono">{iss.warrantyInfo}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. TAB ĐÁNH GIÁ QUẢN LÝ (KHÓA HOÀN TOÀN SAU KHI GỬI) */}
      {activeTab === 'reviews' && (
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider font-bold text-purple-400 bg-purple-500/10 border border-purple-500/30 px-3 py-1 rounded-full mb-2">
                <Lock className="w-3.5 h-3.5" />
                Ràng buộc nghiệp vụ: Đánh giá xong sẽ Khóa Vĩnh Viễn
              </div>
              <h3 className="text-lg font-bold text-white">Đánh Giá Người Quản Lý Tòa Nhà</h3>
              <p className="text-xs text-slate-400 mt-1">
                Theo quy định của hệ thống: Khách thuê được đánh giá người quản lý sau khi hoàn tất trả phòng và thanh toán. Khi đã gửi đánh giá xong, hệ thống <strong>khóa hoàn toàn việc sửa đổi</strong> để đảm bảo tính công tâm.
              </p>
            </div>

            {reviewSubmittedAlert ? (
              <div className="p-6 rounded-2xl bg-purple-950/40 border border-purple-500/40 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-purple-900/60 border border-purple-700 flex items-center justify-center mx-auto text-purple-300">
                  <Lock className="w-6 h-6" />
                </div>
                <div className="text-base font-bold text-white">Đánh Giá Đã Được Gửi & Khóa Vĩnh Viễn!</div>
                <p className="text-xs text-slate-300">
                  Cột <code>TwoWayReviews.IsLocked = 1</code>. Bạn không thể chỉnh sửa lại đánh giá này nữa.
                </p>
              </div>
            ) : (
              <form onSubmit={handleReviewSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-medium mb-1.5">Số sao hài lòng (1 - 5 sao):</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRatingStar(star)}
                        className={`p-2.5 rounded-xl border transition-all ${
                          ratingStar >= star
                            ? 'bg-amber-950/60 border-amber-500 text-amber-400 shadow'
                            : 'bg-slate-950 border-slate-800 text-slate-600'
                        }`}
                      >
                        <Star className="w-5 h-5 fill-current" />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1.5">
                    Nhận xét về Quản lý Lê Văn Hoàng (Thái độ, bảo trì thiết bị, hỗ trợ):
                  </label>
                  <textarea
                    rows={4}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Quản lý nhiệt tình, hỗ trợ sửa chữa máy giặt trong ngày..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-purple-500 placeholder-slate-500"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition-all shadow-lg active:scale-95"
                >
                  Gửi Đánh Giá & Khóa Lại Vĩnh Viễn
                </button>
              </form>
            )}
          </div>

          {/* Hiển thị các đánh giá thực tế đã khóa */}
          <div className="space-y-3">
            <h4 className="font-bold text-white text-sm">Lịch Sử Đánh Giá Trong Hệ Thống:</h4>
            {reviews.map((rev) => (
              <div key={rev.reviewId} className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-2">
                <div className="flex justify-between items-center">
                  <div className="font-semibold text-white">
                    {rev.reviewerName} &rarr; {rev.targetUserName}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="flex text-amber-400">
                      {'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}
                    </span>
                    {rev.isLocked && (
                      <span className="text-[10px] bg-slate-800 text-slate-400 border border-slate-700 px-2 py-0.5 rounded flex items-center gap-1 font-mono">
                        <Lock className="w-3 h-3 text-amber-400" />
                        ĐÃ KHÓA
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-slate-300 italic">"{rev.comment}"</p>
                <div className="text-[10px] text-slate-500">Ngày tạo: {formatDateVN(rev.createdAt)} • {rev.roomName}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. TAB BẢN TIN & TIỆN ÍCH */}
      {activeTab === 'posts' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <FileText className="w-5 h-5 text-cyan-400" />
              Bản Tin & Giới Thiệu Tiện Ích Tòa Nhà
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Bài viết do Ban quản trị hoặc Quản lý đăng tải thông tin hướng dẫn, tiện ích và thông báo bảo trì.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {posts.map((post) => (
              <div key={post.postId} className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-lg flex flex-col">
                <img src={post.coverImage} alt={post.title} className="w-full h-44 object-cover" />
                <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[11px] text-slate-400">
                      <span className="text-blue-400 font-semibold">{post.buildingName}</span>
                      <span>{formatDateVN(post.createdAt)}</span>
                    </div>
                    <h4 className="font-bold text-white text-base leading-snug">{post.title}</h4>
                    <p className="text-xs text-slate-300">{post.summary}</p>
                  </div>
                  <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex justify-between items-center">
                    <span>Đăng bởi: <strong>{post.authorName}</strong> ({post.authorRole})</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. TAB ĐỔI MẬT KHẨU */}
      {activeTab === 'changePwd' && (
        <div className="max-w-md mx-auto space-y-6">
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center gap-2">
              <Key className="w-5 h-5 text-blue-400" />
              <h3 className="text-base font-bold text-white">Đổi Mật Khẩu Đăng Nhập & Mật Mã Cửa</h3>
            </div>
            <p className="text-xs text-slate-400">
              Đổi mật khẩu tài khoản khách thuê (Số điện thoại: <strong>{currentUser.phoneNumber}</strong>).
            </p>

            {pwdChangedAlert && (
              <div className="p-3 rounded-xl bg-emerald-950 border border-emerald-800 text-xs text-emerald-300">
                ✓ Đã đổi mật khẩu thành công!
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Mật khẩu hiện tại:</label>
                <input
                  type="password"
                  value={oldPwd}
                  onChange={(e) => setOldPwd(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Mật khẩu mới (tối thiểu 6 ký tự):</label>
                <input
                  type="password"
                  value={newPwd}
                  onChange={(e) => setNewPwd(e.target.value)}
                  placeholder="Mật khẩu mới..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-blue-500"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all shadow"
              >
                Cập Nhật Mật Khẩu
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL XEM ẢNH THỰC TẾ THIẾT BỊ DÀNH CHO KHÁCH THUÊ */}
      <DevicePhotoModal
        isOpen={!!selectedDeviceForPhoto}
        device={selectedDeviceForPhoto}
        buildingName={currentContract?.buildingName}
        roomName={currentContract?.roomName}
        onClose={() => setSelectedDeviceForPhoto(null)}
      />

      {/* MODAL THEO DÕI BIẾN ĐỘNG GIÁ THUÊ THIẾT BỊ DÀNH CHO KHÁCH THUÊ */}
      {selectedDeviceForHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">
                    Theo Dõi Biến Động Giá Thuê Thiết Bị
                  </h3>
                  <p className="text-xs text-slate-400">
                    Minh bạch lịch sử điều chỉnh & thống kê tính vào hóa đơn theo từng tháng
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDeviceForHistory(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 overflow-y-auto space-y-5 text-xs">
              {/* Thẻ tóm tắt thiết bị */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-900 border border-slate-800 flex-shrink-0">
                  <img
                    src={getDevicePhotoUrl(selectedDeviceForHistory)}
                    alt={selectedDeviceForHistory.nodeName}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{getDeviceCategoryIcon(selectedDeviceForHistory)}</span>
                    <h4 className="font-bold text-white text-sm truncate">
                      {selectedDeviceForHistory.nodeName}
                    </h4>
                  </div>
                  <div className="text-slate-400 font-mono mt-0.5">
                    Mã: [{selectedDeviceForHistory.nodeCode}] • Serial: {selectedDeviceForHistory.serialNumber || 'N/A'}
                  </div>
                  <div className="text-slate-300 mt-0.5">
                    📍 Vị trí: {selectedDeviceForHistory.addressOrLocation || 'Trong phòng'}
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <div className="text-[11px] text-slate-400">Giá thuê hiện tại:</div>
                  <div className="text-lg font-bold font-mono text-emerald-400">
                    {(selectedDeviceForHistory.monthlyRentalPrice || 0).toLocaleString('vi-VN')} đ
                  </div>
                  <div className="text-[10px] text-slate-400">/ tháng</div>
                </div>
              </div>

              {/* Bảng giá theo từng tháng (Schedule) */}
              {selectedDeviceForHistory.monthlyPriceSchedule && Object.keys(selectedDeviceForHistory.monthlyPriceSchedule).length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-blue-400" />
                      Bảng Giá Thuê Áp Dụng Theo Từng Tháng:
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Tự động tính vào tổng hóa đơn
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {Object.entries(selectedDeviceForHistory.monthlyPriceSchedule).map(([mYear, price]) => {
                      const isNewYearAdjust = mYear.startsWith('01/2027') || mYear.startsWith('02/2027');
                      return (
                        <div
                          key={mYear}
                          className={`p-3 rounded-xl border text-center transition-all ${
                            isNewYearAdjust
                              ? 'bg-emerald-950/40 border-emerald-700/60 ring-1 ring-emerald-500/30'
                              : 'bg-slate-950 border-slate-800'
                          }`}
                        >
                          <div className="text-slate-400 text-[11px] font-medium flex items-center justify-center gap-1">
                            <span>Tháng {mYear}</span>
                            {isNewYearAdjust && (
                              <span className="text-[9px] bg-emerald-900 text-emerald-300 px-1 rounded font-bold">Mới</span>
                            )}
                          </div>
                          <div className="font-mono font-bold text-sm text-emerald-400 mt-1">
                            {price.toLocaleString('vi-VN')} đ
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">/ tháng</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Lịch sử các đợt điều chỉnh giá */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200 flex items-center gap-1.5">
                    <History className="w-4 h-4 text-emerald-400" />
                    Lịch Sử Các Đợt Điều Chỉnh Biến Động Giá:
                  </span>
                  <span className="text-[11px] text-emerald-400 font-mono">
                    {selectedDeviceForHistory.priceHistory?.length || 1} đợt ghi nhận
                  </span>
                </div>

                {selectedDeviceForHistory.priceHistory && selectedDeviceForHistory.priceHistory.length > 0 ? (
                  <div className="space-y-2.5">
                    {selectedDeviceForHistory.priceHistory.map((rec) => {
                      const diff = rec.oldPrice !== undefined ? rec.newPrice - rec.oldPrice : 0;
                      const percent = rec.oldPrice && rec.oldPrice > 0 ? ((diff / rec.oldPrice) * 100).toFixed(1) : null;

                      return (
                        <div
                          key={rec.recordId}
                          className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 relative overflow-hidden"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="px-2.5 py-1 rounded-lg bg-blue-950 text-blue-300 border border-blue-800 font-bold text-xs">
                                Áp Dụng: Tháng {rec.effectiveMonthYear}
                              </span>
                              {diff !== 0 && (
                                <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                                  diff > 0
                                    ? 'bg-rose-950 text-rose-300 border border-rose-800'
                                    : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                }`}>
                                  {diff > 0 ? `+${diff.toLocaleString('vi-VN')} đ` : `${diff.toLocaleString('vi-VN')} đ`}
                                  {percent ? ` (+${percent}%)` : ''}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2 text-slate-300 font-mono text-xs">
                              {rec.oldPrice !== undefined && (
                                <>
                                  <span className="text-slate-400 line-through">
                                    {rec.oldPrice.toLocaleString('vi-VN')} đ
                                  </span>
                                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                                </>
                              )}
                              <span className="font-bold text-emerald-400 text-sm">
                                {rec.newPrice.toLocaleString('vi-VN')} đ/tháng
                              </span>
                            </div>
                          </div>

                          {/* Lý do & Người điều chỉnh */}
                          <div className="text-slate-300 text-xs bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80">
                            <div className="text-slate-200">
                              <strong>Lý do điều chỉnh:</strong> {rec.reason || 'Điều chỉnh theo thỏa thuận hợp đồng và biến động thị trường.'}
                            </div>
                            <div className="text-slate-400 text-[11px] mt-1 flex items-center justify-between">
                              <span>Người thực hiện: <strong>{rec.changedByName || 'Ban Quản Lý'}</strong></span>
                              <span>Ngày cập nhật: {formatDateVN(rec.changedAt)}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 text-center">
                    Chưa có lịch sử điều chỉnh giá nào được lưu cho thiết bị này. Giá thuê hiện tại: {(selectedDeviceForHistory.monthlyRentalPrice || 0).toLocaleString('vi-VN')} đ/tháng.
                  </div>
                )}
              </div>

              {/* Hướng dẫn tính vào hóa đơn */}
              <div className="p-3.5 rounded-2xl bg-blue-950/30 border border-blue-900/50 text-[11px] text-blue-300 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                  Quy trình tính tiền hóa đơn hàng tháng:
                </div>
                <p className="text-slate-300">
                  Khi đến kỳ lập hóa đơn (ví dụ Tháng 09/2026 hoặc Tháng 01/2027), hệ thống sẽ đối soát theo bảng giá thiết bị của chính tháng đó. Mọi biến động tăng hoặc giảm giá sẽ được thể hiện minh bạch trong mục <strong>"Thuê thiết bị phòng"</strong> và tính chính xác vào <strong>tổng tiền hóa đơn</strong> mà bạn nhận được.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedDeviceForHistory(null)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-all"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
