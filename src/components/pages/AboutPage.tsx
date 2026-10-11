import React from 'react';
import { 
  Building2, 
  ShieldCheck, 
  Target, 
  Compass, 
  Users, 
  Zap, 
  Lock, 
  FolderTree, 
  CheckCircle2, 
  Sparkles, 
  KeyRound, 
  Cpu, 
  FileCheck2,
  HeartHandshake
} from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto space-y-10 py-4 animate-in fade-in duration-200 text-slate-200">
      {/* Header Banner */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 text-xs font-bold text-blue-400 bg-blue-500/10 border border-blue-500/30 px-3.5 py-1 rounded-full uppercase tracking-wider">
          <Target className="w-3.5 h-3.5" />
          Chủ Trương &amp; Mục Đích Hoạt Động
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Hệ Thống Quản Lý Chuỗi 100 Nhà Trọ Công Nghệ &amp; Thiết Bị Thông Minh
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
          Tuyên ngôn phát triển một môi trường lưu trú văn minh, minh bạch, ứng dụng triệt để công nghệ IoT và cơ sở dữ liệu hướng đối tượng dạng cây đa cấp.
        </p>
      </div>

      {/* 1. Tầm Nhìn & Sứ Mệnh */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Compass className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-bold text-white">1. Tầm Nhìn Chiến Lược</h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Trở thành chuẩn mực số hóa hàng đầu trong việc quản lý và vận hành chuỗi 100 nhà trọ đô thị. Giải quyết triệt để các rào cản truyền thống: ghi chép sổ sách thủ công sai lệch, nhập nhằng số điện nước, tranh cãi tiền cọc phòng và thiếu minh bạch an ninh.
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Target className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-bold text-white">2. Sứ Mệnh Cốt Lõi</h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Mang đến cho người thuê trọ (sinh viên, người đi làm, chuyên gia) một không gian sống an toàn tuyệt đối, tiện nghi cao cấp với chi phí hợp lý. Ban quản trị và các chủ tòa nhà kiểm soát toàn diện tài sản và doanh thu theo thời gian thực mà không phụ thuộc vào khoảng cách địa lý.
          </p>
        </div>
      </section>

      {/* 2. Năm Mục Đích Cốt Lõi Của Hệ Thống */}
      <section className="space-y-6">
        <div className="border-b border-slate-800 pb-3">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            5 Trọng Tâm Mục Đích Của Trang Quản Trị
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs sm:text-sm">
          {/* Mục 1 */}
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-3">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-sm">
              01
            </div>
            <h3 className="font-bold text-white text-base">Định Danh An Ninh Tuyệt Đối</h3>
            <p className="text-slate-300 leading-relaxed text-xs">
              Mỗi cư dân lưu trú bắt buộc định danh bằng <strong>Căn cước công dân (CCCD 12 số)</strong> kèm hình ảnh 2 mặt và <strong>Địa chỉ thường trú (Address)</strong>. Một người chỉ sở hữu duy nhất một tài khoản, tạo môi trường lưu trú văn minh, loại trừ tệ nạn xã hội.
            </p>
          </div>

          {/* Mục 2 */}
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-3">
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-sm">
              02
            </div>
            <h3 className="font-bold text-white text-base">Tự Động Hóa Thiết Bị IoT</h3>
            <p className="text-slate-300 leading-relaxed text-xs">
              Mở cổng an ninh từ xa qua điện thoại; kích hoạt máy giặt sảnh, trạm sạc xe điện thông minh tự ngắt khi đầy pin. Toàn bộ lượt dùng được đo đếm tự động và cộng dồn vào hóa đơn phòng (nằm trong tiền cọc, không cần nạp ví trả trước).
            </p>
          </div>

          {/* Mục 3 */}
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
              03
            </div>
            <h3 className="font-bold text-white text-base">Giữ Phòng &amp; Đặt Trước Thông Minh</h3>
            <p className="text-slate-300 leading-relaxed text-xs">
              Hệ thống tự động lọc ra các phòng trống và các phòng có hợp đồng sắp hết hạn trong vòng 30 ngày (số ngày do Quản lý ấn định) để người dùng đặt trước. Khi Quản lý duyệt chấp thuận, phòng sẽ chính thức tạo hợp đồng và loại khỏi danh sách giữ chỗ.
            </p>
          </div>

          {/* Mục 4 */}
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-3">
            <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold text-sm">
              04
            </div>
            <h3 className="font-bold text-white text-base">Đánh Giá 2 Chiều Khóa Minh Bạch</h3>
            <p className="text-slate-300 leading-relaxed text-xs">
              Quản lý đánh giá khách thuê trong thời gian ở (khóa lại ngay khi thanh toán trả phòng). Khách thuê đánh giá ban quản lý sau khi trả phòng (gửi xong khóa vĩnh viễn). Triệt tiêu hoàn toàn sự can thiệp hoặc sửa đổi kết quả sau này.
            </p>
          </div>

          {/* Mục 5 */}
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-3">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-sm">
              05
            </div>
            <h3 className="font-bold text-white text-base">Cây Đối Tượng Đa Cấp Không Cần Sửa Code</h3>
            <p className="text-slate-300 leading-relaxed text-xs">
              Ứng dụng mô hình thực thể dạng cây đệ quy (`ManagementNodes`). Khi tòa nhà lắp thêm tiện ích mới (Điện thoại sảnh, WiFi, trạm sạc, thang máy), Quản lý chỉ cần thêm vào danh mục Loại Đối Tượng là hệ thống tự động thống kê toàn bộ.
            </p>
          </div>

          {/* Mục 6 */}
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-sm">
              06
            </div>
            <h3 className="font-bold text-white text-base">Bảo Hành &amp; Bảo Trì Thiết Bị Đa Tầng</h3>
            <p className="text-slate-300 leading-relaxed text-xs">
              Phân định rõ 3 trạng thái phản ánh: <strong>Hư hỏng</strong> (liên hệ hãng bảo hành / gọi thợ), <strong>Hay bẩn</strong> (điều động tạp vụ), <strong>Khó sử dụng</strong> (dán tem hướng dẫn trực quan), tối ưu tuổi thọ thiết bị.
            </p>
          </div>
        </div>
      </section>

      {/* 3. Tuyên Ngôn 3 Cấp Quyền Hạn */}
      <section className="p-8 rounded-3xl bg-gradient-to-r from-blue-950/60 via-slate-900 to-indigo-950/60 border border-blue-500/30 space-y-6">
        <h2 className="text-xl font-bold text-white text-center">
          Mô Hình Phân Quyền Đúng 3 Cấp Độ Chặt Chẽ
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-purple-500/40 space-y-2">
            <div className="text-purple-400 font-bold text-sm">Cấp 1: 3 Admins Tối Cao</div>
            <p className="text-slate-300 leading-relaxed">
              Toàn quyền điều khiển hệ sinh thái 100 nhà trọ, thêm loại đối tượng quản lý mới, phân quyền quản lý từng tòa, xem báo cáo tổng hợp tài chính và điện nước toàn quốc.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/80 border border-blue-500/40 space-y-2">
            <div className="text-blue-400 font-bold text-sm">Cấp 2: Quản Lý Tòa Nhà</div>
            <p className="text-slate-300 leading-relaxed">
              Trực tiếp quản lý 1 hoặc nhiều tòa nhà, tạo phòng, chốt số điện nước, quản lý thiết bị dùng chung, duyệt yêu cầu giữ phòng và đánh giá người thuê (khóa sau trả phòng).
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/80 border border-emerald-500/40 space-y-2">
            <div className="text-emerald-400 font-bold text-sm">Cấp 3: Người Dùng (Khách Thuê)</div>
            <p className="text-slate-300 leading-relaxed">
              Có thể thuê nhiều phòng đồng thời, mở cổng từ xa, kích hoạt thiết bị trong nhà, báo cáo tình trạng máy móc và đánh giá quản lý sau khi thanh toán xong.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
