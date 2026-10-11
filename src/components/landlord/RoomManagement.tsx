import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Room, RoomStatus, RoomCategory } from '../../types';
import { formatVND } from '../../utils/formatters';
import {
  Plus,
  Edit2,
  Trash2,
  Maximize2,
  CheckCircle2,
  AlertCircle,
  Wrench,
  Search,
  Building2,
  User,
  Layers,
  Wind,
} from 'lucide-react';

export const RoomManagement: React.FC = () => {
  const {
    rooms,
    buildings,
    tenants,
    selectedBuildingId,
    addRoom,
    updateRoom,
    deleteRoom,
    updateRoomStatus,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'matrix' | 'table'>('matrix');
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Form State for Add / Edit
  const [formRoomNumber, setFormRoomNumber] = useState('');
  const [formBuildingId, setFormBuildingId] = useState(buildings[0]?.id || '');
  const [formFloor, setFormFloor] = useState(1);
  const [formCategory, setFormCategory] = useState<RoomCategory>('boarding');
  const [formArea, setFormArea] = useState(25);
  const [formPrice, setFormPrice] = useState(3800000);
  const [formDeposit, setFormDeposit] = useState(3800000);
  const [formStatus, setFormStatus] = useState<RoomStatus>('available');
  const [formMaxOccupants, setFormMaxOccupants] = useState(2);
  const [formDescription, setFormDescription] = useState('');
  const [formAmenities, setFormAmenities] = useState({
    airConditioner: true,
    waterHeater: true,
    mezzanine: true,
    balcony: false,
    fridge: false,
    washingMachine: false,
    privateBathroom: true,
    freeHours: true,
    petsAllowed: false,
    wifi: true,
    securityCamera: true,
    parking: true,
    kitchenShelf: true,
  });

  const openEditModal = (room: Room) => {
    setEditingRoom(room);
    setFormRoomNumber(room.roomNumber);
    setFormBuildingId(room.buildingId);
    setFormFloor(room.floor);
    setFormCategory(room.category);
    setFormArea(room.area);
    setFormPrice(room.price);
    setFormDeposit(room.deposit);
    setFormStatus(room.status);
    setFormMaxOccupants(room.maxOccupants);
    setFormDescription(room.description);
    setFormAmenities({ ...room.amenities });
    setShowAddModal(true);
  };

  const openAddModal = () => {
    setEditingRoom(null);
    setFormRoomNumber('');
    setFormBuildingId(selectedBuildingId !== 'all' ? selectedBuildingId : buildings[0]?.id || '');
    setFormFloor(1);
    setFormCategory('boarding');
    setFormArea(25);
    setFormPrice(3500000);
    setFormDeposit(3500000);
    setFormStatus('available');
    setFormMaxOccupants(2);
    setFormDescription('Phòng trọ mới sửa sạch sẽ, giờ giấc tự do, an ninh đảm bảo.');
    setFormAmenities({
      airConditioner: true,
      waterHeater: true,
      mezzanine: true,
      balcony: false,
      fridge: false,
      washingMachine: false,
      privateBathroom: true,
      freeHours: true,
      petsAllowed: false,
      wifi: true,
      securityCamera: true,
      parking: true,
      kitchenShelf: true,
    });
    setShowAddModal(true);
  };

  const handleSaveRoom = (e: React.FormEvent) => {
    e.preventDefault();
    const targetBuilding = buildings.find(b => b.id === formBuildingId) || buildings[0];

    const payload = {
      buildingId: targetBuilding.id,
      buildingName: targetBuilding.name,
      roomNumber: formRoomNumber.trim(),
      floor: Number(formFloor),
      category: formCategory,
      area: Number(formArea),
      price: Number(formPrice),
      deposit: Number(formDeposit),
      status: formStatus,
      maxOccupants: Number(formMaxOccupants),
      currentOccupants: formStatus === 'occupied' ? 1 : 0,
      amenities: formAmenities,
      description: formDescription.trim(),
      address: targetBuilding.address,
      ward: targetBuilding.ward,
      district: targetBuilding.district,
      city: targetBuilding.city,
      electricityRate: targetBuilding.electricityRate,
      waterRate: targetBuilding.waterRate,
      waterRateType: targetBuilding.waterRateType,
      internetFee: targetBuilding.internetFee,
      garbageFee: targetBuilding.garbageFee,
      parkingFee: targetBuilding.parkingFee,
      images: [
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80',
      ],
    };

    if (editingRoom) {
      updateRoom(editingRoom.id, payload);
    } else {
      addRoom(payload);
    }

    setShowAddModal(false);
  };

  // Filter rooms
  const filteredRooms = rooms.filter(r => {
    if (selectedBuildingId !== 'all' && r.buildingId !== selectedBuildingId) return false;
    if (filterStatus !== 'all' && r.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return r.roomNumber.toLowerCase().includes(q) || r.buildingName.toLowerCase().includes(q);
    }
    return true;
  });

  // Group by floor for matrix view
  const floors = Array.from(new Set(filteredRooms.map(r => r.floor))).sort((a, b) => a - b);

  return (
    <div className="space-y-6">
      
      {/* Top Header & Actions */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        
        {/* View mode toggle & filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('matrix')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                activeTab === 'matrix' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600'
              }`}
            >
              Sơ Đồ Tầng (Ma Trận)
            </button>
            <button
              onClick={() => setActiveTab('table')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                activeTab === 'table' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600'
              }`}
            >
              Danh Sách Bảng
            </button>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm số phòng..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-transparent outline-none w-28 sm:w-36"
            />
          </div>

          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-700 outline-none"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="available">Chỉ phòng trống</option>
            <option value="occupied">Đang có người ở</option>
            <option value="reserved">Đã cọc</option>
            <option value="maintenance">Đang bảo trì</option>
          </select>
        </div>

        {/* Add room button */}
        <button
          onClick={openAddModal}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm Phòng Mới</span>
        </button>

      </div>

      {/* MATRIX VIEW */}
      {activeTab === 'matrix' && (
        <div className="space-y-6">
          {floors.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-dashed border-slate-300 text-slate-400">
              Không có phòng nào theo bộ lọc hiện tại.
            </div>
          ) : (
            floors.map(floorNum => {
              const floorRooms = filteredRooms.filter(r => r.floor === floorNum);

              return (
                <div key={floorNum} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 text-xs font-extrabold flex items-center justify-center">
                        {floorNum}
                      </span>
                      <h3 className="font-extrabold text-slate-900 text-sm">
                        Tầng {floorNum}
                      </h3>
                      <span className="text-xs text-slate-500 font-medium">
                        ({floorRooms.length} phòng)
                      </span>
                    </div>

                    <div className="text-xs text-slate-500 flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span>Trống: {floorRooms.filter(r => r.status === 'available').length}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-blue-500" />
                        <span>Đang thuê: {floorRooms.filter(r => r.status === 'occupied').length}</span>
                      </span>
                    </div>
                  </div>

                  {/* Rooms on this floor */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {floorRooms.map(room => {
                      const tenant = tenants.find(t => t.roomId === room.id);
                      
                      let badgeColor = 'bg-emerald-50 border-emerald-300 text-emerald-800';
                      let statusText = 'Trống (Sẵn sàng)';
                      if (room.status === 'occupied') {
                        badgeColor = 'bg-blue-50 border-blue-200 text-blue-800';
                        statusText = tenant ? tenant.fullName : 'Đang thuê';
                      } else if (room.status === 'reserved') {
                        badgeColor = 'bg-amber-50 border-amber-300 text-amber-800';
                        statusText = 'Đã đặt cọc';
                      } else if (room.status === 'maintenance') {
                        badgeColor = 'bg-rose-50 border-rose-300 text-rose-800';
                        statusText = 'Đang bảo dưỡng';
                      }

                      return (
                        <div
                          key={room.id}
                          className={`p-3.5 rounded-2xl border transition-all ${badgeColor} hover:shadow-md flex flex-col justify-between space-y-3`}
                        >
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="font-black text-slate-900 text-base">
                                P.{room.roomNumber}
                              </span>
                              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-white/80 shadow-2xs">
                                {room.area} m²
                              </span>
                            </div>

                            <div className="text-sm font-extrabold text-slate-900 mt-1">
                              {formatVND(room.price)}
                              <span className="text-[11px] font-normal text-slate-500">/th</span>
                            </div>

                            <div className="text-xs font-semibold mt-2 flex items-center gap-1 truncate">
                              <User className="w-3 h-3 text-slate-500 shrink-0" />
                              <span className="truncate">{statusText}</span>
                            </div>
                          </div>

                          {/* Quick Status Dropdown & Edit */}
                          <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between gap-1 text-xs">
                            <select
                              value={room.status}
                              onChange={e => updateRoomStatus(room.id, e.target.value as RoomStatus)}
                              className="bg-white/90 border border-slate-200 rounded-lg px-2 py-1 text-[11px] font-semibold text-slate-700 outline-none cursor-pointer"
                            >
                              <option value="available">Trống</option>
                              <option value="occupied">Đang thuê</option>
                              <option value="reserved">Đã cọc</option>
                              <option value="maintenance">Sửa chữa</option>
                            </select>

                            <button
                              onClick={() => openEditModal(room)}
                              className="p-1 text-slate-500 hover:text-blue-600 rounded-md hover:bg-white"
                              title="Chỉnh sửa thông tin phòng"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TABLE VIEW */}
      {activeTab === 'table' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Số Phòng</th>
                  <th className="p-3.5">Dãy / Toà Nhà</th>
                  <th className="p-3.5">Tầng</th>
                  <th className="p-3.5">Diện Tích</th>
                  <th className="p-3.5">Giá Thuê</th>
                  <th className="p-3.5">Khách Đang Ở</th>
                  <th className="p-3.5">Trạng Thái</th>
                  <th className="p-3.5 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredRooms.map(r => {
                  const tenant = tenants.find(t => t.roomId === r.id);
                  return (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="p-3.5 font-bold text-slate-900 text-sm">
                        Phòng {r.roomNumber}
                      </td>
                      <td className="p-3.5">{r.buildingName}</td>
                      <td className="p-3.5">Tầng {r.floor}</td>
                      <td className="p-3.5">{r.area} m²</td>
                      <td className="p-3.5 font-bold text-slate-900">{formatVND(r.price)}</td>
                      <td className="p-3.5">
                        {tenant ? (
                          <span className="font-semibold text-blue-700">{tenant.fullName}</span>
                        ) : (
                          <span className="text-slate-400 italic">Chưa có khách</span>
                        )}
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          r.status === 'available' ? 'bg-emerald-100 text-emerald-800' :
                          r.status === 'occupied' ? 'bg-blue-100 text-blue-800' :
                          r.status === 'reserved' ? 'bg-amber-100 text-amber-800' :
                          'bg-rose-100 text-rose-800'
                        }`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEditModal(r)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-slate-100"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`Bạn có chắc chắn muốn xóa phòng ${r.roomNumber}?`)) {
                                deleteRoom(r.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Room Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-base">
                {editingRoom ? `Chỉnh Sửa Phòng ${editingRoom.roomNumber}` : 'Thêm Phòng Trọ Mới'}
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleSaveRoom} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Toà Nhà</label>
                  <select
                    value={formBuildingId}
                    onChange={e => setFormBuildingId(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
                  >
                    {buildings.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Số Phòng (VD: 204)</label>
                  <input
                    type="text"
                    required
                    value={formRoomNumber}
                    onChange={e => setFormRoomNumber(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Tầng</label>
                  <input
                    type="number"
                    min="1"
                    value={formFloor}
                    onChange={e => setFormFloor(Number(e.target.value))}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Diện Tích (m²)</label>
                  <input
                    type="number"
                    min="10"
                    value={formArea}
                    onChange={e => setFormArea(Number(e.target.value))}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Giá Thuê (VNĐ / tháng)</label>
                  <input
                    type="number"
                    step="50000"
                    value={formPrice}
                    onChange={e => setFormPrice(Number(e.target.value))}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white font-bold text-blue-700"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Tiền Cọc (VNĐ)</label>
                  <input
                    type="number"
                    step="50000"
                    value={formDeposit}
                    onChange={e => setFormDeposit(Number(e.target.value))}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Loại Phòng</label>
                  <select
                    value={formCategory}
                    onChange={e => setFormCategory(e.target.value as RoomCategory)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="boarding">Phòng trọ gác lửng</option>
                    <option value="mini_apartment">Căn hộ mini</option>
                    <option value="studio">Studio cao cấp</option>
                    <option value="dormitory">Ký túc xá</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Trạng Thái Ban Đầu</label>
                  <select
                    value={formStatus}
                    onChange={e => setFormStatus(e.target.value as RoomStatus)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="available">Còn trống</option>
                    <option value="occupied">Đang có người ở</option>
                    <option value="reserved">Đã cọc giữ chỗ</option>
                    <option value="maintenance">Đang bảo trì</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Mô Tả Phòng</label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
                />
              </div>

              {/* Amenity checkboxes */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-2">Tiện Nghi Có Sẵn</label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { key: 'airConditioner', label: 'Máy lạnh' },
                    { key: 'mezzanine', label: 'Gác lửng' },
                    { key: 'waterHeater', label: 'Máy nước nóng' },
                    { key: 'balcony', label: 'Ban công' },
                    { key: 'freeHours', label: 'Giờ tự do' },
                    { key: 'petsAllowed', label: 'Nuôi thú cưng' },
                    { key: 'fridge', label: 'Tủ lạnh' },
                    { key: 'washingMachine', label: 'Máy giặt' },
                  ].map(item => (
                    <label key={item.key} className="flex items-center gap-2 cursor-pointer text-slate-700">
                      <input
                        type="checkbox"
                        checked={(formAmenities as any)[item.key]}
                        onChange={e => setFormAmenities(prev => ({ ...prev, [item.key]: e.target.checked }))}
                        className="rounded text-blue-600"
                      />
                      <span>{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
                >
                  Lưu Thông Tin Phòng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
