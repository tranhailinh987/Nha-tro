import React from 'react';
import { useApp } from '../../context/AppContext';
import { formatDate } from '../../utils/formatters';
import {
  Calendar,
  Clock,
  Phone,
  CheckCircle2,
  XCircle,
  MapPin,
  User,
  MessageSquare,
} from 'lucide-react';

export const AppointmentManagement: React.FC = () => {
  const { appointments, updateAppointmentStatus } = useApp();

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <h3 className="font-extrabold text-slate-900 text-sm">
            Danh Sách Khách Hẹn Đến Xem Phòng
          </h3>
          <p className="text-xs text-slate-500">
            Khách hàng đăng ký đặt lịch trực tuyến từ cổng tìm kiếm phòng trọ
          </p>
        </div>
        <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-50 text-blue-700">
          {appointments.length} lịch hẹn
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {appointments.length === 0 ? (
          <div className="col-span-full bg-white p-12 text-center rounded-2xl border border-dashed border-slate-300 text-slate-400">
            Chưa có lịch hẹn xem phòng nào.
          </div>
        ) : (
          appointments.map(app => (
            <div
              key={app.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-slate-900 text-base">
                      {app.guestName}
                    </h4>
                    <div className="text-xs text-blue-600 font-semibold mt-0.5">
                      Xem Phòng {app.roomNumber} • {app.buildingName}
                    </div>
                  </div>

                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                    app.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                    app.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                    app.status === 'cancelled' ? 'bg-rose-100 text-rose-800' :
                    'bg-amber-100 text-amber-800'
                  }`}>
                    {app.status === 'confirmed' ? 'Đã xác nhận' :
                     app.status === 'completed' ? 'Đã xem xong' :
                     app.status === 'cancelled' ? 'Đã hủy' : 'Chờ liên hệ'}
                  </span>
                </div>

                <div className="mt-4 p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                    <span>Ngày hẹn: <strong>{formatDate(app.viewingDate)}</strong> lúc <strong>{app.viewingTime}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-blue-600" />
                    <span>SĐT khách: <strong className="text-slate-900">{app.guestPhone}</strong></span>
                  </div>
                  {app.notes && (
                    <div className="text-[11px] text-slate-500 italic pt-1">
                      "{app.notes}"
                    </div>
                  )}
                </div>
              </div>

              {/* Status Actions */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                <a
                  href={`tel:${app.guestPhone.replace(/\s+/g, '')}`}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5"
                >
                  <Phone className="w-3.5 h-3.5 text-blue-600" />
                  <span>Gọi Xác Nhận</span>
                </a>

                <div className="flex items-center gap-1.5">
                  {app.status === 'pending' && (
                    <button
                      onClick={() => updateAppointmentStatus(app.id, 'confirmed')}
                      className="px-3 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700"
                    >
                      Xác Nhận Hẹn
                    </button>
                  )}
                  {app.status === 'confirmed' && (
                    <button
                      onClick={() => updateAppointmentStatus(app.id, 'completed')}
                      className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700"
                    >
                      Đã Xem Phòng Xong
                    </button>
                  )}
                  {app.status !== 'cancelled' && app.status !== 'completed' && (
                    <button
                      onClick={() => updateAppointmentStatus(app.id, 'cancelled')}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                      title="Hủy lịch hẹn"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

            </div>
          ))
        )}
      </div>
    </div>
  );
};
