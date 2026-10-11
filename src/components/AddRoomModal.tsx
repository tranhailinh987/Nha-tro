import React, { useState, useEffect } from 'react';
import { 
  DoorClosed, 
  Building2, 
  Layers, 
  DollarSign, 
  Calendar, 
  Tag, 
  ShieldCheck, 
  Plus, 
  CheckCircle2, 
  Sparkles, 
  Info,
  AlertCircle,
  Camera,
  Upload,
  X
} from 'lucide-react';
import { ManagementNode, User } from '../types/rental';

interface AddRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  buildings: ManagementNode[];
  allNodes: ManagementNode[];
  currentUser: User | null;
  preselectedBuildingId?: number | null;
  onAddRoom: (
    targetNodeId: number, 
    roomName: string, 
    rent: number, 
    deposit: number, 
    roomCode?: string, 
    priceNote?: string,
    imageUrl?: string
  ) => void;
}

export const AddRoomModal: React.FC<AddRoomModalProps> = ({
  isOpen,
  onClose,
  buildings,
  allNodes,
  currentUser,
  preselectedBuildingId,
  onAddRoom
}) => {
  // Lọc các tòa nhà thuộc phạm vi quản lý:
  // Nếu là Quản lý cấp 2: chỉ hiển thị những tòa nhà mình quản lý (managerUserId === currentUser.userId hoặc notes có ID)
  // Nếu là Admin cấp 1: hiển thị toàn bộ tòa nhà
  const allowedBuildings = buildings.filter((b) => {
    if (!currentUser) return false;
    if (currentUser.roleId === 1) return true; // Admin cấp 1: toàn quyền tất cả tòa nhà
    if (currentUser.roleId === 2) {
      // Quản lý cấp 2: chỉ các tòa nhà được phân công hoặc do mình tạo
      return b.managerUserId === currentUser.userId || (b.notes && b.notes.includes(String(currentUser.userId)));
    }
    return false;
  });

  const [selectedBuildingId, setSelectedBuildingId] = useState<number>(() => {
    if (preselectedBuildingId && allowedBuildings.some(b => b.nodeId === preselectedBuildingId)) {
      return preselectedBuildingId;
    }
    return allowedBuildings[0]?.nodeId || 0;
  });

  const [selectedFloorId, setSelectedFloorId] = useState<number | 'BUILDING_DIRECT'>('BUILDING_DIRECT');
  const [roomCode, setRoomCode] = useState('');
  const [roomName, setRoomName] = useState('');
  const [rentPrice, setRentPrice] = useState<number>(4500000);
  const [depositAmount, setDepositAmount] = useState<number>(4500000);
  const [pricePeriodNote, setPricePeriodNote] = useState<string>('Giá mùa cao điểm tháng 9/2026');
  const [roomDescription, setRoomDescription] = useState<string>('Phòng khép kín, có ban công thoáng mát, gác xép, điều hòa & nóng lạnh');
  const [imageUrl, setImageUrl] = useState<string>('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Cập nhật selectedBuildingId khi mở modal hoặc khi preselectedBuildingId thay đổi
  useEffect(() => {
    if (preselectedBuildingId && allowedBuildings.some(b => b.nodeId === preselectedBuildingId)) {
      setSelectedBuildingId(preselectedBuildingId);
    } else if (allowedBuildings.length > 0 && !allowedBuildings.some(b => b.nodeId === selectedBuildingId)) {
      setSelectedBuildingId(allowedBuildings[0].nodeId);
    }
  }, [preselectedBuildingId, isOpen, allowedBuildings]);

  // Lấy danh sách các tầng của tòa nhà được chọn
  const currentBuildingFloors = allNodes.filter(
    (n) => n.parentNodeId === selectedBuildingId && n.typeId === 2
  );

  // Tự động gợi ý mã phòng & tên phòng khi chọn tòa nhà / tầng
  useEffect(() => {
    if (!selectedBuildingId) return;
    const currentBuilding = allowedBuildings.find(b => b.nodeId === selectedBuildingId);
    const existingRoomsInBuilding = allNodes.filter(n => {
      if (n.typeId !== 3) return false;
      let curr: ManagementNode | undefined = n;
      while (curr && curr.parentNodeId !== null) {
        if (curr.parentNodeId === selectedBuildingId) return true;
        curr = allNodes.find(item => item.nodeId === curr?.parentNodeId);
      }
      return false;
    });

    const nextRoomNum = existingRoomsInBuilding.length + 1;
    const defaultCode = `P-${nextRoomNum.toString().padStart(3, '0')}`;
    setRoomCode(defaultCode);
    setRoomName(`Phòng ${nextRoomNum} - ${currentBuilding?.nodeName || 'Tòa nhà'}`);
  }, [selectedBuildingId, isOpen]);

  if (!isOpen) return null;

  // Nếu người dùng không có quyền quản lý cấp 1 hoặc 2
  const isManagerOrAdmin = currentUser && (currentUser.roleId === 1 || currentUser.roleId === 2);
  if (!isManagerOrAdmin) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 text-center space-y-4 shadow-2xl">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">Yêu Cầu Quyền Quản Lý Cấp 1 Hoặc 2</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Chức năng <strong>Thêm phòng</strong> và <strong>Ấn định mức giá</strong> chỉ dành riêng cho <strong>Người quản lý cấp 1 (Admin)</strong> và <strong>Người quản lý cấp 2 (Quản lý tòa nhà)</strong>.
          </p>
          <p className="text-[11px] text-slate-400 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
            Mẹo: Sử dụng menu góc phải trên thanh Navbar để chuyển đổi sang tài khoản <strong>Lê Văn Hoàng (Admin Cấp 1)</strong> hoặc <strong>Vũ Thị Mai (Quản lý Cấp 2)</strong>.
          </p>
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors"
          >
            Đóng Lại
          </button>
        </div>
      </div>
    );
  }

  // Nếu Quản lý cấp 2 chưa có tòa nhà nào thuộc phạm vi quản lý
  if (allowedBuildings.length === 0) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 text-center space-y-4 shadow-2xl">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 mx-auto">
            <Building2 className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">Chưa Có Tòa Nhà Để Thêm Phòng</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Theo quy định nghiệp vụ: <strong>Tạo nhà xong mới tạo phòng</strong>. Hiện tại chưa có tòa nhà nào trong phạm vi quản lý của bạn. Vui lòng bấm <strong>+ Thêm Tòa Nhà Mới</strong> trước khi tạo phòng!
          </p>
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors"
          >
            Đã Hiểu &amp; Quay Lại
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomName.trim() || !selectedBuildingId) return;

    // Node cha của phòng: nếu chọn tầng thì lưu vào tầng, nếu không thì lưu trực tiếp vào tòa nhà
    const targetNodeId = selectedFloorId !== 'BUILDING_DIRECT' ? Number(selectedFloorId) : selectedBuildingId;

    onAddRoom(
      targetNodeId,
      roomName.trim(),
      Number(rentPrice),
      Number(depositAmount),
      roomCode.trim() || undefined,
      pricePeriodNote.trim() || undefined,
      imageUrl.trim() || undefined
    );

    onClose();
    setImageUrl('');
  };

  const selectedBuilding = allowedBuildings.find(b => b.nodeId === selectedBuildingId);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 space-y-5 shadow-2xl max-h-[92vh] overflow-y-auto">
        {/* Header Modal */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <DoorClosed className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-base">Thêm Phòng Mới Vào Tòa Nhà</h3>
                <span className="text-[10px] bg-blue-500/10 border border-blue-500/30 text-blue-400 font-semibold px-2 py-0.5 rounded-full">
                  {currentUser.roleId === 1 ? 'Quyền Admin Cấp 1' : 'Quyền Quản Lý Cấp 2'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Tạo nhà xong mới tạo phòng • Ấn định mức giá theo từng thời điểm
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-sm transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Thông tin người quản lý thực hiện */}
        <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-slate-300">
              Người tạo phòng: <strong>{currentUser.fullName}</strong> ({currentUser.roleId === 1 ? 'Admin Cấp 1' : 'Quản lý Cấp 2'})
            </span>
          </div>
          <span className="text-[11px] text-emerald-400 font-medium">Hợp lệ</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* 1. CHỌN TÒA NHÀ & TẦNG */}
          <div className="space-y-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
            <div className="text-[11px] font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" />
              1. Chọn Tòa Nhà &amp; Vị Trí Phòng
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Tòa Nhà Mục Tiêu <span className="text-rose-400">*</span>
              </label>
              <select
                value={selectedBuildingId}
                onChange={(e) => {
                  setSelectedBuildingId(Number(e.target.value));
                  setSelectedFloorId('BUILDING_DIRECT');
                }}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-xs outline-none focus:border-blue-500 font-medium"
              >
                {allowedBuildings.map((b) => (
                  <option key={b.nodeId} value={b.nodeId}>
                    [{b.nodeCode}] {b.nodeName} - {b.addressOrLocation || 'Chưa có địa chỉ'}
                  </option>
                ))}
              </select>
              {currentUser.roleId === 2 && (
                <p className="text-[10px] text-slate-400 mt-1">
                  ✓ Bạn chỉ có thể chọn những Tòa nhà thuộc phạm vi quản lý của mình ({allowedBuildings.length} tòa nhà).
                </p>
              )}
            </div>

            {/* Chọn Tầng nếu tòa nhà có tầng */}
            {currentBuildingFloors.length > 0 && (
              <div>
                <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-cyan-400" />
                  Chọn Tầng (Tùy chọn)
                </label>
                <select
                  value={selectedFloorId}
                  onChange={(e) => setSelectedFloorId(e.target.value === 'BUILDING_DIRECT' ? 'BUILDING_DIRECT' : Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-cyan-500"
                >
                  <option value="BUILDING_DIRECT">Gán trực tiếp vào Tòa nhà</option>
                  {currentBuildingFloors.map((fl) => (
                    <option key={fl.nodeId} value={fl.nodeId}>
                      {fl.nodeName} ({fl.nodeCode})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* 2. THÔNG TIN PHÒNG (MÃ & TÊN) */}
          <div className="space-y-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
            <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <DoorClosed className="w-3.5 h-3.5" />
              2. Định Danh Phòng
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Mã Phòng <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value)}
                  placeholder="Ví dụ: P-101, P-202"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-xs outline-none focus:border-emerald-500 uppercase"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Tên Phòng Hiển Thị <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="Ví dụ: Phòng 101 - Ban công thoáng mát"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Mô Tả Tiện Ích Phòng
              </label>
              <input
                type="text"
                value={roomDescription}
                onChange={(e) => setRoomDescription(e.target.value)}
                placeholder="Ví dụ: Gác xép, điều hòa, tủ lạnh, máy nước nóng..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* 3. ẤN ĐỊNH MỨC GIÁ THEO TỪNG THỜI ĐIỂM (NGHIỆP VỤ QUAN TRỌNG) */}
          <div className="space-y-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
            <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5" />
                3. Ấn Định Mức Giá Thuê &amp; Thời Điểm
              </span>
              <span className="text-[10px] text-slate-400 font-normal">
                Quản lý Cấp 1 hoặc 2 có thể điều chỉnh
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Giá Thuê Tháng (VNĐ) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="number"
                  required
                  min={500000}
                  step={100000}
                  value={rentPrice}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setRentPrice(val);
                    setDepositAmount(val); // Cọc mặc định = 1 tháng tiền nhà
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-emerald-400 font-mono font-bold text-sm outline-none focus:border-emerald-500"
                />
                <div className="text-[11px] text-slate-400 mt-1 font-mono">
                  = {rentPrice.toLocaleString('vi-VN')} đ/tháng
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Tiền Đặt Cọc (VNĐ) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  step={100000}
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-amber-400 font-mono font-bold text-sm outline-none focus:border-amber-500"
                />
                <div className="text-[11px] text-slate-400 mt-1 font-mono">
                  = {depositAmount.toLocaleString('vi-VN')} đ cọc
                </div>
              </div>
            </div>

            {/* Nút bấm nhanh các mức giá phổ biến */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] text-slate-400">Chọn nhanh:</span>
              {[3500000, 4000000, 4500000, 5000000, 5500000, 6000000].map((quick) => (
                <button
                  type="button"
                  key={quick}
                  onClick={() => {
                    setRentPrice(quick);
                    setDepositAmount(quick);
                  }}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono border transition-all ${
                    rentPrice === quick
                      ? 'bg-emerald-600 text-white border-emerald-500 font-bold'
                      : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500'
                  }`}
                >
                  {(quick / 1000000).toFixed(1)}Tr
                </button>
              ))}
            </div>

            {/* Thời điểm áp dụng mức giá (Mỗi phòng có giá khác nhau tùy thời điểm) */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1 flex items-center justify-between">
                <span>Thời Điểm / Giai Đoạn Áp Dụng Mức Giá</span>
                <span className="text-[10px] text-blue-400 font-normal">Ấn định theo mùa</span>
              </label>
              <input
                type="text"
                value={pricePeriodNote}
                onChange={(e) => setPricePeriodNote(e.target.value)}
                placeholder="Ví dụ: Giá mùa cao điểm tháng 9/2026, Giá ưu đãi tân sinh viên..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-amber-500"
              />
              <div className="flex flex-wrap items-center gap-1.5 mt-1.5 text-[10px]">
                <span className="text-slate-500">Mẫu gợi ý:</span>
                {[
                  'Giá tiêu chuẩn',
                  'Giá mùa cao điểm tháng 9/2026',
                  'Giá ưu đãi tân sinh viên (-5%)',
                  'Giá mùa hè giảm giá'
                ].map((sample) => (
                  <button
                    type="button"
                    key={sample}
                    onClick={() => setPricePeriodNote(sample)}
                    className="text-amber-400/90 hover:text-amber-300 underline underline-offset-2"
                  >
                    {sample}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 4. UPLOAD ẢNH CHỤP THỰC TẾ CỦA PHÒNG */}
          <div className="space-y-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5" />
                4. Ảnh Chụp Thực Tế Phòng Trọ (Upload hoặc Dán Link)
              </div>
              {imageUrl && (
                <button
                  type="button"
                  onClick={() => setImageUrl('')}
                  className="text-[10px] text-rose-400 hover:text-rose-300 flex items-center gap-0.5"
                >
                  <X className="w-3 h-3" />
                  <span>Xóa ảnh</span>
                </button>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <label className="cursor-pointer px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 flex-shrink-0">
                <Upload className="w-3.5 h-3.5 text-cyan-400" />
                <span>Tải Ảnh Phòng Lên</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>

              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="Hoặc dán URL ảnh chụp phòng https://..."
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-cyan-500"
              />
            </div>

            {imageUrl && (
              <div className="mt-2 relative rounded-xl overflow-hidden border border-slate-700/80 h-36 bg-slate-900 group">
                <img src={imageUrl} alt="Ảnh thực tế phòng" className="w-full h-full object-cover" />
                <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur text-emerald-400 text-[10px] font-semibold px-2 py-0.5 rounded-lg border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Ảnh phòng đã nạp</span>
                </div>
              </div>
            )}
          </div>

          {/* Nút Submit Form */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
            >
              Hủy Bỏ
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 flex items-center gap-1.5 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Xác Nhận Thêm Phòng Ngay</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
