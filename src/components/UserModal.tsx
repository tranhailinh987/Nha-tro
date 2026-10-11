import React, { useState, useRef } from 'react';
import { 
  Users, 
  CreditCard, 
  Smartphone, 
  MapPin, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck,
  Eye,
  Trash2,
  Image as ImageIcon,
  Sparkles,
  Camera,
  Search,
  UserCheck,
  ShieldAlert
} from 'lucide-react';
import { User, RoleType } from '../types/rental';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegisterUser: (newUser: Omit<User, 'userId' | 'isActive' | 'createdAt'>) => { success: boolean; message: string };
  allUsers: User[];
  isSqlConnected?: boolean;
  currentUser?: User | null;
  onUpdateUserRole?: (targetUserId: number, newRoleId: RoleType) => void;
}

export const UserModal: React.FC<UserModalProps> = ({
  isOpen,
  onClose,
  onRegisterUser,
  allUsers,
  isSqlConnected,
  currentUser,
  onUpdateUserRole
}) => {
  const [activeTab, setActiveTab] = useState<'register' | 'list'>('register');
  const [listSearchQuery, setListSearchQuery] = useState('');
  const [listRoleFilter, setListRoleFilter] = useState<'ALL' | 1 | 2 | 3>('ALL');

  // Form State
  const [fullName, setFullName] = useState('');
  const [citizenId, setCitizenId] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState(''); // TRƯỜNG DỮ LIỆU ĐỊA CHỈ MỚI BỔ SUNG
  const [roleId, setRoleId] = useState<RoleType>(3);
  
  // Real Uploaded CCCD Image Data (Base64 or URL)
  const [frontImg, setFrontImg] = useState<string>('');
  const [frontImgName, setFrontImgName] = useState<string>('');
  const [frontImgSize, setFrontImgSize] = useState<string>('');

  const [backImg, setBackImg] = useState<string>('');
  const [backImgName, setBackImgName] = useState<string>('');
  const [backImgSize, setBackImgSize] = useState<string>('');

  // Zoom Image Preview Modal
  const [zoomImgUrl, setZoomImgUrl] = useState<string | null>(null);

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // File Input References
  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Xử lý upload ảnh thật từ máy tính người dùng
  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>, 
    side: 'FRONT' | 'BACK'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Vui lòng chỉ chọn tệp hình ảnh (JPG, PNG, WEBP, v.v.)!');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('Dung lượng ảnh tối đa là 10MB!');
      return;
    }

    setErrorMsg('');
    const sizeKB = (file.size / 1024).toFixed(1) + ' KB';
    const reader = new FileReader();

    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (side === 'FRONT') {
        setFrontImg(result);
        setFrontImgName(file.name);
        setFrontImgSize(sizeKB);
      } else {
        setBackImg(result);
        setBackImgName(file.name);
        setBackImgSize(sizeKB);
      }
    };

    reader.readAsDataURL(file);
  };

  // Chọn ảnh mẫu nhanh nếu máy tính chưa có sẵn ảnh CCCD
  const applyPresetImage = (side: 'FRONT' | 'BACK') => {
    if (side === 'FRONT') {
      setFrontImg('https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80');
      setFrontImgName('cccd_mat_truoc_chip.jpg');
      setFrontImgSize('142.5 KB');
    } else {
      setBackImg('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80');
      setBackImgName('cccd_mat_sau_mrz.jpg');
      setBackImgSize('185.2 KB');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (citizenId.length < 9) {
      setErrorMsg('Số CCCD phải từ 9 đến 12 số theo quy định định danh!');
      return;
    }

    if (phoneNumber.length < 10) {
      setErrorMsg('Số điện thoại phải từ 10 số trở lên!');
      return;
    }

    if (!address.trim()) {
      setErrorMsg('Vui lòng nhập trường dữ liệu Địa chỉ (Address) thường trú / quê quán!');
      return;
    }

    if (!frontImg || !backImg) {
      setErrorMsg('Vui lòng tải lên cả 2 mặt Căn cước công dân (Mặt trước & Mặt sau)! Bạn có thể chọn file từ máy hoặc bấm "Dùng ảnh mẫu".');
      return;
    }

    const result = onRegisterUser({
      fullName,
      citizenId,
      phoneNumber,
      address,
      roleId,
      citizenIdFrontImg: frontImg,
      citizenIdBackImg: backImg
    });

    if (result.success) {
      setSuccessMsg(result.message);
      setFullName('');
      setCitizenId('');
      setPhoneNumber('');
      setAddress('');
      setFrontImg('');
      setBackImg('');
      setTimeout(() => {
        setSuccessMsg('');
        setActiveTab('list');
      }, 1500);
    } else {
      setErrorMsg(result.message);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full p-6 space-y-4 shadow-2xl max-h-[92vh] overflow-y-auto">
          {/* Header */}
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-400" />
              <h3 className="font-bold text-white text-base">
                Đăng Ký Tài Khoản & Định Danh Căn Cước Công Dân (CCCD)
              </h3>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-white text-sm">✕</button>
          </div>

          {/* Tab điều hướng */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('register')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'register' ? 'bg-blue-600 text-white shadow' : 'bg-slate-950 text-slate-400 hover:text-white'
              }`}
            >
              Đăng Ký Mới (Kèm Upload Ảnh CCCD & Address)
            </button>
            <button
              onClick={() => setActiveTab('list')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'list' ? 'bg-blue-600 text-white shadow' : 'bg-slate-950 text-slate-400 hover:text-white'
              }`}
            >
              Xem Danh Sách Tài Khoản ({allUsers.length})
            </button>
          </div>

          {activeTab === 'register' && (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Thông báo nghiệp vụ */}
              <div className="p-3 rounded-2xl bg-blue-950/30 border border-blue-800/40 text-blue-300 text-[11px] space-y-1.5">
                <div className="font-bold flex items-center gap-1.5 text-blue-200">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                  Quy định phân quyền &amp; Đăng ký tài khoản:
                </div>
                <div className="text-slate-300 space-y-1">
                  <div>
                    1. <strong>Khi người dùng đăng ký tài khoản thì mặc định là Cấp 3 (cấp thấp nhất).</strong>
                  </div>
                  <div>
                    2. Những tài khoản của người quản lý sẽ do <strong>Tài khoản Cấp 1 (Admin) chỉ định</strong>; người quản lý được phép <strong>ấn định tài khoản khác ngang quyền mình</strong> (đầy đủ các tính năng của người quản lý).
                  </div>
                  <div>
                    3. Người quản trị (Admin Cấp 1) cũng được phép <strong>ấn định tài khoản khác ngang quyền mình</strong>.
                  </div>
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-950/90 border border-rose-500/50 text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-3 rounded-xl bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Họ và tên đầy đủ:</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ví dụ: Hoàng Văn Nam"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Cấp phân quyền tài khoản:</label>
                  <div className="w-full bg-slate-950 border border-emerald-800/60 rounded-xl px-3 py-2 text-emerald-300 text-xs flex items-center justify-between">
                    <span className="font-semibold flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      Khách thuê (Cấp 3 - Cấp thấp nhất)
                    </span>
                    <span className="text-[10px] bg-emerald-950 px-2 py-0.5 rounded border border-emerald-700 font-mono text-emerald-300 font-bold">
                      MẶC ĐỊNH
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    * Mặc định là Cấp 3 khi đăng ký. Tài khoản người quản lý sẽ do Cấp 1 chỉ định; Quản lý và Admin được phép ấn định tài khoản khác ngang quyền mình sau đó.
                  </span>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Số Căn cước công dân (12 số duy nhất):</label>
                  <input
                    type="text"
                    value={citizenId}
                    onChange={(e) => setCitizenId(e.target.value)}
                    placeholder="001095009999"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Số điện thoại đăng nhập (Duy nhất):</label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="0989999999"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono outline-none focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              {/* TRƯỜNG DỮ LIỆU ĐỊA CHỈ (ADDRESS) MỚI BỔ SUNG */}
              <div>
                <label className="block text-emerald-400 font-semibold mb-1 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  Địa chỉ thường trú / quê quán (Cột Address trong bảng Users):
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Ví dụ: Thôn 2, Xã Quỳnh Hưng, Quỳnh Phụ, Tỉnh Thái Bình"
                  className="w-full bg-slate-950 border border-emerald-500/40 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-400"
                  required
                />
              </div>

              {/* TÍNH NĂNG UPLOAD ẢNH CCCD 2 MẶT THỰC TẾ */}
              <div className="space-y-3 pt-1 border-t border-slate-800">
                <div className="flex justify-between items-center">
                  <label className="block text-slate-200 font-bold text-xs flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-cyan-400" />
                    Tải Lên Hình Ảnh Căn Cước Công Dân (2 Mặt):
                  </label>
                  <span className="text-[11px] text-slate-400">Hỗ trợ JPG, PNG, WEBP</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Mặt Trước CCCD */}
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-white text-xs flex items-center gap-1">
                        <span>1. Mặt Trước CCCD</span>
                        {frontImg && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                      </span>
                      <button
                        type="button"
                        onClick={() => applyPresetImage('FRONT')}
                        className="text-[10px] text-blue-400 hover:text-blue-300 font-medium underline"
                      >
                        Dùng ảnh mẫu
                      </button>
                    </div>

                    <input
                      type="file"
                      ref={frontInputRef}
                      onChange={(e) => handleFileUpload(e, 'FRONT')}
                      accept="image/*"
                      className="hidden"
                    />

                    {frontImg ? (
                      <div className="space-y-2">
                        <div className="relative group rounded-xl overflow-hidden border border-slate-700 h-36 bg-slate-900 flex items-center justify-center">
                          <img src={frontImg} alt="Mặt trước CCCD" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => setZoomImgUrl(frontImg)}
                              className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-white"
                              title="Xem ảnh lớn"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => frontInputRef.current?.click()}
                              className="p-2 rounded-lg bg-blue-600/80 hover:bg-blue-600 text-white"
                              title="Thay ảnh khác"
                            >
                              <Upload className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => { setFrontImg(''); setFrontImgName(''); }}
                              className="p-2 rounded-lg bg-rose-600/80 hover:bg-rose-600 text-white"
                              title="Xóa ảnh"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <div className="text-[11px] text-slate-400 flex justify-between font-mono">
                          <span className="truncate max-w-[150px]">{frontImgName || 'Ảnh tải lên'}</span>
                          <span className="text-emerald-400">{frontImgSize || '✓ Đã tải'}</span>
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => frontInputRef.current?.click()}
                        className="border-2 border-dashed border-slate-700 hover:border-blue-500 rounded-xl p-6 text-center cursor-pointer transition-colors space-y-2 bg-slate-900/50 hover:bg-slate-900"
                      >
                        <Upload className="w-6 h-6 text-slate-400 mx-auto" />
                        <div className="text-xs text-slate-300 font-medium">Bấm để chọn ảnh mặt trước</div>
                        <div className="text-[10px] text-slate-500">Hoặc kéo thả file ảnh từ máy vào đây</div>
                      </div>
                    )}
                  </div>

                  {/* Mặt Sau CCCD */}
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-white text-xs flex items-center gap-1">
                        <span>2. Mặt Sau CCCD</span>
                        {backImg && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                      </span>
                      <button
                        type="button"
                        onClick={() => applyPresetImage('BACK')}
                        className="text-[10px] text-blue-400 hover:text-blue-300 font-medium underline"
                      >
                        Dùng ảnh mẫu
                      </button>
                    </div>

                    <input
                      type="file"
                      ref={backInputRef}
                      onChange={(e) => handleFileUpload(e, 'BACK')}
                      accept="image/*"
                      className="hidden"
                    />

                    {backImg ? (
                      <div className="space-y-2">
                        <div className="relative group rounded-xl overflow-hidden border border-slate-700 h-36 bg-slate-900 flex items-center justify-center">
                          <img src={backImg} alt="Mặt sau CCCD" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => setZoomImgUrl(backImg)}
                              className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-white"
                              title="Xem ảnh lớn"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => backInputRef.current?.click()}
                              className="p-2 rounded-lg bg-blue-600/80 hover:bg-blue-600 text-white"
                              title="Thay ảnh khác"
                            >
                              <Upload className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => { setBackImg(''); setBackImgName(''); }}
                              className="p-2 rounded-lg bg-rose-600/80 hover:bg-rose-600 text-white"
                              title="Xóa ảnh"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <div className="text-[11px] text-slate-400 flex justify-between font-mono">
                          <span className="truncate max-w-[150px]">{backImgName || 'Ảnh tải lên'}</span>
                          <span className="text-emerald-400">{backImgSize || '✓ Đã tải'}</span>
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => backInputRef.current?.click()}
                        className="border-2 border-dashed border-slate-700 hover:border-blue-500 rounded-xl p-6 text-center cursor-pointer transition-colors space-y-2 bg-slate-900/50 hover:bg-slate-900"
                      >
                        <Upload className="w-6 h-6 text-slate-400 mx-auto" />
                        <div className="text-xs text-slate-300 font-medium">Bấm để chọn ảnh mặt sau</div>
                        <div className="text-[10px] text-slate-500">Hoặc kéo thả file ảnh từ máy vào đây</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-between items-center">
                <div className="text-[11px] text-slate-400">
                  {isSqlConnected ? (
                    <span className="text-emerald-400">✓ Đang kết nối MS SQL Server (Dữ liệu sẽ lưu thẳng vào CSDL)</span>
                  ) : (
                    <span>Lưu tạm thời trên phiên thử nghiệm (Bộ nhớ/localStorage)</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300"
                  >
                    Đóng
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg shadow-blue-600/30"
                  >
                    Tạo Tài Khoản
                  </button>
                </div>
              </div>
            </form>
          )}

          {activeTab === 'list' && (
            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-slate-300 space-y-1 text-[11px]">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                  Quy tắc hệ thống phân cấp:
                </div>
                <p>
                  • Người đăng ký mới mặc định là <strong>Cấp 3 (Khách thuê - cấp thấp nhất)</strong>.
                </p>
                <p>
                  • Tài khoản Quản lý do <strong>Admin Cấp 1 chỉ định</strong>. Người quản lý (Cấp 2) được phép <strong>ấn định tài khoản khác ngang quyền mình</strong> (đầy đủ tính năng quản lý).
                </p>
                <p>
                  • Người quản trị (Admin Cấp 1) được phép <strong>ấn định tài khoản khác ngang quyền mình</strong>.
                </p>
              </div>

              {/* Bộ lọc vai trò & Tìm kiếm */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 p-3 rounded-2xl bg-slate-950 border border-slate-800">
                <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setListRoleFilter('ALL')}
                    className={`px-2.5 py-1 rounded-lg font-semibold text-[11px] transition-all ${
                      listRoleFilter === 'ALL' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Tất cả ({allUsers.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setListRoleFilter(1)}
                    className={`px-2.5 py-1 rounded-lg font-semibold text-[11px] transition-all ${
                      listRoleFilter === 1 ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Admin Cấp 1 ({allUsers.filter(u => u.roleId === 1).length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setListRoleFilter(2)}
                    className={`px-2.5 py-1 rounded-lg font-semibold text-[11px] transition-all ${
                      listRoleFilter === 2 ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Quản Lý Cấp 2 ({allUsers.filter(u => u.roleId === 2).length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setListRoleFilter(3)}
                    className={`px-2.5 py-1 rounded-lg font-semibold text-[11px] transition-all ${
                      listRoleFilter === 3 ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Khách Thuê Cấp 3 ({allUsers.filter(u => u.roleId === 3).length})
                  </button>
                </div>

                <div className="relative w-full sm:w-60">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={listSearchQuery}
                    onChange={(e) => setListSearchQuery(e.target.value)}
                    placeholder="Tìm tên, CCCD, SĐT..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Danh sách người dùng */}
              {(() => {
                const filtered = allUsers.filter((u) => {
                  if (listRoleFilter !== 'ALL' && u.roleId !== listRoleFilter) return false;
                  if (listSearchQuery.trim()) {
                    const q = listSearchQuery.toLowerCase();
                    const matchName = u.fullName.toLowerCase().includes(q);
                    const matchCccd = u.citizenId.toLowerCase().includes(q);
                    const matchPhone = u.phoneNumber.toLowerCase().includes(q);
                    const matchAddr = (u.address || '').toLowerCase().includes(q);
                    return matchName || matchCccd || matchPhone || matchAddr;
                  }
                  return true;
                });

                return (
                  <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-1">
                    {filtered.map((u) => {
                      const isSelf = currentUser?.userId === u.userId;
                      const canAdminEdit = currentUser?.roleId === 1;
                      const canManagerEdit = currentUser?.roleId === 2;

                      return (
                        <div key={u.userId} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white text-sm">{u.fullName}</span>
                              {isSelf && (
                                <span className="text-[9px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-semibold">
                                  (Bạn)
                                </span>
                              )}
                              <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                                u.roleId === 1 
                                  ? 'bg-purple-950 text-purple-300 border border-purple-800'
                                  : u.roleId === 2
                                  ? 'bg-blue-950 text-blue-300 border border-blue-800'
                                  : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              }`}>
                                {u.roleId === 1 ? 'Admins Cấp 1' : u.roleId === 2 ? 'Quản lý Cấp 2' : 'Khách thuê Cấp 3'}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-500 font-mono">ID: #{u.userId}</span>
                          </div>

                          <div className="text-slate-400 font-mono text-[11px] flex flex-wrap gap-4">
                            <span>CCCD: <strong className="text-slate-200">{u.citizenId}</strong></span>
                            <span>SĐT: <strong className="text-slate-200">{u.phoneNumber}</strong></span>
                          </div>

                          <div className="text-emerald-400 flex items-center gap-1 text-[11px]">
                            <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-emerald-400" />
                            <span>Địa chỉ thường trú: <strong className="text-emerald-200">{u.address}</strong></span>
                          </div>

                          {u.designatedByName && (
                            <div className="text-[10px] text-indigo-300 bg-indigo-950/40 px-2 py-0.5 rounded-md border border-indigo-900/50 inline-block">
                              Được ấn định bởi: <strong>{u.designatedByName}</strong>
                            </div>
                          )}

                          {/* Hiển thị ảnh CCCD nếu có */}
                          {(u.citizenIdFrontImg || u.citizenIdBackImg) && (
                            <div className="pt-2 border-t border-slate-900 flex items-center gap-3">
                              <span className="text-[11px] text-slate-400">Ảnh CCCD:</span>
                              {u.citizenIdFrontImg && (
                                <button
                                  type="button"
                                  onClick={() => setZoomImgUrl(u.citizenIdFrontImg || null)}
                                  className="flex items-center gap-1 text-[10px] text-cyan-400 bg-cyan-950/40 border border-cyan-800/40 px-2 py-0.5 rounded hover:bg-cyan-900/60"
                                >
                                  <ImageIcon className="w-3 h-3" /> Xem mặt trước
                                </button>
                              )}
                              {u.citizenIdBackImg && (
                                <button
                                  type="button"
                                  onClick={() => setZoomImgUrl(u.citizenIdBackImg || null)}
                                  className="flex items-center gap-1 text-[10px] text-indigo-400 bg-indigo-950/40 border border-indigo-800/40 px-2 py-0.5 rounded hover:bg-indigo-900/60"
                                >
                                  <ImageIcon className="w-3 h-3" /> Xem mặt sau
                                </button>
                              )}
                            </div>
                          )}

                          {/* Khu vực ấn định vai trò trực tiếp nếu người xem là Admin hoặc Quản lý */}
                          {onUpdateUserRole && (canAdminEdit || canManagerEdit) && (
                            <div className="pt-2 border-t border-slate-900 flex flex-wrap items-center gap-1.5">
                              <span className="text-[10px] text-slate-400 mr-1">Ấn định vai trò:</span>

                              {/* Admin Cấp 1 quyền hạn: */}
                              {canAdminEdit && (
                                <>
                                  {u.roleId !== 1 && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (confirm(`Ấn định "${u.fullName}" thành Admin Cấp 1 ngang quyền mình?`)) {
                                          onUpdateUserRole(u.userId, 1);
                                        }
                                      }}
                                      className="px-2 py-1 rounded bg-purple-600/30 hover:bg-purple-600 text-purple-300 hover:text-white border border-purple-500/40 text-[10px] font-semibold transition-all"
                                    >
                                      + Admin Ngang Quyền (Cấp 1)
                                    </button>
                                  )}

                                  {u.roleId !== 2 && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (confirm(`Chỉ định "${u.fullName}" làm Quản Lý Cấp 2?`)) {
                                          onUpdateUserRole(u.userId, 2);
                                        }
                                      }}
                                      className="px-2 py-1 rounded bg-blue-600/30 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/40 text-[10px] font-semibold transition-all"
                                    >
                                      + Quản Lý (Cấp 2)
                                    </button>
                                  )}

                                  {u.roleId !== 3 && !isSelf && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (confirm(`Chuyển tài khoản "${u.fullName}" về Khách Thuê (Cấp 3)?`)) {
                                          onUpdateUserRole(u.userId, 3);
                                        }
                                      }}
                                      className="px-2 py-1 rounded bg-slate-900 hover:bg-rose-950/60 text-slate-400 hover:text-rose-300 border border-slate-800 text-[10px] transition-all"
                                    >
                                      Chuyển về Cấp 3
                                    </button>
                                  )}
                                </>
                              )}

                              {/* Quản lý Cấp 2 quyền hạn: */}
                              {canManagerEdit && (
                                <>
                                  {u.roleId === 1 && (
                                    <span className="text-[10px] text-purple-400 bg-purple-950/30 px-2 py-0.5 rounded border border-purple-800/40">
                                      Admin Tối Cao (Không được phép can thiệp)
                                    </span>
                                  )}

                                  {u.roleId === 3 && !isSelf && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (confirm(`Ấn định "${u.fullName}" thành Quản Lý Cấp 2 ngang quyền bạn? (Đầy đủ chức năng quản lý)`)) {
                                          onUpdateUserRole(u.userId, 2);
                                        }
                                      }}
                                      className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold shadow transition-all"
                                    >
                                      + Ấn Định Quản Lý Ngang Quyền (Cấp 2)
                                    </button>
                                  )}

                                  {u.roleId === 2 && !isSelf && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (confirm(`Chuyển tài khoản "${u.fullName}" về Khách Thuê (Cấp 3)?`)) {
                                          onUpdateUserRole(u.userId, 3);
                                        }
                                      }}
                                      className="px-2 py-1 rounded bg-slate-900 hover:bg-rose-950/60 text-slate-400 hover:text-rose-300 border border-slate-800 text-[10px] transition-all"
                                    >
                                      Chuyển về Cấp 3
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </div>

      {/* Modal Xem Ảnh CCCD Lớn (Zoom View) */}
      {zoomImgUrl && (
        <div 
          onClick={() => setZoomImgUrl(null)}
          className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in"
        >
          <div className="max-w-2xl w-full bg-slate-900 border border-slate-800 rounded-3xl p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-white">Xem Chi Tiết Ảnh Căn Cước Công Dân</span>
              <button 
                onClick={() => setZoomImgUrl(null)} 
                className="text-slate-400 hover:text-white px-2 py-1 bg-slate-800 rounded-lg text-xs"
              >
                Đóng (✕)
              </button>
            </div>
            <div className="rounded-2xl overflow-hidden border border-slate-800 bg-black flex items-center justify-center max-h-[75vh]">
              <img src={zoomImgUrl} alt="Ảnh lớn" className="max-w-full max-h-[70vh] object-contain" />
            </div>
          </div>
        </div>
      )}
    </>
  );
};
