import React, { useState } from 'react';
import { 
  Building2, 
  MapPin, 
  Layers, 
  Users, 
  ShieldCheck, 
  Plus, 
  CheckCircle2, 
  Zap, 
  DoorClosed,
  KeyRound,
  Upload,
  Camera,
  X,
  Droplets,
  Sparkles,
  FileCheck
} from 'lucide-react';
import { User } from '../types/rental';

interface AddBuildingModalProps {
  isOpen: boolean;
  onClose: () => void;
  managers: User[];
  currentUser?: User | null;
  onAddBuilding: (buildingData: {
    code: string;
    name: string;
    address: string;
    managerUserId: number;
    floors: number;
    hasSharedWashing: boolean;
    hasEvCharger: boolean;
    hasSmartGate: boolean;
    autoCreateSampleRooms?: boolean;
    imageUrl?: string;
    electricRate?: number;
    waterRate?: number;
    sanitationFeePerPerson?: number;
    residenceFeePerPerson?: number;
  }) => void;
}

export const AddBuildingModal: React.FC<AddBuildingModalProps> = ({
  isOpen,
  onClose,
  managers,
  currentUser,
  onAddBuilding
}) => {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [electricRate, setElectricRate] = useState<number>(3800);
  const [waterRate, setWaterRate] = useState<number>(30000);
  const [sanitationFeePerPerson, setSanitationFeePerPerson] = useState<number>(30000);
  const [residenceFeePerPerson, setResidenceFeePerPerson] = useState<number>(100000);
  // Nếu là Quản lý cấp 2, mặc định gán cho chính mình
  const [managerUserId, setManagerUserId] = useState<number>(() => {
    if (currentUser?.roleId === 2) return currentUser.userId;
    return managers[0]?.userId || 4;
  });
  const [floors, setFloors] = useState<number>(5);
  
  // Tự động tạo tiện ích mẫu
  const [hasSharedWashing, setHasSharedWashing] = useState(true);
  const [hasEvCharger, setHasEvCharger] = useState(true);
  const [hasSmartGate, setHasSmartGate] = useState(true);

  // Tạo nhà xong mới tạo phòng: Mặc định không tạo phòng sẵn để quản lý tự thêm
  const [autoCreateSampleRooms, setAutoCreateSampleRooms] = useState(false);

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

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim() || !address.trim()) return;

    const assignedId = currentUser?.roleId === 2 ? currentUser.userId : Number(managerUserId);

    onAddBuilding({
      code: code.trim().toUpperCase(),
      name: name.trim(),
      address: address.trim(),
      managerUserId: assignedId,
      floors: Number(floors),
      hasSharedWashing,
      hasEvCharger,
      hasSmartGate,
      autoCreateSampleRooms,
      imageUrl: imageUrl.trim() || undefined,
      electricRate: Number(electricRate) || 3800,
      waterRate: Number(waterRate) || 30000,
      sanitationFeePerPerson: Number(sanitationFeePerPerson) || 30000,
      residenceFeePerPerson: Number(residenceFeePerPerson) || 100000
    });

    onClose();
    setCode('');
    setName('');
    setAddress('');
    setImageUrl('');
    setElectricRate(3800);
    setWaterRate(30000);
    setSanitationFeePerPerson(30000);
    setResidenceFeePerPerson(100000);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Thêm Tòa Nhà Trọ Mới Vào Hệ Thống</h3>
              <p className="text-xs text-slate-400">Khởi tạo nút gốc (Root Node) trong cây quản lý đa cấp</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-sm">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 mb-1 font-medium">Mã Tòa Nhà (NodeCode):</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Ví dụ: HN-TX03, HN-HBT01"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono uppercase outline-none focus:border-blue-500"
                required
              />
              <span className="text-[10px] text-slate-500">Mã định danh duy nhất trong CSDL</span>
            </div>

            <div>
              <label className="block text-slate-300 mb-1 font-medium">Tên Tòa Nhà:</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ví dụ: Tòa Nhà 03 - Thanh Xuân (Nhà Ánh Dương)"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 mb-1 font-medium flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              Địa Chỉ Cụ Thể Của Tòa Nhà:
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Ví dụ: Số 28 Ngõ 12 Triều Khúc, Thanh Xuân Nam, Thanh Xuân, Hà Nội"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-400"
              required
            />
          </div>

          {/* Upload ảnh của tòa nhà */}
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-slate-300 font-semibold flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-blue-400" />
                Ảnh Chụp Tòa Nhà (Upload từ máy hoặc dán link ảnh):
              </label>
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
                <Upload className="w-3.5 h-3.5 text-blue-400" />
                <span>Chọn File Ảnh</span>
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
                placeholder="Hoặc dán link ảnh (https://...)"
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-blue-500 text-xs"
              />
            </div>

            {imageUrl && (
              <div className="mt-2 relative rounded-xl overflow-hidden border border-slate-700/80 h-36 bg-slate-900 group">
                <img src={imageUrl} alt="Ảnh tòa nhà" className="w-full h-full object-cover" />
                <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur text-emerald-400 text-[10px] font-semibold px-2 py-0.5 rounded-lg border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Ảnh xem trước</span>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 mb-1 font-medium flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-blue-400" />
                Người Quản Lý Phụ Trách:
              </label>
              {currentUser?.roleId === 2 ? (
                <div className="w-full bg-slate-950 border border-blue-500/40 rounded-xl px-3 py-2 text-white flex items-center justify-between">
                  <span className="font-semibold text-blue-300">{currentUser.fullName}</span>
                  <span className="text-[10px] bg-blue-900/60 text-blue-200 px-2 py-0.5 rounded border border-blue-700">
                    Chính bạn (Cấp 2)
                  </span>
                </div>
              ) : (
                <select
                  value={managerUserId}
                  onChange={(e) => setManagerUserId(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-blue-500"
                >
                  {managers.map((m) => (
                    <option key={m.userId} value={m.userId}>
                      {m.fullName} ({m.phoneNumber})
                    </option>
                  ))}
                </select>
              )}
              <span className="text-[10px] text-slate-500">
                {currentUser?.roleId === 2
                  ? 'Tòa nhà do bạn tạo sẽ thuộc phạm vi quản lý và chỉnh sửa trực tiếp của bạn'
                  : 'Admin cấp 1 ấn định người quản lý phụ trách tòa nhà'}
              </span>
            </div>

            <div>
              <label className="block text-slate-300 mb-1 font-medium flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                Số Lượng Tầng Nhà:
              </label>
              <input
                type="number"
                min={1}
                max={20}
                value={floors}
                onChange={(e) => setFloors(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono outline-none focus:border-indigo-400"
                required
              />
              <span className="text-[10px] text-slate-500">Hệ thống sẽ tạo sẵn các tầng tương ứng trên cây</span>
            </div>
          </div>

          {/* Đơn Giá Điện Nước & Phí Vệ Sinh / Tạm Trú Cơ Sở Cho Tòa Nhà */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
            <div>
              <label className="block text-slate-300 mb-1 font-semibold flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                Đơn Giá Điện Cơ Sở (đ/kWh):
              </label>
              <input
                type="number"
                min={0}
                step={100}
                value={electricRate}
                onChange={(e) => setElectricRate(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-amber-400 font-mono font-bold outline-none focus:border-amber-500"
                required
              />
              <span className="text-[10px] text-slate-500">Mặc định: 3.800 đ/kWh cho tòa nhà</span>
            </div>

            <div>
              <label className="block text-slate-300 mb-1 font-semibold flex items-center gap-1.5">
                <Droplets className="w-3.5 h-3.5 text-cyan-400" />
                Đơn Giá Nước Cơ Sở (đ/m³):
              </label>
              <input
                type="number"
                min={0}
                step={1000}
                value={waterRate}
                onChange={(e) => setWaterRate(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-cyan-400 font-mono font-bold outline-none focus:border-cyan-500"
                required
              />
              <span className="text-[10px] text-slate-500">Mặc định: 30.000 đ/m³ cho tòa nhà</span>
            </div>

            <div>
              <label className="block text-slate-300 mb-1 font-semibold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                Phí Vệ Sinh (đ/người/tháng):
              </label>
              <input
                type="number"
                min={0}
                step={5000}
                value={sanitationFeePerPerson}
                onChange={(e) => setSanitationFeePerPerson(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-emerald-400 font-mono font-bold outline-none focus:border-emerald-500"
                required
              />
              <span className="text-[10px] text-slate-500">Kê vào hóa đơn hàng tháng theo số đầu người</span>
            </div>

            <div>
              <label className="block text-slate-300 mb-1 font-semibold flex items-center gap-1.5">
                <FileCheck className="w-3.5 h-3.5 text-indigo-400" />
                Phí Tạm Trú Tạm Vắng (đ/người/năm):
              </label>
              <input
                type="number"
                min={0}
                step={10000}
                value={residenceFeePerPerson}
                onChange={(e) => setResidenceFeePerPerson(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-indigo-400 font-mono font-bold outline-none focus:border-indigo-500"
                required
              />
              <span className="text-[10px] text-slate-500">Thu từ tháng bắt đầu ở, sau mỗi 12 tháng thu tiếp</span>
            </div>
          </div>

          {/* Tùy chọn: Tạo nhà xong mới tạo phòng thủ công */}
          <div className="p-3.5 rounded-2xl bg-blue-950/20 border border-blue-500/30 space-y-2">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={autoCreateSampleRooms}
                onChange={(e) => setAutoCreateSampleRooms(e.target.checked)}
                className="rounded bg-slate-950 border-slate-700 mt-0.5"
              />
              <div>
                <span className="text-white font-semibold block text-xs">
                  Tự động sinh 2 phòng mẫu trên mỗi tầng
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  Bỏ chọn nếu bạn muốn <strong>Tạo nhà xong mới tạo từng phòng</strong> để tự tay ấn định mã phòng và giá thuê theo từng thời điểm!
                </span>
              </div>
            </label>
          </div>

          {/* Tùy chọn tiện ích IoT mặc định */}
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <span className="text-slate-300 font-semibold block text-[11px]">
              Tự động khởi tạo tiện ích dùng chung ban đầu cho tòa nhà:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
              <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasSmartGate}
                  onChange={(e) => setHasSmartGate(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-700"
                />
                <span className="text-slate-200">Cổng từ vân tay</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasSharedWashing}
                  onChange={(e) => setHasSharedWashing(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-700"
                />
                <span className="text-slate-200">Máy giặt chung</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasEvCharger}
                  onChange={(e) => setHasEvCharger(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-700"
                />
                <span className="text-slate-200">Trạm sạc xe điện</span>
              </label>
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg shadow-blue-600/30 flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Tạo Tòa Nhà Mới</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
