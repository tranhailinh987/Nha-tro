import React, { useState, useEffect } from 'react';
import { 
  X, 
  MapPin, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  Calendar, 
  Sparkles, 
  Info,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Camera
} from 'lucide-react';
import { ManagementNode } from '../types/rental';
import { formatDateVN } from '../utils/dateUtils';

export interface DeviceGalleryPhoto {
  url: string;
  title: string;
}

interface DevicePhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  device?: ManagementNode | null;
  deviceNode?: ManagementNode | null;
  buildingName?: string;
  roomName?: string;
  onUpdateNode?: (nodeId: number, updates: Partial<ManagementNode>) => void;
}

export const getDevicePhotoGallery = (node?: ManagementNode | null): DeviceGalleryPhoto[] => {
  if (!node) {
    return [
      {
        url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=900&auto=format&fit=crop&q=80',
        title: 'Thiết bị kỹ thuật tiêu chuẩn'
      }
    ];
  }

  if (node.imageUrl) {
    return [
      { url: node.imageUrl, title: 'Ảnh thực tế chụp tại phòng' },
      { url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=900&auto=format&fit=crop&q=80', title: 'Thông số kỹ thuật' }
    ];
  }

  const name = node.nodeName.toLowerCase();
  const cat = node.deviceCategory?.toLowerCase() || '';

  // Điều hòa
  if (cat.includes('air') || name.includes('điều hòa') || name.includes('máy lạnh') || node.typeId === 11) {
    return [
      {
        url: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=900&auto=format&fit=crop&q=80',
        title: 'Mặt trước điều hòa lắp tại phòng'
      },
      {
        url: 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=900&auto=format&fit=crop&q=80',
        title: 'Điều khiển từ xa & cánh đảo gió'
      },
      {
        url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=900&auto=format&fit=crop&q=80',
        title: 'Cục nóng bảo dưỡng định kỳ bên ngoài'
      }
    ];
  }

  // Tủ lạnh
  if (cat.includes('fridge') || name.includes('tủ lạnh') || node.typeId === 12) {
    return [
      {
        url: 'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=900&auto=format&fit=crop&q=80',
        title: 'Mặt trước tủ lạnh tại góc bếp'
      },
      {
        url: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=900&auto=format&fit=crop&q=80',
        title: 'Ngăn mát & ngăn đá sạch sẽ khử mùi'
      }
    ];
  }

  // Máy giặt
  if (cat.includes('washing') || name.includes('máy giặt') || node.typeId === 4) {
    return [
      {
        url: 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=900&auto=format&fit=crop&q=80',
        title: 'Máy giặt cửa trước lồng ngang hiện đại'
      },
      {
        url: 'https://images.unsplash.com/photo-1545173168-9f1947eebb7f?w=900&auto=format&fit=crop&q=80',
        title: 'Khu vực ban công giặt phơi thoáng khí'
      }
    ];
  }

  // Bình nước nóng
  if (cat.includes('heater') || name.includes('nước nóng') || name.includes('bình nóng') || node.typeId === 13) {
    return [
      {
        url: 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=900&auto=format&fit=crop&q=80',
        title: 'Bình nước nóng chống giật ELCB lắp trong WC'
      },
      {
        url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=900&auto=format&fit=crop&q=80',
        title: 'Phòng tắm vòi sen & áp lực nước mạnh'
      }
    ];
  }

  // Cổng thông minh / khóa vân tay
  if (cat.includes('gate') || name.includes('cổng') || name.includes('vân tay') || name.includes('an ninh') || node.typeId === 8) {
    return [
      {
        url: 'https://images.unsplash.com/photo-1558002038-1055907df827?w=900&auto=format&fit=crop&q=80',
        title: 'Khóa vân tay cảm ứng & chốt điện tự động'
      },
      {
        url: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=900&auto=format&fit=crop&q=80',
        title: 'Cổng ra vào tòa nhà kiểm soát an ninh'
      }
    ];
  }

  // Trạm sạc xe điện
  if (cat.includes('charger') || name.includes('sạc') || node.typeId === 5) {
    return [
      {
        url: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=900&auto=format&fit=crop&q=80',
        title: 'Trụ sạc xe máy điện thông minh ngắt tự động'
      }
    ];
  }

  // Công tơ điện thông minh
  if (cat.includes('power') || name.includes('công tơ') || name.includes('điện') || node.typeId === 9) {
    return [
      {
        url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=900&auto=format&fit=crop&q=80',
        title: 'Mặt đồng hồ công tơ điện tử WiFi PVEIC'
      },
      {
        url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=900&auto=format&fit=crop&q=80',
        title: 'Tủ điện an toàn Aptomat chống rò'
      }
    ];
  }

  // Cục phát WiFi / Router
  if (cat.includes('wifi') || name.includes('wifi') || name.includes('router') || name.includes('phát wifi') || node.typeId === 14) {
    return [
      {
        url: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=900&auto=format&fit=crop&q=80',
        title: 'Cục phát WiFi tốc độ cao lắp tại phòng'
      },
      {
        url: 'https://images.unsplash.com/photo-1562774053-701939374585?w=900&auto=format&fit=crop&q=80',
        title: 'Cổng cắm mạng LAN Gigabit & Đèn tín hiệu'
      }
    ];
  }

  // Đồng hồ nước
  if (cat.includes('water') || name.includes('nước') || node.typeId === 10) {
    return [
      {
        url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=900&auto=format&fit=crop&q=80',
        title: 'Đồng hồ nước kiểm định chì niêm phong'
      }
    ];
  }

  return [
    {
      url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=900&auto=format&fit=crop&q=80',
      title: 'Thiết bị kỹ thuật bàn giao'
    }
  ];
};

export const getDevicePhotoUrl = (node?: ManagementNode | null): string => {
  const gallery = getDevicePhotoGallery(node);
  return gallery[0]?.url || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80';
};

export const getDeviceCategoryIcon = (node?: ManagementNode | null): string => {
  if (!node) return '⏱️';
  const name = node.nodeName.toLowerCase();
  if (node.typeId === 14 || node.deviceCategory === 'WIFI_ROUTER' || name.includes('wifi') || name.includes('router') || name.includes('phát wifi')) return '📶';
  if (node.typeId === 11 || node.deviceCategory === 'AIR_COND') return '❄️';
  if (node.typeId === 12 || node.deviceCategory === 'FRIDGE') return '🧊';
  if (node.typeId === 13 || node.deviceCategory === 'WATER_HEATER') return '♨️';
  if (node.typeId === 4 || node.deviceCategory === 'WASHING_MACHINE') return '🧺';
  if (node.typeId === 8 || node.deviceCategory === 'SECURITY_GATE') return '🚪';
  if (node.typeId === 5 || node.deviceCategory === 'EV_CHARGER') return '⚡';
  if (node.typeId === 9) return '⚡';
  if (node.typeId === 10) return '💧';
  return '⏱️';
};

export const DevicePhotoModal: React.FC<DevicePhotoModalProps> = ({
  isOpen,
  onClose,
  device: propDevice,
  deviceNode,
  buildingName,
  roomName,
  onUpdateNode
}) => {
  const device = propDevice || deviceNode;
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [isEditingPrice, setIsEditingPrice] = useState(false);
  const [editPriceInput, setEditPriceInput] = useState<number>(0);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Xác định đơn giá theo tháng thực tế của thiết bị:
  const isShared = device?.isShared === true;
  const calculatedMonthlyPrice = (() => {
    if (!device) return 0;
    if (device.monthlyRentalPrice !== undefined && Number(device.monthlyRentalPrice) > 0) {
      return Number(device.monthlyRentalPrice);
    }
    if (!isShared && device.unitPrice !== undefined && Number(device.unitPrice) > 0) {
      return Number(device.unitPrice);
    }
    if (device.monthlyPriceSchedule) {
      const scheduleVals = Object.values(device.monthlyPriceSchedule).map(Number).filter(v => v > 0);
      if (scheduleVals.length > 0) {
        return scheduleVals[scheduleVals.length - 1];
      }
    }
    if (device.priceCatalog && device.priceCatalog.length > 0) {
      const catEntry = device.priceCatalog.find(c => Number(c.monthlyRentalPrice) > 0);
      if (catEntry) return Number(catEntry.monthlyRentalPrice);
    }
    if (device.priceHistory && device.priceHistory.length > 0) {
      const histEntry = device.priceHistory.find(h => Number(h.newPrice) > 0);
      if (histEntry) return Number(histEntry.newPrice);
    }
    return 0;
  })();

  const isFreeDevice = calculatedMonthlyPrice === 0;

  // Reset state when device changes or modal opens
  useEffect(() => {
    setActivePhotoIdx(0);
    setIsEditingPrice(false);
    setSaveSuccessMsg(null);
    setEditPriceInput(calculatedMonthlyPrice);
  }, [device?.nodeId, isOpen]);

  if (!isOpen || !device) return null;

  const gallery = getDevicePhotoGallery(device);
  const currentPhoto = gallery[activePhotoIdx] || gallery[0];
  const icon = getDeviceCategoryIcon(device);

  const handleSavePrice = () => {
    if (!onUpdateNode) return;
    const newPrice = Math.max(0, Number(editPriceInput) || 0);
    onUpdateNode(device.nodeId, {
      monthlyRentalPrice: isShared ? 0 : newPrice,
      unitPrice: newPrice,
      monthlyPriceSchedule: !isShared && newPrice > 0 ? {
        '08/2026': newPrice,
        '09/2026': newPrice,
        '10/2026': newPrice,
        '11/2026': newPrice,
        '12/2026': newPrice,
        '01/2027': newPrice
      } : {}
    });
    // Cập nhật thuộc tính của device object hiện tại để phản ánh ngay lập tức
    if (!isShared) {
      device.monthlyRentalPrice = newPrice;
      device.unitPrice = newPrice;
    } else {
      device.unitPrice = newPrice;
    }
    setIsEditingPrice(false);
    setSaveSuccessMsg(`Đã cập nhật giá mới: ${newPrice > 0 ? `${newPrice.toLocaleString('vi-VN')} đ/${isShared ? 'lượt' : 'tháng'}` : 'Miễn phí đi kèm phòng'}`);
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  const handlePrevPhoto = () => {
    setActivePhotoIdx((prev) => (prev > 0 ? prev - 1 : gallery.length - 1));
  };

  const handleNextPhoto = () => {
    setActivePhotoIdx((prev) => (prev < gallery.length - 1 ? prev + 1 : 0));
  };

  return (
    <div 
      className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 z-50 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
        
        {/* Header với nút đóng */}
        <div className="p-4 px-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-3">
            <span className="text-2xl p-2 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm flex items-center justify-center">
              {icon}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-base leading-tight">
                  {device.nodeName}
                </h3>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5 flex items-center gap-1.5">
                <span>Mã thiết bị: <strong>[{device.nodeCode}]</strong></span>
                {roomName && (
                  <span className="text-blue-400 font-sans">• Đi cùng {roomName}</span>
                )}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
            title="Đóng cửa sổ ảnh"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nội dung chính: Ảnh thực tế & Thông số */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          
          {/* Khung ảnh thực tế chất lượng cao */}
          <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 aspect-[16/10] sm:aspect-video shadow-2xl group">
            <img
              src={currentPhoto.url}
              alt={currentPhoto.title || device.nodeName}
              className="w-full h-full object-cover object-center transition-all duration-300 group-hover:scale-105"
            />
            
            {/* Lớp bóng đổ overlay để đọc chữ */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

            {/* Tag nhãn trên ảnh */}
            <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border shadow-lg backdrop-blur-md ${
                isShared 
                  ? 'bg-purple-950/90 text-purple-200 border-purple-600/80' 
                  : 'bg-emerald-950/90 text-emerald-200 border-emerald-600/80'
              }`}>
                {isShared ? '🏢 Thiết Bị Dùng Chung Tòa Nhà' : `🏠 Trang Bị Đi Cùng Phòng ${roomName || ''}`}
              </span>

              <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border backdrop-blur-md shadow-lg ${
                device.currentCondition === 0
                  ? 'bg-slate-950/85 text-emerald-400 border-emerald-600/80'
                  : 'bg-rose-950/85 text-rose-300 border-rose-600/80'
              }`}>
                {device.currentCondition === 0 ? '✓ Đang hoạt động hoàn hảo' : '⚠️ Đang bảo dưỡng / vệ sinh'}
              </span>
            </div>

            {/* Nút lướt ảnh nếu có nhiều ảnh */}
            {gallery.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrevPhoto}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-all backdrop-blur-sm z-10"
                  title="Ảnh trước"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={handleNextPhoto}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-all backdrop-blur-sm z-10"
                  title="Ảnh tiếp"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            {/* Caption ảnh */}
            <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-[11px] text-slate-200 font-medium z-10">
              <span className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg">
                <Camera className="w-3.5 h-3.5 text-blue-400" />
                {currentPhoto.title}
              </span>
              {gallery.length > 1 && (
                <span className="bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-md text-[10px] font-mono text-slate-300">
                  {activePhotoIdx + 1}/{gallery.length} ảnh
                </span>
              )}
            </div>
          </div>

          {/* Dải thumbnail xem nhiều góc ảnh chụp */}
          {gallery.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {gallery.map((photo, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActivePhotoIdx(idx)}
                  className={`relative rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 w-20 h-14 ${
                    activePhotoIdx === idx 
                      ? 'border-blue-500 scale-105 shadow-md shadow-blue-500/30 ring-2 ring-blue-500/40' 
                      : 'border-slate-800 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={photo.url} alt={photo.title} className="w-full h-full object-cover" />
                  <span className="absolute bottom-0 inset-x-0 bg-black/70 text-[9px] text-white truncate px-1 py-0.5 text-center">
                    Góc {idx + 1}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Bảng chi tiết thông số kỹ thuật & vị trí */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5 text-xs">
            <div className="flex items-center justify-between text-slate-300">
              <span className="text-slate-400 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                Vị trí lắp đặt:
              </span>
              <strong className="text-white">
                {device.addressOrLocation || (isShared ? 'Khu vực công cộng tòa nhà' : `Trong phòng ${roomName || ''}`)}
              </strong>
            </div>

            {buildingName && (
              <div className="flex items-center justify-between text-slate-300 pt-1.5 border-t border-slate-900">
                <span className="text-slate-400">Trực thuộc tòa nhà:</span>
                <span className="text-blue-300 font-semibold">{buildingName}</span>
              </div>
            )}

            {device.serialNumber && (
              <div className="flex items-center justify-between text-slate-300 pt-1.5 border-t border-slate-900">
                <span className="text-slate-400">Số Serial / Model:</span>
                <span className="font-mono text-slate-200">{device.serialNumber}</span>
              </div>
            )}

            {device.warrantyExpiryDate && (
              <div className="flex items-center justify-between text-slate-300 pt-1.5 border-t border-slate-900">
                <span className="text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-cyan-400" />
                  Hạn bảo hành chính hãng:
                </span>
                <span className="font-mono text-cyan-300 font-semibold">{formatDateVN(device.warrantyExpiryDate)}</span>
              </div>
            )}

            {/* Phân loại 2 hình thức tính phí: Dùng chung (theo lượt) vs Trang bị phòng (theo tháng) */}
            <div className="pt-2 border-t border-slate-900 space-y-1.5">
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-400">Hình thức tính phí:</span>
                <span className={`font-semibold px-2 py-0.5 rounded text-[11px] ${
                  isShared 
                    ? 'bg-purple-950 text-purple-300 border border-purple-800' 
                    : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                }`}>
                  {isShared ? '🏢 Dùng chung: Tính theo LƯỢT DÙNG' : '🏠 Theo phòng: Tính tiền thuê THEO THÁNG'}
                </span>
              </div>

              {isShared ? (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-400">Đơn giá sử dụng:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-purple-400 font-bold text-sm bg-purple-950/60 border border-purple-800/80 px-2.5 py-1 rounded-lg">
                        {(device.unitPrice || 0) > 0 ? `${(device.unitPrice || 0).toLocaleString('vi-VN')} đ/lượt` : 'Miễn phí (0 đ)'}
                      </span>
                      {onUpdateNode && !isEditingPrice && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditPriceInput(device.unitPrice || 0);
                            setIsEditingPrice(true);
                          }}
                          className="text-[11px] px-2 py-1 rounded-lg bg-purple-950 text-purple-300 border border-purple-700/60 hover:bg-purple-900 hover:text-white transition-all font-semibold"
                        >
                          Sửa giá
                        </button>
                      )}
                    </div>
                  </div>

                  {isEditingPrice && (
                    <div className="p-3 rounded-xl bg-slate-900 border border-purple-500/50 space-y-2 mt-1 animate-in fade-in">
                      <div className="text-[11px] font-semibold text-slate-200 flex justify-between">
                        <span>Cài đặt lại đơn giá theo lượt dùng:</span>
                        <span className="text-slate-400">(Nhập 0 để đặt Miễn phí)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step={1000}
                          min={0}
                          value={editPriceInput}
                          onChange={(e) => setEditPriceInput(Number(e.target.value))}
                          placeholder="VD: 15000"
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-purple-300 font-mono font-bold text-xs outline-none focus:border-purple-500"
                        />
                        <span className="text-xs text-slate-400 whitespace-nowrap">đ/lượt</span>
                        <button
                          type="button"
                          onClick={handleSavePrice}
                          className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs whitespace-nowrap shadow"
                        >
                          Lưu Giá
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsEditingPrice(false)}
                          className="px-2 py-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white text-xs whitespace-nowrap"
                        >
                          Hủy
                        </button>
                      </div>
                    </div>
                  )}

                  {saveSuccessMsg && (
                    <div className="text-[11px] text-purple-300 font-semibold bg-purple-950/60 border border-purple-800/80 px-2.5 py-1 rounded-lg animate-in fade-in">
                      ✓ {saveSuccessMsg}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-400">Giá thuê theo tháng:</span>
                    <div className="flex items-center gap-2">
                      {isFreeDevice ? (
                        <span className="font-mono text-slate-300 font-bold text-sm bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg">
                          Miễn phí đi kèm phòng (0 đ)
                        </span>
                      ) : (
                        <span className="font-mono text-emerald-400 font-bold text-sm bg-emerald-950/70 border border-emerald-800/80 px-2.5 py-1 rounded-lg flex items-center gap-1">
                          {calculatedMonthlyPrice.toLocaleString('vi-VN')} đ/tháng
                        </span>
                      )}

                      {onUpdateNode && !isEditingPrice && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditPriceInput(calculatedMonthlyPrice);
                            setIsEditingPrice(true);
                          }}
                          className="text-[11px] px-2 py-1 rounded-lg bg-emerald-950 text-emerald-300 border border-emerald-700/60 hover:bg-emerald-900 hover:text-white transition-all font-semibold"
                        >
                          Sửa giá
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Form sửa giá nhanh nếu quản lý hoặc admin bấm sửa */}
                  {isEditingPrice && (
                    <div className="p-3 rounded-xl bg-slate-900 border border-emerald-500/50 space-y-2 mt-1 animate-in fade-in">
                      <div className="text-[11px] font-semibold text-slate-200 flex justify-between">
                        <span>Cài đặt lại đơn giá thuê thiết bị phòng:</span>
                        <span className="text-slate-400">(Nhập 0 để đặt Miễn phí đi kèm phòng)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step={1000}
                          min={0}
                          value={editPriceInput}
                          onChange={(e) => setEditPriceInput(Number(e.target.value))}
                          placeholder="VD: 120000 hoặc 0"
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-emerald-400 font-mono font-bold text-xs outline-none focus:border-emerald-500"
                        />
                        <span className="text-xs text-slate-400 whitespace-nowrap">đ/tháng</span>
                        <button
                          type="button"
                          onClick={handleSavePrice}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs whitespace-nowrap shadow"
                        >
                          Lưu Giá
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsEditingPrice(false)}
                          className="px-2 py-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white text-xs whitespace-nowrap"
                        >
                          Hủy
                        </button>
                      </div>
                    </div>
                  )}

                  {saveSuccessMsg && (
                    <div className="text-[11px] text-emerald-400 font-semibold bg-emerald-950/60 border border-emerald-800/80 px-2.5 py-1 rounded-lg animate-in fade-in">
                      ✓ {saveSuccessMsg}
                    </div>
                  )}

                  {/* Bảng giá của thiết bị theo từng tháng */}
                  {device.monthlyPriceSchedule && Object.keys(device.monthlyPriceSchedule).length > 0 && (
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1 mt-1">
                      <div className="text-[10px] text-slate-400 font-semibold flex items-center justify-between">
                        <span>📅 Bảng giá thiết bị theo từng tháng:</span>
                        <span className="text-emerald-400">Áp dụng tính hóa đơn</span>
                      </div>
                      <div className="grid grid-cols-2 gap-1 text-[11px]">
                        {Object.entries(device.monthlyPriceSchedule).map(([mYear, pVal]) => (
                          <div key={mYear} className="flex justify-between items-center bg-slate-950 px-2 py-1 rounded border border-slate-800 font-mono">
                            <span className="text-slate-400">Tháng {mYear}:</span>
                            <strong className="text-emerald-400">{Number(pVal).toLocaleString('vi-VN')} đ</strong>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Ghi chú bảo dưỡng & Bàn giao khi nhận phòng */}
          <div className="p-3.5 rounded-xl bg-blue-950/30 border border-blue-500/20 text-blue-200 text-xs flex items-start gap-2.5">
            <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-0.5 leading-relaxed text-[11px]">
              <span className="font-bold text-white">Cam kết bàn giao thực tế:</span>
              <p className="text-slate-300">
                {isShared
                  ? 'Thiết bị công cộng dùng chung được bảo trì, vệ sinh định kỳ hàng tuần bởi ban quản lý tòa nhà.'
                  : `Thiết bị đi cùng phòng ${roomName || ''} được kiểm định kỹ thuật 100% trước khi bàn giao. Khách xem phòng có thể yên tâm về chất lượng; khi nhận phòng nếu có bất kỳ vấn đề gì, bạn chỉ cần bấm "Báo hỏng" trên app để được thợ đến xử lý miễn phí.`}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Trang thiết bị chuẩn căn hộ dịch vụ cao cấp
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-all shadow-md shadow-blue-600/30 active:scale-95"
          >
            Đóng Xem Ảnh
          </button>
        </div>

      </div>
    </div>
  );
};
