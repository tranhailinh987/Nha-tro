import React, { useState, useMemo } from 'react';
import { 
  FolderTree, 
  ChevronRight, 
  ChevronDown, 
  Building2, 
  DoorClosed, 
  Layers, 
  Zap, 
  Flame, 
  Sparkles, 
  HelpCircle, 
  CheckCircle2, 
  Plus, 
  Wrench,
  Search,
  Maximize2,
  Minimize2,
  Edit3,
  Trash2,
  X,
  Sliders,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { ManagementNode, ObjectType, DeviceCondition } from '../types/rental';

interface RecursiveTreeProps {
  nodes: ManagementNode[];
  objectTypes: ObjectType[];
  onAddChildNode: (parentNodeId: number) => void;
  onUpdateCondition: (nodeId: number, condition: DeviceCondition) => void;
  onSelectNode?: (node: ManagementNode) => void;
  onUpdateNode?: (nodeId: number, updates: Partial<ManagementNode>) => void;
  onDeleteNode?: (nodeId: number) => void;
}

export const RecursiveTree: React.FC<RecursiveTreeProps> = ({
  nodes,
  objectTypes,
  onAddChildNode,
  onUpdateCondition,
  onSelectNode,
  onUpdateNode,
  onDeleteNode
}) => {
  const [collapsedNodes, setCollapsedNodes] = useState<Record<number, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');

  // State phục vụ Chỉnh Sửa Đối Tượng (Edit Node Modal)
  const [editingNode, setEditingNode] = useState<ManagementNode | null>(null);
  const [editName, setEditName] = useState('');
  const [editCode, setEditCode] = useState('');
  const [editTypeId, setEditTypeId] = useState<number>(1);
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editBillingType, setEditBillingType] = useState<'MONTHLY' | 'PER_USE'>('MONTHLY');
  const [editMonthlyPrice, setEditMonthlyPrice] = useState<number>(70000);
  const [editUnitPrice, setEditUnitPrice] = useState<number>(15000);
  const [editLocation, setEditLocation] = useState('');
  const [editSerial, setEditSerial] = useState('');
  const [editCondition, setEditCondition] = useState<DeviceCondition>(0);
  const [editNotes, setEditNotes] = useState('');
  const [editParentId, setEditParentId] = useState<number | null>(null);
  const [editSuccessAlert, setEditSuccessAlert] = useState<string | null>(null);
  const [lastUpdatedNotice, setLastUpdatedNotice] = useState<string | null>(null);
  const [recentlyUpdatedId, setRecentlyUpdatedId] = useState<number | null>(null);

  // Tìm tất cả ID con cháu của một node để tránh chọn chính nó hoặc con cháu làm cha (chống đệ quy vòng)
  const getDescendantIds = (parentId: number): number[] => {
    const direct = nodes.filter((n) => n.parentNodeId === parentId);
    let ids: number[] = [];
    direct.forEach((c) => {
      ids.push(c.nodeId);
      ids = ids.concat(getDescendantIds(c.nodeId));
    });
    return ids;
  };

  const handleOpenEdit = (node: ManagementNode, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingNode(node);
    setEditName(node.nodeName);
    setEditCode(node.nodeCode);
    setEditTypeId(node.typeId);
    setEditPrice(node.unitPrice || node.monthlyRentalPrice || 0);
    const isSharedDev = node.isShared === true;
    setEditBillingType(isSharedDev ? 'PER_USE' : 'MONTHLY');
    setEditMonthlyPrice(node.monthlyRentalPrice || node.unitPrice || 70000);
    setEditUnitPrice(node.unitPrice || 15000);
    setEditLocation(node.addressOrLocation || '');
    setEditSerial(node.serialNumber || '');
    setEditCondition(node.currentCondition);
    setEditNotes(node.notes || '');
    setEditParentId(node.parentNodeId);
    setEditSuccessAlert(null);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNode || !editName.trim() || !editCode.trim()) return;

    const isDevice = editTypeId >= 4 || editingNode.typeId >= 4;

    const finalUnitPrice = isDevice 
      ? (editBillingType === 'PER_USE' ? editUnitPrice : editMonthlyPrice) 
      : editPrice;

    const finalMonthlyPrice = isDevice && editBillingType === 'MONTHLY' 
      ? editMonthlyPrice 
      : (isDevice ? 0 : undefined);

    const isShared = isDevice 
      ? (editBillingType === 'PER_USE') 
      : editingNode.isShared;

    // Xác định roomNodeId nếu là thiết bị gắn phòng
    let assignedRoomId: number | null | undefined = undefined;
    if (isDevice) {
      if (isShared) {
        assignedRoomId = null;
      } else if (editParentId !== null) {
        const parentNode = nodes.find(n => n.nodeId === editParentId);
        if (parentNode && parentNode.typeId === 3) {
          assignedRoomId = parentNode.nodeId;
        }
      }
    }

    if (onUpdateNode) {
      onUpdateNode(editingNode.nodeId, {
        nodeName: editName.trim(),
        nodeCode: editCode.trim().toUpperCase(),
        typeId: editTypeId,
        unitPrice: finalUnitPrice,
        monthlyRentalPrice: finalMonthlyPrice,
        isShared,
        roomNodeId: assignedRoomId,
        addressOrLocation: editLocation.trim() || undefined,
        serialNumber: editSerial.trim() || undefined,
        currentCondition: editCondition,
        notes: editNotes.trim() || undefined,
        parentNodeId: editParentId
      });
    }

    // Mở rộng toàn bộ chuỗi nút cha & tổ tiên để nút luôn hiển thị trực quan ngay lập tức trong cây
    setCollapsedNodes((prev) => {
      const next = { ...prev };
      [editParentId, editingNode.parentNodeId].forEach((startId) => {
        let curr = startId;
        while (curr !== null) {
          delete next[curr];
          const pNode = nodes.find((n) => n.nodeId === curr);
          curr = pNode ? pNode.parentNodeId : null;
        }
      });
      return next;
    });

    const savedId = editingNode.nodeId;
    setRecentlyUpdatedId(savedId);
    setTimeout(() => {
      setRecentlyUpdatedId(null);
    }, 7000);

    const billingDesc = isDevice 
      ? (isShared ? ` [Phí ${finalUnitPrice.toLocaleString('vi-VN')} đ/lượt]` : ` [Thuê ${finalMonthlyPrice?.toLocaleString('vi-VN')} đ/tháng]`)
      : '';
    const notice = `✓ Đã cập nhật thành công đối tượng: "${editName.trim()}" [${editCode.trim().toUpperCase()}]${billingDesc}! Toàn bộ dữ liệu trên cây thực thể, danh mục thiết bị và hóa đơn phòng đã được đồng bộ hóa tức thì.`;
    setLastUpdatedNotice(notice);
    setEditingNode(null);
    setEditSuccessAlert(null);
    setTimeout(() => {
      setLastUpdatedNotice(null);
    }, 6000);
  };

  // Xây dựng cây phân cấp từ danh sách phẳng dùng thuật toán đệ quy
  const nodeMap = useMemo(() => new Set(nodes.map((n) => n.nodeId)), [nodes]);

  const buildTree = (parentId: number | null): ManagementNode[] => {
    return nodes
      .filter((n) => {
        if (parentId === null) {
          return n.parentNodeId === null || !nodeMap.has(n.parentNodeId);
        }
        return n.parentNodeId === parentId;
      })
      .map((n) => ({
        ...n,
        children: buildTree(n.nodeId)
      }));
  };

  const rootNodes = useMemo(() => buildTree(null), [nodes, nodeMap]);

  const toggleCollapse = (nodeId: number) => {
    setCollapsedNodes((prev) => ({
      ...prev,
      [nodeId]: !prev[nodeId]
    }));
  };

  const expandAll = () => setCollapsedNodes({});
  const collapseAll = () => {
    const allIds: Record<number, boolean> = {};
    nodes.forEach((n) => {
      allIds[n.nodeId] = true;
    });
    setCollapsedNodes(allIds);
  };

  // Hàm đệ quy thống kê trong nhánh
  const getSubtreeStats = (node: ManagementNode): { total: number; damaged: number; dirty: number; difficult: number } => {
    let total = 1;
    let damaged = node.currentCondition === 3 ? 1 : 0;
    let dirty = node.currentCondition === 1 ? 1 : 0;
    let difficult = node.currentCondition === 2 ? 1 : 0;

    const children = nodes.filter((n) => n.parentNodeId === node.nodeId);
    children.forEach((child) => {
      const s = getSubtreeStats(child);
      total += s.total;
      damaged += s.damaged;
      dirty += s.dirty;
      difficult += s.difficult;
    });

    return { total, damaged, dirty, difficult };
  };

  // Helper render icon theo loại
  const getNodeIcon = (typeId: number) => {
    const type = objectTypes.find((t) => t.typeId === typeId);
    if (!type) return <Layers className="w-4 h-4 text-slate-400" />;
    switch (type.typeCode) {
      case 'BUILDING':
        return <Building2 className="w-4 h-4 text-blue-400" />;
      case 'FLOOR':
        return <Layers className="w-4 h-4 text-indigo-400" />;
      case 'ROOM':
        return <DoorClosed className="w-4 h-4 text-emerald-400" />;
      case 'WASHING_MACHINE':
      case 'EV_CHARGER':
      case 'PUBLIC_PHONE':
      case 'AIR_COND':
      case 'FRIDGE':
      case 'WATER_HEATER':
      case 'POWER_METER':
      case 'WATER_METER':
      case 'SECURITY_GATE':
        return <Zap className="w-4 h-4 text-amber-400" />;
      default:
        return <FolderTree className="w-4 h-4 text-cyan-400" />;
    }
  };

  const getConditionBadge = (condition: DeviceCondition, nodeId: number) => {
    switch (condition) {
      case 3:
        return (
          <span 
            onClick={(e) => {
              e.stopPropagation();
              onUpdateCondition(nodeId, 0); // Click để khắc phục xong
            }}
            className="inline-flex items-center gap-1 text-[10px] bg-rose-950/80 border border-rose-600/80 text-rose-300 font-semibold px-2 py-0.5 rounded cursor-pointer hover:bg-rose-900"
            title="Bấm để đánh dấu: Đã sửa xong"
          >
            <Flame className="w-3 h-3 text-rose-400" />
            Hư hỏng (Bấm sửa xong)
          </span>
        );
      case 1:
        return (
          <span 
            onClick={(e) => {
              e.stopPropagation();
              onUpdateCondition(nodeId, 0);
            }}
            className="inline-flex items-center gap-1 text-[10px] bg-orange-950/80 border border-orange-600/80 text-orange-300 font-semibold px-2 py-0.5 rounded cursor-pointer hover:bg-orange-900"
            title="Bấm để đánh dấu: Tạp vụ đã dọn sạch"
          >
            <Sparkles className="w-3 h-3 text-orange-400" />
            Hay bẩn (Bấm đã vệ sinh)
          </span>
        );
      case 2:
        return (
          <span 
            onClick={(e) => {
              e.stopPropagation();
              onUpdateCondition(nodeId, 0);
            }}
            className="inline-flex items-center gap-1 text-[10px] bg-amber-950/80 border border-amber-600/80 text-amber-300 font-semibold px-2 py-0.5 rounded cursor-pointer hover:bg-amber-900"
            title="Bấm để đánh dấu: Đã dán tem hướng dẫn"
          >
            <HelpCircle className="w-3 h-3 text-amber-400" />
            Khó dùng (Bấm đã dán tem HD)
          </span>
        );
      default:
        return null;
    }
  };

  // Đệ quy render từng nhánh cây
  const renderTreeNode = (node: ManagementNode, depth: number = 0): React.ReactNode => {
    const children = nodes.filter((n) => n.parentNodeId === node.nodeId);
    const hasChildren = children.length > 0;
    const isCollapsed = collapsedNodes[node.nodeId];
    const stats = getSubtreeStats(node);
    const type = objectTypes.find((t) => t.typeId === node.typeId);

    // Tìm kiếm lọc
    if (
      searchQuery &&
      !node.nodeName.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !node.nodeCode.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !children.some((c) => c.nodeName.toLowerCase().includes(searchQuery.toLowerCase()))
    ) {
      return null;
    }

    const isRecentlyUpdated = recentlyUpdatedId === node.nodeId;

    return (
      <div key={node.nodeId} className="select-none">
        <div 
          onClick={() => onSelectNode && onSelectNode(node)}
          style={{ paddingLeft: `${depth * 20 + 8}px` }}
          className={`py-2 px-3 rounded-xl flex items-center justify-between gap-3 text-xs transition-all hover:bg-slate-800/80 group ${
            isRecentlyUpdated
              ? 'bg-emerald-950/90 border-2 border-emerald-400 ring-4 ring-emerald-500/25 shadow-xl shadow-emerald-950/60 font-bold'
              : depth === 0 
              ? 'bg-slate-900 border border-slate-800 font-bold mb-1' 
              : 'hover:bg-slate-800/50'
          }`}
        >
          {/* Tên & Trạng thái mở rộng */}
          <div className="flex items-center gap-2 min-w-0">
            {hasChildren ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleCollapse(node.nodeId);
                }}
                className="w-5 h-5 flex items-center justify-center rounded hover:bg-slate-700 text-slate-400"
              >
                {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            ) : (
              <span className="w-5 text-center text-slate-600">•</span>
            )}

            <div className="flex-shrink-0">{getNodeIcon(node.typeId)}</div>

            <div className="truncate flex items-center gap-1.5">
              <span className="font-semibold text-white">{node.nodeName}</span>
              <span className="text-[10px] text-slate-400 font-mono">[{node.nodeCode}]</span>
              {isRecentlyUpdated && (
                <span className="text-[10px] bg-emerald-400 text-slate-950 font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1 shadow animate-pulse">
                  <span>✨ Vừa cập nhật</span>
                </span>
              )}
              {type && (
                <span className="text-[10px] text-slate-500">({type.typeName})</span>
              )}
            </div>
          </div>

          {/* Badges & Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Tình trạng thiết bị */}
            {getConditionBadge(node.currentCondition, node.nodeId)}

            {/* Giá tiền và phân loại tính tiền rõ ràng */}
            {(() => {
              const isDeviceNode = node.typeId >= 4;
              const monthlyRentVal = (node.monthlyRentalPrice !== undefined && Number(node.monthlyRentalPrice) > 0)
                ? Number(node.monthlyRentalPrice)
                : (!node.isShared && node.unitPrice !== undefined && Number(node.unitPrice) > 0 && isDeviceNode)
                  ? Number(node.unitPrice)
                  : 0;

              if (isDeviceNode && !node.isShared) {
                if (monthlyRentVal > 0) {
                  return (
                    <span className="font-mono text-[11px] text-emerald-300 font-bold bg-emerald-950/80 border border-emerald-700/70 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                      <span>🟢 {monthlyRentVal.toLocaleString('vi-VN')} đ/tháng</span>
                    </span>
                  );
                } else {
                  return (
                    <span className="text-[10px] text-slate-300 font-semibold bg-slate-900 border border-slate-700 px-2 py-0.5 rounded-full">
                      Miễn phí đi kèm phòng (0 đ)
                    </span>
                  );
                }
              }

              if (node.isShared && node.unitPrice !== undefined && Number(node.unitPrice) > 0) {
                return (
                  <span className="font-mono text-[11px] text-purple-300 font-bold bg-purple-950/80 border border-purple-700/70 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                    <span>🟣 {Number(node.unitPrice).toLocaleString('vi-VN')} đ/lượt</span>
                  </span>
                );
              }

              if (node.unitPrice !== undefined && Number(node.unitPrice) > 0) {
                return (
                  <span className="font-mono text-[11px] text-emerald-400 font-semibold bg-emerald-950/40 border border-emerald-800/50 px-2 py-0.5 rounded">
                    {Number(node.unitPrice).toLocaleString('vi-VN')} đ{type?.metricUnit ? `/${type.metricUnit}` : ''}
                  </span>
                );
              }

              return null;
            })()}

            {/* Tag loại thiết bị nếu là thiết bị (typeId >= 4) */}
            {node.typeId >= 4 && (
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase ${
                node.isShared 
                  ? 'bg-purple-950 text-purple-300 border-purple-800' 
                  : 'bg-emerald-950 text-emerald-300 border-emerald-800'
              }`}>
                {node.isShared ? 'Dùng chung' : 'Trong phòng'}
              </span>
            )}

            {/* Thống kê con nếu có */}
            {hasChildren && (
              <span className="text-[10px] text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                {stats.total - 1} mục con
                {stats.damaged > 0 && <span className="text-rose-400 ml-1 font-bold">({stats.damaged} hỏng)</span>}
              </span>
            )}

            {/* CÁC NÚT THAO TÁC TRỰC QUAN: SỬA ĐỐI TƯỢNG, THÊM CON & XÓA */}
            <div className="flex items-center gap-1.5">
              {/* Nút Sửa đối tượng */}
              <button
                type="button"
                onClick={(e) => handleOpenEdit(node, e)}
                className="px-2 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-600 text-amber-300 hover:text-white border border-amber-500/40 text-[11px] font-semibold flex items-center gap-1 transition-all active:scale-95 shadow-sm"
                title={`Sửa thông tin đối tượng "${node.nodeName}"`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Sửa</span>
              </button>

              {/* Nút Thêm nút con */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddChildNode(node.nodeId);
                }}
                className="px-2 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-semibold flex items-center gap-1 transition-all active:scale-95 shadow"
                title={`Thêm đối tượng con vào "${node.nodeName}"`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Thêm con</span>
              </button>

              {/* Nút Xóa đối tượng */}
              {onDeleteNode && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteNode(node.nodeId);
                  }}
                  className="p-1 px-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40 text-[11px] flex items-center gap-1 transition-all active:scale-95 opacity-80 hover:opacity-100"
                  title={`Xóa đối tượng "${node.nodeName}" khỏi cây`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Render đệ quy các con nếu không bị thu gọn */}
        {hasChildren && !isCollapsed && (
          <div className="border-l border-slate-800/80 ml-5 pl-1 my-0.5">
            {children.map((child) => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header Bar của Cây */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/90 p-4 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <FolderTree className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Cấu Trúc Cây Quản Lý Thực Thể Đa Cấp</span>
              <span className="text-[10px] bg-amber-500/20 border border-amber-500/40 text-amber-300 px-2 py-0.5 rounded-full font-normal">
                Đầy đủ nút [Sửa] &amp; [+ Thêm con]
              </span>
            </h4>
            <p className="text-[11px] text-slate-400">
              Mỗi dòng đối tượng đều có nút <strong className="text-amber-400">[Sửa]</strong> (chỉnh sửa tên, mã, loại, giá, vị trí, tình trạng) và <strong className="text-blue-400">[+ Thêm con]</strong>.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Tìm kiếm */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo tên hoặc mã..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500 w-44"
            />
          </div>

          <button
            onClick={() => {
              setCollapsedNodes({});
              setLastUpdatedNotice('✓ Cây thực thể đã được làm mới và đồng bộ dữ liệu hoàn tất!');
              setTimeout(() => setLastUpdatedNotice(null), 3000);
            }}
            className="p-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-600/60 text-emerald-300 text-xs flex items-center gap-1 px-2.5 font-bold shadow-sm"
            title="Làm mới và mở rộng toàn bộ cấu trúc cây"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Làm mới</span>
          </button>
          <button
            onClick={expandAll}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1 px-2 font-medium"
            title="Mở rộng tất cả"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Mở hết</span>
          </button>
          <button
            onClick={collapseAll}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1 px-2 font-medium"
            title="Thu gọn tất cả"
          >
            <Minimize2 className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Thu gọn</span>
          </button>
        </div>
      </div>

      {/* Thông báo cập nhật thành công trực quan */}
      {lastUpdatedNotice && (
        <div className="p-3.5 rounded-2xl bg-emerald-950/90 border border-emerald-500/60 text-emerald-200 text-xs flex items-center justify-between gap-2 shadow-lg animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <span className="font-bold">{lastUpdatedNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setLastUpdatedNotice(null)}
            className="text-emerald-400 hover:text-white p-1 rounded-lg hover:bg-emerald-900/50"
          >
            ✕
          </button>
        </div>
      )}

      {/* Danh sách cây */}
      <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800/80 space-y-1 overflow-x-auto">
        {rootNodes.map((root: ManagementNode) => renderTreeNode(root, 0))}
      </div>

      {/* Modal Chỉnh Sửa Thông Tin Đối Tượng Quản Lý Trong Cây */}
      {editingNode && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Sửa Đối Tượng Quản Lý</h3>
                  <p className="text-xs text-slate-400">{editingNode.nodeName} [{editingNode.nodeCode}] (ID: #{editingNode.nodeId})</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingNode(null)}
                className="text-slate-400 hover:text-white text-sm p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editSuccessAlert && (
              <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{editSuccessAlert}</span>
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Tên Đối Tượng:</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="VD: Phòng 204, Điều Hòa Daikin..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Mã Đối Tượng (Code):</label>
                  <input
                    type="text"
                    value={editCode}
                    onChange={(e) => setEditCode(e.target.value)}
                    placeholder="VD: P-204, DEV-88"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono uppercase outline-none focus:border-amber-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Loại Đối Tượng:</label>
                  <select
                    value={editTypeId}
                    onChange={(e) => setEditTypeId(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-500"
                  >
                    {objectTypes.map((t) => (
                      <option key={t.typeId} value={t.typeId}>
                        {t.typeName} ({t.typeCode})
                      </option>
                    ))}
                  </select>
                </div>

                {!(editTypeId >= 4 || editingNode.typeId >= 4) && (
                  <div>
                    <label className="block text-slate-300 mb-1 font-semibold">Nút Cha Trực Thuộc (Cấp Trên):</label>
                    <select
                      value={editParentId === null ? '' : editParentId}
                      onChange={(e) => setEditParentId(e.target.value === '' ? null : Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-500"
                    >
                      <option value="">-- Nút Gốc (Cấp cao nhất / Không có cha) --</option>
                      {(() => {
                        const invalidIds = new Set([editingNode.nodeId, ...getDescendantIds(editingNode.nodeId)]);
                        return nodes
                          .filter((n) => !invalidIds.has(n.nodeId))
                          .map((p) => (
                            <option key={p.nodeId} value={p.nodeId}>
                              {p.nodeName} ({p.nodeCode})
                            </option>
                          ));
                      })()}
                    </select>
                  </div>
                )}
              </div>

              {/* Nếu là thiết bị (typeId >= 4), hiển thị tùy chọn Phương Thức Tính Tiền chi tiết */}
              {(editTypeId >= 4 || editingNode.typeId >= 4) ? (
                <div className="p-3.5 rounded-xl bg-slate-950 border border-indigo-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-white font-bold flex items-center gap-1.5 text-xs">
                      <span>⚙️ Cách Tính Tiền Thiết Bị:</span>
                    </label>
                    <span className="text-[10px] text-indigo-400 font-mono">
                      {editBillingType === 'MONTHLY' ? '🟢 Tính theo tháng' : '🟣 Tính theo lượt dùng'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setEditBillingType('MONTHLY')}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        editBillingType === 'MONTHLY'
                          ? 'bg-emerald-950/60 border-emerald-500 text-white shadow-lg shadow-emerald-950'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                      }`}
                    >
                      <div className="font-bold text-xs text-emerald-400 flex items-center gap-1">
                        <span>🟢 Theo Tháng</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1">
                        Cộng vào hóa đơn phòng hàng tháng (WiFi, ĐH, Tủ lạnh...)
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setEditBillingType('PER_USE')}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        editBillingType === 'PER_USE'
                          ? 'bg-purple-950/60 border-purple-500 text-white shadow-lg shadow-purple-950'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                      }`}
                    >
                      <div className="font-bold text-xs text-purple-400 flex items-center gap-1">
                        <span>🟣 Theo Lượt Dùng</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1">
                        Dùng chung cả nhà, tính tiền theo lần dùng (Giặt, Sạc EV...)
                      </div>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {editBillingType === 'MONTHLY' ? (
                      <>
                        <div>
                          <label className="block text-emerald-300 mb-1 font-semibold">
                            Đơn Giá Thuê Theo Tháng (đ/tháng):
                          </label>
                          <input
                            type="number"
                            min={0}
                            step={1000}
                            value={editMonthlyPrice}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setEditMonthlyPrice(val);
                              setEditPrice(val);
                            }}
                            className="w-full bg-slate-900 border border-emerald-700/60 rounded-xl px-3 py-2 text-emerald-400 font-mono font-bold outline-none focus:border-emerald-500"
                          />
                          <span className="text-[10px] text-slate-500 mt-0.5 block">
                            Tiền thuê thiết bị cố định mỗi tháng
                          </span>
                        </div>

                        <div>
                          <label className="block text-emerald-300 mb-1 font-semibold">
                            Gán Vào Phòng Cụ Thể (Thuê Tháng):
                          </label>
                          <select
                            value={editParentId === null ? '' : editParentId}
                            onChange={(e) => {
                              const targetId = e.target.value === '' ? null : Number(e.target.value);
                              setEditParentId(targetId);
                              if (targetId) {
                                const targetRoom = nodes.find(n => n.nodeId === targetId);
                                if (targetRoom) {
                                  setEditLocation(`Phòng ${targetRoom.nodeName}`);
                                }
                              }
                            }}
                            className="w-full bg-slate-900 border border-emerald-700/60 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500 font-medium"
                          >
                            <option value="">-- Chọn Phòng Thuê Để Gán Thiết Bị --</option>
                            {nodes
                              .filter((n) => n.typeId === 3)
                              .map((r) => {
                                const bNode = nodes.find(p => p.nodeId === r.buildingNodeId || p.nodeId === r.parentNodeId);
                                return (
                                  <option key={r.nodeId} value={r.nodeId}>
                                    {r.nodeName} [{r.nodeCode}] {bNode ? `• ${bNode.nodeName}` : ''}
                                  </option>
                                );
                              })}
                          </select>
                          <span className="text-[10px] text-slate-500 mt-0.5 block">
                            Thiết bị sẽ nằm dưới phòng này trên cây & cộng vào hóa đơn phòng
                          </span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <label className="block text-purple-300 mb-1 font-semibold">
                            Phí Dùng Chung Theo Lượt (đ/lượt):
                          </label>
                          <input
                            type="number"
                            min={0}
                            step={1000}
                            value={editUnitPrice}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setEditUnitPrice(val);
                              setEditPrice(val);
                            }}
                            className="w-full bg-slate-900 border border-purple-700/60 rounded-xl px-3 py-2 text-purple-400 font-mono font-bold outline-none focus:border-purple-500"
                          />
                          <span className="text-[10px] text-slate-500 mt-0.5 block">
                            Tính mỗi lần cư dân kích hoạt sử dụng
                          </span>
                        </div>

                        <div>
                          <label className="block text-purple-300 mb-1 font-semibold">
                            Vị Trí Tiện Ích Dùng Chung (Khu Vực):
                          </label>
                          <select
                            value={editParentId === null ? '' : editParentId}
                            onChange={(e) => {
                              const targetId = e.target.value === '' ? null : Number(e.target.value);
                              setEditParentId(targetId);
                              if (targetId) {
                                const targetArea = nodes.find(n => n.nodeId === targetId);
                                if (targetArea) {
                                  setEditLocation(targetArea.nodeName);
                                }
                              }
                            }}
                            className="w-full bg-slate-900 border border-purple-700/60 rounded-xl px-3 py-2 text-white outline-none focus:border-purple-500 font-medium"
                          >
                            <option value="">-- Khu Vực Sảnh / Tòa Nhà Chung --</option>
                            {nodes
                              .filter((n) => n.typeId === 1 || n.typeId === 2)
                              .map((area) => (
                                <option key={area.nodeId} value={area.nodeId}>
                                  {area.nodeName} [{area.nodeCode}]
                                </option>
                              ))}
                          </select>
                          <span className="text-[10px] text-slate-500 mt-0.5 block">
                            Thiết bị dùng chung sẽ nằm dưới khu tiện ích này trên cây
                          </span>
                        </div>
                      </>
                    )}

                    <div className="sm:col-span-2">
                      <label className="block text-slate-300 mb-1 font-semibold">Tình Trạng Thiết Bị:</label>
                      <select
                        value={editCondition}
                        onChange={(e) => setEditCondition(Number(e.target.value) as DeviceCondition)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-500"
                      >
                        <option value={0}>✓ Bình thường (Hoạt động tốt)</option>
                        <option value={1}>⚠️ Hay bẩn (Cần vệ sinh định kỳ)</option>
                        <option value={2}>❓ Khó dùng (Cần dán tem hướng dẫn)</option>
                        <option value={3}>🔥 Hư hỏng (Cần bảo trì / sửa chữa)</option>
                      </select>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 mb-1 font-semibold">Đơn Giá / Định Giá (VNĐ):</label>
                    <input
                      type="number"
                      min={0}
                      step={1000}
                      value={editPrice}
                      onChange={(e) => setEditPrice(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-emerald-400 font-mono font-bold outline-none focus:border-emerald-500"
                    />
                    <span className="text-[10px] text-slate-500 mt-0.5 block">
                      Định giá đối tượng (tiền thuê hoặc đơn giá)
                    </span>
                  </div>

                  <div>
                    <label className="block text-slate-300 mb-1 font-semibold">Tình Trạng / Hoạt Động:</label>
                    <select
                      value={editCondition}
                      onChange={(e) => setEditCondition(Number(e.target.value) as DeviceCondition)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-500"
                    >
                      <option value={0}>✓ Bình thường (Hoạt động tốt)</option>
                      <option value={1}>⚠️ Cần bảo dưỡng định kỳ</option>
                      <option value={2}>❓ Khó vận hành</option>
                      <option value={3}>🔥 Hư hỏng (Cần sửa chữa)</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Vị Trí Cụ Thể / Địa Chỉ:</label>
                  <input
                    type="text"
                    value={editLocation}
                    onChange={(e) => setEditLocation(e.target.value)}
                    placeholder="VD: Sảnh T1, Ban công phòng 201..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Số Serial / Model (nếu có):</label>
                  <input
                    type="text"
                    value={editSerial}
                    onChange={(e) => setEditSerial(e.target.value)}
                    placeholder="VD: SN-2026-DK900"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Ghi Chú Bổ Sung:</label>
                <textarea
                  rows={2}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Ghi chú thêm về thiết bị, đặc điểm lắp đặt..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingNode(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white font-medium"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold shadow-lg shadow-amber-600/30 flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Lưu Thay Đổi</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
