import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Incident, IncidentPriority, IncidentStatus } from '../../types';
import { formatVND, formatDate } from '../../utils/formatters';
import {
  Wrench,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Plus,
  Phone,
  Zap,
  Droplets,
  Tv,
  Shield,
  Sparkles,
} from 'lucide-react';

export const IncidentManagement: React.FC = () => {
  const { incidents, rooms, updateIncidentStatus, addIncident } = useApp();

  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  // New incident form
  const [formRoomId, setFormRoomId] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState<Incident['category']>('appliance');
  const [formPriority, setFormPriority] = useState<IncidentPriority>('medium');
  const [formReportedBy, setFormReportedBy] = useState('Chủ nhà ghi nhận');
  const [formPhone, setFormPhone] = useState('0908 123 456');

  // Selected incident to update cost & resolution
  const [resolvingIncident, setResolvingIncident] = useState<Incident | null>(null);
  const [resolveCost, setResolveCost] = useState<number>(0);
  const [resolveNotes, setResolveNotes] = useState<string>('');

  const filteredIncidents = incidents.filter(i => {
    if (filterStatus !== 'all' && i.status !== filterStatus) return false;
    return true;
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const room = rooms.find(r => r.id === formRoomId);
    if (!room) return;

    addIncident({
      roomId: room.id,
      roomNumber: room.roomNumber,
      buildingId: room.buildingId,
      title: formTitle.trim(),
      description: formDescription.trim(),
      category: formCategory,
      priority: formPriority,
      status: 'pending',
      reportedBy: formReportedBy.trim(),
      reportedPhone: formPhone.trim(),
    });

    setShowAddModal(false);
    setFormTitle('');
    setFormDescription('');
  };

  const handleConfirmResolve = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingIncident) return;

    updateIncidentStatus(resolvingIncident.id, 'resolved', Number(resolveCost), resolveNotes);
    setResolvingIncident(null);
  };

  const getCategoryIcon = (cat: Incident['category']) => {
    switch (cat) {
      case 'electricity': return <Zap className="w-4 h-4 text-amber-500" />;
      case 'water': return <Droplets className="w-4 h-4 text-blue-500" />;
      case 'appliance': return <Tv className="w-4 h-4 text-indigo-500" />;
      case 'security': return <Shield className="w-4 h-4 text-rose-500" />;
      default: return <Wrench className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {[
            { id: 'all', label: 'Tất cả sự cố' },
            { id: 'pending', label: 'Chờ tiếp nhận' },
            { id: 'in_progress', label: 'Đang xử lý / Đã hẹn thợ' },
            { id: 'resolved', label: 'Đã hoàn thành' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                filterStatus === tab.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => {
            if (rooms.length > 0) setFormRoomId(rooms[0].id);
            setShowAddModal(true);
          }}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Ghi Nhận Sự Cố Mới</span>
        </button>
      </div>

      {/* Incidents Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredIncidents.length === 0 ? (
          <div className="col-span-full bg-white p-12 text-center rounded-2xl border border-dashed border-slate-300 text-slate-400">
            Không có sự cố nào cần xử lý.
          </div>
        ) : (
          filteredIncidents.map(inc => {
            const isPending = inc.status === 'pending';
            const isInProgress = inc.status === 'in_progress';
            const isResolved = inc.status === 'resolved';

            return (
              <div
                key={inc.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-slate-100">
                        {getCategoryIcon(inc.category)}
                      </div>
                      <div>
                        <h3 className="font-extrabold text-slate-900 text-sm">
                          {inc.title}
                        </h3>
                        <div className="text-xs text-blue-600 font-semibold mt-0.5">
                          Phòng {inc.roomNumber} • Ngày báo: {formatDate(inc.createdAt)}
                        </div>
                      </div>
                    </div>

                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                      isResolved ? 'bg-emerald-100 text-emerald-800' :
                      isInProgress ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {isResolved ? 'Đã xong' : isInProgress ? 'Đang sửa' : 'Chờ xử lý'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 mt-3 p-3 bg-slate-50 rounded-xl leading-relaxed">
                    {inc.description}
                  </p>

                  <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                    <div>
                      Người báo: <strong>{inc.reportedBy}</strong> ({inc.reportedPhone})
                    </div>
                    {inc.cost !== undefined && inc.cost > 0 && (
                      <div className="text-slate-800 font-bold">
                        Chi phí sửa: <span className="text-rose-600">{formatVND(inc.cost)}</span>
                      </div>
                    )}
                  </div>

                  {inc.notes && (
                    <div className="mt-2 text-[11px] text-emerald-700 bg-emerald-50/70 p-2 rounded-lg font-medium">
                      ✓ Đã xử lý: {inc.notes}
                    </div>
                  )}
                </div>

                {/* Progress updates */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  {isPending && (
                    <button
                      onClick={() => updateIncidentStatus(inc.id, 'in_progress')}
                      className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-xs font-bold transition-colors"
                    >
                      Bắt Đầu Xử Lý / Gọi Thợ
                    </button>
                  )}

                  {!isResolved && (
                    <button
                      onClick={() => {
                        setResolvingIncident(inc);
                        setResolveCost(inc.cost || 0);
                        setResolveNotes(inc.notes || 'Đã sửa chữa và kiểm tra nghiệm thu.');
                      }}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Đánh Dấu Hoàn Thành</span>
                    </button>
                  )}
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* Complete Incident Modal */}
      {resolvingIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="font-bold text-slate-900 text-base">
              Nghiệm Thu Hoàn Thành Sự Cố P.{resolvingIncident.roomNumber}
            </h3>
            
            <form onSubmit={handleConfirmResolve} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Chi phí sửa chữa thực tế (VNĐ)
                </label>
                <input
                  type="number"
                  min="0"
                  step="10000"
                  value={resolveCost}
                  onChange={e => setResolveCost(Number(e.target.value))}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Ghi chú kết quả sửa chữa
                </label>
                <input
                  type="text"
                  value={resolveNotes}
                  onChange={e => setResolveNotes(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResolvingIncident(null)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold"
                >
                  Xác Nhận Đã Xong
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Incident Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Ghi Nhận Sự Cố / Yêu Cầu Sửa Chữa</h3>
            <form onSubmit={handleAddSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Phòng xảy ra sự cố</label>
                <select
                  value={formRoomId}
                  onChange={e => setFormRoomId(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                >
                  {rooms.map(r => (
                    <option key={r.id} value={r.id}>Phòng {r.roomNumber} - {r.buildingName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Tiêu đề sự cố</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Hỏng vòi nước, điều hòa không mát..."
                  value={formTitle}
                  onChange={e => setFormTitle(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Mô tả cụ thể</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Hiện trạng, vị trí hỏng..."
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Phân loại</label>
                  <select
                    value={formCategory}
                    onChange={e => setFormCategory(e.target.value as any)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                  >
                    <option value="electricity">Điện</option>
                    <option value="water">Nước</option>
                    <option value="appliance">Thiết bị (Điều hòa, tủ lạnh)</option>
                    <option value="security">An ninh / Khóa cửa</option>
                    <option value="cleanliness">Vệ sinh</option>
                    <option value="other">Khác</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Độ ưu tiên</label>
                  <select
                    value={formPriority}
                    onChange={e => setFormPriority(e.target.value as any)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                  >
                    <option value="low">Thấp (Bình thường)</option>
                    <option value="medium">Trung bình</option>
                    <option value="high">Cao</option>
                    <option value="urgent">Khẩn cấp</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold"
                >
                  Lưu Sự Cố
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
