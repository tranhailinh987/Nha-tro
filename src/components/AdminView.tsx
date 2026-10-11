import React, { useState } from 'react';
import { 
  Building2, 
  ShieldCheck, 
  FolderTree, 
  BarChart3, 
  Plus, 
  Users, 
  CheckCircle2, 
  Flame, 
  Sparkles, 
  HelpCircle, 
  Zap, 
  Calendar, 
  TrendingUp, 
  Layers,
  MapPin,
  FileCode2,
  Check,
  DoorClosed,
  Trash2,
  Edit3,
  Tag,
  ChevronDown,
  ChevronUp, 
  Cpu, 
  CornerDownRight, 
  Camera, 
  Upload, 
  Eye, 
  X,
  CreditCard,
  PlusCircle,
  DollarSign,
  Wifi,
  Home,
  Droplets,
  Sliders,
  UserCheck,
  Search
} from 'lucide-react';
import { 
  User, 
  RoleType,
  ManagementNode, 
  ObjectType, 
  DeviceIssueReport, 
  RentalContract, 
  MonthlyInvoice, 
  DeviceCondition,
  Roommate
} from '../types/rental';
import { 
  checkIsResidenceFeeBillingMonth, 
  getRoomOccupantCount 
} from '../utils/utilityCalculations';
import { formatDateVN, formatDateTimeVN } from '../utils/dateUtils';
import { RecursiveTree } from './RecursiveTree';
import { DevicePriceScheduleModal } from './DevicePriceScheduleModal';
import { DevicePhotoModal, getDeviceCategoryIcon, getDevicePhotoUrl } from './DevicePhotoModal';

interface AdminViewProps {
  currentUser: User;
  allUsers: User[];
  nodes: ManagementNode[];
  objectTypes: ObjectType[];
  issues: DeviceIssueReport[];
  contracts: RentalContract[];
  roommates?: Roommate[];
  invoices: MonthlyInvoice[];
  onAddObjectType: (typeCode: string, typeName: string, category: 'PROPERTY' | 'ROOM' | 'DEVICE' | 'PUBLIC_SERVICE', unit: string) => void;
  onAddChildNode: (parentNodeId: number, typeId: number, code: string, name: string, price?: number) => void;
  onUpdateCondition: (nodeId: number, condition: DeviceCondition) => void;
  onOpenAddBuildingModal: () => void;
  onOpenAddRoomModal?: (buildingId?: number) => void;
  onAddRoom?: (buildingNodeId: number, roomName: string, rent: number, deposit: number, roomCode?: string, priceNote?: string) => void;
  onDeleteRoom?: (roomNodeId: number) => void;
  onUpdateRoomPrice?: (roomNodeId: number, newPrice: number, priceNote?: string) => void;
  onAssignManagerToBuilding?: (buildingNodeId: number, managerUserId: number) => void;
  onAddDeviceToBuilding?: (
    buildingNodeId: number, 
    deviceName: string, 
    typeId: number, 
    serialNumber?: string, 
    isShared?: boolean, 
    roomNodeId?: number | null, 
    location?: string,
    unitPrice?: number,
    monthlyRentalPrice?: number,
    monthlyPriceSchedule?: { [monthYear: string]: number },
    imageUrl?: string
  ) => void;
  onAssignDeviceToRoom?: (deviceNodeId: number, roomNodeId: number | null, isShared?: boolean, newPrice?: number) => void;
  onDeleteDevice?: (deviceNodeId: number) => void;
  onUpdateDeviceMonthlyPrice?: (deviceNodeId: number, monthYear: string, newPrice: number) => void;
  onRecalculateInvoicesForMonth?: (monthYear: string) => void;
  onApproveInvoice?: (invoiceId: number) => void;
  onCreateMonthlyInvoice?: (
    contractId: number, 
    targetMonthYear: string, 
    currElectric: number, 
    currWater: number, 
    sharedCost?: number, 
    customElectricRate?: number, 
    customWaterRate?: number,
    customOccupantCount?: number,
    customSanitationFeePerPerson?: number,
    customResidenceFeePerPerson?: number,
    customIsResidenceFeeApplied?: boolean
  ) => void;
  onUpdateInvoiceMeters?: (
    invoiceId: number, 
    currElectric: number, 
    currWater: number, 
    newElectricRate?: number, 
    newWaterRate?: number,
    newOccupantCount?: number,
    newSanitationFeePerPerson?: number,
    newResidenceFeePerPerson?: number,
    newIsResidenceFeeApplied?: boolean
  ) => void;
  onUpdateBuildingUtilityRates?: (
    buildingNodeId: number, 
    electricRate: number, 
    waterRate: number,
    sanitationFeePerPerson?: number,
    residenceFeePerPerson?: number
  ) => void;
  onUpdateUserRole?: (targetUserId: number, newRoleId: RoleType) => void;
  onUpdateNode?: (nodeId: number, updates: Partial<ManagementNode>) => void;
  onDeleteNode?: (nodeId: number) => void;
}

export const AdminView: React.FC<AdminViewProps> = ({
  currentUser,
  allUsers,
  nodes,
  objectTypes,
  issues,
  contracts,
  roommates,
  invoices,
  onAddObjectType,
  onAddChildNode,
  onUpdateCondition,
  onOpenAddBuildingModal,
  onOpenAddRoomModal,
  onAddRoom,
  onDeleteRoom,
  onUpdateRoomPrice,
  onAssignManagerToBuilding,
  onAddDeviceToBuilding,
  onAssignDeviceToRoom,
  onDeleteDevice,
  onUpdateDeviceMonthlyPrice,
  onRecalculateInvoicesForMonth,
  onApproveInvoice,
  onCreateMonthlyInvoice,
  onUpdateInvoiceMeters,
  onUpdateBuildingUtilityRates,
  onUpdateUserRole,
  onUpdateNode,
  onDeleteNode
}) => {
  const [activeTab, setActiveTab] = useState<'tree' | 'buildings' | 'devices' | 'invoices' | 'objectTypes' | 'analytics' | 'users' | 'addNode'>('buildings');

  // Tìm kiếm & Lọc nhân sự phân quyền
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<'ALL' | 1 | 2 | 3>('ALL');

  // Quản lý hóa đơn & duyệt chốt sổ phía Admin Cấp 1
  const [adminInvMonthFilter, setAdminInvMonthFilter] = useState<string>('ALL');
  const [showAdminCreateInvModal, setShowAdminCreateInvModal] = useState<boolean>(false);
  const [adminNewInvContractId, setAdminNewInvContractId] = useState<number>(contracts[0]?.contractId || 1);
  const [adminNewInvMonthYear, setAdminNewInvMonthYear] = useState<string>('12/2026');
  const [adminNewInvElec, setAdminNewInvElec] = useState<number>(1650);
  const [adminNewInvWater, setAdminNewInvWater] = useState<number>(75);
  const [adminNewInvShared, setAdminNewInvShared] = useState<number>(50000);
  const [adminNewInvElectricRate, setAdminNewInvElectricRate] = useState<number>(3800);
  const [adminNewInvWaterRate, setAdminNewInvWaterRate] = useState<number>(30000);
  const [adminNewInvOccupantCount, setAdminNewInvOccupantCount] = useState<number>(1);
  const [adminNewInvSanitationRate, setAdminNewInvSanitationRate] = useState<number>(30000);
  const [adminNewInvResidenceRate, setAdminNewInvResidenceRate] = useState<number>(100000);
  const [adminNewInvApplyResidence, setAdminNewInvApplyResidence] = useState<boolean>(false);

  // Modal Cài đặt Đơn giá Điện Nước & Phí Dịch Vụ cho Tòa Nhà
  const [adminEditingBuildingRates, setAdminEditingBuildingRates] = useState<ManagementNode | null>(null);
  const [adminEditBuildingElecRate, setAdminEditBuildingElecRate] = useState<number>(3800);
  const [adminEditBuildingWaterRate, setAdminEditBuildingWaterRate] = useState<number>(30000);
  const [adminEditBuildingSanitationRate, setAdminEditBuildingSanitationRate] = useState<number>(30000);
  const [adminEditBuildingResidenceRate, setAdminEditBuildingResidenceRate] = useState<number>(100000);

  // Chỉnh sửa số điện nước & các loại phí trực tiếp trên hóa đơn dự thảo
  const [adminEditingInvoiceMeters, setAdminEditingInvoiceMeters] = useState<MonthlyInvoice | null>(null);
  const [adminEditInvCurrElec, setAdminEditInvCurrElec] = useState<number>(0);
  const [adminEditInvCurrWater, setAdminEditInvCurrWater] = useState<number>(0);
  const [adminEditInvElecRate, setAdminEditInvElecRate] = useState<number>(3800);
  const [adminEditInvWaterRate, setAdminEditInvWaterRate] = useState<number>(30000);
  const [adminEditInvOccupantCount, setAdminEditInvOccupantCount] = useState<number>(1);
  const [adminEditInvSanitationRate, setAdminEditInvSanitationRate] = useState<number>(30000);
  const [adminEditInvResidenceRate, setAdminEditInvResidenceRate] = useState<number>(100000);
  const [adminEditInvApplyResidence, setAdminEditInvApplyResidence] = useState<boolean>(false);

  // Modal Thêm Loại Đối Tượng Mới (ObjectTypes)
  const [showAddTypeModal, setShowAddTypeModal] = useState(false);
  const [newTypeCode, setNewTypeCode] = useState('');
  const [newTypeName, setNewTypeName] = useState('');
  const [newTypeCategory, setNewTypeCategory] = useState<'PROPERTY' | 'ROOM' | 'DEVICE' | 'PUBLIC_SERVICE'>('DEVICE');
  const [newTypeUnit, setNewTypeUnit] = useState('Lần');

  // Modal Thêm Nút Con Vào Cây (ManagementNodes)
  const [showAddNodeModal, setShowAddNodeModal] = useState(false);
  const [targetParentId, setTargetParentId] = useState<number>(1);
  const [newNodeTypeId, setNewNodeTypeId] = useState<number>(4);
  const [newNodeCode, setNewNodeCode] = useState('');
  const [newNodeName, setNewNodeName] = useState('');
  const [newNodePrice, setNewNodePrice] = useState<number>(15000);

  // Quản lý phòng & ấn định giá theo từng thời điểm dành cho Admin Cấp 1
  const [showAdminAddRoomModal, setShowAdminAddRoomModal] = useState(false);
  const [adminRoomBuildingId, setAdminRoomBuildingId] = useState<number>(1);
  const [adminRoomCode, setAdminRoomCode] = useState('');
  const [adminRoomName, setAdminRoomName] = useState('');
  const [adminRoomRent, setAdminRoomRent] = useState<number>(4500000);
  const [adminRoomDeposit, setAdminRoomDeposit] = useState<number>(4500000);
  const [adminRoomPriceNote, setAdminRoomPriceNote] = useState('Giá tiêu chuẩn');

  const [adminEditingPriceRoom, setAdminEditingPriceRoom] = useState<ManagementNode | null>(null);
  const [adminEditPriceValue, setAdminEditPriceValue] = useState<number>(4500000);
  const [adminEditPriceNote, setAdminEditPriceNote] = useState<string>('Giá mùa cao điểm tháng 9/2026');

  const [expandedBuildingId, setExpandedBuildingId] = useState<number | null>(null);

  // Bộ lọc chu kỳ báo cáo tổng hợp
  const [reportPeriod, setReportPeriod] = useState<'MONTH' | 'QUARTER' | 'YEAR'>('MONTH');

  // Quản lý thiết bị theo từng nhà dành cho Admin cấp 1
  const allBuildings = nodes.filter((n) => n.parentNodeId === null);
  const [adminSelectedBuildingForDevices, setAdminSelectedBuildingForDevices] = useState<number>(allBuildings[0]?.nodeId || 1);
  const [adminDeviceCategoryFilter, setAdminDeviceCategoryFilter] = useState<'ALL' | 'SHARED' | 'ROOM' | 'UNASSIGNED'>('ALL');
  const [adminSelectedRoomFilter, setAdminSelectedRoomFilter] = useState<number | 'ALL'>('ALL');

  // Modal Thêm Thiết Bị Của Admin
  const [showAdminAddDeviceModal, setShowAdminAddDeviceModal] = useState(false);
  const [adminNewDevBuildingId, setAdminNewDevBuildingId] = useState<number>(allBuildings[0]?.nodeId || 1);
  const [adminNewDevName, setAdminNewDevName] = useState('');
  const [adminNewDevTypeId, setAdminNewDevTypeId] = useState<number>(11);
  const [adminNewDevSerial, setAdminNewDevSerial] = useState('');
  const [adminNewDevIsShared, setAdminNewDevIsShared] = useState(false);
  const [adminNewDevRoomId, setAdminNewDevRoomId] = useState<number | null>(null);
  const [adminNewDevLocation, setAdminNewDevLocation] = useState('');
  const [adminNewDevUnitPrice, setAdminNewDevUnitPrice] = useState<number>(15000); // Cho thiết bị dùng chung (đ/lượt)
  const [adminNewDevMonthlyRentalPrice, setAdminNewDevMonthlyRentalPrice] = useState<number>(120000); // Cho thiết bị theo phòng (đ/tháng)
  const [adminNewDevImageUrl, setAdminNewDevImageUrl] = useState<string>(''); // Ảnh thiết bị
  const [showAdminPriceScheduleModal, setShowAdminPriceScheduleModal] = useState<boolean>(false);
  const [adminSelectedDevForPriceSchedule, setAdminSelectedDevForPriceSchedule] = useState<number | null>(null);
  const [adminSelectedDeviceForPhoto, setAdminSelectedDeviceForPhoto] = useState<ManagementNode | null>(null);

  const handleAdminDevImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setAdminNewDevImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Modal Gán / Chuyển Thiết Bị & Đổi Cách Tính Tiền của Admin
  const [adminAssigningDevice, setAdminAssigningDevice] = useState<ManagementNode | null>(null);
  const [adminTargetRoomForAssign, setAdminTargetRoomForAssign] = useState<number | null>(null);
  const [adminAssigningBillingMode, setAdminAssigningBillingMode] = useState<'MONTHLY' | 'PER_USE'>('MONTHLY');
  const [adminAssigningUnitPrice, setAdminAssigningUnitPrice] = useState<number>(15000);
  const [adminAssigningMonthlyPrice, setAdminAssigningMonthlyPrice] = useState<number>(70000);

  const handleOpenAdminAssignDevice = (dev: ManagementNode) => {
    setAdminAssigningDevice(dev);
    const isSharedDev = dev.isShared === true;
    setAdminAssigningBillingMode(isSharedDev ? 'PER_USE' : 'MONTHLY');
    setAdminAssigningUnitPrice(dev.unitPrice || 15000);
    setAdminAssigningMonthlyPrice(dev.monthlyRentalPrice || 70000);
    setAdminTargetRoomForAssign(dev.roomNodeId || adminRoomsInCurrentBuilding[0]?.nodeId || null);
  };

  const adminCurrentBuildingNode = allBuildings.find(b => b.nodeId === adminSelectedBuildingForDevices) || allBuildings[0];
  const adminCurrentBuildingId = adminCurrentBuildingNode?.nodeId || 1;

  const adminRoomsInCurrentBuilding = nodes.filter(
    (n) => n.typeId === 3 && (
      n.parentNodeId === adminCurrentBuildingId ||
      nodes.some(p => p.nodeId === n.parentNodeId && p.parentNodeId === adminCurrentBuildingId)
    )
  );
  const adminRoomIdsInCurrentBuilding = new Set(adminRoomsInCurrentBuilding.map(r => r.nodeId));

  const adminDevicesOfSelectedBuilding = nodes.filter((n) => {
    if (n.typeId < 4) return false;
    if (n.buildingNodeId === adminCurrentBuildingId) return true;
    if (n.parentNodeId === adminCurrentBuildingId) return true;
    if (n.roomNodeId && adminRoomIdsInCurrentBuilding.has(n.roomNodeId)) return true;
    if (n.parentNodeId && adminRoomIdsInCurrentBuilding.has(n.parentNodeId)) return true;
    const parent = nodes.find(p => p.nodeId === n.parentNodeId);
    if (parent && (parent.parentNodeId === adminCurrentBuildingId || parent.nodeId === adminCurrentBuildingId)) return true;
    return false;
  });

  const adminSharedDevicesInBuilding = adminDevicesOfSelectedBuilding.filter(d => d.isShared === true);
  const adminRoomDevicesInBuilding = adminDevicesOfSelectedBuilding.filter(d => d.isShared === false && d.roomNodeId);
  const adminUnassignedDevicesInBuilding = adminDevicesOfSelectedBuilding.filter(d => d.isShared === false && !d.roomNodeId);

  const handleAdminCreateDeviceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminNewDevName.trim()) return;
    if (onAddDeviceToBuilding) {
      onAddDeviceToBuilding(
        Number(adminNewDevBuildingId),
        adminNewDevName.trim(),
        Number(adminNewDevTypeId),
        adminNewDevSerial.trim() || undefined,
        adminNewDevIsShared,
        adminNewDevIsShared ? null : (adminNewDevRoomId ? Number(adminNewDevRoomId) : null),
        adminNewDevLocation.trim() || undefined,
        adminNewDevIsShared ? Number(adminNewDevUnitPrice) : 0,
        !adminNewDevIsShared ? Number(adminNewDevMonthlyRentalPrice) : 0,
        !adminNewDevIsShared ? {
          '08/2026': Number(adminNewDevMonthlyRentalPrice),
          '09/2026': Number(adminNewDevMonthlyRentalPrice),
          '10/2026': Number(adminNewDevMonthlyRentalPrice),
          '11/2026': Number(adminNewDevMonthlyRentalPrice),
          '12/2026': Number(adminNewDevMonthlyRentalPrice)
        } : undefined,
        adminNewDevImageUrl.trim() || undefined
      );
    }
    setShowAdminAddDeviceModal(false);
    setAdminNewDevName('');
    setAdminNewDevSerial('');
    setAdminNewDevLocation('');
    setAdminNewDevImageUrl('');
  };

  const handleAdminAssignDeviceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminAssigningDevice) return;
    const isShared = adminAssigningBillingMode === 'PER_USE';
    const targetRoomId = isShared ? null : (adminTargetRoomForAssign ? Number(adminTargetRoomForAssign) : null);
    const newPrice = isShared ? adminAssigningUnitPrice : adminAssigningMonthlyPrice;

    if (onAssignDeviceToRoom) {
      onAssignDeviceToRoom(
        adminAssigningDevice.nodeId,
        targetRoomId,
        isShared,
        newPrice
      );
    } else if (onUpdateNode) {
      onUpdateNode(adminAssigningDevice.nodeId, {
        isShared,
        roomNodeId: targetRoomId,
        unitPrice: isShared ? adminAssigningUnitPrice : adminAssigningDevice.unitPrice,
        monthlyRentalPrice: !isShared ? adminAssigningMonthlyPrice : adminAssigningDevice.monthlyRentalPrice,
        addressOrLocation: isShared ? 'Khu công cộng dùng chung' : (targetRoomId ? `Phòng ${nodes.find(n => n.nodeId === targetRoomId)?.nodeName || ''}` : 'Kho phòng chưa gán')
      });
    }
    setAdminAssigningDevice(null);
  };

  const topAdmins = allUsers.filter((u) => u.roleId === 1);
  const managers = allUsers.filter((u) => u.roleId === 2);
  const tenants = allUsers.filter((u) => u.roleId === 3);

  // Thống kê đệ quy tổng thể
  const totalBuildings = nodes.filter((n) => n.parentNodeId === null).length;
  const totalRooms = nodes.filter((n) => n.typeId === 3).length;
  const totalDevices = nodes.filter((n) => n.typeId >= 4).length;
  const damagedCount = nodes.filter((n) => n.currentCondition === 3).length;
  const dirtyCount = nodes.filter((n) => n.currentCondition === 1).length;
  const difficultCount = nodes.filter((n) => n.currentCondition === 2).length;

  const handleOpenAddChild = (parentId: number) => {
    setTargetParentId(parentId);
    setShowAddNodeModal(true);
  };

  const handleCreateObjectType = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTypeCode.trim() || !newTypeName.trim()) return;
    onAddObjectType(newTypeCode.toUpperCase(), newTypeName, newTypeCategory, newTypeUnit);
    setShowAddTypeModal(false);
    setNewTypeCode('');
    setNewTypeName('');
  };

  const handleCreateNode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNodeCode.trim() || !newNodeName.trim()) return;
    onAddChildNode(targetParentId, Number(newNodeTypeId), newNodeCode, newNodeName, Number(newNodePrice));
    setShowAddNodeModal(false);
    setNewNodeCode('');
    setNewNodeName('');
  };

  const handleAdminCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminRoomName.trim() || !onAddRoom) return;
    onAddRoom(
      adminRoomBuildingId,
      adminRoomName.trim(),
      Number(adminRoomRent),
      Number(adminRoomDeposit),
      adminRoomCode.trim() || undefined,
      adminRoomPriceNote.trim() || undefined
    );
    setShowAdminAddRoomModal(false);
    setAdminRoomCode('');
    setAdminRoomName('');
  };

  const handleAdminSavePrice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminEditingPriceRoom || !onUpdateRoomPrice) return;
    onUpdateRoomPrice(adminEditingPriceRoom.nodeId, Number(adminEditPriceValue), adminEditPriceNote.trim());
    setAdminEditingPriceRoom(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Admins */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-950/80 via-slate-900 to-indigo-950/70 border border-purple-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs text-purple-300 bg-purple-500/10 border border-purple-500/30 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider mb-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            Cấp 1: 3 Người Quản Trị Tối Cao (Admins)
          </div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            Trung Tâm Điều Hành Chuỗi 100 Nhà Trọ
          </h2>
          <p className="text-xs text-slate-300">
            Xin chào <strong>{currentUser.fullName}</strong> • Địa chỉ: <strong>{currentUser.address}</strong> (Cột Address)
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {/* NÚT THÊM TÒA NHÀ MỚI NỔI BẬT */}
          <button
            onClick={onOpenAddBuildingModal}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-blue-600/30 transition-all active:scale-95"
            title="Thêm tòa nhà trọ mới vào hệ thống"
          >
            <Building2 className="w-4 h-4" />
            <span>+ Thêm Tòa Nhà Mới</span>
          </button>

          <button
            onClick={() => setShowAddTypeModal(true)}
            className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 shadow transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Loại Đối Tượng</span>
          </button>
          <button
            onClick={() => {
              setTargetParentId(1);
              setShowAddNodeModal(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-1.5 border border-slate-700 shadow transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Node Cây</span>
          </button>
        </div>
      </div>

      {/* 4 Thẻ Thống Kê Tổng Hợp Cả Hệ Thống */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-slate-400">Quy mô hệ thống</span>
          <div className="text-xl font-bold text-white font-mono">{totalBuildings} Tòa Nhà</div>
          <div className="text-slate-500 text-[11px]">{totalRooms} phòng mẫu thử nghiệm</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-rose-500/40 space-y-1">
          <span className="text-rose-400 font-semibold flex items-center gap-1">
            <Flame className="w-3.5 h-3.5" /> Thiết bị báo Hư hỏng
          </span>
          <div className="text-xl font-bold text-rose-400 font-mono">{damagedCount} máy</div>
          <div className="text-slate-500 text-[11px]">Cần gọi thợ/bảo hành</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-orange-500/40 space-y-1">
          <span className="text-orange-400 font-semibold flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> Thiết bị Hay bẩn
          </span>
          <div className="text-xl font-bold text-orange-400 font-mono">{dirtyCount} máy</div>
          <div className="text-slate-500 text-[11px]">Đã lên lịch tạp vụ</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-amber-500/40 space-y-1">
          <span className="text-amber-400 font-semibold flex items-center gap-1">
            <HelpCircle className="w-3.5 h-3.5" /> Phản ánh Khó dùng
          </span>
          <div className="text-xl font-bold text-amber-400 font-mono">{difficultCount} điểm</div>
          <div className="text-slate-500 text-[11px]">Cần dán tem Decal HD</div>
        </div>
      </div>

      {/* Tabs Quản Trị Admins */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto text-xs sm:text-sm">
        <button
          onClick={() => setActiveTab('buildings')}
          className={`px-3.5 py-2 rounded-xl font-medium transition-all flex items-center gap-1.5 ${
            activeTab === 'buildings' ? 'bg-blue-600 text-white shadow' : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <Building2 className="w-4 h-4" />
          1. Danh Sách Tòa Nhà ({totalBuildings})
        </button>

        <button
          onClick={() => setActiveTab('devices')}
          className={`px-3.5 py-2 rounded-xl font-medium transition-all flex items-center gap-1.5 ${
            activeTab === 'devices' ? 'bg-indigo-600 text-white shadow' : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <Cpu className="w-4 h-4" />
          2. Thiết Bị Theo Từng Nhà ({totalDevices})
        </button>

        <button
          onClick={() => setActiveTab('invoices')}
          className={`px-3.5 py-2 rounded-xl font-medium transition-all flex items-center gap-1.5 ${
            activeTab === 'invoices' ? 'bg-emerald-600 text-white shadow ring-2 ring-emerald-500/30' : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          3. Hóa Đơn &amp; Chốt Sổ ({invoices.length})
        </button>

        <button
          onClick={() => setActiveTab('tree')}
          className={`px-3.5 py-2 rounded-xl font-medium transition-all flex items-center gap-1.5 ${
            activeTab === 'tree' ? 'bg-purple-600 text-white shadow' : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <FolderTree className="w-4 h-4" />
          4. Cây Quản Lý Thực Thể Đệ Quy
        </button>

        <button
          onClick={() => setActiveTab('objectTypes')}
          className={`px-3.5 py-2 rounded-xl font-medium transition-all flex items-center gap-1.5 ${
            activeTab === 'objectTypes' ? 'bg-cyan-600 text-white shadow' : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4" />
          4. Danh Mục Loại Đối Tượng ({objectTypes.length})
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-3.5 py-2 rounded-xl font-medium transition-all flex items-center gap-1.5 ${
            activeTab === 'analytics' ? 'bg-emerald-600 text-white shadow' : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          5. Báo Cáo Tháng / Quý / Năm
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`px-3.5 py-2 rounded-xl font-medium transition-all flex items-center gap-1.5 ${
            activeTab === 'users' ? 'bg-purple-600 text-white shadow' : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          6. Phân Quyền &amp; Nhân Sự ({allUsers.length})
        </button>
      </div>

      {/* 1. TAB DANH SÁCH TÒA NHÀ & THÊM MỚI */}
      {activeTab === 'buildings' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <h4 className="font-bold text-white text-sm flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-400" />
                Danh Sách Các Tòa Nhà Trong Chuỗi ({nodes.filter(n => n.parentNodeId === null).length} Tòa Nhà)
              </h4>
              <p className="text-slate-400 mt-0.5">
                Quản lý các tòa nhà trọ độc lập thuộc chuỗi, địa chỉ thực tế và phân quyền người quản lý.
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
              <button
                onClick={onOpenAddBuildingModal}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/30 flex items-center gap-1.5 transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>+ Thêm Tòa Nhà Mới</span>
              </button>
              <button
                onClick={() => {
                  if (onOpenAddRoomModal) {
                    onOpenAddRoomModal();
                  } else {
                    setShowAdminAddRoomModal(true);
                  }
                }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-600/30 flex items-center gap-1.5 transition-all active:scale-95"
              >
                <DoorClosed className="w-4 h-4" />
                <span>+ Thêm Phòng Mới</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {nodes.filter((n) => n.parentNodeId === null).map((building) => {
              // Đếm số tầng và số phòng thuộc tòa này
              const buildingFloors = nodes.filter((n) => n.parentNodeId === building.nodeId);
              const buildingFloorIds = buildingFloors.map((f) => f.nodeId);
              const buildingRooms = nodes.filter(
                (n) => n.typeId === 3 && (buildingFloorIds.includes(n.parentNodeId || 0) || n.parentNodeId === building.nodeId)
              );

              return (
                <div key={building.nodeId} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-mono bg-blue-950 text-blue-300 border border-blue-800 px-2 py-0.5 rounded font-semibold">
                        {building.nodeCode}
                      </span>
                      <h4 className="font-bold text-white text-base mt-1">{building.nodeName}</h4>
                    </div>
                    <span className="text-xs font-mono text-emerald-400 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 font-bold">
                      {buildingRooms.length} phòng
                    </span>
                  </div>

                  <div className="text-xs text-slate-300 flex items-start gap-1.5 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                    <MapPin className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span>Địa chỉ: <strong>{building.addressOrLocation || 'Chưa cập nhật địa chỉ'}</strong></span>
                  </div>

                  {/* Phân công quản lý cấp 2 phụ trách (Admin cấp 1 ấn định) */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
                    <div className="flex items-center gap-1.5 text-slate-300">
                      <ShieldCheck className="w-4 h-4 text-blue-400 flex-shrink-0" />
                      <span>Quản lý phụ trách (Cấp 2):</span>
                    </div>
                    {onAssignManagerToBuilding ? (
                      <select
                        value={building.managerUserId || 4}
                        onChange={(e) => onAssignManagerToBuilding(building.nodeId, Number(e.target.value))}
                        className="bg-slate-900 border border-blue-500/50 text-blue-300 text-xs px-2.5 py-1 rounded-lg outline-none font-medium"
                        title="Admin cấp 1 ấn định quản lý cấp 2 phụ trách tòa nhà này"
                      >
                        {managers.map((m) => (
                          <option key={m.userId} value={m.userId}>
                            {m.fullName} (ID: {m.userId})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <strong className="text-blue-300 font-semibold">
                        {managers.find((m) => m.userId === building.managerUserId)?.fullName || 'Chưa gán'}
                      </strong>
                    )}
                  </div>

                  {/* Đơn giá Điện Nước & Phí Vệ Sinh / Tạm Trú áp dụng cho tòa nhà */}
                  <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                      <div className="flex items-center gap-1.5 text-amber-300">
                        <Zap className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                        <span>Điện: <strong className="font-mono text-amber-400">{(building.electricRate || 3800).toLocaleString('vi-VN')} đ/kWh</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5 text-cyan-300">
                        <Droplets className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                        <span>Nước: <strong className="font-mono text-cyan-400">{(building.waterRate || 30000).toLocaleString('vi-VN')} đ/m³</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5 text-emerald-300">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                        <span>Phí vệ sinh: <strong className="font-mono text-emerald-400">{(building.sanitationFeePerPerson || 30000).toLocaleString('vi-VN')} đ/người/tháng</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5 text-indigo-300">
                        <ShieldCheck className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                        <span>Phí tạm trú: <strong className="font-mono text-indigo-400">{(building.residenceFeePerPerson || 100000).toLocaleString('vi-VN')} đ/người/năm</strong></span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setAdminEditingBuildingRates(building);
                        setAdminEditBuildingElecRate(building.electricRate || 3800);
                        setAdminEditBuildingWaterRate(building.waterRate || 30000);
                        setAdminEditBuildingSanitationRate(building.sanitationFeePerPerson || 30000);
                        setAdminEditBuildingResidenceRate(building.residenceFeePerPerson || 100000);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 hover:text-white font-semibold text-[11px] transition-all flex items-center gap-1 self-start sm:self-auto shrink-0 shadow"
                      title="Điều chỉnh đơn giá điện nước và phí vệ sinh, tạm trú áp dụng cho tòa nhà này"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      <span>Đổi Đơn Giá & Phí</span>
                    </button>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400">
                    <span>Số khu vực con: <strong>{buildingFloors.length} tầng/tiện ích</strong></span>
                    <span className="text-emerald-400 font-semibold">✓ Đang hoạt động</span>
                  </div>

                  {/* Nút thao tác Quản trị phòng & Ấn định giá */}
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    <button
                      onClick={() => {
                        if (onOpenAddRoomModal) {
                          onOpenAddRoomModal(building.nodeId);
                        } else {
                          setAdminRoomBuildingId(building.nodeId);
                          setShowAdminAddRoomModal(true);
                        }
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-1 shadow transition-all active:scale-95"
                      title="Thêm phòng mới vào tòa nhà này"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Thêm Phòng</span>
                    </button>

                    <button
                      onClick={() => setExpandedBuildingId(expandedBuildingId === building.nodeId ? null : building.nodeId)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center gap-1 transition-all"
                    >
                      <DoorClosed className="w-3.5 h-3.5 text-blue-400" />
                      <span>{expandedBuildingId === building.nodeId ? 'Thu Gọn Phòng' : `Xem ${buildingRooms.length} Phòng & Định Giá`}</span>
                      {expandedBuildingId === building.nodeId ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {/* Danh sách phòng chi tiết khi mở rộng */}
                  {expandedBuildingId === building.nodeId && (
                    <div className="pt-3 border-t border-slate-800 space-y-2">
                      <div className="text-[11px] text-slate-400 font-semibold flex items-center justify-between">
                        <span>Danh sách phòng ({buildingRooms.length} phòng):</span>
                        <span className="text-slate-500">Admin cấp 1 ấn định giá &amp; thêm/bớt phòng</span>
                      </div>

                      {buildingRooms.length === 0 ? (
                        <div className="p-3 rounded-xl bg-slate-950 text-center text-xs text-slate-400">
                          Chưa có phòng nào. Hãy bấm <strong>+ Thêm Phòng</strong> bên trên để tạo phòng đầu tiên!
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                          {buildingRooms.map((room) => (
                            <div key={room.nodeId} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-2 text-xs">
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono text-[10px] bg-blue-950 text-blue-300 border border-blue-800 px-1.5 py-0.5 rounded font-bold">
                                    {room.nodeCode}
                                  </span>
                                  <strong className="text-white truncate">{room.nodeName}</strong>
                                </div>
                                <div className="flex items-center gap-2 mt-0.5 text-[11px]">
                                  <span className="font-mono text-emerald-400 font-bold">
                                    {(room.unitPrice || 4500000).toLocaleString('vi-VN')} đ/tháng
                                  </span>
                                  {room.pricePeriodNote && (
                                    <span className="text-[10px] text-amber-300 bg-amber-950/60 border border-amber-800/60 px-1.5 py-0.2 rounded truncate">
                                      {room.pricePeriodNote}
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                <button
                                  onClick={() => {
                                    setAdminEditingPriceRoom(room);
                                    setAdminEditPriceValue(room.unitPrice || 4500000);
                                    setAdminEditPriceNote(room.pricePeriodNote || 'Giá mùa cao điểm tháng 9/2026');
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600 border border-blue-500/50 hover:border-blue-500 text-blue-300 hover:text-white text-[11px] font-semibold flex items-center gap-1"
                                  title="Ấn định mức giá thuê theo từng thời điểm"
                                >
                                  <Edit3 className="w-3 h-3" />
                                  <span>Ấn Định Giá</span>
                                </button>

                                {onDeleteRoom && (
                                  <button
                                    onClick={() => onDeleteRoom(room.nodeId)}
                                    className="p-1 rounded-lg bg-rose-600/20 hover:bg-rose-600 border border-rose-500/50 text-rose-300 hover:text-white"
                                    title="Bớt phòng khỏi tòa nhà"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. TAB QUẢN LÝ THIẾT BỊ THEO TỪNG NHÀ (DÀNH CHO ADMIN CẤP 1) */}
      {activeTab === 'devices' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Top Bar: Chọn Tòa Nhà & Nút Thêm Thiết Bị Mới */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 text-xs text-indigo-400 bg-indigo-500/10 border border-indigo-500/30 px-2.5 py-0.5 rounded-full font-bold">
                <Cpu className="w-3.5 h-3.5" />
                <span>Toàn Quyền Lập Danh Sách Thiết Bị Từng Nhà</span>
              </div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Quản Trị Thiết Bị Theo Từng Nhà (Admin Cấp 1)
              </h3>
              <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
                Admin cấp 1 và Quản lý tòa nhà lập danh sách thiết bị cho từng nhà. Thiết bị <strong>Dùng chung (công cộng)</strong> phục vụ cả tòa nhà. Thiết bị không dùng chung sẽ được lắp đặt vào từng phòng để người thuê phòng đó quản lý và báo hỏng độc quyền.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 self-start md:self-auto">
              {/* Chọn Tòa Nhà Trong Chuỗi */}
              <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800 text-xs">
                <Building2 className="w-4 h-4 text-blue-400 ml-1.5 flex-shrink-0" />
                <span className="text-slate-400 hidden sm:inline">Tòa nhà:</span>
                <select
                  value={adminSelectedBuildingForDevices}
                  onChange={(e) => {
                    setAdminSelectedBuildingForDevices(Number(e.target.value));
                    setAdminSelectedRoomFilter('ALL');
                  }}
                  className="bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-white font-bold outline-none focus:border-indigo-500 text-xs"
                >
                  {allBuildings.map((b) => (
                    <option key={b.nodeId} value={b.nodeId}>
                      {b.nodeName} ({b.nodeCode})
                    </option>
                  ))}
                </select>
              </div>

              {/* Nút Xem & Chỉnh Sửa Bảng Giá Thiết Bị Theo Tháng */}
              <button
                type="button"
                onClick={() => setShowAdminPriceScheduleModal(true)}
                className="px-4 py-2.5 rounded-xl bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-500/50 text-indigo-300 hover:text-white font-bold text-xs flex items-center gap-1.5 shadow transition-all active:scale-95 whitespace-nowrap"
                title="Bảng giá của thiết bị theo từng tháng (cục phát wifi, điều hòa, tủ lạnh...)"
              >
                <Calendar className="w-4 h-4 text-indigo-400" />
                <span>📊 Bảng Giá Thiết Bị Theo Tháng</span>
              </button>

              {/* Nút Thêm Thiết Bị Cho Nhà Này */}
              <button
                type="button"
                onClick={() => {
                  setAdminNewDevBuildingId(adminCurrentBuildingId);
                  setAdminNewDevIsShared(false);
                  setAdminNewDevRoomId(adminRoomsInCurrentBuilding[0]?.nodeId || null);
                  setAdminNewDevName('');
                  setAdminNewDevSerial('');
                  setAdminNewDevLocation(adminRoomsInCurrentBuilding[0] ? `Phòng ${adminRoomsInCurrentBuilding[0].nodeName}` : 'Trong phòng');
                  setAdminNewDevUnitPrice(15000);
                  setAdminNewDevMonthlyRentalPrice(120000);
                  setAdminNewDevImageUrl('');
                  setShowAdminAddDeviceModal(true);
                }}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 transition-all active:scale-95 whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span>+ Thêm Thiết Bị Cho Nhà Này</span>
              </button>
            </div>
          </div>

          {/* Banner Hướng Dẫn: 2 Cách Tính Tiền & Cách Thay Đổi Của Admin */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/60 to-purple-950/60 border border-indigo-500/40 space-y-2.5 text-xs shadow-lg">
            <div className="flex items-center justify-between">
              <div className="font-bold text-white text-sm flex items-center gap-2">
                <span className="p-1 rounded-lg bg-indigo-500/20 text-indigo-400">💡</span>
                <span>Hướng Dẫn Quản Trị: 2 Cách Tính Tiền Thiết Bị &amp; Cách Chuyển Đổi</span>
              </div>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700/60 font-semibold">
                Toàn quyền Admin Cấp 1
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              <div className="p-3 rounded-xl bg-slate-950/80 border border-emerald-500/30 space-y-1">
                <div className="font-bold text-emerald-400 flex items-center gap-1.5 text-xs">
                  <span>🟢 1. Thiết Bị Tính Tiền Theo Tháng (Lắp Trong Phòng)</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  • <strong>Áp dụng:</strong> Cục phát WiFi riêng từng phòng, điều hòa, tủ lạnh, bình nóng lạnh...<br />
                  • <strong>Cách tính:</strong> Tiền thuê thiết bị cố định hàng tháng (đ/tháng) được cộng vào hóa đơn phòng. Bấm nút <strong>"📊 Bảng Giá Thiết Bị Theo Tháng"</strong> để xem và điều chỉnh giá theo từng tháng (tháng 9, tháng 11...).
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/80 border border-purple-500/30 space-y-1">
                <div className="font-bold text-purple-400 flex items-center gap-1.5 text-xs">
                  <span>🟣 2. Thiết Bị Tính Tiền Theo Lượt Dùng (Dùng Chung Tòa Nhà)</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  • <strong>Áp dụng:</strong> Máy giặt chung công cộng, trạm sạc xe điện EV, cổng an ninh...<br />
                  • <strong>Cách tính:</strong> Cư dân dùng lần nào sẽ ghi nhận theo lượt (đ/lượt) và cộng dồn vào mục phí dùng chung trong hóa đơn phòng cuối tháng.
                </p>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-indigo-950/50 border border-indigo-600/40 flex items-center justify-between text-[11px] text-indigo-200">
              <div>
                <strong>🔄 Cách thay đổi cách tính tiền:</strong> Bấm trực tiếp nút <strong>"⚙️ Đổi Cách Tính Tiền"</strong> trên thẻ thiết bị bên dưới (hoặc vào Tab <em>Cây Quản Lý Thực Thể Đệ Quy</em> bấm ✏️) để chuyển giữa <em>Theo tháng</em> ⇄ <em>Theo lượt</em> và nhập đơn giá mới ngay lập tức!
              </div>
            </div>
          </div>

          {/* 4 Thẻ Thống Kê Thiết Bị Của Tòa Nhà Đang Chọn */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-slate-400 font-medium">Tổng thiết bị nhà này:</span>
              <div className="text-2xl font-bold text-white font-mono">{adminDevicesOfSelectedBuilding.length}</div>
              <div className="text-[11px] text-slate-500">{adminCurrentBuildingNode?.nodeName}</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-purple-500/30 space-y-1">
              <span className="text-purple-300 font-semibold flex items-center gap-1">
                <span>🏢 Dùng chung công cộng:</span>
              </span>
              <div className="text-2xl font-bold text-purple-400 font-mono">{adminSharedDevicesInBuilding.length}</div>
              <div className="text-[11px] text-slate-500">Máy giặt sảnh, trạm sạc, cổng...</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-emerald-500/30 space-y-1">
              <span className="text-emerald-300 font-semibold flex items-center gap-1">
                <span>🏠 Trang bị trong các phòng:</span>
              </span>
              <div className="text-2xl font-bold text-emerald-400 font-mono">{adminRoomDevicesInBuilding.length}</div>
              <div className="text-[11px] text-slate-500">Lắp trong {adminRoomsInCurrentBuilding.length} phòng</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-rose-500/30 space-y-1">
              <span className="text-rose-300 font-semibold flex items-center gap-1">
                <span>⚠️ Thiết bị có phản ánh:</span>
              </span>
              <div className="text-2xl font-bold text-rose-400 font-mono">
                {adminDevicesOfSelectedBuilding.filter((d) => d.currentCondition > 0).length}
              </div>
              <div className="text-[11px] text-slate-500">Hư hỏng / Hay bẩn / Khó dùng</div>
            </div>
          </div>

          {/* Thanh Bộ Lọc Thiết Bị */}
          <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setAdminDeviceCategoryFilter('ALL');
                  setAdminSelectedRoomFilter('ALL');
                }}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  adminDeviceCategoryFilter === 'ALL' && adminSelectedRoomFilter === 'ALL'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Tất Cả ({adminDevicesOfSelectedBuilding.length})
              </button>

              <button
                type="button"
                onClick={() => {
                  setAdminDeviceCategoryFilter('SHARED');
                  setAdminSelectedRoomFilter('ALL');
                }}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1 ${
                  adminDeviceCategoryFilter === 'SHARED'
                    ? 'bg-purple-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>🏢 Dùng Chung ({adminSharedDevicesInBuilding.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setAdminDeviceCategoryFilter('ROOM')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1 ${
                  adminDeviceCategoryFilter === 'ROOM'
                    ? 'bg-emerald-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>🏠 Trong Phòng ({adminRoomDevicesInBuilding.length})</span>
              </button>

              {adminUnassignedDevicesInBuilding.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setAdminDeviceCategoryFilter('UNASSIGNED');
                    setAdminSelectedRoomFilter('ALL');
                  }}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1 ${
                    adminDeviceCategoryFilter === 'UNASSIGNED'
                      ? 'bg-amber-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span>📦 Chưa Gán Phòng ({adminUnassignedDevicesInBuilding.length})</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-medium whitespace-nowrap">Lọc theo phòng:</span>
              <select
                value={adminSelectedRoomFilter}
                onChange={(e) => {
                  const val = e.target.value;
                  setAdminSelectedRoomFilter(val === 'ALL' ? 'ALL' : Number(val));
                  if (val !== 'ALL') {
                    setAdminDeviceCategoryFilter('ALL');
                  }
                }}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-white outline-none focus:border-indigo-500 font-medium text-xs max-w-xs"
              >
                <option value="ALL">-- Tất cả phòng ({adminRoomDevicesInBuilding.length} TB) --</option>
                {adminRoomsInCurrentBuilding.map((r) => {
                  const devCount = adminDevicesOfSelectedBuilding.filter(
                    (d) => d.roomNodeId === r.nodeId || d.parentNodeId === r.nodeId
                  ).length;
                  return (
                    <option key={r.nodeId} value={r.nodeId}>
                      {r.nodeName} ({devCount} TB)
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* Lưới Thẻ Thiết Bị */}
          {(() => {
            const displayedDevices = adminDevicesOfSelectedBuilding.filter((dev) => {
              if (adminDeviceCategoryFilter === 'SHARED' && !dev.isShared) return false;
              if (adminDeviceCategoryFilter === 'ROOM' && (dev.isShared || !dev.roomNodeId)) return false;
              if (adminDeviceCategoryFilter === 'UNASSIGNED' && (dev.isShared || dev.roomNodeId)) return false;
              if (adminSelectedRoomFilter !== 'ALL' && dev.roomNodeId !== adminSelectedRoomFilter && dev.parentNodeId !== adminSelectedRoomFilter) {
                return false;
              }
              return true;
            });

            if (displayedDevices.length === 0) {
              return (
                <div className="p-12 text-center bg-slate-900/60 rounded-3xl border border-slate-800 space-y-3">
                  <Cpu className="w-12 h-12 text-slate-600 mx-auto" />
                  <div className="text-slate-300 font-bold text-sm">Chưa có thiết bị nào theo bộ lọc đã chọn</div>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Admin cấp 1 hãy bấm nút "+ Thêm Thiết Bị Cho Nhà Này" để lập danh sách thiết bị cho tòa nhà này!
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setAdminNewDevBuildingId(adminCurrentBuildingId);
                      setAdminNewDevIsShared(false);
                      setAdminNewDevRoomId(adminRoomsInCurrentBuilding[0]?.nodeId || null);
                      setAdminNewDevName('');
                      setAdminNewDevSerial('');
                      setShowAdminAddDeviceModal(true);
                    }}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs"
                  >
                    + Thêm Thiết Bị Ngay
                  </button>
                </div>
              );
            }

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {displayedDevices.map((dev) => {
                  const isShared = dev.isShared === true;
                  const targetRoom = dev.roomNodeId
                    ? nodes.find((n) => n.nodeId === dev.roomNodeId)
                    : nodes.find((n) => n.nodeId === dev.parentNodeId && n.typeId === 3);

                  return (
                    <div
                      key={dev.nodeId}
                      className={`p-5 rounded-2xl border transition-all flex flex-col justify-between gap-3 shadow-md ${
                        dev.currentCondition === 3
                          ? 'bg-slate-900/90 border-rose-500/50 hover:border-rose-400'
                          : dev.currentCondition === 1
                          ? 'bg-slate-900/90 border-orange-500/50 hover:border-orange-400'
                          : dev.currentCondition === 2
                          ? 'bg-slate-900/90 border-amber-500/50 hover:border-amber-400'
                          : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                              isShared
                                ? 'bg-purple-950 text-purple-300 border-purple-800'
                                : targetRoom
                                ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                                : 'bg-amber-950 text-amber-300 border-amber-800'
                            }`}
                          >
                            <span>
                              {isShared
                                ? '🏢 DÙNG CHUNG • TÍNH THEO LƯỢT DÙNG'
                                : targetRoom
                                ? `🏠 TRONG PHÒNG: ${targetRoom.nodeName} • TÍNH THEO THÁNG`
                                : '📦 KHO CHƯA GÁN • TÍNH THEO THÁNG'}
                            </span>
                          </span>

                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                              dev.currentCondition === 0
                                ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                                : dev.currentCondition === 3
                                ? 'bg-rose-950 text-rose-300 border-rose-800'
                                : dev.currentCondition === 1
                                ? 'bg-orange-950 text-orange-300 border-orange-800'
                                : 'bg-amber-950 text-amber-300 border-amber-800'
                            }`}
                          >
                            {dev.currentCondition === 0
                              ? '✓ Tốt'
                              : dev.currentCondition === 3
                              ? '🔥 Hư hỏng'
                              : dev.currentCondition === 1
                              ? '✨ Hay bẩn'
                              : '❓ Khó dùng'}
                          </span>
                        </div>

                        <div className="flex items-start gap-2.5">
                          <span className="text-2xl p-2 rounded-xl bg-slate-950 border border-slate-800 flex-shrink-0">
                            {dev.typeId === 11 || dev.deviceCategory === 'AIR_COND'
                              ? '❄️'
                              : dev.typeId === 12 || dev.deviceCategory === 'FRIDGE'
                              ? '🧊'
                              : dev.typeId === 13 || dev.deviceCategory === 'WATER_HEATER'
                              ? '♨️'
                              : dev.typeId === 4 || dev.deviceCategory === 'WASHING_MACHINE'
                              ? '🧺'
                              : dev.typeId === 8 || dev.deviceCategory === 'SECURITY_GATE'
                              ? '🚪'
                              : dev.typeId === 5 || dev.deviceCategory === 'EV_CHARGER'
                              ? '⚡'
                              : dev.typeId === 9
                              ? '⚡'
                              : dev.typeId === 10
                              ? '💧'
                              : '⏱️'}
                          </span>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-white text-sm truncate" title={dev.nodeName}>
                              {dev.nodeName}
                            </h4>
                            <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                              Mã: <span className="text-slate-300 font-semibold">{dev.nodeCode}</span>
                              {dev.serialNumber && ` • SN: ${dev.serialNumber}`}
                            </div>
                          </div>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1 text-xs">
                          <div className="flex justify-between text-slate-400">
                            <span>Vị trí:</span>
                            <span className="text-slate-200 font-medium truncate max-w-[160px]">
                              {dev.addressOrLocation || (isShared ? 'Khu vực công cộng' : targetRoom ? `Phòng ${targetRoom.nodeName}` : 'Kho')}
                            </span>
                          </div>

                          {isShared ? (
                            <div className="flex justify-between items-center text-slate-400 pt-1 border-t border-slate-900">
                              <span className="text-purple-300 font-medium">Đơn giá dùng chung:</span>
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono text-purple-400 font-bold">
                                  {(dev.unitPrice || 0).toLocaleString('vi-VN')} đ/lượt
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleOpenAdminAssignDevice(dev)}
                                  className="text-[10px] text-purple-400 hover:text-purple-300 underline font-semibold cursor-pointer"
                                  title="Đổi mức phí theo lượt hoặc chuyển sang tính theo tháng"
                                >
                                  Sửa giá
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex justify-between items-center text-slate-400 pt-1 border-t border-slate-900">
                              <span className="text-emerald-300 font-medium">Tiền thuê tháng:</span>
                              <div className="flex items-center gap-1.5">
                                {(() => {
                                  const price = (dev.monthlyRentalPrice !== undefined && Number(dev.monthlyRentalPrice) > 0)
                                    ? Number(dev.monthlyRentalPrice)
                                    : (!dev.isShared && dev.unitPrice !== undefined && Number(dev.unitPrice) > 0)
                                      ? Number(dev.unitPrice)
                                      : 0;
                                  return (
                                    <span className={`font-mono font-bold ${price > 0 ? 'text-emerald-400' : 'text-slate-300 text-[11px]'}`}>
                                      {price > 0 ? `${price.toLocaleString('vi-VN')} đ/tháng` : 'Miễn phí đi kèm phòng (0 đ)'}
                                    </span>
                                  );
                                })()}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setAdminSelectedDevForPriceSchedule(dev.nodeId);
                                    setShowAdminPriceScheduleModal(true);
                                  }}
                                  className="text-[10px] text-indigo-400 hover:text-indigo-300 underline font-semibold flex items-center gap-0.5 cursor-pointer"
                                  title="Xem và điều chỉnh bảng giá theo từng tháng của thiết bị này"
                                >
                                  <span>Chỉnh giá</span>
                                </button>
                              </div>
                            </div>
                          )}

                          {dev.warrantyExpiryDate && (
                            <div className="flex justify-between text-slate-400 pt-1 border-t border-slate-900 text-[11px]">
                              <span>Bảo hành:</span>
                              <span className="font-mono text-cyan-400">{formatDateVN(dev.warrantyExpiryDate)}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Các Nút Thao Tác: Đổi cách tính tiền & phòng, Điều chỉnh giá, Cập nhật tình trạng, Xóa */}
                      <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-1.5 text-xs">
                        <button
                          type="button"
                          onClick={() => handleOpenAdminAssignDevice(dev)}
                          className="px-2.5 py-1.5 rounded-xl bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 hover:text-white font-medium text-[11px] border border-indigo-700/50 flex items-center gap-1 transition-all flex-1 justify-center"
                          title="Thay đổi cách tính tiền (Theo tháng <-> Theo lượt dùng) và vị trí lắp đặt"
                        >
                          <Sliders className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                          <span className="truncate">Đổi Cách Tính Tiền</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (isShared) {
                              handleOpenAdminAssignDevice(dev);
                            } else {
                              setAdminSelectedDevForPriceSchedule(dev.nodeId);
                              setShowAdminPriceScheduleModal(true);
                            }
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-medium text-[11px] border border-slate-700/60 flex items-center gap-1 transition-all whitespace-nowrap"
                          title={isShared ? "Sửa phí dùng chung theo lượt" : "Xem và sửa bảng giá thuê theo tháng"}
                        >
                          <DollarSign className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                          <span>{isShared ? 'Sửa Giá' : 'Bảng Giá'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const nextCond: DeviceCondition = dev.currentCondition === 0 ? 3 : 0;
                            onUpdateCondition(dev.nodeId, nextCond);
                          }}
                          className={`px-2.5 py-1.5 rounded-xl font-medium text-[11px] border transition-all ${
                            dev.currentCondition === 0
                              ? 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                              : 'bg-rose-950/80 border-rose-700 text-rose-300 hover:bg-rose-900'
                          }`}
                          title="Đổi nhanh tình trạng bình thường / báo hỏng"
                        >
                          {dev.currentCondition === 0 ? 'Báo hỏng' : 'Đã sửa'}
                        </button>

                        {onDeleteDevice && (
                          <button
                            type="button"
                            onClick={() => onDeleteDevice(dev.nodeId)}
                            className="p-1.5 rounded-xl bg-rose-600/10 hover:bg-rose-600 border border-rose-500/30 hover:border-rose-500 text-rose-400 hover:text-white transition-all"
                            title="Xóa thiết bị này khỏi tòa nhà"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      {/* 3. TAB QUẢN TRỊ HÓA ĐƠN & CHỐT SỔ HỆ THỐNG */}
      {activeTab === 'invoices' && (
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-white text-base">Quản Trị Hóa Đơn &amp; Chốt Sổ Phê Duyệt Hệ Thống</h4>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                  Lưu Trữ Bất Biến
                </span>
              </div>
              <p className="text-slate-400 max-w-3xl">
                Quy tắc cốt lõi: Mỗi thiết bị có <strong>danh mục bảng giá</strong>. Khi tính tiền phòng hàng tháng, hệ thống tự động lấy <strong>giá mới nhất</strong> của thiết bị để tính vào hóa đơn. 
                Khi Người Quản Trị duyệt hóa đơn, hệ thống sẽ lưu cố định gồm <strong>tháng, năm và đơn giá thuê thiết bị đã chốt của tháng đấy</strong>. 
                Đến Tháng 11 hoặc bất kỳ thời điểm nào sau này, quản trị viên và khách thuê có thể xem lại chính xác hóa đơn của các tháng trước mà <strong>không cần phải tính lại toàn bộ</strong>!
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowAdminCreateInvModal(true)}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all shadow flex items-center gap-1.5"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Lập Hóa Đơn Kỳ Mới</span>
              </button>

              <button
                type="button"
                onClick={() => setShowAdminPriceScheduleModal(true)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition-all border border-slate-700 flex items-center gap-1.5"
              >
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <span>Bảng Giá Thiết Bị</span>
              </button>
            </div>
          </div>

          {/* Bộ lọc theo kỳ hóa đơn */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <span className="text-slate-400 font-medium whitespace-nowrap">Lọc theo kỳ:</span>
            {['ALL', ...Array.from(new Set(invoices.map((i) => i.monthYear)))].map((mYear) => (
              <button
                key={mYear}
                type="button"
                onClick={() => setAdminInvMonthFilter(mYear)}
                className={`px-3 py-1.5 rounded-xl font-semibold transition-all whitespace-nowrap ${
                  adminInvMonthFilter === mYear
                    ? 'bg-emerald-600 text-white shadow ring-2 ring-emerald-400/40'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {mYear === 'ALL' ? 'Tất cả các tháng' : `Tháng ${mYear}`}
              </button>
            ))}
          </div>

          {/* Danh sách hóa đơn toàn hệ thống */}
          <div className="space-y-3">
            {invoices
              .filter((inv) => adminInvMonthFilter === 'ALL' || inv.monthYear === adminInvMonthFilter)
              .map((inv) => (
                <div 
                  key={inv.invoiceId} 
                  className={`p-5 rounded-2xl border transition-all text-xs space-y-4 ${
                    inv.isApproved 
                      ? 'bg-slate-900/90 border-slate-800' 
                      : 'bg-slate-900 border-amber-500/40 shadow-lg'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-base">{inv.roomName}</span>
                        <span className="px-2.5 py-0.5 rounded-lg bg-blue-950 text-blue-300 font-mono font-bold border border-blue-800">
                          Kỳ {inv.monthYear}
                        </span>
                        {inv.isApproved ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            ĐÃ DUYỆT &amp; CHỐT SỔ (Bảo Lưu Cố Định)
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800">
                            ⏳ DỰ THẢO CHỜ DUYỆT
                          </span>
                        )}
                      </div>
                      <div className="text-slate-400">
                        {inv.isApproved 
                          ? `Đã chốt sổ bởi: ${inv.approvedByName || 'Ban Quản Trị'} lúc ${formatDateTimeVN(inv.approvedAt) || 'cuối tháng'}. Toàn bộ đơn giá thiết bị và số tiền lưu cố định không bị tính lại.`
                          : 'Hóa đơn đang ở dạng dự thảo. Admin có thể xem xét và bấm Duyệt để chốt sổ vĩnh viễn.'}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block">Tổng hóa đơn:</span>
                        <span className="text-xl font-bold font-mono text-emerald-400">
                          {inv.totalAmount.toLocaleString('vi-VN')} đ
                        </span>
                      </div>

                      {!inv.isApproved && onUpdateInvoiceMeters && (
                        <button
                          type="button"
                          onClick={() => {
                            setAdminEditingInvoiceMeters(inv);
                            setAdminEditInvCurrElec(inv.currElectric);
                            setAdminEditInvCurrWater(inv.currWater);
                            setAdminEditInvElecRate(inv.electricRate || 3800);
                            setAdminEditInvWaterRate(inv.waterRate || 30000);
                            setAdminEditInvOccupantCount(inv.occupantCount || 1);
                            setAdminEditInvSanitationRate(inv.sanitationFeePerPerson || 30000);
                            setAdminEditInvResidenceRate(inv.residenceFeePerPerson || 100000);
                            setAdminEditInvApplyResidence(inv.isResidenceFeeApplied ?? false);
                          }}
                          className="px-3 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 hover:text-white font-semibold transition-all flex items-center gap-1.5 shadow"
                          title="Sửa chỉ số điện nước, phí vệ sinh hoặc điều chỉnh phí tạm trú cho hóa đơn này"
                        >
                          <Sliders className="w-3.5 h-3.5" />
                          <span>Sửa Điện / Nước / Phí Dịch Vụ</span>
                        </button>
                      )}

                      {!inv.isApproved && onApproveInvoice && (
                        <button
                          type="button"
                          onClick={() => {
                            onApproveInvoice(inv.invoiceId);
                            alert(`Admin đã duyệt & chốt sổ hóa đơn Kỳ ${inv.monthYear} cho ${inv.roomName}! Đơn giá thiết bị của tháng này đã được lưu cố định.`);
                          }}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all shadow flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Duyệt Hóa Đơn &amp; Chốt Sổ</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Chi tiết đơn giá thiết bị phòng đã chốt */}
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-emerald-300 flex items-center gap-1">
                        <Wifi className="w-3.5 h-3.5" />
                        Đơn giá thuê thiết bị phòng đã chốt của Kỳ {inv.monthYear}:
                      </span>
                      <span className="font-mono font-bold text-emerald-400">
                        Tổng thiết bị: {(inv.roomDeviceRentalCost || 0).toLocaleString('vi-VN')} đ/tháng
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {(inv.deviceBreakdown && inv.deviceBreakdown.length > 0 ? inv.deviceBreakdown : []).map((devItem) => (
                        <div key={devItem.deviceNodeId} className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                          <span className="font-medium text-slate-300 truncate mr-2">{devItem.deviceName}</span>
                          <span className="font-mono font-bold text-emerald-400 whitespace-nowrap">
                            {devItem.monthlyPrice.toLocaleString('vi-VN')} đ
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Thông tin số liệu & các loại phí */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs bg-slate-950/60 p-3 rounded-xl border border-slate-800/50">
                    <div>
                      <span className="text-slate-500 block text-[10px]">Tiền thuê phòng:</span>
                      <span className="font-mono font-semibold text-slate-200">{inv.roomRent.toLocaleString('vi-VN')} đ</span>
                    </div>
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 text-[10px]">Tiền điện ({inv.currElectric - inv.prevElectric} kWh):</span>
                        <span className="text-[10px] text-amber-500/80 font-mono">@{inv.electricRate.toLocaleString('vi-VN')}đ</span>
                      </div>
                      <span className="font-mono font-semibold text-amber-400">
                        {((inv.currElectric - inv.prevElectric) * inv.electricRate).toLocaleString('vi-VN')} đ
                      </span>
                      <span className="text-[10px] text-slate-500 block">Số cũ {inv.prevElectric} → Mới {inv.currElectric}</span>
                    </div>
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 text-[10px]">Tiền nước ({inv.currWater - inv.prevWater} m³):</span>
                        <span className="text-[10px] text-cyan-500/80 font-mono">@{inv.waterRate.toLocaleString('vi-VN')}đ</span>
                      </div>
                      <span className="font-mono font-semibold text-cyan-400">
                        {((inv.currWater - inv.prevWater) * inv.waterRate).toLocaleString('vi-VN')} đ
                      </span>
                      <span className="text-[10px] text-slate-500 block">Số cũ {inv.prevWater} → Mới {inv.currWater}</span>
                    </div>
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 text-[10px]">Phí vệ sinh ({inv.occupantCount || 1} người):</span>
                        <span className="text-[10px] text-emerald-400 font-mono">@{(inv.sanitationFeePerPerson || 30000).toLocaleString('vi-VN')}đ</span>
                      </div>
                      <span className="font-mono font-semibold text-emerald-400">
                        {(inv.sanitationFee ?? ((inv.occupantCount || 1) * (inv.sanitationFeePerPerson || 30000))).toLocaleString('vi-VN')} đ
                      </span>
                      <span className="text-[10px] text-slate-500 block">{(inv.occupantCount || 1)} người/tháng</span>
                    </div>
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 text-[10px]">Phí tạm trú (Năm):</span>
                        <span className="text-[10px] text-indigo-400 font-mono">{inv.residenceFee && inv.residenceFee > 0 ? 'Có thu' : 'Miễn thu'}</span>
                      </div>
                      <span className={`font-mono font-semibold ${inv.residenceFee && inv.residenceFee > 0 ? 'text-indigo-400' : 'text-slate-400'}`}>
                        {(inv.residenceFee || 0).toLocaleString('vi-VN')} đ
                      </span>
                      <span className="text-[10px] text-slate-500 block truncate" title={inv.residenceFeeNote || 'Chu kỳ 12 tháng'}>
                        {inv.residenceFee && inv.residenceFee > 0 ? 'Thu chu kỳ 12 tháng' : 'Đang trong chu kỳ 12T'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Dùng chung &amp; Rác:</span>
                      <span className="font-mono font-semibold text-purple-400">
                        {(inv.sharedDeviceCost + inv.internetAndTrash).toLocaleString('vi-VN')} đ
                      </span>
                      <span className="text-[10px] text-slate-500 block">Rác/Net: {inv.internetAndTrash.toLocaleString('vi-VN')} đ</span>
                    </div>
                  </div>
                </div>
              ))}
          </div>

          {/* MODAL LẬP HÓA ĐƠN THÁNG MỚI CHO ADMIN */}
          {showAdminCreateInvModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl space-y-4 p-6">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
                      <PlusCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-base">Admin Lập Hóa Đơn Tháng Mới</h4>
                      <p className="text-xs text-slate-400">Tự động lấy giá mới nhất từ danh mục bảng giá thiết bị</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAdminCreateInvModal(false)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (onCreateMonthlyInvoice) {
                      onCreateMonthlyInvoice(
                        adminNewInvContractId,
                        adminNewInvMonthYear,
                        adminNewInvElec,
                        adminNewInvWater,
                        adminNewInvShared,
                        adminNewInvElectricRate,
                        adminNewInvWaterRate,
                        adminNewInvOccupantCount,
                        adminNewInvSanitationRate,
                        adminNewInvResidenceRate,
                        adminNewInvApplyResidence
                      );
                      setShowAdminCreateInvModal(false);
                      alert(`Admin đã lập thành công hóa đơn Kỳ ${adminNewInvMonthYear}!\n- Điện: ${adminNewInvElectricRate.toLocaleString('vi-VN')} đ/kWh\n- Nước: ${adminNewInvWaterRate.toLocaleString('vi-VN')} đ/m³\n- Vệ sinh: ${adminNewInvOccupantCount} người × ${adminNewInvSanitationRate.toLocaleString('vi-VN')} đ = ${(adminNewInvOccupantCount * adminNewInvSanitationRate).toLocaleString('vi-VN')} đ\n- Phí tạm trú: ${adminNewInvApplyResidence ? `${(adminNewInvOccupantCount * adminNewInvResidenceRate).toLocaleString('vi-VN')} đ (${adminNewInvOccupantCount} người)` : '0 đ (Miễn thu kỳ này)'}`);
                    }
                  }}
                  className="space-y-3.5 text-xs"
                >
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Chọn Hợp Đồng Phòng Thuê:</label>
                    <select
                      value={adminNewInvContractId}
                      onChange={(e) => {
                        const cid = Number(e.target.value);
                        setAdminNewInvContractId(cid);
                        const targetContract = contracts.find(c => c.contractId === cid);
                        if (targetContract) {
                          const bNode = nodes.find(n => n.nodeId === targetContract.buildingNodeId);
                          if (bNode?.electricRate) setAdminNewInvElectricRate(bNode.electricRate);
                          if (bNode?.waterRate) setAdminNewInvWaterRate(bNode.waterRate);
                          if (bNode?.sanitationFeePerPerson) setAdminNewInvSanitationRate(bNode.sanitationFeePerPerson);
                          if (bNode?.residenceFeePerPerson) setAdminNewInvResidenceRate(bNode.residenceFeePerPerson);
                          const count = getRoomOccupantCount(targetContract, roommates);
                          setAdminNewInvOccupantCount(count);
                          const resCheck = checkIsResidenceFeeBillingMonth(targetContract.actualCheckInDate || targetContract.startDateContract, adminNewInvMonthYear);
                          setAdminNewInvApplyResidence(resCheck.isBillingMonth);
                        }
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-blue-500"
                    >
                      {contracts.map((c) => (
                        <option key={c.contractId} value={c.contractId}>
                          {c.buildingName} - {c.roomName} (Khách: {c.primaryTenantName})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Kỳ Hóa Đơn (Tháng/Năm - MM/YYYY):</label>
                    <input
                      type="text"
                      value={adminNewInvMonthYear}
                      onChange={(e) => {
                        const val = e.target.value;
                        setAdminNewInvMonthYear(val);
                        const targetContract = contracts.find(c => c.contractId === adminNewInvContractId);
                        if (targetContract && val.length >= 7) {
                          const resCheck = checkIsResidenceFeeBillingMonth(targetContract.actualCheckInDate || targetContract.startDateContract, val);
                          setAdminNewInvApplyResidence(resCheck.isBillingMonth);
                        }
                      }}
                      placeholder="12/2026 hoặc 01/2027"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono outline-none focus:border-blue-500"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Chỉ số điện mới (kWh):</label>
                      <input
                        type="number"
                        value={adminNewInvElec}
                        onChange={(e) => setAdminNewInvElec(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-amber-400 font-mono font-bold outline-none focus:border-amber-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Chỉ số nước mới (m³):</label>
                      <input
                        type="number"
                        value={adminNewInvWater}
                        onChange={(e) => setAdminNewInvWater(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-cyan-400 font-mono font-bold outline-none focus:border-cyan-500"
                        required
                      />
                    </div>
                  </div>

                  {/* Đơn giá điện và đơn giá nước áp dụng */}
                  <div className="grid grid-cols-2 gap-3 p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                    <div>
                      <label className="block text-amber-300 font-semibold mb-1 flex items-center gap-1">
                        <Zap className="w-3.5 h-3.5 text-amber-400" />
                        Đơn giá điện (đ/kWh):
                      </label>
                      <input
                        type="number"
                        min={0}
                        step={100}
                        value={adminNewInvElectricRate}
                        onChange={(e) => setAdminNewInvElectricRate(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-amber-400 font-mono font-bold outline-none focus:border-amber-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-cyan-300 font-semibold mb-1 flex items-center gap-1">
                        <Droplets className="w-3.5 h-3.5 text-cyan-400" />
                        Đơn giá nước (đ/m³):
                      </label>
                      <input
                        type="number"
                        min={0}
                        step={1000}
                        value={adminNewInvWaterRate}
                        onChange={(e) => setAdminNewInvWaterRate(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-cyan-400 font-mono font-bold outline-none focus:border-cyan-500"
                        required
                      />
                    </div>
                  </div>

                  {/* Phí vệ sinh (tính trên đầu người/tháng) & Phí tạm trú (tính trên đầu người/năm - chu kỳ 12 tháng) */}
                  <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                        Phí Dịch Vụ Theo Đầu Người
                      </span>
                      <div className="flex items-center gap-1 text-[11px] text-slate-400">
                        <span>Số người ở:</span>
                        <input
                          type="number"
                          min={1}
                          max={10}
                          value={adminNewInvOccupantCount}
                          onChange={(e) => setAdminNewInvOccupantCount(Number(e.target.value))}
                          className="w-14 bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-white font-mono font-bold text-center outline-none focus:border-emerald-500"
                        />
                        <span>người</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-300 mb-1">
                          Đơn giá phí vệ sinh (đ/người/tháng):
                        </label>
                        <input
                          type="number"
                          min={0}
                          step={5000}
                          value={adminNewInvSanitationRate}
                          onChange={(e) => setAdminNewInvSanitationRate(Number(e.target.value))}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-emerald-400 font-mono font-bold outline-none focus:border-emerald-500"
                          required
                        />
                        <span className="text-[10px] text-emerald-400/80 block mt-0.5">
                          = {(adminNewInvOccupantCount * adminNewInvSanitationRate).toLocaleString('vi-VN')} đ/tháng
                        </span>
                      </div>

                      <div>
                        <label className="block text-slate-300 mb-1">
                          Đơn giá phí tạm trú (đ/người/năm):
                        </label>
                        <input
                          type="number"
                          min={0}
                          step={10000}
                          value={adminNewInvResidenceRate}
                          onChange={(e) => setAdminNewInvResidenceRate(Number(e.target.value))}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-indigo-400 font-mono font-bold outline-none focus:border-indigo-500"
                          required
                        />
                        <span className="text-[10px] text-indigo-400/80 block mt-0.5">
                          = {(adminNewInvOccupantCount * adminNewInvResidenceRate).toLocaleString('vi-VN')} đ/năm
                        </span>
                      </div>
                    </div>

                    {/* Kiểm tra chu kỳ 12 tháng của phí tạm trú */}
                    {(() => {
                      const curCont = contracts.find(c => c.contractId === adminNewInvContractId);
                      const resCheck = checkIsResidenceFeeBillingMonth(curCont?.actualCheckInDate || curCont?.startDateContract || '', adminNewInvMonthYear);
                      return (
                        <div className="p-2.5 rounded-xl bg-indigo-950/30 border border-indigo-500/30 text-[11px] space-y-1.5">
                          <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-200">
                            <input
                              type="checkbox"
                              checked={adminNewInvApplyResidence}
                              onChange={(e) => setAdminNewInvApplyResidence(e.target.checked)}
                              className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0"
                            />
                            <span>Kê phí tạm trú tạm vắng vào hóa đơn kỳ này (+{(adminNewInvOccupantCount * adminNewInvResidenceRate).toLocaleString('vi-VN')} đ)</span>
                          </label>
                          <p className="text-[10px] text-slate-400 leading-relaxed">
                            💡 Quy tắc chu kỳ 12 tháng: {resCheck.note}
                          </p>
                        </div>
                      );
                    })()}
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Chi phí thiết bị chung cộng dồn (đ):</label>
                    <input
                      type="number"
                      value={adminNewInvShared}
                      onChange={(e) => setAdminNewInvShared(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-purple-400 font-mono font-bold outline-none focus:border-purple-500"
                      required
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setShowAdminCreateInvModal(false)}
                      className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold hover:bg-slate-700"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow"
                    >
                      Tạo Hóa Đơn Kỳ Mới
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. TAB CÂY ĐỆ QUY TRỰC QUAN */}
      {activeTab === 'tree' && (
        <div className="space-y-4">
          <RecursiveTree
            nodes={nodes}
            objectTypes={objectTypes}
            onAddChildNode={handleOpenAddChild}
            onUpdateCondition={onUpdateCondition}
            onUpdateNode={onUpdateNode}
            onDeleteNode={onDeleteNode}
          />
        </div>
      )}

      {/* 2. TAB DANH MỤC LOẠI ĐỐI TƯỢNG (OBJECT TYPES) */}
      {activeTab === 'objectTypes' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex justify-between items-center text-xs">
            <div>
              <h4 className="font-bold text-white text-sm">
                Bảng Danh Mục Loại Đối Tượng Quản Lý (Mô hình Hướng Đối Tượng)
              </h4>
              <p className="text-slate-400">
                Khi thực tế phát sinh thiết bị mới (Điện thoại công cộng, WiFi, Ghế massage, Lò vi sóng...), quản lý chỉ việc thêm Loại mới mà <strong>không cần phải sửa mã nguồn chương trình!</strong>
              </p>
            </div>
            <button
              onClick={() => setShowAddTypeModal(true)}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center gap-1 text-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              Thêm Loại Mới
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
            {objectTypes.map((type) => (
              <div key={type.typeId} className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="flex justify-between items-start">
                  <span className="font-bold text-white text-sm">{type.typeName}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono font-semibold">
                    {type.typeCode}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400 text-[11px]">
                  <span>Nhóm: <strong>{type.categoryGroup}</strong></span>
                  <span>Đơn vị: <strong>{type.metricUnit || 'Chiếc/Phòng'}</strong></span>
                </div>
                <div className="text-[10px] text-emerald-400">
                  {type.hasSubItems ? '✓ Có thể chứa các mục con' : '• Nút lá (Không chứa con)'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. TAB BÁO CÁO THÁNG / QUÝ / NĂM */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <h4 className="font-bold text-white text-base flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-emerald-400" />
                Báo Cáo Tổng Hợp Chuỗi 100 Nhà Trọ, Phòng & Cư Dân
              </h4>
              <p className="text-slate-400">
                Thống kê người dùng hàng năm, lượng tiêu thụ điện nước, doanh thu và tỷ lệ sự cố thiết bị.
              </p>
            </div>

            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setReportPeriod('MONTH')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  reportPeriod === 'MONTH' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Hàng Tháng
              </button>
              <button
                onClick={() => setReportPeriod('QUARTER')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  reportPeriod === 'QUARTER' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Hàng Quý
              </button>
              <button
                onClick={() => setReportPeriod('YEAR')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  reportPeriod === 'YEAR' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Hàng Năm
              </button>
            </div>
          </div>

          {/* Dữ liệu tổng hợp */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex justify-between items-center text-slate-400">
                <span>Tổng cư dân lưu trú ({reportPeriod === 'YEAR' ? 'Năm 2026' : 'Kỳ này'})</span>
                <Users className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-white">1.850 người</div>
              <div className="text-slate-400 text-[11px]">Đều được định danh bằng CCCD & ảnh 2 mặt</div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex justify-between items-center text-slate-400">
                <span>Tổng điện năng tiêu thụ</span>
                <Zap className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-amber-400">
                {reportPeriod === 'YEAR' ? '184.500 kWh' : '15.420 kWh'}
              </div>
              <div className="text-slate-400 text-[11px]">Đo bằng công tơ WiFi tự động</div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex justify-between items-center text-slate-400">
                <span>Tổng nước lạnh sinh hoạt</span>
                <Sparkles className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-cyan-400">
                {reportPeriod === 'YEAR' ? '12.600 m³' : '980 m³'}
              </div>
              <div className="text-slate-400 text-[11px]">Đo đếm theo từng phòng</div>
            </div>
          </div>
        </div>
      )}

      {/* 4. TAB 6: PHÂN QUYỀN & NHÂN SỰ TOÀN HỆ THỐNG */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          {/* Banner giải thích thẩm quyền Admin Cấp 1 */}
          <div className="p-5 rounded-3xl bg-gradient-to-r from-purple-950/60 via-slate-900 to-indigo-950/50 border border-purple-500/30 space-y-2 shadow-xl">
            <div className="flex items-center gap-2 text-purple-400 text-xs font-bold uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" />
              <span>Thẩm Quyền Quản Trị Cao Nhất (Admin Cấp 1)</span>
            </div>
            <h3 className="text-lg font-bold text-white">
              Phân Quyền &amp; Ấn Định Vai Trò Nhân Sự Toàn Hệ Thống
            </h3>
            <div className="text-xs text-slate-300 max-w-4xl space-y-1.5 leading-relaxed">
              <p>
                • <strong>Mặc định Cấp 3:</strong> Khi người dùng đăng ký tài khoản thì mặc định luôn là <strong>Cấp 3 (Khách thuê / Cư dân - cấp thấp nhất)</strong>.
              </p>
              <p>
                • <strong>Chỉ định Quản lý &amp; Ấn định ngang quyền:</strong> Những tài khoản của người quản lý sẽ do <strong>Tài khoản Cấp 1 (Admin) chỉ định</strong>. Người quản lý (Cấp 2) được phép <strong>ấn định tài khoản khác ngang quyền mình</strong> (hàm ý đầy đủ các tính năng của người quản lý ấn định).
              </p>
              <p>
                • <strong>Admin ấn định ngang quyền:</strong> Người quản trị (Admin Cấp 1) thì cũng được phép <strong>ấn định tài khoản khác ngang quyền mình</strong> (Admin Cấp 1 với toàn quyền tối cao) hoặc điều chỉnh vai trò bất kỳ ai.
              </p>
            </div>
          </div>

          {/* Thanh tìm kiếm & Bộ lọc vai trò */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-slate-400 font-medium">Lọc vai trò:</span>
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setUserRoleFilter('ALL')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                    userRoleFilter === 'ALL' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Tất cả ({allUsers.length})
                </button>
                <button
                  type="button"
                  onClick={() => setUserRoleFilter(1)}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                    userRoleFilter === 1 ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Admin Cấp 1 ({topAdmins.length})
                </button>
                <button
                  type="button"
                  onClick={() => setUserRoleFilter(2)}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                    userRoleFilter === 2 ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Quản Lý Cấp 2 ({managers.length})
                </button>
                <button
                  type="button"
                  onClick={() => setUserRoleFilter(3)}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                    userRoleFilter === 3 ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Khách Thuê Cấp 3 ({tenants.length})
                </button>
              </div>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                placeholder="Tìm tên, CCCD, SĐT, địa chỉ..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {/* Danh sách người dùng theo bộ lọc & tìm kiếm */}
          {(() => {
            const filteredUsers = allUsers.filter((u) => {
              if (userRoleFilter !== 'ALL' && u.roleId !== userRoleFilter) return false;
              if (userSearchQuery.trim()) {
                const q = userSearchQuery.toLowerCase();
                const matchName = u.fullName.toLowerCase().includes(q);
                const matchCccd = u.citizenId.toLowerCase().includes(q);
                const matchPhone = u.phoneNumber.toLowerCase().includes(q);
                const matchAddr = (u.address || '').toLowerCase().includes(q);
                return matchName || matchCccd || matchPhone || matchAddr;
              }
              return true;
            });

            return (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Hiển thị {filteredUsers.length} tài khoản trong hệ thống:</span>
                  <span className="text-[11px] text-purple-300 font-medium">
                    * Bấm các nút tương ứng bên dưới từng thẻ để ấn định vai trò
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                  {filteredUsers.map((u) => {
                    const isSelf = currentUser.userId === u.userId;

                    return (
                      <div
                        key={u.userId}
                        className={`p-4 rounded-2xl bg-slate-900 border transition-all space-y-3 flex flex-col justify-between ${
                          u.roleId === 1
                            ? 'border-purple-800/60 shadow-lg shadow-purple-950/20'
                            : u.roleId === 2
                            ? 'border-blue-800/60 shadow-lg shadow-blue-950/20'
                            : 'border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-bold text-white text-sm">{u.fullName}</span>
                                {isSelf && (
                                  <span className="text-[9px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">
                                    (Bạn)
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-500 font-mono">ID: #{u.userId}</span>
                            </div>

                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap ${
                                u.roleId === 1
                                  ? 'bg-purple-950 text-purple-300 border-purple-700'
                                  : u.roleId === 2
                                  ? 'bg-blue-950 text-blue-300 border-blue-700'
                                  : 'bg-emerald-950 text-emerald-300 border-emerald-700'
                              }`}
                            >
                              {u.roleId === 1 ? 'Admin Cấp 1' : u.roleId === 2 ? 'Quản Lý Cấp 2' : 'Khách Thuê Cấp 3'}
                            </span>
                          </div>

                          <div className="text-slate-400 font-mono text-[11px] space-y-0.5">
                            <div>CCCD: <strong className="text-slate-200">{u.citizenId}</strong></div>
                            <div>SĐT: <strong className="text-slate-200">{u.phoneNumber}</strong></div>
                          </div>

                          <div className="text-emerald-400 flex items-start gap-1 text-[11px]">
                            <MapPin className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                            <span className="line-clamp-2">{u.address || 'Chưa cập nhật địa chỉ'}</span>
                          </div>

                          {u.designatedByName && (
                            <div className="text-[10px] text-indigo-300 bg-indigo-950/40 px-2 py-1 rounded-lg border border-indigo-900/50">
                              Được ấn định bởi: <strong>{u.designatedByName}</strong>
                            </div>
                          )}
                        </div>

                        {/* Các nút hành động ấn định phân quyền dành riêng cho Admin Cấp 1 */}
                        <div className="pt-3 border-t border-slate-800/80 space-y-1.5">
                          <span className="text-[10px] text-slate-400 block font-semibold">
                            Hành động ấn định quyền:
                          </span>

                          <div className="grid grid-cols-1 gap-1.5">
                            {/* Nút Ấn Định Admin Ngang Quyền (Cấp 1) */}
                            {u.roleId !== 1 && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(`Bạn có chắc chắn muốn ấn định tài khoản "${u.fullName}" thành Admin (Cấp 1) ngang quyền mình? Người này sẽ có toàn quyền quản trị cao nhất hệ thống!`)) {
                                    onUpdateUserRole && onUpdateUserRole(u.userId, 1);
                                  }
                                }}
                                className="w-full py-1.5 px-2.5 rounded-xl bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white border border-purple-500/40 text-[11px] font-semibold transition-all flex items-center justify-center gap-1.5 active:scale-95"
                              >
                                <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                                <span>Ấn Định Admin Ngang Quyền (Cấp 1)</span>
                              </button>
                            )}

                            {/* Nút Chỉ Định Quản Lý (Cấp 2) */}
                            {u.roleId !== 2 && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(`Xác nhận chỉ định "${u.fullName}" làm Quản Lý Tòa Nhà (Cấp 2)?`)) {
                                    onUpdateUserRole && onUpdateUserRole(u.userId, 2);
                                  }
                                }}
                                className="w-full py-1.5 px-2.5 rounded-xl bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/40 text-[11px] font-semibold transition-all flex items-center justify-center gap-1.5 active:scale-95"
                              >
                                <Users className="w-3.5 h-3.5 text-blue-400" />
                                <span>Chỉ Định Quản Lý (Cấp 2)</span>
                              </button>
                            )}

                            {/* Nút Chuyển Về Khách Thuê (Cấp 3 - Cấp thấp nhất) */}
                            {u.roleId !== 3 && !isSelf && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(`Xác nhận chuyển tài khoản "${u.fullName}" về Khách Thuê (Cấp 3 - Cấp thấp nhất)?`)) {
                                    onUpdateUserRole && onUpdateUserRole(u.userId, 3);
                                  }
                                }}
                                className="w-full py-1.5 px-2.5 rounded-xl bg-slate-950 hover:bg-rose-950/60 text-slate-400 hover:text-rose-300 border border-slate-800 hover:border-rose-800 text-[11px] font-medium transition-all flex items-center justify-center gap-1"
                              >
                                <span>Chuyển về Khách Thuê (Cấp 3)</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Modal Thêm Loại Đối Tượng Mới */}
      {showAddTypeModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-white text-base">Thêm Loại Đối Tượng Quản Lý Mới</h3>
              <button onClick={() => setShowAddTypeModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <p className="text-xs text-slate-400">
              Đối tượng mới sẽ có mặt ngay trên cây và trong các biểu mẫu báo cáo thiết bị mà không cần viết lại mã nguồn.
            </p>

            <form onSubmit={handleCreateObjectType} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Mã Loại (TypeCode):</label>
                <input
                  type="text"
                  value={newTypeCode}
                  onChange={(e) => setNewTypeCode(e.target.value)}
                  placeholder="Ví dụ: PUBLIC_PHONE, MASSAGE_CHAIR..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono uppercase"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Tên Hiển Thị (TypeName):</label>
                <input
                  type="text"
                  value={newTypeName}
                  onChange={(e) => setNewTypeName(e.target.value)}
                  placeholder="Ví dụ: Điện Thoại Công Cộng Sảnh, Ghế Massage..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Nhóm (Category):</label>
                  <select
                    value={newTypeCategory}
                    onChange={(e) => setNewTypeCategory(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="DEVICE">Thiết bị (DEVICE)</option>
                    <option value="PUBLIC_SERVICE">Dịch vụ chung (PUBLIC_SERVICE)</option>
                    <option value="ROOM">Phòng (ROOM)</option>
                    <option value="PROPERTY">Bất động sản (PROPERTY)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Đơn vị đo:</label>
                  <input
                    type="text"
                    value={newTypeUnit}
                    onChange={(e) => setNewTypeUnit(e.target.value)}
                    placeholder="Lần, Phút, kWh, Khối..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddTypeModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold"
                >
                  Lưu Loại Đối Tượng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Thêm Node Vào Cây */}
      {showAddNodeModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-white text-base">Thêm Thực Thể Con Vào Cây</h3>
              <button onClick={() => setShowAddNodeModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateNode} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Node Cha (Parent Node):</label>
                <select
                  value={targetParentId}
                  onChange={(e) => setTargetParentId(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                >
                  {nodes.map((n) => (
                    <option key={n.nodeId} value={n.nodeId}>
                      [{n.nodeCode}] {n.nodeName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Loại Đối Tượng:</label>
                <select
                  value={newNodeTypeId}
                  onChange={(e) => setNewNodeTypeId(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                >
                  {objectTypes.map((t) => (
                    <option key={t.typeId} value={t.typeId}>{t.typeName} ({t.typeCode})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Mã Nhận Diện (NodeCode):</label>
                <input
                  type="text"
                  value={newNodeCode}
                  onChange={(e) => setNewNodeCode(e.target.value)}
                  placeholder="Ví dụ: DRY-01, TEL-02..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Tên Thực Thể (NodeName):</label>
                <input
                  type="text"
                  value={newNodeName}
                  onChange={(e) => setNewNodeName(e.target.value)}
                  placeholder="Ví dụ: Máy sấy quần áo công nghiệp 12kg..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Đơn Giá Sử Dụng / Giá Thuê (đ):</label>
                <input
                  type="number"
                  value={newNodePrice}
                  onChange={(e) => setNewNodePrice(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddNodeModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold"
                >
                  Thêm Vào Cây
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Admin Thêm Phòng Mới Vào Tòa Nhà */}
      {showAdminAddRoomModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <DoorClosed className="w-5 h-5 text-blue-400" />
                <div>
                  <h3 className="font-bold text-white text-base">Thêm Phòng Mới Vào Tòa Nhà</h3>
                  <p className="text-xs text-slate-400">Quyền Admin Cấp 1 &amp; Quản Lý Cấp 2</p>
                </div>
              </div>
              <button 
                onClick={() => setShowAdminAddRoomModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAdminCreateRoom} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-medium">Tòa Nhà Trực Thuộc:</label>
                <select
                  value={adminRoomBuildingId}
                  onChange={(e) => setAdminRoomBuildingId(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-blue-500"
                >
                  {nodes.filter((n) => n.parentNodeId === null).map((b) => (
                    <option key={b.nodeId} value={b.nodeId}>
                      {b.nodeName} ({b.nodeCode})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Mã Phòng:</label>
                  <input
                    type="text"
                    value={adminRoomCode}
                    onChange={(e) => setAdminRoomCode(e.target.value)}
                    placeholder="VD: P204, P301"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Tên Phòng:</label>
                  <input
                    type="text"
                    value={adminRoomName}
                    onChange={(e) => setAdminRoomName(e.target.value)}
                    placeholder="VD: Phòng 204 (Studio VIP)"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Giá Thuê (đ/tháng):</label>
                  <input
                    type="number"
                    step="50000"
                    value={adminRoomRent}
                    onChange={(e) => setAdminRoomRent(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none font-mono font-bold text-emerald-400"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Tiền Cọc (đ):</label>
                  <input
                    type="number"
                    step="50000"
                    value={adminRoomDeposit}
                    onChange={(e) => setAdminRoomDeposit(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Thời Điểm / Ghi Chú Giá:</label>
                <input
                  type="text"
                  value={adminRoomPriceNote}
                  onChange={(e) => setAdminRoomPriceNote(e.target.value)}
                  placeholder="Ví dụ: Giá mùa cao điểm tháng 9/2026, Giá khuyến mãi..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAdminAddRoomModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow"
                >
                  Tạo Phòng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Admin Ấn Định Mức Giá Thuê Theo Từng Thời Điểm */}
      {adminEditingPriceRoom && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="font-bold text-white text-base">Ấn Định Mức Giá Thuê</h3>
                  <p className="text-xs text-slate-400">{adminEditingPriceRoom.nodeName} ({adminEditingPriceRoom.nodeCode})</p>
                </div>
              </div>
              <button 
                onClick={() => setAdminEditingPriceRoom(null)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAdminSavePrice} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-medium">Mức Giá Thuê Mới (VNĐ/tháng):</label>
                <input
                  type="number"
                  step="50000"
                  value={adminEditPriceValue}
                  onChange={(e) => setAdminEditPriceValue(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white font-mono font-bold text-base text-emerald-400 outline-none focus:border-emerald-400"
                  required
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Giá cũ: {(adminEditingPriceRoom.unitPrice || 4500000).toLocaleString('vi-VN')} đ/tháng
                </span>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Thời Điểm / Chương Trình Định Giá:</label>
                <input
                  type="text"
                  value={adminEditPriceNote}
                  onChange={(e) => setAdminEditPriceNote(e.target.value)}
                  placeholder="Ví dụ: Giá mùa cao điểm tháng 9/2026, Giá khuyến mãi hè, Giá tiêu chuẩn..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {['Giá tiêu chuẩn', 'Mùa cao điểm tháng 9', 'Khuyến mãi hè', 'Ưu đãi sinh viên'].map((sug) => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => setAdminEditPriceNote(sug)}
                    className="text-[10px] px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:border-slate-700"
                  >
                    + {sug}
                  </button>
                ))}
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setAdminEditingPriceRoom(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow"
                >
                  Lưu Mức Giá
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Admin Thêm Thiết Bị Cho Tòa Nhà */}
      {showAdminAddDeviceModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-indigo-400" />
                <div>
                  <h3 className="font-bold text-white text-base">Admin Thêm Thiết Bị Vào Tòa Nhà</h3>
                  <p className="text-xs text-slate-400">Lập danh mục thiết bị theo từng cơ sở</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAdminAddDeviceModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAdminCreateDeviceSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Tòa Nhà Nhận Thiết Bị:</label>
                <select
                  value={adminNewDevBuildingId}
                  onChange={(e) => {
                    const bId = Number(e.target.value);
                    setAdminNewDevBuildingId(bId);
                    const roomsOfB = nodes.filter(
                      (n) => n.typeId === 3 && (n.parentNodeId === bId || nodes.some(p => p.nodeId === n.parentNodeId && p.parentNodeId === bId))
                    );
                    setAdminNewDevRoomId(roomsOfB[0]?.nodeId || null);
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-semibold outline-none focus:border-indigo-500"
                >
                  {allBuildings.map((b) => (
                    <option key={b.nodeId} value={b.nodeId}>
                      {b.nodeName} ({b.nodeCode})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Tên Thiết Bị:</label>
                  <input
                    type="text"
                    value={adminNewDevName}
                    onChange={(e) => setAdminNewDevName(e.target.value)}
                    placeholder="VD: Điều Hòa Casper 9000BTU"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-indigo-500 placeholder-slate-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Loại Thiết Bị:</label>
                  <select
                    value={adminNewDevTypeId}
                    onChange={(e) => setNewNodeTypeId(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-indigo-500"
                  >
                    {objectTypes
                      .filter((t) => t.categoryGroup === 'DEVICE' || t.categoryGroup === 'PUBLIC_SERVICE')
                      .map((t) => (
                        <option key={t.typeId} value={t.typeId}>
                          {t.typeName} ({t.typeCode})
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Lựa chọn: Dùng chung hay trong phòng */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <label className="block text-slate-200 font-bold text-xs">
                  Phân Định Phạm Vi Sử Dụng Thiết Bị:
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <label
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-2.5 ${
                      adminNewDevIsShared
                        ? 'bg-purple-950/60 border-purple-500 text-purple-200 shadow'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="adminDeviceUsageScope"
                      checked={adminNewDevIsShared}
                      onChange={() => {
                        setAdminNewDevIsShared(true);
                        setAdminNewDevRoomId(null);
                        setAdminNewDevLocation('Khu dùng chung công cộng');
                      }}
                      className="mt-0.5 text-purple-600 focus:ring-0"
                    />
                    <div>
                      <div className="font-bold text-xs text-white">🏢 Dùng Chung Cả Tòa Nhà</div>
                      <div className="text-[10px] text-slate-400 mt-0.5 leading-snug">
                        Phục vụ mọi khách thuê trong tòa nhà (Máy giặt sảnh, trạm sạc, cổng từ).
                      </div>
                    </div>
                  </label>

                  <label
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-2.5 ${
                      !adminNewDevIsShared
                        ? 'bg-emerald-950/60 border-emerald-500 text-emerald-200 shadow'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="adminDeviceUsageScope"
                      checked={!adminNewDevIsShared}
                      onChange={() => {
                        setAdminNewDevIsShared(false);
                        const rooms = nodes.filter(
                          (n) => n.typeId === 3 && (n.parentNodeId === adminNewDevBuildingId || nodes.some(p => p.nodeId === n.parentNodeId && p.parentNodeId === adminNewDevBuildingId))
                        );
                        setAdminNewDevRoomId(rooms[0]?.nodeId || null);
                        setAdminNewDevLocation(rooms[0] ? `Phòng ${rooms[0].nodeName}` : 'Trong phòng');
                      }}
                      className="mt-0.5 text-emerald-600 focus:ring-0"
                    />
                    <div>
                      <div className="font-bold text-xs text-white">🏠 Trang Bị Trong Phòng</div>
                      <div className="text-[10px] text-slate-400 mt-0.5 leading-snug">
                        Lắp vào phòng cụ thể. Người thuê phòng đó dùng và báo hỏng độc quyền.
                      </div>
                    </div>
                  </label>
                </div>

                {!adminNewDevIsShared && (
                  <div className="pt-2 border-t border-slate-900 space-y-1.5 animate-in fade-in">
                    <label className="block text-slate-300 font-medium">Chọn Phòng Lắp Đặt Thiết Bị:</label>
                    <select
                      value={adminNewDevRoomId || ''}
                      onChange={(e) => {
                        const rId = e.target.value ? Number(e.target.value) : null;
                        setAdminNewDevRoomId(rId);
                        const targetR = nodes.find(n => n.nodeId === rId);
                        if (targetR) {
                          setAdminNewDevLocation(`Phòng ${targetR.nodeName}`);
                        }
                      }}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-semibold outline-none focus:border-emerald-500"
                    >
                      {nodes
                        .filter(
                          (n) => n.typeId === 3 && (n.parentNodeId === adminNewDevBuildingId || nodes.some(p => p.nodeId === n.parentNodeId && p.parentNodeId === adminNewDevBuildingId))
                        )
                        .map((r) => (
                          <option key={r.nodeId} value={r.nodeId}>
                            Phòng: {r.nodeName} ({r.nodeCode})
                          </option>
                        ))}
                      <option value="">-- Để ở kho phòng (Chưa gán phòng) --</option>
                    </select>
                  </div>
                )}

                {/* Cấu hình giá thiết bị theo 2 loại */}
                <div className="pt-2 border-t border-slate-900">
                  {adminNewDevIsShared ? (
                    <div>
                      <label className="block text-purple-300 font-semibold mb-1 flex items-center justify-between">
                        <span>Đơn Giá Thu Phí Sử Dụng (Tính theo lượt dùng):</span>
                        <span className="text-[10px] text-purple-400 font-normal">Trừ tiền qua QR / cộng dồn hóa đơn</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="1000"
                          min="0"
                          value={adminNewDevUnitPrice}
                          onChange={(e) => setAdminNewDevUnitPrice(Number(e.target.value))}
                          placeholder="VD: 15000"
                          className="w-full bg-slate-950 border border-purple-500/50 rounded-xl px-3 py-2 text-white font-mono font-bold outline-none focus:border-purple-400"
                          required
                        />
                        <span className="text-purple-300 font-semibold whitespace-nowrap">đ / lượt dùng</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">
                        Áp dụng cho máy giặt chung (15k/lượt), sạc xe điện (10k/lượt), cổng vân tay (0đ)...
                      </p>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-emerald-300 font-semibold mb-1 flex items-center justify-between">
                        <span>Đơn Giá Thuê Theo Tháng (Trang bị theo phòng):</span>
                        <span className="text-[10px] text-emerald-400 font-normal">Tự động khởi tạo vào Bảng giá tháng</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="10000"
                          min="0"
                          value={adminNewDevMonthlyRentalPrice}
                          onChange={(e) => setAdminNewDevMonthlyRentalPrice(Number(e.target.value))}
                          placeholder="VD: 120000"
                          className="w-full bg-slate-950 border border-emerald-500/50 rounded-xl px-3 py-2 text-white font-mono font-bold outline-none focus:border-emerald-400"
                          required
                        />
                        <span className="text-emerald-300 font-semibold whitespace-nowrap">đ / tháng</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">
                        Ví dụ: Cục phát WiFi các model khác nhau giá thuê sẽ khác nhau (80k - 150k/tháng), điều hòa 150k/tháng. Sau này tiền phòng &amp; hóa đơn tính dựa trên bảng giá của từng tháng!
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Upload ảnh của thiết bị */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-slate-300 font-semibold flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-indigo-400" />
                    Ảnh Chụp Thực Tế Của Thiết Bị:
                  </label>
                  {adminNewDevImageUrl && (
                    <button
                      type="button"
                      onClick={() => setAdminNewDevImageUrl('')}
                      className="text-[10px] text-rose-400 hover:text-rose-300 flex items-center gap-0.5"
                    >
                      <X className="w-3 h-3" />
                      <span>Xóa ảnh</span>
                    </button>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <label className="cursor-pointer px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 flex-shrink-0">
                    <Upload className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Chọn File Ảnh</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAdminDevImageUpload}
                    />
                  </label>

                  <input
                    type="url"
                    value={adminNewDevImageUrl}
                    onChange={(e) => setAdminNewDevImageUrl(e.target.value)}
                    placeholder="Hoặc dán link ảnh (https://...)"
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-indigo-500 text-xs"
                  />
                </div>

                {adminNewDevImageUrl && (
                  <div className="mt-2 relative rounded-xl overflow-hidden border border-slate-700/80 h-32 bg-slate-900 group">
                    <img src={adminNewDevImageUrl} alt="Ảnh thiết bị" className="w-full h-full object-cover" />
                    <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur text-emerald-400 text-[10px] font-semibold px-2 py-0.5 rounded-lg border border-emerald-500/30 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Ảnh xem trước thiết bị</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Vị Trí Cụ Thể:</label>
                  <input
                    type="text"
                    value={adminNewDevLocation}
                    onChange={(e) => setAdminNewDevLocation(e.target.value)}
                    placeholder="VD: Ban công, Tường phòng, Sảnh T1..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1">Số Serial / Model (nếu có):</label>
                  <input
                    type="text"
                    value={adminNewDevSerial}
                    onChange={(e) => setAdminNewDevSerial(e.target.value)}
                    placeholder="VD: SN-2026-8811"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAdminAddDeviceModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-600/30"
                >
                  Thêm Thiết Bị
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Admin Đổi Cách Tính Tiền & Vị Trí Thiết Bị */}
      {adminAssigningDevice && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Đổi Cách Tính Tiền &amp; Vị Trí Thiết Bị</h3>
                  <p className="text-xs text-slate-400 truncate max-w-[280px]">
                    {adminAssigningDevice.nodeName} ({adminAssigningDevice.nodeCode})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAdminAssigningDevice(null)}
                className="text-slate-400 hover:text-white text-sm p-1 rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAdminAssignDeviceSubmit} className="space-y-4 text-xs">
              {/* Trạng thái tính tiền hiện tại */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="text-slate-400 text-[11px]">Trạng thái tính tiền hiện tại:</div>
                <div className="text-white font-semibold flex items-center gap-2">
                  {adminAssigningDevice.isShared ? (
                    <span className="text-purple-400 flex items-center gap-1.5 font-bold">
                      <span>🏢 Dùng chung cả tòa nhà • Tính tiền THEO LƯỢT DÙNG</span>
                      <span className="font-mono text-purple-300">({(adminAssigningDevice.unitPrice || 0).toLocaleString('vi-VN')} đ/lượt)</span>
                    </span>
                  ) : (
                    <span className="text-emerald-400 flex items-center gap-1.5 font-bold">
                      <span>🏠 Thiết bị theo phòng • Tính tiền THEO THÁNG</span>
                      <span className="font-mono text-emerald-300">({(adminAssigningDevice.monthlyRentalPrice || 0).toLocaleString('vi-VN')} đ/tháng)</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Lựa Chọn Cách Tính Tiền Mới */}
              <div>
                <label className="block text-slate-300 mb-2 font-bold text-xs">
                  Chọn Phương Thức Tính Tiền Mới Cho Thiết Bị:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Option: Theo Tháng */}
                  <div
                    onClick={() => setAdminAssigningBillingMode('MONTHLY')}
                    className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                      adminAssigningBillingMode === 'MONTHLY'
                        ? 'bg-emerald-950/70 border-emerald-500 ring-2 ring-emerald-500/40 text-white shadow-lg'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    <div className="font-bold text-emerald-400 flex items-center gap-1.5 text-xs">
                      <span>🟢 Tính Tiền Theo Tháng</span>
                    </div>
                    <div className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                      Lắp đặt cố định cho từng phòng riêng (WiFi, Điều hòa, Tủ lạnh...). Tiền thuê được cộng vào hóa đơn phòng mỗi tháng.
                    </div>
                  </div>

                  {/* Option: Theo Lượt Dùng */}
                  <div
                    onClick={() => setAdminAssigningBillingMode('PER_USE')}
                    className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                      adminAssigningBillingMode === 'PER_USE'
                        ? 'bg-purple-950/70 border-purple-500 ring-2 ring-purple-500/40 text-white shadow-lg'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    <div className="font-bold text-purple-400 flex items-center gap-1.5 text-xs">
                      <span>🟣 Tính Tiền Theo Lượt Dùng</span>
                    </div>
                    <div className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                      Thiết bị dùng chung cả tòa nhà (Máy giặt sảnh, Trạm sạc EV, Cổng từ...). Cư dân dùng lần nào tính tiền lượt đó.
                    </div>
                  </div>
                </div>
              </div>

              {/* Chi Tiết Cấu Hình Theo Cách Tính Tiền Đã Chọn */}
              {adminAssigningBillingMode === 'MONTHLY' ? (
                <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/40 space-y-3">
                  <div>
                    <label className="block text-emerald-300 font-semibold mb-1">
                      1. Chọn Phòng Lắp Đặt Thiết Bị:
                    </label>
                    <select
                      value={adminTargetRoomForAssign || ''}
                      onChange={(e) => setAdminTargetRoomForAssign(e.target.value ? Number(e.target.value) : null)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-semibold outline-none focus:border-emerald-500"
                    >
                      <option value="">-- Kho (Chưa gán phòng cụ thể) --</option>
                      {adminRoomsInCurrentBuilding.map((r) => (
                        <option key={r.nodeId} value={r.nodeId}>
                          Lắp tại phòng: {r.nodeName} ({r.nodeCode})
                        </option>
                      ))}
                    </select>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Khi gắn vào phòng, tiền thuê sẽ xuất hiện trên hóa đơn và khách thuê phòng đó có quyền quản lý, báo hỏng.
                    </p>
                  </div>

                  <div>
                    <label className="block text-emerald-300 font-semibold mb-1">
                      2. Đơn Giá Thuê Thiết Bị Hàng Tháng (VNĐ/tháng):
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={1000}
                      value={adminAssigningMonthlyPrice}
                      onChange={(e) => setAdminAssigningMonthlyPrice(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-emerald-700/60 rounded-xl px-3 py-2 text-emerald-400 font-mono font-bold outline-none focus:border-emerald-500"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      Số tiền này sẽ được cộng cố định vào hóa đơn hàng tháng của phòng.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 rounded-2xl bg-purple-950/30 border border-purple-500/40 space-y-3">
                  <div>
                    <label className="block text-purple-300 font-semibold mb-1">
                      1. Vị Trí Lắp Đặt:
                    </label>
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 font-medium">
                      🏢 Khu vực công cộng dùng chung của cả tòa nhà ({adminCurrentBuildingNode?.nodeName})
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Mọi khách thuê trong tòa nhà đều có thể kích hoạt sử dụng thiết bị này.
                    </p>
                  </div>

                  <div>
                    <label className="block text-purple-300 font-semibold mb-1">
                      2. Phí Sử Dụng Cho Mỗi Lượt Dùng (VNĐ/lượt):
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={1000}
                      value={adminAssigningUnitPrice}
                      onChange={(e) => setAdminAssigningUnitPrice(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-purple-700/60 rounded-xl px-3 py-2 text-purple-400 font-mono font-bold outline-none focus:border-purple-500"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      Đơn giá tính cho mỗi lần sử dụng (hoặc lần giặt, lần sạc xe).
                    </p>
                  </div>
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setAdminAssigningDevice(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Lưu Thay Đổi Cách Tính Tiền</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Bảng Giá Thiết Bị Theo Từng Tháng */}
      {showAdminPriceScheduleModal && (
        <DevicePriceScheduleModal
          isOpen={showAdminPriceScheduleModal}
          onClose={() => {
            setShowAdminPriceScheduleModal(false);
            setAdminSelectedDevForPriceSchedule(null);
          }}
          buildings={allBuildings}
          nodes={nodes}
          invoices={invoices}
          objectTypes={objectTypes}
          initialSelectedDeviceNodeId={adminSelectedDevForPriceSchedule}
          onUpdateDeviceMonthlyPrice={onUpdateDeviceMonthlyPrice || (() => {})}
          onRecalculateInvoicesForMonth={onRecalculateInvoicesForMonth}
          onOpenPhotoModal={(dev) => setAdminSelectedDeviceForPhoto(dev)}
        />
      )}

      {/* Modal Xem Ảnh Chụp Thực Tế Thiết Bị */}
      {adminSelectedDeviceForPhoto && (
        <DevicePhotoModal
          deviceNode={adminSelectedDeviceForPhoto}
          isOpen={!!adminSelectedDeviceForPhoto}
          onClose={() => setAdminSelectedDeviceForPhoto(null)}
          buildingName={nodes.find(n => n.nodeId === adminSelectedDeviceForPhoto.buildingNodeId)?.nodeName || allBuildings.find(b => b.nodeId === adminSelectedBuildingForDevices)?.nodeName}
          roomName={nodes.find(n => n.nodeId === adminSelectedDeviceForPhoto.roomNodeId || n.nodeId === adminSelectedDeviceForPhoto.parentNodeId)?.nodeName}
          onUpdateNode={onUpdateNode}
        />
      )}

      {/* Modal Cài Đặt Đơn Giá Điện Nước & Phí Dịch Vụ cho Tòa Nhà */}
      {adminEditingBuildingRates && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-base">Cài Đặt Đơn Giá &amp; Phí Tòa Nhà</h4>
                  <p className="text-xs text-slate-400">{adminEditingBuildingRates.nodeName} ({adminEditingBuildingRates.nodeCode})</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAdminEditingBuildingRates(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (onUpdateBuildingUtilityRates && adminEditingBuildingRates) {
                  onUpdateBuildingUtilityRates(
                    adminEditingBuildingRates.nodeId,
                    adminEditBuildingElecRate,
                    adminEditBuildingWaterRate,
                    adminEditBuildingSanitationRate,
                    adminEditBuildingResidenceRate
                  );
                  alert(`Đã cập nhật đơn giá cho tòa nhà ${adminEditingBuildingRates.nodeName}!\n- Điện: ${adminEditBuildingElecRate.toLocaleString('vi-VN')} đ/kWh\n- Nước: ${adminEditBuildingWaterRate.toLocaleString('vi-VN')} đ/m³\n- Phí vệ sinh: ${adminEditBuildingSanitationRate.toLocaleString('vi-VN')} đ/người/tháng\n- Phí tạm trú: ${adminEditBuildingResidenceRate.toLocaleString('vi-VN')} đ/người/năm`);
                  setAdminEditingBuildingRates(null);
                }
              }}
              className="space-y-3.5 text-xs"
            >
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-300 space-y-1">
                <p>
                  Các đơn giá và định mức phí này được sử dụng làm <strong>mức cơ sở mặc định</strong> khi tự động lập hóa đơn hàng tháng cho toàn bộ các phòng trực thuộc tòa nhà này. Có thể điều chỉnh riêng từng kỳ nếu cần.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-amber-300 font-semibold mb-1 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    Đơn Giá Điện (đ/kWh):
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={100}
                    value={adminEditBuildingElecRate}
                    onChange={(e) => setAdminEditBuildingElecRate(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-amber-400 font-mono font-bold text-sm outline-none focus:border-amber-500"
                    required
                  />
                  <span className="text-[10px] text-slate-500">Mặc định: 3.800 đ/kWh</span>
                </div>

                <div>
                  <label className="block text-cyan-300 font-semibold mb-1 flex items-center gap-1.5">
                    <Droplets className="w-3.5 h-3.5 text-cyan-400" />
                    Đơn Giá Nước (đ/m³):
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    value={adminEditBuildingWaterRate}
                    onChange={(e) => setAdminEditBuildingWaterRate(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-cyan-400 font-mono font-bold text-sm outline-none focus:border-cyan-500"
                    required
                  />
                  <span className="text-[10px] text-slate-500">Mặc định: 30.000 đ/m³</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-emerald-300 font-semibold mb-1 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    Phí Vệ Sinh (đ/người/tháng):
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={5000}
                    value={adminEditBuildingSanitationRate}
                    onChange={(e) => setAdminEditBuildingSanitationRate(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-emerald-400 font-mono font-bold text-sm outline-none focus:border-emerald-500"
                    required
                  />
                  <span className="text-[10px] text-slate-500">Tính trên đầu người mỗi tháng</span>
                </div>

                <div>
                  <label className="block text-indigo-300 font-semibold mb-1 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                    Phí Tạm Trú (đ/người/năm):
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={10000}
                    value={adminEditBuildingResidenceRate}
                    onChange={(e) => setAdminEditBuildingResidenceRate(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-indigo-400 font-mono font-bold text-sm outline-none focus:border-indigo-500"
                    required
                  />
                  <span className="text-[10px] text-slate-500">Định kỳ sau mỗi 12 tháng</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setAdminEditingBuildingRates(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold hover:bg-slate-700"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold shadow"
                >
                  Lưu Cài Đặt Tòa Nhà
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Sửa Chỉ Số, Đơn Giá & Phí Dịch Vụ Cho Hóa Đơn Cụ Thể */}
      {adminEditingInvoiceMeters && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-base">Sửa Chỉ Số &amp; Phí Dịch Vụ Hóa Đơn</h4>
                  <p className="text-xs text-slate-400">{adminEditingInvoiceMeters.roomName} • Kỳ {adminEditingInvoiceMeters.monthYear}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAdminEditingInvoiceMeters(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (onUpdateInvoiceMeters && adminEditingInvoiceMeters) {
                  onUpdateInvoiceMeters(
                    adminEditingInvoiceMeters.invoiceId,
                    adminEditInvCurrElec,
                    adminEditInvCurrWater,
                    adminEditInvElecRate,
                    adminEditInvWaterRate,
                    adminEditInvOccupantCount,
                    adminEditInvSanitationRate,
                    adminEditInvResidenceRate,
                    adminEditInvApplyResidence
                  );
                  alert(`Đã cập nhật hóa đơn Kỳ ${adminEditingInvoiceMeters.monthYear} phòng ${adminEditingInvoiceMeters.roomName}! Hệ thống đã tính lại tổng tiền.`);
                  setAdminEditingInvoiceMeters(null);
                }
              }}
              className="space-y-4 text-xs"
            >
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-300">
                Cho phép điều chỉnh linh hoạt <strong>chỉ số công tơ điện nước</strong>, <strong>đơn giá riêng của tháng này</strong>, và <strong>phí vệ sinh / phí tạm trú</strong> tính theo đầu người.
              </div>

              {/* Điện */}
              <div className="p-3.5 rounded-2xl bg-amber-950/20 border border-amber-500/30 space-y-3">
                <div className="font-bold text-amber-300 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>Điện Sinh Hoạt (Số cũ: {adminEditingInvoiceMeters.prevElectric} kWh)</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 mb-1">Chỉ số điện mới (kWh):</label>
                    <input
                      type="number"
                      value={adminEditInvCurrElec}
                      onChange={(e) => setAdminEditInvCurrElec(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-amber-400 font-mono font-bold outline-none focus:border-amber-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 mb-1">Đơn giá điện tháng này (đ/kWh):</label>
                    <input
                      type="number"
                      min={0}
                      step={100}
                      value={adminEditInvElecRate}
                      onChange={(e) => setAdminEditInvElecRate(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-amber-400 font-mono font-bold outline-none focus:border-amber-500"
                      required
                    />
                  </div>
                </div>
                <div className="text-[11px] text-amber-400/80 font-mono">
                  Sử dụng: {Math.max(0, adminEditInvCurrElec - adminEditingInvoiceMeters.prevElectric)} kWh × {adminEditInvElecRate.toLocaleString('vi-VN')} đ = {(Math.max(0, adminEditInvCurrElec - adminEditingInvoiceMeters.prevElectric) * adminEditInvElecRate).toLocaleString('vi-VN')} đ
                </div>
              </div>

              {/* Nước */}
              <div className="p-3.5 rounded-2xl bg-cyan-950/20 border border-cyan-500/30 space-y-3">
                <div className="font-bold text-cyan-300 flex items-center gap-1.5">
                  <Droplets className="w-4 h-4 text-cyan-400" />
                  <span>Nước Sinh Hoạt (Số cũ: {adminEditingInvoiceMeters.prevWater} m³)</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 mb-1">Chỉ số nước mới (m³):</label>
                    <input
                      type="number"
                      value={adminEditInvCurrWater}
                      onChange={(e) => setAdminEditInvCurrWater(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-cyan-400 font-mono font-bold outline-none focus:border-cyan-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 mb-1">Đơn giá nước tháng này (đ/m³):</label>
                    <input
                      type="number"
                      min={0}
                      step={1000}
                      value={adminEditInvWaterRate}
                      onChange={(e) => setAdminEditInvWaterRate(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-cyan-400 font-mono font-bold outline-none focus:border-cyan-500"
                      required
                    />
                  </div>
                </div>
                <div className="text-[11px] text-cyan-400/80 font-mono">
                  Sử dụng: {Math.max(0, adminEditInvCurrWater - adminEditingInvoiceMeters.prevWater)} m³ × {adminEditInvWaterRate.toLocaleString('vi-VN')} đ = {(Math.max(0, adminEditInvCurrWater - adminEditingInvoiceMeters.prevWater) * adminEditInvWaterRate).toLocaleString('vi-VN')} đ
                </div>
              </div>

              {/* Phí vệ sinh & Phí tạm trú theo đầu người */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    Phí Vệ Sinh &amp; Phí Tạm Trú Theo Đầu Người
                  </span>
                  <div className="flex items-center gap-1 text-[11px] text-slate-400">
                    <span>Số người ở:</span>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={adminEditInvOccupantCount}
                      onChange={(e) => setAdminEditInvOccupantCount(Number(e.target.value))}
                      className="w-14 bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-white font-mono font-bold text-center outline-none focus:border-emerald-500"
                    />
                    <span>người</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 mb-1">Đơn giá phí vệ sinh (đ/người/tháng):</label>
                    <input
                      type="number"
                      min={0}
                      step={5000}
                      value={adminEditInvSanitationRate}
                      onChange={(e) => setAdminEditInvSanitationRate(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-emerald-400 font-mono font-bold outline-none focus:border-emerald-500"
                      required
                    />
                    <div className="text-[10px] text-emerald-400/80 font-mono mt-1">
                      = {(adminEditInvOccupantCount * adminEditInvSanitationRate).toLocaleString('vi-VN')} đ
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 mb-1">Đơn giá phí tạm trú (đ/người/năm):</label>
                    <input
                      type="number"
                      min={0}
                      step={10000}
                      value={adminEditInvResidenceRate}
                      onChange={(e) => setAdminEditInvResidenceRate(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-indigo-400 font-mono font-bold outline-none focus:border-indigo-500"
                      required
                    />
                    <div className="text-[10px] text-indigo-400/80 font-mono mt-1">
                      = {(adminEditInvOccupantCount * adminEditInvResidenceRate).toLocaleString('vi-VN')} đ
                    </div>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-indigo-950/30 border border-indigo-500/30 text-[11px] space-y-1">
                  <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-200">
                    <input
                      type="checkbox"
                      checked={adminEditInvApplyResidence}
                      onChange={(e) => setAdminEditInvApplyResidence(e.target.checked)}
                      className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0"
                    />
                    <span>Kê phí tạm trú tạm vắng vào kỳ hóa đơn này (+{adminEditInvApplyResidence ? (adminEditInvOccupantCount * adminEditInvResidenceRate).toLocaleString('vi-VN') : 0} đ)</span>
                  </label>
                  <p className="text-[10px] text-slate-400">
                    {adminEditingInvoiceMeters.residenceFeeNote || 'Thu từ tháng bắt đầu ở và định kỳ sau mỗi 12 tháng'}
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setAdminEditingInvoiceMeters(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold hover:bg-slate-700"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow"
                >
                  Cập Nhật Hóa Đơn
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
