import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Calendar, 
  DollarSign, 
  Wifi, 
  Wind, 
  Tv, 
  Flame, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Building2, 
  DoorClosed, 
  Cpu, 
  Tag, 
  Layers,
  ArrowUpDown,
  Save, 
  RotateCcw, 
  Calculator,
  Search,
  Filter,
  Eye,
  Camera,
  TrendingUp,
  History,
  FileText,
  Clock,
  ArrowRight,
  PlusCircle,
  HelpCircle,
  Percent
} from 'lucide-react';
import { ManagementNode, MonthlyInvoice, DevicePriceHistoryRecord, ObjectType } from '../types/rental';
import { getDeviceCategoryIcon, getDevicePhotoUrl } from './DevicePhotoModal';
import { formatDateVN } from '../utils/dateUtils';

interface DevicePriceScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  buildings: ManagementNode[];
  nodes: ManagementNode[];
  invoices: MonthlyInvoice[];
  objectTypes?: ObjectType[];
  onUpdateDeviceMonthlyPrice: (deviceNodeId: number, monthYear: string, newPrice: number, reason?: string) => void;
  onRecalculateInvoicesForMonth?: (monthYear: string) => void;
  onOpenPhotoModal?: (deviceNode: ManagementNode) => void;
  initialSelectedDeviceNodeId?: number | null;
}

export const DevicePriceScheduleModal: React.FC<DevicePriceScheduleModalProps> = ({
  isOpen,
  onClose,
  buildings,
  nodes,
  invoices,
  objectTypes,
  onUpdateDeviceMonthlyPrice,
  onRecalculateInvoicesForMonth,
  onOpenPhotoModal,
  initialSelectedDeviceNodeId
}) => {
  // Tab chính: 'schedule' (Bảng giá các tháng) | 'fluctuations' (Theo dõi biến động giá) | 'invoiceRevenue' (Thống kê hóa đơn)
  const [activeMainTab, setActiveMainTab] = useState<'schedule' | 'fluctuations' | 'invoiceRevenue'>('schedule');

  const [selectedBuildingId, setSelectedBuildingId] = useState<number | 'ALL'>('ALL');
  // Lọc theo Loại Đối Tượng (typeId): Chọn loại đối tượng nào thì chỉ hiển thị thiết bị của loại đối tượng ấy
  const [selectedTypeId, setSelectedTypeId] = useState<number | 'ALL'>('ALL');
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  
  // Các tháng trong bảng giá (Có năm 2026 và năm 2027 để theo dõi biến động giá qua các năm)
  const [availableMonths, setAvailableMonths] = useState<string[]>([
    '08/2026',
    '09/2026',
    '10/2026',
    '11/2026',
    '12/2026',
    '01/2027',
    '02/2027'
  ]);
  const [newMonthInput, setNewMonthInput] = useState<string>('');
  const [selectedActiveMonth, setSelectedActiveMonth] = useState<string>('09/2026');

  // Trạng thái chỉnh sửa giá cục bộ trước khi bấm lưu
  const [localPriceChanges, setLocalPriceChanges] = useState<{ [key: string]: number }>({});
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Thiết bị đang được chọn để theo dõi lịch sử biến động giá chi tiết
  const [trackedDevId, setTrackedDevId] = useState<number>(() => {
    if (initialSelectedDeviceNodeId) return initialSelectedDeviceNodeId;
    const wifiDev = nodes.find(n => n.nodeId === 307 || n.nodeName.toLowerCase().includes('wifi') || n.typeId === 14);
    return wifiDev?.nodeId || 307;
  });

  // Form điều chỉnh giá mới cho thiết bị
  const [adjustEffectiveMonth, setAdjustEffectiveMonth] = useState<string>('11/2026');
  const [adjustNewPrice, setAdjustNewPrice] = useState<number>(82000);
  const [adjustReason, setAdjustReason] = useState<string>('Đến Tháng 11 điều chỉnh giá thuê cục phát WiFi lên 82.000đ/tháng do nâng cấp gói cước băng thông Gigabit');

  // Danh mục loại đối tượng thiết bị (dành cho lọc phân loại)
  const availableObjectTypes = useMemo(() => {
    const presentTypeIds = new Set(nodes.filter(n => !n.isShared && n.typeId >= 4).map(n => n.typeId));
    if (objectTypes && objectTypes.length > 0) {
      const filtered = objectTypes.filter(t => presentTypeIds.has(t.typeId) || t.categoryGroup === 'DEVICE');
      if (filtered.length > 0) return filtered;
    }
    return Array.from(presentTypeIds).map(tid => {
      const sample = nodes.find(n => n.typeId === tid);
      let name = sample?.nodeName?.split('-')[0]?.trim() || `Loại thiết bị ${tid}`;
      if (tid === 14) name = 'Cục Phát WiFi Riêng (Phòng)';
      else if (tid === 11) name = 'Điều Hòa Không Khí Inverter';
      else if (tid === 12) name = 'Tủ Lạnh Mini / Phòng';
      else if (tid === 13) name = 'Bình Nước Nóng Ariston';
      else if (tid === 4) name = 'Máy Giặt Chung';
      return {
        typeId: tid,
        typeCode: `TYPE_${tid}`,
        typeName: name,
        categoryGroup: 'DEVICE' as const,
        hasSubItems: false
      };
    });
  }, [objectTypes, nodes]);

  // LỌC DANH SÁCH THIẾT BỊ:
  // 1. Chỉ lấy thiết bị trang bị theo phòng (isShared === false và typeId >= 4)
  // 2. Chọn loại đối tượng nào thì CHỈ RA thiết bị của loại đối tượng ấy
  // 3. SẮP XẾP THEO TÊN THIẾT BỊ (A-Z tiếng Việt)
  const roomDevices = useMemo(() => {
    const filtered = nodes.filter((n) => {
      if (n.typeId < 4) return false;
      if (n.isShared === true) return false; // Không lấy thiết bị dùng chung tính theo lượt

      // Lọc theo Tòa nhà
      if (selectedBuildingId !== 'ALL') {
        if (n.buildingNodeId && n.buildingNodeId !== selectedBuildingId) return false;
        let curr: ManagementNode | undefined = n;
        while (curr && curr.parentNodeId !== null) {
          curr = nodes.find(item => item.nodeId === curr?.parentNodeId);
        }
        if (curr && curr.nodeId !== selectedBuildingId) return false;
      }

      // LỌC THEO LOẠI ĐỐI TƯỢNG (Chỉ ra thiết bị của loại đối tượng ấy)
      if (selectedTypeId !== 'ALL') {
        if (n.typeId !== selectedTypeId) return false;
      }

      // Tìm kiếm theo từ khóa
      if (searchKeyword.trim()) {
        const q = searchKeyword.toLowerCase();
        const matchName = n.nodeName.toLowerCase().includes(q);
        const matchCode = n.nodeCode.toLowerCase().includes(q);
        const matchSerial = (n.serialNumber || '').toLowerCase().includes(q);
        if (!matchName && !matchCode && !matchSerial) return false;
      }

      return true;
    });

    // SẮP XẾP THEO TÊN THIẾT BỊ (A - Z Tiếng Việt)
    return filtered.sort((a, b) => a.nodeName.localeCompare(b.nodeName, 'vi', { sensitivity: 'base' }));
  }, [nodes, selectedBuildingId, selectedTypeId, searchKeyword]);

  // Tự động đồng bộ thiết bị khi mở modal hoặc khi ban đầu truyền thiết bị
  useEffect(() => {
    if (isOpen && initialSelectedDeviceNodeId) {
      setTrackedDevId(initialSelectedDeviceNodeId);
      setActiveMainTab('fluctuations');
      const dev = nodes.find(n => n.nodeId === initialSelectedDeviceNodeId);
      if (dev) {
        // Tự động chuyển loại đối tượng sang loại của thiết bị này
        setSelectedTypeId(dev.typeId);
        if (dev.monthlyRentalPrice) {
          setAdjustNewPrice(dev.monthlyRentalPrice);
        }
      }
    }
  }, [isOpen, initialSelectedDeviceNodeId, nodes]);

  // Khi người dùng đổi Loại đối tượng, nếu thiết bị đang chọn không còn trong danh sách thì tự động chọn thiết bị đầu tiên
  useEffect(() => {
    if (roomDevices.length > 0) {
      const exists = roomDevices.some(d => d.nodeId === trackedDevId);
      if (!exists) {
        setTrackedDevId(roomDevices[0].nodeId);
        if (roomDevices[0].monthlyRentalPrice) {
          setAdjustNewPrice(roomDevices[0].monthlyRentalPrice);
        }
      }
    }
  }, [roomDevices, trackedDevId]);

  if (!isOpen) return null;

  // Thiết bị đang theo dõi biến động giá
  const selectedTrackedDev = nodes.find(n => n.nodeId === trackedDevId) || roomDevices[0];

  // Helper lấy giá của thiết bị theo tháng (có tính giá sửa đổi cục bộ)
  const getDevicePriceForMonth = (device: ManagementNode, monthYear: string): number => {
    const key = `${device.nodeId}_${monthYear}`;
    if (localPriceChanges[key] !== undefined) {
      return localPriceChanges[key];
    }
    if (device.monthlyPriceSchedule && device.monthlyPriceSchedule[monthYear] !== undefined) {
      return device.monthlyPriceSchedule[monthYear];
    }
    return device.monthlyRentalPrice || (!device.isShared ? (device.unitPrice || 0) : 0);
  };

  // Cập nhật giá trên giao diện
  const handlePriceChange = (deviceNodeId: number, monthYear: string, value: string) => {
    const num = Math.max(0, parseInt(value.replace(/\D/g, ''), 10) || 0);
    setLocalPriceChanges(prev => ({
      ...prev,
      [`${deviceNodeId}_${monthYear}`]: num
    }));
  };

  // Áp dụng giá của tháng đang chọn cho tất cả các tháng tiếp theo của thiết bị đó
  const handleApplyToAllMonths = (device: ManagementNode, sourceMonth: string) => {
    const sourcePrice = getDevicePriceForMonth(device, sourceMonth);
    const newChanges = { ...localPriceChanges };
    availableMonths.forEach(m => {
      newChanges[`${device.nodeId}_${m}`] = sourcePrice;
    });
    setLocalPriceChanges(newChanges);
    setSaveSuccessMsg(`Đã sao chép giá ${sourcePrice.toLocaleString('vi-VN')} đ của "${device.nodeName}" cho tất cả các tháng!`);
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  // Lưu bảng giá
  const handleSaveAllChanges = () => {
    const keys = Object.keys(localPriceChanges);
    if (keys.length === 0) {
      alert('Chưa có thay đổi giá nào cần lưu.');
      return;
    }

    keys.forEach(key => {
      const [deviceIdStr, monthYear] = key.split('_');
      const deviceId = Number(deviceIdStr);
      const newPrice = localPriceChanges[key];
      const targetDev = nodes.find(n => n.nodeId === deviceId);
      const oldPrice = targetDev ? getDevicePriceForMonth(targetDev, monthYear) : 0;
      onUpdateDeviceMonthlyPrice(
        deviceId, 
        monthYear, 
        newPrice, 
        `Điều chỉnh giá thuê tháng ${monthYear} từ ${oldPrice.toLocaleString('vi-VN')}đ lên ${newPrice.toLocaleString('vi-VN')}đ/tháng`
      );
    });

    // Tự động tính toán lại hóa đơn cho các tháng có thay đổi
    if (onRecalculateInvoicesForMonth) {
      const affectedMonths = Array.from(new Set(keys.map(k => k.split('_')[1])));
      affectedMonths.forEach(m => {
        onRecalculateInvoicesForMonth(m);
      });
    }

    setSaveSuccessMsg(`Thành công! Đã lưu bảng giá mới cho ${keys.length} lượt cập nhật & tự động tính lại tiền hóa đơn.`);
    setLocalPriceChanges({});
    setTimeout(() => setSaveSuccessMsg(null), 4000);
  };

  // Thực hiện điều chỉnh giá mới từ form Theo dõi biến động giá
  const handleExecutePriceAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTrackedDev) return;

    const oldPrice = getDevicePriceForMonth(selectedTrackedDev, adjustEffectiveMonth);
    onUpdateDeviceMonthlyPrice(
      selectedTrackedDev.nodeId,
      adjustEffectiveMonth,
      Number(adjustNewPrice),
      adjustReason.trim() || undefined
    );

    // Nếu tháng này chưa có trong availableMonths thì thêm vào
    if (!availableMonths.includes(adjustEffectiveMonth)) {
      setAvailableMonths(prev => [...prev, adjustEffectiveMonth]);
    }

    // Tự động tính lại hóa đơn tháng đó
    if (onRecalculateInvoicesForMonth) {
      onRecalculateInvoicesForMonth(adjustEffectiveMonth);
    }

    setSaveSuccessMsg(`Đã ghi nhận điều chỉnh giá: ${selectedTrackedDev.nodeName} áp dụng từ tháng ${adjustEffectiveMonth} mức giá mới là ${Number(adjustNewPrice).toLocaleString('vi-VN')} đ/tháng!`);
    setTimeout(() => setSaveSuccessMsg(null), 5000);
  };

  // Thêm tháng mới vào bảng giá
  const handleAddMonth = () => {
    if (!newMonthInput.trim()) return;
    const formatted = newMonthInput.trim();
    if (!availableMonths.includes(formatted)) {
      setAvailableMonths(prev => [...prev, formatted]);
      setSelectedActiveMonth(formatted);
    }
    setNewMonthInput('');
  };

  // Tìm phòng lắp đặt
  const getRoomName = (device: ManagementNode) => {
    const roomId = device.roomNodeId || device.parentNodeId;
    if (!roomId) return 'Kho phòng';
    const room = nodes.find(n => n.nodeId === roomId && n.typeId === 3);
    return room ? room.nodeName : 'Kho chưa gán';
  };

  // Tìm tòa nhà
  const getBuildingName = (device: ManagementNode) => {
    let curr: ManagementNode | undefined = device;
    while (curr && curr.parentNodeId !== null) {
      curr = nodes.find(n => n.nodeId === curr?.parentNodeId);
    }
    return curr?.nodeName || 'Tòa nhà';
  };

  const totalMonthlyCostCurrentMonth = roomDevices.reduce((sum, d) => sum + getDevicePriceForMonth(d, selectedActiveMonth), 0);

  // Lịch sử biến động giá của thiết bị đang theo dõi
  const priceHistoryList: DevicePriceHistoryRecord[] = selectedTrackedDev?.priceHistory && selectedTrackedDev.priceHistory.length > 0
    ? selectedTrackedDev.priceHistory
    : [
        {
          recordId: 101,
          effectiveMonthYear: '08/2026',
          oldPrice: 0,
          newPrice: selectedTrackedDev?.monthlyRentalPrice || 70000,
          changedAt: '2026-08-01',
          changedByName: 'Lê Văn Hoàng (Quản lý)',
          reason: `Khách thuê đăng ký trang bị thêm ${selectedTrackedDev?.nodeName || 'thiết bị'} giá khởi điểm ${(selectedTrackedDev?.monthlyRentalPrice || 70000).toLocaleString('vi-VN')} đ/tháng`
        }
      ];

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-5 z-50 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-6xl w-full max-h-[94vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header chính */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-inner">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white">Quản Lý Bảng Giá &amp; Theo Dõi Biến Động Giá Thiết Bị Thuê</h3>
                <span className="text-[11px] bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-semibold px-2.5 py-0.5 rounded-full">
                  Tính vào hóa đơn tháng
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Thiết bị khách thuê thêm (như Cục phát WiFi) tính tiền thuê theo tháng. Khi bạn điều chỉnh tăng giá (VD: 70k lên 82k), tiền thuê sẽ tự động thống kê vào hóa đơn và lưu vết biến động giá.
              </p>
            </div>
          </div>

          <button 
            onClick={onClose} 
            className="w-9 h-9 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-base transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Guidance Banner */}
        <div className="px-5 py-2.5 bg-indigo-950/40 border-b border-indigo-500/20 flex items-center justify-between text-[11px] text-indigo-200">
          <div className="flex items-center gap-2">
            <span className="font-bold text-indigo-400">💡 Lưu ý:</span>
            <span>
              Bảng giá này quản lý <strong>đơn giá thuê theo tháng</strong> của thiết bị gắn theo phòng. Đối với <strong>thiết bị dùng chung tính theo lượt</strong> (máy giặt sảnh, sạc điện...), bạn có thể sửa giá lượt hoặc đổi cách tính tiền bằng nút <strong>"Đổi Cách Tính Tiền"</strong> trên thẻ thiết bị hoặc trong <strong>Cây Quản Lý Thực Thể Đệ Quy</strong>.
            </span>
          </div>
        </div>

        {/* 3 Tabs Điều Hướng Chức Năng */}
        <div className="px-5 pt-3 bg-slate-950/60 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveMainTab('schedule')}
              className={`px-4 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 ${
                activeMainTab === 'schedule'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>1. Bảng Giá Theo Từng Tháng</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveMainTab('fluctuations')}
              className={`px-4 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 ${
                activeMainTab === 'fluctuations'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>2. 📈 Theo Dõi Biến Động Giá Thiết Bị</span>
              <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-700 px-1.5 py-0.2 rounded-full">
                70k → 82k
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveMainTab('invoiceRevenue')}
              className={`px-4 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 ${
                activeMainTab === 'invoiceRevenue'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Calculator className="w-4 h-4 text-cyan-400" />
              <span>3. Thống Kê Tính Vào Hóa Đơn Khách</span>
            </button>
          </div>

          {saveSuccessMsg && (
            <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{saveSuccessMsg}</span>
            </div>
          )}
        </div>

        {/* TAB 1: BẢNG GIÁ THEO THÁNG */}
        {activeMainTab === 'schedule' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Thanh công cụ lọc & tìm kiếm */}
            <div className="p-4 bg-slate-900/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                {/* Lọc Tòa Nhà */}
                <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
                  <Building2 className="w-3.5 h-3.5 text-blue-400" />
                  <select
                    value={selectedBuildingId}
                    onChange={(e) => setSelectedBuildingId(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
                    className="bg-transparent text-white outline-none font-semibold text-xs cursor-pointer"
                  >
                    <option value="ALL" className="bg-slate-900 text-white">Tất cả tòa nhà</option>
                    {buildings.map((b) => (
                      <option key={b.nodeId} value={b.nodeId} className="bg-slate-900 text-white">
                        {b.nodeName} ({b.nodeCode})
                      </option>
                    ))}
                  </select>
                </div>

                {/* LỌC THEO LOẠI ĐỐI TƯỢNG (Chỉ ra thiết bị của loại đối tượng ấy) */}
                <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-indigo-500/40 shadow-sm">
                  <Layers className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                  <span className="text-slate-400 font-semibold whitespace-nowrap">Loại đối tượng:</span>
                  <select
                    value={selectedTypeId}
                    onChange={(e) => setSelectedTypeId(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
                    className="bg-transparent text-white outline-none font-bold text-xs cursor-pointer max-w-[210px]"
                  >
                    <option value="ALL" className="bg-slate-900 text-white">
                      -- Tất cả loại đối tượng ({nodes.filter(n => !n.isShared && n.typeId >= 4).length}) --
                    </option>
                    {availableObjectTypes.map((ot) => {
                      const count = nodes.filter(n => !n.isShared && n.typeId === ot.typeId).length;
                      return (
                        <option key={ot.typeId} value={ot.typeId} className="bg-slate-900 text-white">
                          {ot.typeName} ({count} thiết bị)
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Chỉ báo Sắp xếp theo tên thiết bị (A-Z) */}
                <div className="hidden lg:flex items-center gap-1 text-[11px] text-slate-300 font-medium bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-800">
                  <ArrowUpDown className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Xếp theo tên: <strong>A → Z</strong> ({roomDevices.length} thiết bị)</span>
                </div>

                {/* Tìm kiếm */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Tìm tên, mã, serial..."
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-white outline-none focus:border-indigo-500 w-36 sm:w-48"
                  />
                </div>
              </div>

              {/* Thêm cột tháng & Thao tác Lưu */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-xl border border-slate-800">
                  <input
                    type="text"
                    placeholder="MM/YYYY (VD: 01/2028)"
                    value={newMonthInput}
                    onChange={(e) => setNewMonthInput(e.target.value)}
                    className="bg-transparent text-white text-xs w-28 px-1 outline-none font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleAddMonth}
                    className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-[11px]"
                  >
                    + Thêm Tháng
                  </button>
                </div>

                {Object.keys(localPriceChanges).length > 0 && (
                  <button
                    type="button"
                    onClick={handleSaveAllChanges}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold shadow-lg shadow-emerald-900/30 transition-all active:scale-95 animate-pulse"
                  >
                    <Save className="w-4 h-4" />
                    <span>Lưu {Object.keys(localPriceChanges).length} Thay Đổi</span>
                  </button>
                )}
              </div>
            </div>

            {/* Bảng giá chính */}
            <div className="flex-1 overflow-auto p-4">
              <div className="border border-slate-800 rounded-2xl overflow-hidden shadow-inner bg-slate-950/60">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-slate-300 border-b border-slate-800 uppercase tracking-wider text-[11px] font-semibold sticky top-0 z-10">
                      <th className="py-3 px-4 w-12 text-center">Ảnh</th>
                      <th className="py-3 px-4">Thiết Bị &amp; Model</th>
                      <th className="py-3 px-3">Phòng Thuê</th>
                      <th className="py-3 px-3">Tòa Nhà</th>
                      {availableMonths.map((m) => (
                        <th 
                          key={m} 
                          className={`py-3 px-3 text-right font-mono min-w-[125px] cursor-pointer transition-colors ${
                            selectedActiveMonth === m ? 'bg-indigo-950/70 text-indigo-300 border-b-2 border-indigo-500' : 'hover:bg-slate-800/60'
                          }`}
                          onClick={() => setSelectedActiveMonth(m)}
                        >
                          <div className="flex items-center justify-end gap-1">
                            <span>Tháng {m}</span>
                            {m.includes('2027') && (
                              <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1 rounded">Năm sau</span>
                            )}
                          </div>
                        </th>
                      ))}
                      <th className="py-3 px-4 text-center w-36">Biến Động Giá</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {roomDevices.length === 0 ? (
                      <tr>
                        <td colSpan={5 + availableMonths.length} className="text-center py-12 text-slate-500">
                          Không tìm thấy thiết bị phòng nào phù hợp với bộ lọc hiện tại.
                        </td>
                      </tr>
                    ) : (
                      roomDevices.map((device) => {
                        const photoUrl = getDevicePhotoUrl(device);
                        const isWifi = device.nodeName.toLowerCase().includes('wifi') || device.typeId === 14;

                        return (
                          <tr 
                            key={device.nodeId} 
                            className="hover:bg-slate-900/50 transition-colors group"
                          >
                            {/* Ảnh thu nhỏ thumbnail */}
                            <td className="py-2.5 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => onOpenPhotoModal ? onOpenPhotoModal(device) : null}
                                className="w-10 h-10 rounded-xl overflow-hidden border border-slate-700/80 bg-slate-900 relative group/img cursor-pointer hover:border-indigo-400 transition-all flex items-center justify-center mx-auto"
                                title="Bấm để xem ảnh thực tế thiết bị"
                              >
                                <img 
                                  src={photoUrl} 
                                  alt={device.nodeName} 
                                  className="w-full h-full object-cover group-hover/img:scale-110 transition-transform duration-300"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-opacity">
                                  <Eye className="w-3.5 h-3.5 text-white" />
                                </div>
                              </button>
                            </td>

                            {/* Tên & Model */}
                            <td className="py-2.5 px-4">
                              <div className="flex items-center gap-2">
                                <span className="text-base">{getDeviceCategoryIcon(device)}</span>
                                <div>
                                  <div className="font-bold text-white group-hover:text-indigo-300 transition-colors flex items-center gap-1.5">
                                    <span>{device.nodeName}</span>
                                    {isWifi && (
                                      <span className="text-[10px] bg-blue-500/20 text-blue-400 border border-blue-500/30 px-1.5 py-0.2 rounded font-semibold">
                                        Khách thuê thêm
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                                    <span className="font-mono text-slate-500">{device.nodeCode}</span>
                                    {device.serialNumber && (
                                      <span>• SN: <span className="font-mono text-slate-400">{device.serialNumber}</span></span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Phòng lắp đặt */}
                            <td className="py-2.5 px-3">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-950/40 text-emerald-300 border border-emerald-800/40 font-medium text-[11px]">
                                <DoorClosed className="w-3 h-3" />
                                <span>{getRoomName(device)}</span>
                              </span>
                            </td>

                            {/* Tòa nhà */}
                            <td className="py-2.5 px-3">
                              <span className="text-slate-300 text-[11px] truncate block max-w-[130px]" title={getBuildingName(device)}>
                                {getBuildingName(device)}
                              </span>
                            </td>

                            {/* Các cột giá theo từng tháng */}
                            {availableMonths.map((m) => {
                              const currentPrice = getDevicePriceForMonth(device, m);
                              const isModified = localPriceChanges[`${device.nodeId}_${m}`] !== undefined;

                              return (
                                <td 
                                  key={m} 
                                  className={`py-2.5 px-3 text-right ${selectedActiveMonth === m ? 'bg-indigo-950/20' : ''}`}
                                >
                                  <div className="inline-flex items-center justify-end gap-1">
                                    <input
                                      type="text"
                                      value={currentPrice.toLocaleString('vi-VN')}
                                      onChange={(e) => handlePriceChange(device.nodeId, m, e.target.value)}
                                      className={`w-24 text-right px-2 py-1 rounded-lg font-mono font-bold text-xs outline-none transition-all ${
                                        isModified
                                          ? 'bg-amber-950/60 border border-amber-500 text-amber-300 shadow'
                                          : 'bg-slate-900 border border-slate-700/80 text-white hover:border-slate-600 focus:border-indigo-500'
                                      }`}
                                    />
                                    <span className="text-[10px] text-slate-500">đ</span>
                                  </div>
                                </td>
                              );
                            })}

                            {/* Xem biến động giá */}
                            <td className="py-2.5 px-4 text-center">
                              <button
                                type="button"
                                onClick={() => {
                                  setTrackedDevId(device.nodeId);
                                  setActiveMainTab('fluctuations');
                                }}
                                className="text-[11px] text-emerald-400 hover:text-emerald-300 bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-800/50 px-2.5 py-1 rounded-lg transition-colors font-semibold flex items-center justify-center gap-1 mx-auto"
                                title="Theo dõi chi tiết lịch sử biến động giá của thiết bị này"
                              >
                                <TrendingUp className="w-3.5 h-3.5" />
                                <span>Xem biến động</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: 📈 THEO DÕI TÌNH HÌNH BIẾN ĐỘNG GIÁ THIẾT BỊ */}
        {activeMainTab === 'fluctuations' && selectedTrackedDev && (
          <div className="flex-1 overflow-auto p-5 space-y-6">
            {/* Bộ chọn Loại Đối Tượng & Thiết bị cần theo dõi */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-2.5">
                {/* 1. Lọc Loại Đối Tượng */}
                <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700/80 px-3 py-1.5 rounded-xl">
                  <Layers className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                  <span className="text-slate-300 font-semibold whitespace-nowrap">Loại đối tượng:</span>
                  <select
                    value={selectedTypeId}
                    onChange={(e) => setSelectedTypeId(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
                    className="bg-transparent text-white font-bold outline-none text-xs cursor-pointer max-w-[200px]"
                  >
                    <option value="ALL" className="bg-slate-900 text-white">
                      -- Tất cả loại ({nodes.filter(n => !n.isShared && n.typeId >= 4).length}) --
                    </option>
                    {availableObjectTypes.map((ot) => {
                      const count = nodes.filter(n => !n.isShared && n.typeId === ot.typeId).length;
                      return (
                        <option key={ot.typeId} value={ot.typeId} className="bg-slate-900 text-white">
                          {ot.typeName} ({count})
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* 2. Chọn Thiết Bị Cụ Thể (Đã lọc theo loại và sắp xếp A-Z theo tên) */}
                <div className="flex items-center gap-1.5 bg-slate-900 border border-indigo-500/40 px-3 py-1.5 rounded-xl">
                  <Cpu className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                  <span className="text-slate-300 font-semibold whitespace-nowrap">Thiết bị (A-Z):</span>
                  <select
                    value={trackedDevId}
                    onChange={(e) => {
                      const devId = Number(e.target.value);
                      setTrackedDevId(devId);
                      const dev = nodes.find(n => n.nodeId === devId);
                      if (dev) {
                        setAdjustNewPrice(dev.monthlyRentalPrice || 82000);
                      }
                    }}
                    className="bg-transparent text-white font-bold outline-none text-xs cursor-pointer max-w-xs"
                  >
                    {roomDevices.map(d => (
                      <option key={d.nodeId} value={d.nodeId} className="bg-slate-900 text-white">
                        {d.nodeName} ({d.nodeCode}) - {getRoomName(d)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="hidden sm:flex items-center gap-1 text-[11px] text-slate-400 bg-slate-900/60 px-2.5 py-1 rounded-lg border border-slate-800">
                  <ArrowUpDown className="w-3 h-3 text-indigo-400" />
                  <span>Xếp tên A-Z ({roomDevices.length} thiết bị)</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-slate-400">
                <Clock className="w-4 h-4 text-indigo-400" />
                <span>Số mốc điều chỉnh đã ghi nhận: <strong className="text-white">{priceHistoryList.length}</strong> lần</span>
              </div>
            </div>

            {/* Thẻ Tóm Tắt Thiết Bị Đang Chọn & Minh Họa Thực Tế */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950/60 to-slate-900 border border-indigo-500/30 flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-2xl overflow-hidden border border-slate-700 bg-slate-950 flex-shrink-0">
                  <img src={getDevicePhotoUrl(selectedTrackedDev)} alt={selectedTrackedDev.nodeName} className="w-full h-full object-cover" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] text-indigo-300 font-semibold">{getRoomName(selectedTrackedDev)} • {getBuildingName(selectedTrackedDev)}</div>
                  <h4 className="font-bold text-white text-sm truncate">{selectedTrackedDev.nodeName}</h4>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">Mã: {selectedTrackedDev.nodeCode}</div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-slate-400 text-xs">Mức giá thuê ban đầu (khi khách thuê thêm):</span>
                <div className="text-2xl font-bold font-mono text-white">
                  {(priceHistoryList[0]?.newPrice || selectedTrackedDev.monthlyRentalPrice || 70000).toLocaleString('vi-VN')} đ/tháng
                </div>
                <div className="text-[11px] text-slate-500">
                  Áp dụng từ tháng: {priceHistoryList[0]?.effectiveMonthYear || '08/2026'}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-emerald-500/40 space-y-1">
                <span className="text-emerald-300 text-xs font-semibold">Mức giá thuê sau điều chỉnh (Năm sau):</span>
                <div className="text-2xl font-bold font-mono text-emerald-400">
                  {(priceHistoryList[priceHistoryList.length - 1]?.newPrice || selectedTrackedDev.monthlyRentalPrice || 82000).toLocaleString('vi-VN')} đ/tháng
                </div>
                <div className="text-[11px] text-emerald-300 font-medium">
                  {priceHistoryList.length > 1 && priceHistoryList[priceHistoryList.length - 1].oldPrice ? (
                    <span>
                      ✓ Tăng +{((priceHistoryList[priceHistoryList.length - 1].newPrice - (priceHistoryList[priceHistoryList.length - 1].oldPrice || 0))).toLocaleString('vi-VN')} đ ({(((priceHistoryList[priceHistoryList.length - 1].newPrice - (priceHistoryList[priceHistoryList.length - 1].oldPrice || 0)) / (priceHistoryList[priceHistoryList.length - 1].oldPrice || 1)) * 100).toFixed(1)}%)
                    </span>
                  ) : (
                    <span>✓ Mức giá chuẩn định kỳ</span>
                  )}
                </div>
              </div>
            </div>

            {/* Dòng Thời Gian Biến Động Giá (Visual Timeline Chart) */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-indigo-400" />
                  Dòng Thời Gian Biến Động Giá Thuê Theo Năm &amp; Tháng
                </h4>
                <span className="text-xs text-slate-400">
                  Hệ thống tự động lưu vết mọi lần điều chỉnh giá để bạn theo dõi
                </span>
              </div>

              {/* Đường biến động trực quan */}
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/80">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                  {priceHistoryList.map((rec, index) => {
                    const isIncrease = rec.oldPrice !== undefined && rec.newPrice > rec.oldPrice;
                    const isFirst = index === 0;

                    return (
                      <React.Fragment key={rec.recordId}>
                        <div className="flex-1 bg-slate-950 p-4 rounded-2xl border border-slate-800 relative group hover:border-indigo-500 transition-all">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-bold text-indigo-300 bg-indigo-950 px-2 py-0.5 rounded-lg border border-indigo-800">
                              Mốc {index + 1}: Tháng {rec.effectiveMonthYear}
                            </span>
                            <span className="text-[10px] text-slate-500">{formatDateVN(rec.changedAt)}</span>
                          </div>

                          <div className="text-xl font-bold font-mono text-emerald-400">
                            {rec.newPrice.toLocaleString('vi-VN')} đ/tháng
                          </div>

                          {!isFirst && rec.oldPrice !== undefined && (
                            <div className="text-[11px] text-amber-300 font-medium mt-1 flex items-center gap-1">
                              <span>Giá cũ: {rec.oldPrice.toLocaleString('vi-VN')} đ</span>
                              <span className="text-emerald-400 font-bold">
                                (+{(rec.newPrice - rec.oldPrice).toLocaleString('vi-VN')} đ)
                              </span>
                            </div>
                          )}

                          {isFirst && (
                            <div className="text-[11px] text-slate-400 mt-1">
                              Giá thuê ban đầu khi khách nhận thiết bị
                            </div>
                          )}

                          <div className="text-xs text-slate-300 mt-2 bg-slate-900/70 p-2 rounded-xl border border-slate-800">
                            <strong>Ghi chú:</strong> {rec.reason || 'Điều chỉnh giá thuê theo thỏa thuận'}
                          </div>

                          <div className="text-[10px] text-slate-500 mt-1">
                            Người cập nhật: {rec.changedByName || 'Quản lý'}
                          </div>
                        </div>

                        {index < priceHistoryList.length - 1 && (
                          <div className="hidden sm:flex flex-col items-center justify-center px-2 text-indigo-400">
                            <ArrowRight className="w-6 h-6 animate-pulse" />
                            <span className="text-[10px] text-indigo-300 font-bold mt-1">Điều chỉnh</span>
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Form Thực Hiện Điều Chỉnh Giá Mới Cho Thiết Bị Này */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/40 border border-indigo-500/30 space-y-4">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <PlusCircle className="w-4 h-4 text-emerald-400" />
                <span>Thực Hiện Điều Chỉnh Giá Thuê Mới Cho Thiết Bị Này</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Ví dụ: Năm sau muốn điều chỉnh giá thuê cục phát WiFi này từ <strong>70.000 đ</strong> lên <strong>82.000 đ/tháng</strong> (áp dụng từ tháng 01/2027), bạn chỉ cần nhập thông tin bên dưới và bấm xác nhận:
              </p>

              <form onSubmit={handleExecutePriceAdjustment} className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Tháng Bắt Đầu Áp Dụng Giá Mới:
                  </label>
                  <input
                    type="text"
                    value={adjustEffectiveMonth}
                    onChange={(e) => setAdjustEffectiveMonth(e.target.value)}
                    placeholder="VD: 01/2027"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono font-bold outline-none focus:border-indigo-500"
                    required
                  />
                  <span className="text-[10px] text-slate-400">Định dạng MM/YYYY (Ví dụ: 01/2027)</span>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Mức Giá Thuê Điều Chỉnh Mới:
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      step="1000"
                      min="0"
                      value={adjustNewPrice}
                      onChange={(e) => setAdjustNewPrice(Number(e.target.value))}
                      placeholder="VD: 82000"
                      className="w-full bg-slate-950 border border-emerald-500/50 rounded-xl px-3 py-2 text-emerald-400 font-mono font-bold outline-none focus:border-emerald-400 text-sm"
                      required
                    />
                    <span className="text-slate-400 font-semibold whitespace-nowrap">đ / tháng</span>
                  </div>
                  <span className="text-[10px] text-slate-400">Ví dụ: 82000 đ/tháng</span>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Lý Do / Căn Cứ Điều Chỉnh:
                  </label>
                  <input
                    type="text"
                    value={adjustReason}
                    onChange={(e) => setAdjustReason(e.target.value)}
                    placeholder="VD: Điều chỉnh trượt giá năm 2027, nâng gói cước..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-indigo-500"
                  />
                  <span className="text-[10px] text-slate-400">Lưu vào lịch sử theo dõi biến động</span>
                </div>

                <div className="sm:col-span-3 flex justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition-all active:scale-95"
                  >
                    <Save className="w-4 h-4" />
                    <span>Xác Nhận Điều Chỉnh Giá &amp; Lưu Lịch Sử Biến Động</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* TAB 3: THỐNG KÊ TÍNH VÀO HÓA ĐƠN KHÁCH HÀNG THÁNG */}
        {activeMainTab === 'invoiceRevenue' && (
          <div className="flex-1 overflow-auto p-5 space-y-5 text-xs">
            <div className="p-4 rounded-2xl bg-blue-950/40 border border-blue-900/40 flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-white text-sm">
                  Cơ chế thống kê và cộng dồn tiền thuê thiết bị vào hóa đơn từng tháng
                </h4>
                <p className="text-slate-300 leading-relaxed mt-1 text-[11px]">
                  Hóa đơn hàng tháng của khách thuê sẽ tự động lấy đơn giá thiết bị theo đúng bảng giá của tháng đó. Ví dụ: Cục phát WiFi tháng 09/2026 tính <strong>70.000 đ</strong>, nhưng sang tháng 01/2027 khi chủ trọ đã điều chỉnh giá lên <strong>82.000 đ</strong>, hóa đơn tháng 01/2027 sẽ tự động tính đúng <strong>82.000 đ</strong> và cộng dồn vào tổng tiền hóa đơn!
                </p>
              </div>
            </div>

            {/* Bảng đối soát từng hóa đơn theo tháng */}
            <div className="border border-slate-800 rounded-2xl overflow-hidden shadow-inner bg-slate-950/60">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-slate-300 border-b border-slate-800 uppercase tracking-wider text-[11px] font-semibold">
                    <th className="py-3 px-4">Kỳ Hóa Đơn</th>
                    <th className="py-3 px-4">Phòng Thuê</th>
                    <th className="py-3 px-4">Tiền Thuê Thiết Bị Phòng</th>
                    <th className="py-3 px-4">Chi Tiết Thiết Bị Thuê</th>
                    <th className="py-3 px-4 text-right">Tổng Tiền Hóa Đơn</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {invoices.map((inv) => (
                    <tr key={inv.invoiceId} className="hover:bg-slate-900/50 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-indigo-300 bg-indigo-950/60 px-2 py-1 rounded-lg border border-indigo-800">
                          Tháng {inv.monthYear}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-white">
                        {inv.roomName}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-emerald-400 text-sm">
                          {(inv.roomDeviceRentalCost || 0).toLocaleString('vi-VN')} đ
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          {(inv.deviceBreakdown || []).map((dev, idx) => (
                            <div key={idx} className="flex items-center gap-1.5 text-[11px]">
                              <span className="text-slate-300">• {dev.deviceName}:</span>
                              <span className="font-mono font-bold text-emerald-300">
                                {dev.monthlyPrice.toLocaleString('vi-VN')} đ
                              </span>
                              {dev.deviceName.toLowerCase().includes('wifi') && (
                                <span className={`text-[9px] px-1 py-0.2 rounded font-semibold ${
                                  dev.monthlyPrice >= 82000 ? 'bg-amber-950 text-amber-300 border border-amber-800' : 'bg-blue-950 text-blue-300 border border-blue-800'
                                }`}>
                                  {dev.monthlyPrice >= 82000 ? 'Giá đã điều chỉnh (82k)' : 'Giá ban đầu (70k)'}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="font-mono font-bold text-white text-sm">
                          {inv.totalAmount.toLocaleString('vi-VN')} đ
                        </span>
                        <div className="text-[10px] text-slate-500">
                          Đã bao gồm tiền phòng, điện nước &amp; thiết bị
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Footer tổng kết & Nút hành động */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4 text-slate-300">
            <div className="flex items-center gap-1.5">
              <Calculator className="w-4 h-4 text-indigo-400" />
              <span>
                Tổng tiền thuê thiết bị phòng trong <strong>Tháng {selectedActiveMonth}</strong>:
              </span>
              <span className="font-mono text-base font-bold text-indigo-300">
                {totalMonthlyCostCurrentMonth.toLocaleString('vi-VN')} đ
              </span>
            </div>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">
              Số thiết bị trang bị theo phòng: <strong className="text-white">{roomDevices.length}</strong> thiết bị
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            {onRecalculateInvoicesForMonth && (
              <button
                type="button"
                onClick={() => {
                  onRecalculateInvoicesForMonth(selectedActiveMonth);
                  setSaveSuccessMsg(`Đã đồng bộ và tính lại toàn bộ hóa đơn Tháng ${selectedActiveMonth} theo bảng giá thiết bị!`);
                  setTimeout(() => setSaveSuccessMsg(null), 3500);
                }}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold flex items-center gap-1.5 transition-colors"
                title="Tính lại tiền thuê thiết bị phòng cho các hóa đơn tháng này"
              >
                <Calculator className="w-3.5 h-3.5 text-cyan-400" />
                <span>Tính Lại Hóa Đơn Tháng {selectedActiveMonth}</span>
              </button>
            )}

            {activeMainTab === 'schedule' && (
              <button
                type="button"
                onClick={handleSaveAllChanges}
                disabled={Object.keys(localPriceChanges).length === 0}
                className={`px-5 py-2 rounded-xl font-bold transition-all shadow flex items-center gap-1.5 ${
                  Object.keys(localPriceChanges).length > 0
                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer active:scale-95'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                <Save className="w-4 h-4" />
                <span>Lưu Bảng Giá ({Object.keys(localPriceChanges).length})</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
