import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Room, RoomCategory } from '../../types';
import { formatVND } from '../../utils/formatters';
import {
  Search,
  MapPin,
  Maximize2,
  Wind,
  Layers,
  Clock,
  Heart,
  Dog,
  Eye,
  CalendarCheck,
  CheckCircle2,
  Sparkles,
  SlidersHorizontal,
  X,
  Filter,
} from 'lucide-react';

interface RoomListingViewProps {
  onSelectRoom: (room: Room) => void;
  onBookAppointment: (room: Room) => void;
}

export const RoomListingView: React.FC<RoomListingViewProps> = ({
  onSelectRoom,
  onBookAppointment,
}) => {
  const { rooms } = useApp();

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [cityFilter, setCityFilter] = useState('all');
  const [districtFilter, setDistrictFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [priceRange, setPriceRange] = useState<string>('all');
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'recommended' | 'price_asc' | 'price_desc' | 'area_desc'>('recommended');

  // Toggle amenity
  const toggleAmenity = (key: string) => {
    setSelectedAmenities(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  // Unique cities & districts
  const cities = useMemo(() => {
    const set = new Set(rooms.map(r => r.city));
    return Array.from(set);
  }, [rooms]);

  const districts = useMemo(() => {
    const filtered = cityFilter === 'all' ? rooms : rooms.filter(r => r.city === cityFilter);
    const set = new Set(filtered.map(r => r.district));
    return Array.from(set);
  }, [rooms, cityFilter]);

  // Filtered rooms
  const filteredRooms = useMemo(() => {
    return rooms.filter(room => {
      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchTitle = room.roomNumber.toLowerCase().includes(query);
        const matchBuilding = room.buildingName.toLowerCase().includes(query);
        const matchAddress = room.address.toLowerCase().includes(query);
        const matchDistrict = room.district.toLowerCase().includes(query);
        const matchDesc = room.description.toLowerCase().includes(query);
        if (!matchTitle && !matchBuilding && !matchAddress && !matchDistrict && !matchDesc) {
          return false;
        }
      }

      // City
      if (cityFilter !== 'all' && room.city !== cityFilter) return false;

      // District
      if (districtFilter !== 'all' && room.district !== districtFilter) return false;

      // Category
      if (categoryFilter !== 'all' && room.category !== categoryFilter) return false;

      // Only available
      if (onlyAvailable && room.status !== 'available') return false;

      // Price range
      if (priceRange === 'under_3.5m' && room.price >= 3500000) return false;
      if (priceRange === '3.5m_to_5m' && (room.price < 3500000 || room.price > 5000000)) return false;
      if (priceRange === 'above_5m' && room.price <= 5000000) return false;

      // Amenities filter
      if (selectedAmenities.length > 0) {
        for (const am of selectedAmenities) {
          if (!(room.amenities as any)[am]) return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'price_asc') return a.price - b.price;
      if (sortBy === 'price_desc') return b.price - a.price;
      if (sortBy === 'area_desc') return b.area - a.area;
      // Recommended: Available rooms first, then by id
      if (a.status === 'available' && b.status !== 'available') return -1;
      if (b.status === 'available' && a.status !== 'available') return 1;
      return 0;
    });
  }, [rooms, searchTerm, cityFilter, districtFilter, categoryFilter, onlyAvailable, priceRange, selectedAmenities, sortBy]);

  const clearFilters = () => {
    setSearchTerm('');
    setCityFilter('all');
    setDistrictFilter('all');
    setCategoryFilter('all');
    setPriceRange('all');
    setOnlyAvailable(false);
    setSelectedAmenities([]);
    setSortBy('recommended');
  };

  const hasActiveFilters =
    searchTerm !== '' ||
    cityFilter !== 'all' ||
    districtFilter !== 'all' ||
    categoryFilter !== 'all' ||
    priceRange !== 'all' ||
    onlyAvailable ||
    selectedAmenities.length > 0;

  return (
    <div className="space-y-8 pb-16">
      
      {/* Hero Search Section */}
      <div className="relative rounded-3xl bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-900 text-white p-6 sm:p-10 shadow-xl overflow-hidden">
        {/* Subtle decorative circles */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold mb-4 border border-blue-400/20">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>Phòng Trọ Chính Chủ • Không Trung Gian • Giá Minh Bạch</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight text-white mb-3">
            Tìm phòng trọ, căn hộ mini &amp; studio ưng ý nhất
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-8">
            Khám phá phòng trọ tiện nghi, giờ giấc tự do, an ninh 24/7 tại TP.HCM &amp; Hà Nội với biểu phí điện nước công khai và hỗ trợ đặt lịch xem phòng trực tuyến.
          </p>

          {/* Quick Search Bar */}
          <div className="bg-white p-2.5 sm:p-3 rounded-2xl shadow-lg text-slate-800 flex flex-col md:flex-row items-stretch gap-2">
            
            {/* Search Input */}
            <div className="flex-1 flex items-center gap-2.5 px-3 py-2 bg-slate-50 rounded-xl border border-slate-200">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Tìm theo toà nhà, đường, quận (VD: Ung Văn Khiêm, Bình Thạnh)..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full text-sm bg-transparent outline-none placeholder:text-slate-400"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="text-slate-400 hover:text-slate-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* City Dropdown */}
            <div className="md:w-44 flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-slate-200">
              <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
              <select
                value={cityFilter}
                onChange={e => {
                  setCityFilter(e.target.value);
                  setDistrictFilter('all');
                }}
                className="w-full text-xs font-medium bg-transparent outline-none cursor-pointer"
              >
                <option value="all">Toàn quốc (Tất cả)</option>
                {cities.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* District Dropdown */}
            <div className="md:w-40 flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-slate-200">
              <select
                value={districtFilter}
                onChange={e => setDistrictFilter(e.target.value)}
                className="w-full text-xs font-medium bg-transparent outline-none cursor-pointer"
              >
                <option value="all">Tất cả quận/huyện</option>
                {districts.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            {/* Price Dropdown */}
            <div className="md:w-40 flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-slate-200">
              <select
                value={priceRange}
                onChange={e => setPriceRange(e.target.value)}
                className="w-full text-xs font-medium bg-transparent outline-none cursor-pointer"
              >
                <option value="all">Tất cả mức giá</option>
                <option value="under_3.5m">&lt; 3.5 triệu</option>
                <option value="3.5m_to_5m">3.5 - 5.0 triệu</option>
                <option value="above_5m">&gt; 5.0 triệu</option>
              </select>
            </div>

          </div>
        </div>
      </div>

      {/* Filter Chips Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          
          {/* Room Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: 'all', label: 'Tất cả loại phòng' },
              { id: 'boarding', label: 'Phòng trọ' },
              { id: 'mini_apartment', label: 'Căn hộ mini' },
              { id: 'studio', label: 'Studio cao cấp' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setCategoryFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                  categoryFilter === tab.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Sort & Quick Toggle */}
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 select-none">
              <input
                type="checkbox"
                checked={onlyAvailable}
                onChange={e => setOnlyAvailable(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
              />
              <span>Chỉ hiện phòng còn trống</span>
            </label>

            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="px-3 py-1.5 rounded-xl text-xs font-medium border border-slate-200 bg-slate-50 text-slate-700 cursor-pointer outline-none"
            >
              <option value="recommended">Ưu tiên còn trống</option>
              <option value="price_asc">Giá: Thấp đến Cao</option>
              <option value="price_desc">Giá: Cao đến Thấp</option>
              <option value="area_desc">Diện tích: Lớn đến Nhỏ</option>
            </select>
          </div>

        </div>

        {/* Amenity Filter Tags */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100">
          <span className="text-xs text-slate-400 font-medium mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Tiện nghi:
          </span>

          {[
            { key: 'airConditioner', label: 'Máy lạnh', icon: Wind },
            { key: 'mezzanine', label: 'Gác lửng', icon: Layers },
            { key: 'balcony', label: 'Ban công / Cửa sổ', icon: Maximize2 },
            { key: 'freeHours', label: 'Giờ tự do', icon: Clock },
            { key: 'petsAllowed', label: 'Cho nuôi thú cưng', icon: Dog },
          ].map(item => {
            const Icon = item.icon;
            const active = selectedAmenities.includes(item.key);
            return (
              <button
                key={item.key}
                onClick={() => toggleAmenity(item.key)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  active
                    ? 'bg-blue-50 text-blue-700 border border-blue-300 font-semibold'
                    : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-3 h-3" />
                <span>{item.label}</span>
              </button>
            );
          })}

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-xs text-red-600 hover:text-red-700 font-medium ml-auto flex items-center gap-1"
            >
              <X className="w-3 h-3" /> Xóa bộ lọc
            </button>
          )}
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-slate-900">
            Danh Sách Phòng Trọ
          </h2>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
            {filteredRooms.length} phòng
          </span>
        </div>

        <p className="text-xs text-slate-500 hidden sm:block">
          Cập nhật thông tin và bảng giá mới nhất tháng 10/2026
        </p>
      </div>

      {/* Room Grid */}
      {filteredRooms.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center max-w-lg mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4 text-slate-400">
            <Search className="w-7 h-7" />
          </div>
          <h3 className="font-bold text-slate-900 text-base mb-1">Không tìm thấy phòng phù hợp</h3>
          <p className="text-xs text-slate-500 mb-6">
            Thử điều chỉnh lại bộ lọc mức giá, khu vực hoặc bỏ bớt các tiêu chí tiện ích.
          </p>
          <button
            onClick={clearFilters}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition-colors shadow-xs"
          >
            Xem tất cả phòng trọ
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRooms.map(room => {
            const isAvailable = room.status === 'available';
            const isReserved = room.status === 'reserved';
            const isOccupied = room.status === 'occupied';

            return (
              <div
                key={room.id}
                className="group bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col"
              >
                {/* Image Cover */}
                <div className="relative aspect-16/10 overflow-hidden bg-slate-100">
                  <img
                    src={room.images[0]}
                    alt={`Phòng ${room.roomNumber}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />

                  {/* Status Badge */}
                  <div className="absolute top-3 left-3">
                    {isAvailable && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-600 text-white shadow-xs">
                        <CheckCircle2 className="w-3 h-3" /> Còn phòng
                      </span>
                    )}
                    {isReserved && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500 text-white shadow-xs">
                        Đã giữ cọc
                      </span>
                    )}
                    {isOccupied && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-700 text-white shadow-xs">
                        Đang có khách
                      </span>
                    )}
                  </div>

                  {/* Floor badge */}
                  <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-xs text-white text-[11px] font-semibold px-2 py-0.5 rounded-md">
                    Tầng {room.floor} • Phòng {room.roomNumber}
                  </div>

                  {/* Price Tag Overlay */}
                  <div className="absolute bottom-3 left-3 bg-slate-900/90 backdrop-blur-xs text-white px-3 py-1 rounded-xl shadow-xs">
                    <span className="text-base font-extrabold text-amber-400">
                      {formatVND(room.price)}
                    </span>
                    <span className="text-[11px] text-slate-300 font-normal"> /tháng</span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    
                    {/* Building & Address */}
                    <div>
                      <h3 className="font-bold text-slate-900 text-base group-hover:text-blue-600 transition-colors line-clamp-1">
                        {room.buildingName} - P.{room.roomNumber}
                      </h3>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 line-clamp-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{room.ward}, {room.district}, {room.city}</span>
                      </p>
                    </div>

                    {/* Quick Specs */}
                    <div className="flex items-center gap-3 text-xs text-slate-600 font-medium py-1.5 border-y border-slate-100">
                      <div className="flex items-center gap-1">
                        <Maximize2 className="w-3.5 h-3.5 text-blue-600" />
                        <span>{room.area} m²</span>
                      </div>
                      <span className="text-slate-300">•</span>
                      <div className="text-slate-600">
                        Tối đa {room.maxOccupants} người
                      </div>
                      <span className="text-slate-300">•</span>
                      <div className="text-slate-600">
                        Cọc: {formatVND(room.deposit)}
                      </div>
                    </div>

                    {/* Amenity Badges */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {room.amenities.airConditioner && (
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md text-[11px] font-medium flex items-center gap-1">
                          <Wind className="w-3 h-3" /> Máy lạnh
                        </span>
                      )}
                      {room.amenities.mezzanine && (
                        <span className="px-2 py-0.5 bg-amber-50 text-amber-800 rounded-md text-[11px] font-medium flex items-center gap-1">
                          <Layers className="w-3 h-3" /> Gác lửng
                        </span>
                      )}
                      {room.amenities.freeHours && (
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md text-[11px] font-medium flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Giờ tự do
                        </span>
                      )}
                      {room.amenities.petsAllowed && (
                        <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded-md text-[11px] font-medium flex items-center gap-1">
                          <Dog className="w-3 h-3" /> Nuôi thú cưng
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-2 flex items-center gap-2">
                    <button
                      onClick={() => onSelectRoom(room)}
                      className="flex-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Xem chi tiết &amp; Phí</span>
                    </button>

                    <button
                      onClick={() => onBookAppointment(room)}
                      className="py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors shadow-xs flex items-center gap-1.5"
                      title="Đặt lịch hẹn xem phòng trực tiếp"
                    >
                      <CalendarCheck className="w-3.5 h-3.5" />
                      <span>Hẹn xem</span>
                    </button>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
