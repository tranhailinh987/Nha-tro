import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { RoomManagement } from './RoomManagement';
import { BillingManagement } from './BillingManagement';
import { TenantManagement } from './TenantManagement';
import { IncidentManagement } from './IncidentManagement';
import { AppointmentManagement } from './AppointmentManagement';
import { formatVND } from '../../utils/formatters';
import {
  Building2,
  Layers,
  Receipt,
  Users,
  Wrench,
  Calendar,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Home,
  Plus,
} from 'lucide-react';

export const LandlordDashboard: React.FC = () => {
  const {
    buildings,
    rooms,
    bills,
    tenants,
    incidents,
    appointments,
    selectedBuildingId,
    setSelectedBuildingId,
  } = useApp();

  const [activeTab, setActiveTab] = useState<
    'rooms' | 'billing' | 'tenants' | 'incidents' | 'appointments'
  >('rooms');

  // Stats calculation
  const filteredRooms = selectedBuildingId === 'all'
    ? rooms
    : rooms.filter(r => r.buildingId === selectedBuildingId);

  const totalRoomsCount = filteredRooms.length;
  const occupiedRoomsCount = filteredRooms.filter(r => r.status === 'occupied').length;
  const availableRoomsCount = filteredRooms.filter(r => r.status === 'available').length;
  const occupancyRate = totalRoomsCount > 0 ? Math.round((occupiedRoomsCount / totalRoomsCount) * 100) : 0;

  const filteredBills = selectedBuildingId === 'all'
    ? bills
    : bills.filter(b => b.buildingId === selectedBuildingId);

  const totalRevenue = filteredBills.reduce((acc, b) => acc + b.totalAmount, 0);
  const collectedRevenue = filteredBills.filter(b => b.status === 'paid').reduce((acc, b) => acc + b.totalAmount, 0);
  const pendingIncidentsCount = incidents.filter(i => i.status !== 'resolved').length;
  const pendingAppointmentsCount = appointments.filter(a => a.status === 'pending').length;

  return (
    <div className="space-y-6 pb-16">
      
      {/* Top Banner & Building Selector */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 mb-1.5 border border-blue-200">
            <Building2 className="w-3.5 h-3.5" />
            <span>Khu Vực Quản Lý Chủ Trọ &amp; Vận Hành</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Bảng Điều Khiển Quản Lý Nhà Trọ
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Theo dõi phòng trống, tính toán hóa đơn điện nước tự động và quản lý hợp đồng khách thuê
          </p>
        </div>

        {/* Building Selector */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <label className="text-xs font-bold text-slate-600 whitespace-nowrap">Dãy trọ:</label>
          <select
            value={selectedBuildingId}
            onChange={e => setSelectedBuildingId(e.target.value)}
            className="w-full md:w-64 text-xs font-semibold p-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="all">Tất cả toà nhà ({buildings.length} toà)</option>
            {buildings.map(b => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.district})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Stats Ribbon */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Rooms & Occupancy */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Tỷ Lệ Lấp Đầy</span>
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
              <Home className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900">{occupancyRate}%</span>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
              {occupiedRoomsCount}/{totalRoomsCount} phòng
            </span>
          </div>
          <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100">
            <span>Còn trống: <strong className="text-emerald-700">{availableRoomsCount} phòng</strong></span>
            <span>Đang bảo trì: {filteredRooms.filter(r => r.status === 'maintenance').length}</span>
          </div>
        </div>

        {/* Revenue Expected */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Doanh Thu Tháng Này</span>
            <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-xl sm:text-2xl font-black text-slate-900">
              {formatVND(totalRevenue)}
            </span>
          </div>
          <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100">
            <span>Đã thu: <strong className="text-emerald-700">{formatVND(collectedRevenue)}</strong></span>
            <span>Chưa thu: <strong className="text-amber-700">{formatVND(totalRevenue - collectedRevenue)}</strong></span>
          </div>
        </div>

        {/* Tenants Count */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Khách Thuê Hiện Tại</span>
            <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900">{tenants.length} người</span>
            <span className="text-xs font-semibold text-slate-500">hợp đồng chuẩn</span>
          </div>
          <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-100 truncate">
            Tổng tiền cọc đang giữ: <strong className="text-slate-800">{formatVND(tenants.reduce((a, t) => a + t.depositPaid, 0))}</strong>
          </div>
        </div>

        {/* Incidents & Appointments */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Cần Xử Lý Nhanh</span>
            <div className="p-1.5 bg-rose-50 text-rose-600 rounded-lg">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-rose-700">
              {pendingIncidentsCount} sự cố
            </span>
            <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
              {pendingAppointmentsCount} lịch hẹn
            </span>
          </div>
          <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-100 flex items-center justify-between">
            <span>Bảo dưỡng điện nước</span>
            <button
              onClick={() => setActiveTab('incidents')}
              className="text-blue-600 hover:underline font-semibold"
            >
              Xem ngay
            </button>
          </div>
        </div>

      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 border-b border-slate-200">
        {[
          { id: 'rooms', label: 'Sơ Đồ & Phòng Trọ', icon: Layers, badge: filteredRooms.length },
          { id: 'billing', label: 'Hóa Đơn & Điện Nước', icon: Receipt, badge: filteredBills.filter(b => b.status === 'unpaid').length },
          { id: 'tenants', label: 'Khách Thuê & Hợp Đồng', icon: Users, badge: tenants.length },
          { id: 'incidents', label: 'Sự Cố & Báo Hỏng', icon: Wrench, badge: pendingIncidentsCount },
          { id: 'appointments', label: 'Lịch Hẹn Xem Phòng', icon: Calendar, badge: pendingAppointmentsCount },
        ].map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                active
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  active ? 'bg-white text-blue-700' : 'bg-slate-200 text-slate-700'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      {activeTab === 'rooms' && <RoomManagement />}
      {activeTab === 'billing' && <BillingManagement />}
      {activeTab === 'tenants' && <TenantManagement />}
      {activeTab === 'incidents' && <IncidentManagement />}
      {activeTab === 'appointments' && <AppointmentManagement />}

    </div>
  );
};
