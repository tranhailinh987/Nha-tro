import React, { useState } from 'react';
import { 
  Star, 
  Lock, 
  ArrowUpDown, 
  Filter, 
  ShieldCheck, 
  MessageSquare, 
  Building2, 
  UserCheck, 
  CheckCircle2, 
  Award,
  Sparkles
} from 'lucide-react';
import { TwoWayReview } from '../../types/rental';
import { formatDateVN } from '../../utils/dateUtils';

interface ReviewsPageProps {
  reviews: TwoWayReview[];
}

export const ReviewsPage: React.FC<ReviewsPageProps> = ({ reviews }) => {
  // Bộ lọc vai trò
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'BUILDING_MANAGER' | 'TENANT'>('ALL');
  
  // Sắp xếp theo mức điểm từ trên xuống (DESC) hoặc từ dưới lên (ASC)
  const [sortOrder, setSortOrder] = useState<'RATING_DESC' | 'RATING_ASC' | 'NEWEST' | 'OLDEST'>('RATING_DESC');

  // Lọc theo vai trò
  const filteredReviews = reviews.filter((r) => {
    if (roleFilter === 'ALL') return true;
    return r.reviewerRole === roleFilter;
  });

  // Sắp xếp
  const sortedReviews = [...filteredReviews].sort((a, b) => {
    if (sortOrder === 'RATING_DESC') {
      return b.rating - a.rating; // Từ cao xuống thấp
    }
    if (sortOrder === 'RATING_ASC') {
      return a.rating - b.rating; // Từ thấp lên cao
    }
    if (sortOrder === 'NEWEST') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    if (sortOrder === 'OLDEST') {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }
    return 0;
  });

  // Tính điểm đánh giá trung bình
  const totalScore = reviews.reduce((acc, r) => acc + r.rating, 0);
  const avgRating = reviews.length > 0 ? (totalScore / reviews.length).toFixed(1) : '5.0';

  // Thống kê phân bổ sao
  const starCounts = [5, 4, 3, 2, 1].map((s) => ({
    star: s,
    count: reviews.filter((r) => r.rating === s).length
  }));

  return (
    <div className="max-w-5xl mx-auto space-y-8 py-4 animate-in fade-in duration-200">
      {/* Header */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 text-xs font-bold text-purple-400 bg-purple-500/10 border border-purple-500/30 px-3.5 py-1 rounded-full uppercase tracking-wider">
          <MessageSquare className="w-3.5 h-3.5" />
          Nhận Định &amp; Đánh Giá Hai Chiều
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Ý Kiến Đánh Giá Của Người Quản Lý &amp; Cư Dân
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
          Toàn bộ nhận định đều được bảo chứng minh bạch: Người quản lý và Khách thuê đánh giá sau khi hoàn tất thủ tục và hệ thống <strong>khóa hoàn toàn việc chỉnh sửa</strong>.
        </p>
      </div>

      {/* Thẻ Thống Kê & Phân Bổ Mức Điểm */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        {/* Điểm trung bình */}
        <div className="text-center md:border-r border-slate-800 space-y-2">
          <span className="text-xs text-slate-400 font-medium">Điểm Đánh Giá Trung Bình</span>
          <div className="text-5xl font-black text-amber-400 font-mono tracking-tight flex items-center justify-center gap-2">
            <span>{avgRating}</span>
            <Star className="w-8 h-8 fill-amber-400 text-amber-400" />
          </div>
          <div className="text-xs text-slate-500">
            Dựa trên {reviews.length} nhận định đã được khóa bảo chứng
          </div>
        </div>

        {/* Biểu đồ phân bổ sao */}
        <div className="md:col-span-2 space-y-1.5 text-xs">
          <span className="text-xs text-slate-400 font-medium block mb-2">Phân Bổ Xếp Hạng Mức Điểm:</span>
          {starCounts.map(({ star, count }) => {
            const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
            return (
              <div key={star} className="flex items-center gap-3">
                <span className="w-12 text-slate-300 font-semibold flex items-center gap-1">
                  <span>{star}</span>
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                </span>
                <div className="flex-1 h-2 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                  <div 
                    className="h-full bg-amber-400 rounded-full transition-all duration-500" 
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="w-10 text-right text-slate-400 font-mono text-[11px]">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Thanh Công Cụ Bộ Lọc & Sắp Xếp Điểm */}
      <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        {/* Lọc đối tượng nhận định */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-slate-400 flex items-center gap-1 font-medium">
            <Filter className="w-3.5 h-3.5 text-blue-400" />
            Lọc nhận định:
          </span>
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setRoleFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                roleFilter === 'ALL' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Tất Cả ({reviews.length})
            </button>
            <button
              onClick={() => setRoleFilter('BUILDING_MANAGER')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                roleFilter === 'BUILDING_MANAGER' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Quản Lý Đánh Giá Khách
            </button>
            <button
              onClick={() => setRoleFilter('TENANT')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                roleFilter === 'TENANT' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Khách Đánh Giá Quản Lý
            </button>
          </div>
        </div>

        {/* SẮP XẾP MỨC ĐIỂM TỪ TRÊN XUỐNG VÀ NGƯỢC LẠI THEO ĐÚNG YÊU CẦU */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400 flex items-center gap-1 font-medium">
            <ArrowUpDown className="w-3.5 h-3.5 text-purple-400" />
            Sắp xếp theo mức điểm:
          </span>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as any)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-white font-semibold text-xs outline-none focus:border-purple-500 cursor-pointer"
          >
            <option value="RATING_DESC">Điểm từ trên xuống (5 sao &rarr; 1 sao)</option>
            <option value="RATING_ASC">Điểm từ dưới lên (1 sao &rarr; 5 sao)</option>
            <option value="NEWEST">Ngày đánh giá mới nhất</option>
            <option value="OLDEST">Ngày đánh giá cũ nhất</option>
          </select>
        </div>
      </div>

      {/* Danh Sách Các Nhận Định Đã Sắp Xếp */}
      <div className="space-y-4">
        {sortedReviews.length === 0 ? (
          <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-3xl text-slate-400 text-xs">
            Không tìm thấy nhận định nào phù hợp với bộ lọc hiện tại.
          </div>
        ) : (
          sortedReviews.map((rev) => (
            <div 
              key={rev.reviewId}
              className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 hover:border-slate-700 transition-all shadow-lg"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm shadow ${
                    rev.reviewerRole === 'BUILDING_MANAGER'
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  }`}>
                    {rev.reviewerRole === 'BUILDING_MANAGER' ? 'QL' : 'KT'}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{rev.reviewerName}</span>
                      <span className="text-slate-400 text-xs">&rarr;</span>
                      <span className="font-medium text-slate-200 text-xs">{rev.targetUserName}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                      <Building2 className="w-3.5 h-3.5 text-blue-400" />
                      <span>{rev.roomName}</span>
                      <span>•</span>
                      <span>Ngày: {formatDateVN(rev.createdAt)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Số sao vàng */}
                  <div className="flex items-center gap-1 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
                    <span className="font-bold font-mono text-amber-400 text-sm mr-1">{rev.rating}.0</span>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star 
                        key={s} 
                        className={`w-4 h-4 ${
                          rev.rating >= s 
                            ? 'fill-amber-400 text-amber-400' 
                            : 'text-slate-700'
                        }`} 
                      />
                    ))}
                  </div>

                  {/* Cờ Khóa Đánh Giá Minh Bạch */}
                  {rev.isLocked && (
                    <span 
                      className="inline-flex items-center gap-1 text-[10px] bg-slate-950 text-slate-400 border border-slate-800 px-2.5 py-1 rounded-xl font-mono"
                      title="Đánh giá đã được khóa vĩnh viễn trong CSDL sau khi thanh toán trả phòng"
                    >
                      <Lock className="w-3 h-3 text-amber-400" />
                      ĐÃ KHÓA BẢO CHỨNG
                    </span>
                  )}
                </div>
              </div>

              {/* Nội dung nhận xét */}
              <div className="text-xs sm:text-sm text-slate-200 leading-relaxed bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 italic">
                "{rev.comment}"
              </div>

              <div className="flex justify-between items-center text-[11px] text-slate-500">
                <span className="flex items-center gap-1 text-emerald-400">
                  <CheckCircle2 className="w-3 h-3" />
                  Đã xác minh cư dân hợp lệ qua CCCD
                </span>
                <span className="font-mono">Mã đánh giá: #{rev.reviewId}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
