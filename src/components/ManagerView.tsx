import React, { useState } from 'react';
import { 
  Building2, 
  DoorClosed, 
  Wrench, 
  Zap, 
  Plus, 
  Users, 
  CheckCircle2, 
  Flame, 
  Sparkles, 
  HelpCircle, 
  Lock, 
  Unlock, 
  Star, 
  FileText, 
  Check, 
  Calendar,
  AlertTriangle,
  CreditCard,
  MapPin,
  Camera,
  Trash2,
  Tag,
  Edit3,
  ShieldCheck,
  ShieldAlert,
  ArrowUpDown,
  Cpu,
  Layers, 
  CornerDownRight, 
  Smartphone,
  Upload,
  Eye,
  X,
  PlusCircle,
  DollarSign,
  Wifi,
  Droplets,
  Sliders,
  UserCheck,
  Search,
  FolderTree
} from 'lucide-react';
import { 
  User, 
  RoleType,
  RentalContract, 
  Roommate, 
  MonthlyInvoice, 
  ManagementNode, 
  DeviceIssueReport, 
  TwoWayReview, 
  ObjectType, 
  BuildingPost, 
  DeviceCondition 
} from '../types/rental';
import { 
  checkIsResidenceFeeBillingMonth, 
  getRoomOccupantCount 
} from '../utils/utilityCalculations';
import { formatDateVN, formatDateTimeVN } from '../utils/dateUtils';
import { DevicePriceScheduleModal } from './DevicePriceScheduleModal';
import { DevicePhotoModal, getDeviceCategoryIcon, getDevicePhotoUrl } from './DevicePhotoModal';
import { RecursiveTree } from './RecursiveTree';

interface ManagerViewProps {
  currentUser: User;
  contracts: RentalContract[];
  roommates: Roommate[];
  invoices: MonthlyInvoice[];
  nodes: ManagementNode[];
  issues: DeviceIssueReport[];
  reviews: TwoWayReview[];
  objectTypes: ObjectType[];
  onAddRoom: (buildingNodeId: number, roomName: string, rent: number, deposit: number, roomCode?: string, priceNote?: string) => void;
  onDeleteRoom?: (roomNodeId: number) => void;
  onUpdateRoomPrice?: (roomNodeId: number, newPrice: number, priceNote?: string) => void;
  onAddDeviceToRoom: (roomNodeId: number, typeId: number, deviceName: string, serial: string) => void;
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
  onUpdateNode?: (nodeId: number, updates: Partial<ManagementNode>) => void;
  onAddChildNode?: (parentNodeId: number, typeId: number, code: string, name: string, price?: number) => void;
  onDeleteNode?: (nodeId: number) => void;
  onResolveIssue: (reportId: number, note: string) => void;
  onCheckoutAndLockReview: (contractId: number) => void;
  onUpdateInvoiceMeters: (
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
  onManagerReviewTenant: (contractId: number, tenantUserId: number, rating: number, comment: string) => void;
  onPublishPost: (buildingNodeId: number, title: string, summary: string, content: string) => void;
  onOpenAddBuildingModal?: () => void;
  onOpenAddRoomModal?: (buildingId?: number) => void;
  onUpdateCondition?: (nodeId: number, condition: DeviceCondition) => void;
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
  allUsers?: User[];
  onUpdateUserRole?: (targetUserId: number, newRoleId: RoleType) => void;
}

export const ManagerView: React.FC<ManagerViewProps> = ({
  currentUser,
  allUsers = [],
  contracts,
  roommates,
  invoices,
  nodes,
  issues,
  reviews,
  objectTypes,
  onAddRoom,
  onDeleteRoom,
  onUpdateRoomPrice,
  onAddDeviceToRoom,
  onAddDeviceToBuilding,
  onAssignDeviceToRoom,
  onDeleteDevice,
  onResolveIssue,
  onCheckoutAndLockReview,
  onUpdateInvoiceMeters,
  onUpdateBuildingUtilityRates,
  onManagerReviewTenant,
  onPublishPost,
  onOpenAddBuildingModal,
  onOpenAddRoomModal,
  onUpdateCondition,
  onUpdateDeviceMonthlyPrice,
  onRecalculateInvoicesForMonth,
  onApproveInvoice,
  onCreateMonthlyInvoice,
  onUpdateUserRole,
  onUpdateNode,
  onAddChildNode,
  onDeleteNode
}) => {
  const [activeTab, setActiveTab] = useState<'rooms' | 'devices' | 'deviceHealth' | 'meterEntry' | 'tenantReviews' | 'createPost' | 'staff' | 'tree'>('rooms');
  const [staffSearchQuery, setStaffSearchQuery] = useState('');
  const [staffRoleFilter, setStaffRoleFilter] = useState<'ALL' | 2 | 3 | 1>('ALL');
  const [roomSubTab, setRoomSubTab] = useState<'roomList' | 'contractList'>('roomList');

  // RBAC: LỌC CHẶT CHẼ CHỈ NHỮNG TÒA NHÀ THUỘC PHẠM VI QUẢN LÝ CỦA CURRENT USER (CẤP 2)
  const myBuildings = nodes.filter(
    (n) => n.parentNodeId === null && (n.managerUserId === currentUser.userId || (n.notes && n.notes.includes(String(currentUser.userId))))
  );
  const myBuildingIds = myBuildings.map((b) => b.nodeId);

  // Helper kiểm tra xem 1 node (tầng/phòng/thiết bị) có thuộc tòa nhà phụ trách hay không
  const isNodeInMyBuildings = (node: ManagementNode): boolean => {
    let curr: ManagementNode | undefined = node;
    while (curr && curr.parentNodeId !== null) {
      curr = nodes.find((n) => n.nodeId === curr?.parentNodeId);
    }
    return curr ? myBuildingIds.includes(curr.nodeId) : false;
  };

  // Các phòng thuộc tòa nhà của tôi
  const myRooms = nodes.filter((n) => n.typeId === 3 && isNodeInMyBuildings(n));
  const myRoomIds = myRooms.map((r) => r.nodeId);

  // Hợp đồng thuộc phạm vi quản lý
  const myContracts = contracts.filter((c) => myBuildingIds.includes(c.buildingNodeId) || myRoomIds.includes(c.roomNodeId));

  // Sự cố thuộc phạm vi quản lý
  const myIssues = issues.filter((iss) => {
    const node = nodes.find((n) => n.nodeId === iss.nodeId);
    return node ? isNodeInMyBuildings(node) : false;
  });

  // Hóa đơn thuộc phạm vi quản lý
  const myInvoices = invoices.filter((inv) => myRoomIds.includes(inv.roomNodeId));

  // Đánh giá thuộc phạm vi quản lý
  const myReviews = reviews.filter((rev) => myContracts.some((c) => c.contractId === rev.contractId));

  // Modal Tạo Phòng Mới
  const [showAddRoomModal, setShowAddRoomModal] = useState(false);
  const [newRoomBuildingId, setNewRoomBuildingId] = useState<number>(myBuildings[0]?.nodeId || 1);
  const [newRoomCode, setNewRoomCode] = useState('');
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomRent, setNewRoomRent] = useState(4500000);
  const [newRoomDeposit, setNewRoomDeposit] = useState(4500000);
  const [newRoomPriceNote, setNewRoomPriceNote] = useState('Giá tiêu chuẩn');

  // Modal Ấn Định Mức Giá Theo Thời Điểm
  const [editingPriceRoom, setEditingPriceRoom] = useState<ManagementNode | null>(null);
  const [editPriceValue, setEditPriceValue] = useState<number>(4500000);
  const [editPriceNote, setEditPriceNote] = useState<string>('Giá mùa cao điểm tháng 9/2026');

  // Form Đánh Giá Khách Thuê
  const [selectedContractForReview, setSelectedContractForReview] = useState<number>(myContracts[0]?.contractId || 1);
  const [mgrRating, setMgrRating] = useState<number>(5);
  const [mgrComment, setMgrComment] = useState('');
  const [mgrReviewSavedAlert, setMgrReviewSavedAlert] = useState(false);

  // Form Đăng Bài Viết
  const [postTitle, setPostTitle] = useState('');
  const [postSummary, setPostSummary] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postBuildingId, setPostBuildingId] = useState<number>(myBuildings[0]?.nodeId || 1);
  const [postPublishedAlert, setPostPublishedAlert] = useState(false);

  // Quản lý thiết bị theo từng tòa nhà (Mỗi nhà có danh sách thiết bị riêng)
  const [selectedBuildingForDevices, setSelectedBuildingForDevices] = useState<number>(myBuildings[0]?.nodeId || 1);
  const [deviceCategoryFilter, setDeviceCategoryFilter] = useState<'ALL' | 'SHARED' | 'ROOM' | 'UNASSIGNED'>('ALL');
  const [selectedRoomFilter, setSelectedRoomFilter] = useState<number | 'ALL'>('ALL');

  // Tòa nhà đang chọn xem danh sách thiết bị
  const currentBuildingNode = myBuildings.find(b => b.nodeId === selectedBuildingForDevices) || myBuildings[0];
  const currentBuildingId = currentBuildingNode?.nodeId || 1;

  // Các phòng thuộc tòa nhà đang chọn
  const roomsInCurrentBuilding = nodes.filter(
    (n) => n.typeId === 3 && (
      n.parentNodeId === currentBuildingId ||
      nodes.some(p => p.nodeId === n.parentNodeId && p.parentNodeId === currentBuildingId)
    )
  );
  const roomIdsInCurrentBuilding = new Set(roomsInCurrentBuilding.map(r => r.nodeId));

  // Danh sách thiết bị riêng của tòa nhà đang chọn
  const devicesOfSelectedBuilding = nodes.filter((n) => {
    if (n.typeId < 4) return false;
    if (n.buildingNodeId === currentBuildingId) return true;
    if (n.parentNodeId === currentBuildingId) return true;
    if (n.roomNodeId && roomIdsInCurrentBuilding.has(n.roomNodeId)) return true;
    if (n.parentNodeId && roomIdsInCurrentBuilding.has(n.parentNodeId)) return true;
    const parent = nodes.find(p => p.nodeId === n.parentNodeId);
    if (parent && (parent.parentNodeId === currentBuildingId || parent.nodeId === currentBuildingId)) return true;
    return false;
  });

  const sharedDevicesInBuilding = devicesOfSelectedBuilding.filter((d) => d.isShared === true);
  const roomDevicesInBuilding = devicesOfSelectedBuilding.filter((d) => d.isShared === false && d.roomNodeId);
  const unassignedDevicesInBuilding = devicesOfSelectedBuilding.filter((d) => d.isShared === false && !d.roomNodeId);

  // Toàn bộ thiết bị trong các tòa nhà thuộc quyền quản lý của quản lý này
  const allMyBuildingsDevices = nodes.filter((n) => n.typeId >= 4 && isNodeInMyBuildings(n));

  // Modal Thêm Thiết Bị Mới Vào Nhà
  const [showAddDeviceModal, setShowAddDeviceModal] = useState(false);
  const [newDevBuildingId, setNewDevBuildingId] = useState<number>(myBuildings[0]?.nodeId || 1);
  const [newDevName, setNewDevName] = useState('');
  const [newDevTypeId, setNewDevTypeId] = useState<number>(11); // Điều hòa
  const [newDevSerial, setNewDevSerial] = useState('');
  const [newDevIsShared, setNewDevIsShared] = useState(false);
  const [newDevRoomId, setNewDevRoomId] = useState<number | null>(null);
  const [newDevLocation, setNewDevLocation] = useState('');
  const [newDevUnitPrice, setNewDevUnitPrice] = useState<number>(15000); // Đơn giá theo lượt dùng (thiết bị dùng chung)
  const [newDevMonthlyRentalPrice, setNewDevMonthlyRentalPrice] = useState<number>(120000); // Đơn giá thuê theo tháng (thiết bị phòng)
  const [newDevImageUrl, setNewDevImageUrl] = useState<string>(''); // Upload ảnh thiết bị
  const [showPriceScheduleModal, setShowPriceScheduleModal] = useState<boolean>(false);
  const [selectedDevForPriceSchedule, setSelectedDevForPriceSchedule] = useState<number | null>(null);
  const [selectedDeviceForPhoto, setSelectedDeviceForPhoto] = useState<ManagementNode | null>(null);

  // Quản lý hóa đơn & duyệt chốt sổ
  const [selectedInvoiceMonthFilter, setSelectedInvoiceMonthFilter] = useState<string>('ALL');
  const [showCreateInvoiceModal, setShowCreateInvoiceModal] = useState<boolean>(false);
  const [createInvContractId, setCreateInvContractId] = useState<number>(myContracts[0]?.contractId || 1);
  const [createInvMonthYear, setCreateInvMonthYear] = useState<string>('12/2026');
  const [createInvCurrElec, setCreateInvCurrElec] = useState<number>(1650);
  const [createInvCurrWater, setCreateInvCurrWater] = useState<number>(75);
  const [createInvSharedCost, setCreateInvSharedCost] = useState<number>(50000);
  const [createInvElectricRate, setCreateInvElectricRate] = useState<number>(3800);
  const [createInvWaterRate, setCreateInvWaterRate] = useState<number>(30000);
  const [createInvOccupantCount, setCreateInvOccupantCount] = useState<number>(1);
  const [createInvSanitationRate, setCreateInvSanitationRate] = useState<number>(30000);
  const [createInvResidenceRate, setCreateInvResidenceRate] = useState<number>(100000);
  const [createInvApplyResidence, setCreateInvApplyResidence] = useState<boolean>(false);

  // Modal Cài đặt Đơn giá Điện Nước & Phí Dịch Vụ cho Tòa Nhà của Quản Lý
  const [managerEditingBuildingRates, setManagerEditingBuildingRates] = useState<ManagementNode | null>(null);
  const [managerEditBuildingElecRate, setManagerEditBuildingElecRate] = useState<number>(3800);
  const [managerEditBuildingWaterRate, setManagerEditBuildingWaterRate] = useState<number>(30000);
  const [managerEditBuildingSanitationRate, setManagerEditBuildingSanitationRate] = useState<number>(30000);
  const [managerEditBuildingResidenceRate, setManagerEditBuildingResidenceRate] = useState<number>(100000);

  // Modal Chỉnh sửa Điện Nước, Đơn Giá & Phí Dịch Vụ Hóa Đơn
  const [managerEditingInvoiceMeters, setManagerEditingInvoiceMeters] = useState<MonthlyInvoice | null>(null);
  const [managerEditInvCurrElec, setManagerEditInvCurrElec] = useState<number>(0);
  const [managerEditInvCurrWater, setManagerEditInvCurrWater] = useState<number>(0);
  const [managerEditInvElecRate, setManagerEditInvElecRate] = useState<number>(3800);
  const [managerEditInvWaterRate, setManagerEditInvWaterRate] = useState<number>(30000);
  const [managerEditInvOccupantCount, setManagerEditInvOccupantCount] = useState<number>(1);
  const [managerEditInvSanitationRate, setManagerEditInvSanitationRate] = useState<number>(30000);
  const [managerEditInvResidenceRate, setManagerEditInvResidenceRate] = useState<number>(100000);
  const [managerEditInvApplyResidence, setManagerEditInvApplyResidence] = useState<boolean>(false);

  const handleDevImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setNewDevImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Modal Gán / Chuyển Thiết Bị & Đổi Cách Tính Tiền
  const [assigningDevice, setAssigningDevice] = useState<ManagementNode | null>(null);
  const [targetRoomForAssign, setTargetRoomForAssign] = useState<number | null>(null);
  const [assigningBillingMode, setAssigningBillingMode] = useState<'MONTHLY' | 'PER_USE'>('MONTHLY');
  const [assigningUnitPrice, setAssigningUnitPrice] = useState<number>(15000);
  const [assigningMonthlyPrice, setAssigningMonthlyPrice] = useState<number>(70000);

  const handleOpenAssignDevice = (dev: ManagementNode) => {
    setAssigningDevice(dev);
    const isSharedDev = dev.isShared === true;
    setAssigningBillingMode(isSharedDev ? 'PER_USE' : 'MONTHLY');
    setAssigningUnitPrice(dev.unitPrice || 15000);
    setAssigningMonthlyPrice(dev.monthlyRentalPrice || 70000);
    setTargetRoomForAssign(dev.roomNodeId || roomsInCurrentBuilding[0]?.nodeId || null);
  };

  // Mở modal thêm thiết bị trực tiếp cho 1 phòng cụ thể
  const handleOpenAddDeviceForRoom = (room: ManagementNode) => {
    const parentBuilding = myBuildings.find(b => b.nodeId === room.parentNodeId || isNodeInMyBuildings(room)) || myBuildings[0];
    setNewDevBuildingId(parentBuilding?.nodeId || 1);
    setNewDevRoomId(room.nodeId);
    setNewDevIsShared(false);
    setNewDevName('');
    setNewDevSerial('');
    setNewDevLocation(`Phòng ${room.nodeName}`);
    setNewDevMonthlyRentalPrice(120000);
    setNewDevImageUrl('');
    setShowAddDeviceModal(true);
  };

  // Submit tạo thiết bị mới cho tòa nhà
  const handleCreateDeviceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDevName.trim()) return;
    if (onAddDeviceToBuilding) {
      onAddDeviceToBuilding(
        Number(newDevBuildingId),
        newDevName.trim(),
        Number(newDevTypeId),
        newDevSerial.trim() || undefined,
        newDevIsShared,
        newDevIsShared ? null : (newDevRoomId ? Number(newDevRoomId) : null),
        newDevLocation.trim() || undefined,
        newDevIsShared ? Number(newDevUnitPrice) : 0,
        !newDevIsShared ? Number(newDevMonthlyRentalPrice) : 0,
        !newDevIsShared ? {
          '08/2026': Number(newDevMonthlyRentalPrice),
          '09/2026': Number(newDevMonthlyRentalPrice),
          '10/2026': Number(newDevMonthlyRentalPrice),
          '11/2026': Number(newDevMonthlyRentalPrice),
          '12/2026': Number(newDevMonthlyRentalPrice)
        } : undefined,
        newDevImageUrl.trim() || undefined
      );
    }
    setShowAddDeviceModal(false);
    setNewDevName('');
    setNewDevSerial('');
    setNewDevLocation('');
    setNewDevImageUrl('');
  };

  // Submit gán thiết bị vào phòng & đổi cách tính tiền
  const handleAssignDeviceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningDevice) return;
    const isShared = assigningBillingMode === 'PER_USE';
    const targetRoomId = isShared ? null : (targetRoomForAssign ? Number(targetRoomForAssign) : null);
    const newPrice = isShared ? assigningUnitPrice : assigningMonthlyPrice;

    if (onAssignDeviceToRoom) {
      onAssignDeviceToRoom(
        assigningDevice.nodeId,
        targetRoomId,
        isShared,
        newPrice
      );
    } else if (onUpdateNode) {
      onUpdateNode(assigningDevice.nodeId, {
        isShared,
        roomNodeId: targetRoomId,
        unitPrice: isShared ? assigningUnitPrice : assigningDevice.unitPrice,
        monthlyRentalPrice: !isShared ? assigningMonthlyPrice : assigningDevice.monthlyRentalPrice,
        addressOrLocation: isShared ? 'Khu công cộng dùng chung' : (targetRoomId ? `Phòng ${nodes.find(n => n.nodeId === targetRoomId)?.nodeName || ''}` : 'Kho phòng chưa gán')
      });
    }
    setAssigningDevice(null);
  };

  // Xử lý tạo phòng mới
  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;
    onAddRoom(
      Number(newRoomBuildingId),
      newRoomName.trim(),
      Number(newRoomRent),
      Number(newRoomDeposit),
      newRoomCode.trim() || undefined,
      newRoomPriceNote.trim() || undefined
    );
    setShowAddRoomModal(false);
    setNewRoomCode('');
    setNewRoomName('');
  };

  // Mở modal ấn định giá phòng
  const handleOpenEditPriceModal = (room: ManagementNode) => {
    setEditingPriceRoom(room);
    setEditPriceValue(room.unitPrice || 4500000);
    setEditPriceNote(room.pricePeriodNote || 'Giá mùa cao điểm tháng 9/2026');
  };

  // Lưu mức giá mới
  const handleSavePrice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPriceRoom || !onUpdateRoomPrice) return;
    onUpdateRoomPrice(editingPriceRoom.nodeId, Number(editPriceValue), editPriceNote.trim());
    setEditingPriceRoom(null);
  };

  // Xóa / bớt phòng
  const handleDeleteRoomClick = (room: ManagementNode) => {
    if (!onDeleteRoom) return;
    onDeleteRoom(room.nodeId);
  };

  const handleManagerReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const contract = myContracts.find((c) => c.contractId === selectedContractForReview);
    if (!contract || !mgrComment.trim()) return;
    onManagerReviewTenant(contract.contractId, contract.primaryTenantUserId, mgrRating, mgrComment);
    setMgrReviewSavedAlert(true);
    setMgrComment('');
    setTimeout(() => setMgrReviewSavedAlert(false), 3000);
  };

  const handlePublishPostSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!postTitle.trim() || !postContent.trim()) return;
    onPublishPost(postBuildingId, postTitle, postSummary, postContent);
    setPostPublishedAlert(true);
    setPostTitle('');
    setPostSummary('');
    setPostContent('');
    setTimeout(() => setPostPublishedAlert(false), 3000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Top Banner Quản lý Cấp 2 */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-950/90 via-slate-900 to-indigo-950/70 border border-blue-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs text-blue-300 bg-blue-500/10 border border-blue-500/30 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider mb-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            Cấp 2: Quản Lý Tòa Nhà Phụ Trách
          </div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            Bảng Quản Lý: {currentUser.fullName}
          </h2>
          <div className="text-xs text-slate-300 mt-1 flex flex-wrap items-center gap-2">
            <span>Phạm vi quản lý:</span>
            <strong className="text-emerald-300 font-semibold bg-emerald-950/80 border border-emerald-500/40 px-2 py-0.5 rounded-md">
              {myBuildings.length} tòa nhà ({myBuildings.map(b => b.nodeName).join(', ') || 'Chưa có'})
            </strong>
            <span className="text-slate-500">•</span>
            <span>Địa chỉ: <strong>{currentUser.address}</strong></span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {/* Nút Thêm Tòa Nhà dành cho Quản lý cấp 2 */}
          {onOpenAddBuildingModal && (
            <button
              onClick={onOpenAddBuildingModal}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-blue-600/30 transition-all active:scale-95"
              title="Thêm tòa nhà mới vào danh sách quản lý của bạn"
            >
              <Building2 className="w-4 h-4" />
              <span>+ Thêm Tòa Nhà</span>
            </button>
          )}

          {/* Nút Thêm Phòng Mới dành cho Quản lý cấp 2 */}
          <button
            onClick={() => {
              if (onOpenAddRoomModal) {
                onOpenAddRoomModal(myBuildings[0]?.nodeId);
              } else {
                setNewRoomBuildingId(myBuildings[0]?.nodeId || 1);
                setShowAddRoomModal(true);
              }
            }}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-600/30 transition-all active:scale-95 ring-1 ring-emerald-400/40"
            title="Thêm phòng mới vào tòa nhà phụ trách (Tạo nhà xong mới tạo phòng)"
          >
            <DoorClosed className="w-4 h-4" />
            <span>+ Thêm Phòng Mới</span>
          </button>
        </div>
      </div>

      {/* Cảnh báo nếu quản lý chưa được gán tòa nhà nào */}
      {myBuildings.length === 0 && (
        <div className="p-4 rounded-2xl bg-amber-950/50 border border-amber-500/50 text-amber-200 text-xs flex items-center justify-between gap-3 shadow">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <span>
              Bạn chưa có tòa nhà nào trong phạm vi quản lý. Bạn chỉ được xem/sửa những nhà do bạn tạo hoặc do Admin cấp 1 ấn định. Hãy bấm <strong>"+ Thêm Tòa Nhà"</strong> để bắt đầu tạo cơ sở của bạn!
            </span>
          </div>
          {onOpenAddBuildingModal && (
            <button
              onClick={onOpenAddBuildingModal}
              className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold whitespace-nowrap"
            >
              Tạo Tòa Nhà Ngay
            </button>
          )}
        </div>
      )}

      {/* Tabs Quản lý Cấp 2 */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto text-xs sm:text-sm">
        <button
          onClick={() => setActiveTab('rooms')}
          className={`px-3.5 py-2 rounded-xl font-medium transition-all flex items-center gap-1.5 ${
            activeTab === 'rooms' ? 'bg-blue-600 text-white shadow' : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <DoorClosed className="w-4 h-4" />
          1. Quản Lý Phòng &amp; Hợp Đồng ({myRooms.length} phòng)
        </button>

        <button
          onClick={() => setActiveTab('devices')}
          className={`px-3.5 py-2 rounded-xl font-medium transition-all flex items-center gap-1.5 ${
            activeTab === 'devices' ? 'bg-indigo-600 text-white shadow' : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <Cpu className="w-4 h-4" />
          2. Thiết Bị Theo Từng Nhà ({allMyBuildingsDevices.length} thiết bị)
        </button>

        <button
          onClick={() => setActiveTab('deviceHealth')}
          className={`px-3.5 py-2 rounded-xl font-medium transition-all flex items-center gap-1.5 ${
            activeTab === 'deviceHealth' ? 'bg-amber-600 text-white shadow' : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <Wrench className="w-4 h-4" />
          3. Báo Cáo Thiết Bị ({myIssues.filter(i => i.status !== 'RESOLVED').length} Sự Cố)
        </button>

        <button
          onClick={() => setActiveTab('meterEntry')}
          className={`px-3.5 py-2 rounded-xl font-medium transition-all flex items-center gap-1.5 ${
            activeTab === 'meterEntry' ? 'bg-cyan-600 text-white shadow' : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <Zap className="w-4 h-4" />
          4. Chốt Chỉ Số Điện Nước ({myInvoices.length} HĐ)
        </button>

        <button
          onClick={() => setActiveTab('tenantReviews')}
          className={`px-3.5 py-2 rounded-xl font-medium transition-all flex items-center gap-1.5 ${
            activeTab === 'tenantReviews' ? 'bg-purple-600 text-white shadow' : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <Star className="w-4 h-4" />
          5. Đánh Giá Khách &amp; Khóa Khi Trả Phòng
        </button>

        <button
          onClick={() => setActiveTab('createPost')}
          className={`px-3.5 py-2 rounded-xl font-medium transition-all flex items-center gap-1.5 ${
            activeTab === 'createPost' ? 'bg-slate-800 text-white shadow' : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4" />
          6. Đăng Bài Giới Thiệu
        </button>

        <button
          onClick={() => setActiveTab('staff')}
          className={`px-3.5 py-2 rounded-xl font-medium transition-all flex items-center gap-1.5 ${
            activeTab === 'staff' ? 'bg-blue-600 text-white shadow ring-2 ring-blue-500/30' : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          7. Phân Quyền Quản Lý Ngang Quyền ({allUsers.length})
        </button>

        <button
          onClick={() => setActiveTab('tree')}
          className={`px-3.5 py-2 rounded-xl font-medium transition-all flex items-center gap-1.5 ${
            activeTab === 'tree' ? 'bg-purple-600 text-white shadow ring-2 ring-purple-500/30' : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <FolderTree className="w-4 h-4" />
          8. Cây Thực Thể Đa Cấp
        </button>
      </div>

      {/* 1. TAB QUẢN LÝ PHÒNG, THÊM/BỚT PHÒNG, ẤN ĐỊNH GIÁ & HỢP ĐỒNG */}
      {activeTab === 'rooms' && (
        <div className="space-y-4">
          {/* Sub-tabs điều hướng: Danh sách phòng & giá vs Hợp đồng cư trú */}
          <div className="flex items-center justify-between gap-3 bg-slate-900/90 p-3 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setRoomSubTab('roomList')}
                className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 ${
                  roomSubTab === 'roomList' 
                    ? 'bg-blue-600 text-white shadow' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <DoorClosed className="w-3.5 h-3.5" />
                <span>Phòng &amp; Ấn Định Mức Giá ({myRooms.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setRoomSubTab('contractList')}
                className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 ${
                  roomSubTab === 'contractList' 
                    ? 'bg-indigo-600 text-white shadow' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Hợp Đồng Cư Trú &amp; Khách Thuê ({myContracts.length})</span>
              </button>
            </div>

            <button
              onClick={() => {
                if (onOpenAddRoomModal) {
                  onOpenAddRoomModal(myBuildings[0]?.nodeId);
                } else {
                  setNewRoomBuildingId(myBuildings[0]?.nodeId || 1);
                  setShowAddRoomModal(true);
                }
              }}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow"
            >
              <DoorClosed className="w-3.5 h-3.5" />
              <span>+ Thêm Phòng</span>
            </button>
          </div>

          {/* 1.1 DANH SÁCH PHÒNG - CHO PHÉP THÊM / BỚT PHÒNG / ẤN ĐỊNH MỨC GIÁ THEO THỜI ĐIỂM */}
          {roomSubTab === 'roomList' && (
            <div className="space-y-4">
              <div className="text-xs text-slate-400 flex items-center justify-between">
                <span>
                  Mỗi phòng có mức giá riêng. Bạn có thể <strong>Thêm phòng</strong>, <strong>Bớt phòng</strong> và <strong>Ấn định giá theo từng thời điểm</strong>:
                </span>
                <span className="font-mono text-emerald-400 font-bold">{myRooms.length} phòng trong phạm vi quản lý</span>
              </div>

              {myRooms.length === 0 ? (
                <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-3">
                  <DoorClosed className="w-10 h-10 text-slate-500 mx-auto" />
                  <div className="text-slate-300 font-semibold text-sm">Chưa có phòng nào trong các tòa nhà của bạn</div>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Quy trình: Tạo nhà xong mới tạo phòng. Hãy bấm nút "+ Thêm Phòng Mới" bên trên để tạo phòng đầu tiên và ấn định mức giá thuê!
                  </p>
                  <button
                    onClick={() => {
                      setNewRoomBuildingId(myBuildings[0]?.nodeId || 1);
                      setShowAddRoomModal(true);
                    }}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold"
                  >
                    + Thêm Phòng Đầu Tiên
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {myRooms.map((room) => {
                    const activeContract = myContracts.find((c) => c.roomNodeId === room.nodeId && c.status === 'ACTIVE');
                    const parentBuilding = nodes.find((n) => n.nodeId === room.parentNodeId || n.parentNodeId === null);

                    return (
                      <div
                        key={room.nodeId}
                        className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between gap-3 shadow-md"
                      >
                        <div className="space-y-2.5">
                          <div className="flex justify-between items-start">
                            <span className="font-mono text-xs bg-blue-950 text-blue-300 border border-blue-800 px-2 py-0.5 rounded font-bold">
                              {room.nodeCode}
                            </span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                              activeContract 
                                ? 'bg-emerald-950 text-emerald-300 border-emerald-700' 
                                : 'bg-amber-950 text-amber-300 border-amber-700'
                            }`}>
                              {activeContract ? 'Đang có khách ở' : 'Phòng trống'}
                            </span>
                          </div>

                          <div>
                            <h4 className="font-bold text-white text-base">{room.nodeName}</h4>
                            <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                              <Building2 className="w-3.5 h-3.5 text-blue-400" />
                              <span>{parentBuilding?.nodeName || 'Tòa nhà'}</span>
                            </div>
                          </div>

                          {/* Mức giá thuê và ghi chú thời điểm */}
                          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                            <div className="flex justify-between items-baseline">
                              <span className="text-slate-400 text-[11px]">Giá thuê hiện tại:</span>
                              <span className="font-mono text-base font-bold text-emerald-400">
                                {(room.unitPrice || 4500000).toLocaleString('vi-VN')} đ/tháng
                              </span>
                            </div>

                            <div className="flex justify-between text-[11px] text-slate-400">
                              <span>Tiền cọc:</span>
                              <span className="font-mono text-slate-300">
                                {(room.depositAmount || 4500000).toLocaleString('vi-VN')} đ
                              </span>
                            </div>

                            {/* Ghi chú thời điểm định giá */}
                            {room.pricePeriodNote && (
                              <div className="pt-1 border-t border-slate-900 flex items-center gap-1 text-[10px] text-amber-300">
                                <Tag className="w-3 h-3 text-amber-400 flex-shrink-0" />
                                <span className="truncate">Thời điểm: {room.pricePeriodNote}</span>
                              </div>
                            )}
                          </div>

                          {/* Thiết bị trong phòng này (Đi theo phòng, khách thuê độc quyền sử dụng & báo hỏng) */}
                          {(() => {
                            const devicesInThisRoom = nodes.filter(
                              (n) => n.typeId >= 4 && (n.roomNodeId === room.nodeId || n.parentNodeId === room.nodeId)
                            );
                            return (
                              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-2 text-[11px]">
                                <div className="flex items-center justify-between text-slate-400">
                                  <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                                    <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                                    <span>Thiết bị trong phòng:</span>
                                    <strong className="text-cyan-400 font-mono">({devicesInThisRoom.length})</strong>
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenAddDeviceForRoom(room)}
                                    className="text-[10px] font-bold text-cyan-400 hover:text-cyan-300 bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-700/60 px-2 py-0.5 rounded-md flex items-center gap-1 transition-all shadow-sm"
                                    title="Thêm thiết bị mới trực tiếp vào phòng này"
                                  >
                                    <Plus className="w-3 h-3" />
                                    <span>+ Thêm thiết bị</span>
                                  </button>
                                </div>

                                {devicesInThisRoom.length > 0 ? (
                                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                                    {devicesInThisRoom.map((dev) => (
                                      <span
                                        key={dev.nodeId}
                                        className={`px-2 py-0.5 rounded-lg text-[10px] font-medium border flex items-center gap-1 max-w-full truncate ${
                                          dev.currentCondition === 3
                                            ? 'bg-rose-950/80 text-rose-300 border-rose-700'
                                            : dev.currentCondition === 1
                                            ? 'bg-orange-950/80 text-orange-300 border-orange-700'
                                            : dev.currentCondition === 2
                                            ? 'bg-amber-950/80 text-amber-300 border-amber-700'
                                            : 'bg-slate-900 text-slate-300 border-slate-700/80'
                                        }`}
                                        title={`${dev.nodeName} (${dev.nodeCode}) - Vị trí: ${dev.addressOrLocation || 'Trong phòng'}`}
                                      >
                                        <span>
                                          {dev.typeId === 11 || dev.deviceCategory === 'AIR_COND' ? '❄️' :
                                           dev.typeId === 12 || dev.deviceCategory === 'FRIDGE' ? '🧊' :
                                           dev.typeId === 13 || dev.deviceCategory === 'WATER_HEATER' ? '♨️' :
                                           dev.typeId === 4 || dev.deviceCategory === 'WASHING_MACHINE' ? '🧺' : '⚡'}
                                        </span>
                                        <span className="truncate">{dev.nodeName}</span>
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-[10px] text-slate-500 italic">
                                    Chưa có thiết bị nào trong phòng. Bấm "+ Thêm thiết bị" để trang bị cho phòng!
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </div>

                        {/* Các nút hành động: Ấn định giá theo thời điểm & Bớt phòng */}
                        <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                          <button
                            onClick={() => handleOpenEditPriceModal(room)}
                            className="px-3 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600 border border-blue-500/50 hover:border-blue-500 text-blue-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all flex-1 justify-center"
                            title="Ấn định mức giá thuê tùy theo từng thời điểm"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Ấn Định Giá</span>
                          </button>

                          <button
                            onClick={() => handleDeleteRoomClick(room)}
                            className="px-3 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600 border border-rose-500/50 hover:border-rose-500 text-rose-300 hover:text-white text-xs font-semibold flex items-center gap-1 transition-all"
                            title="Bớt phòng (Xóa phòng khỏi danh sách)"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Bớt phòng</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* 1.2 DANH SÁCH HỢP ĐỒNG CƯ TRÚ */}
          {roomSubTab === 'contractList' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs text-slate-400">
                <span>Hợp đồng cư trú thuộc phạm vi quản lý của bạn:</span>
                <span className="font-mono text-emerald-400 font-bold">{myContracts.length} hợp đồng</span>
              </div>

              <div className="space-y-4">
                {myContracts.map((c) => {
                  const rmates = roommates.filter((r) => r.contractId === c.contractId);
                  return (
                    <div key={c.contractId} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-white text-base">{c.roomName}</h4>
                            <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                              c.status === 'ACTIVE' 
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' 
                                : 'bg-slate-800 text-slate-400 border border-slate-700'
                            }`}>
                              {c.status === 'ACTIVE' ? 'Đang ở' : 'Đã trả phòng thực tế'}
                            </span>
                          </div>
                          <div className="text-xs text-slate-400">
                            Khách ký chính: <strong className="text-white">{c.primaryTenantName}</strong> • {c.buildingName}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {c.status === 'ACTIVE' && (
                            <button
                              onClick={() => onCheckoutAndLockReview(c.contractId)}
                              className="px-3 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600 border border-rose-500/50 hover:border-rose-500 text-rose-300 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5"
                              title="Hoàn tất trả phòng & thanh toán -> Khóa đánh giá của Quản lý"
                            >
                              <Lock className="w-3.5 h-3.5" />
                              <span>Trả Phòng & Khóa Đánh Giá</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Lịch sử Ngày Hợp Đồng vs Ngày Thực Tế */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1 text-slate-300">
                          <div className="font-semibold text-blue-400">Thời hạn trên Hợp Đồng:</div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Bắt đầu - Kết thúc HĐ:</span>
                            <span className="font-mono font-bold text-white">{formatDateVN(c.startDateContract)} &rarr; {formatDateVN(c.endDateContract)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Giá thuê & Tiền cọc:</span>
                            <span className="font-mono text-emerald-400 font-bold">
                              {c.monthlyRent.toLocaleString('vi-VN')} đ (Cọc: {c.depositAmount.toLocaleString('vi-VN')} đ)
                            </span>
                          </div>
                        </div>

                        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1 text-slate-300">
                          <div className="font-semibold text-emerald-400">Lịch sử Đến/Trả Thực Tế:</div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Ngày đến nhận phòng thực tế:</span>
                            <span className="font-mono font-bold text-emerald-300">{formatDateVN(c.actualCheckInDate)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Ngày trả phòng thực tế:</span>
                            <span className="font-mono font-bold text-amber-300">
                              {c.actualCheckOutDate ? formatDateVN(c.actualCheckOutDate) : 'Chưa trả phòng'}
                            </span>
                          </div>
                          {c.notes && <div className="text-[11px] text-slate-400 italic">Ghi chú: {c.notes}</div>}
                        </div>
                      </div>

                      {/* Người cùng ở phòng này */}
                      <div className="text-xs pt-1">
                        <span className="text-slate-400 font-medium">Người cùng ở đã đăng ký CCCD: </span>
                        {rmates.length > 0 ? (
                          <span className="text-slate-200">
                            {rmates.map(r => `${r.fullName} (${r.relationship} - CCCD: ${r.citizenId} - ĐC: ${r.address})`).join(', ')}
                          </span>
                        ) : (
                          <span className="text-slate-500 italic">Ở 1 mình</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. TAB QUẢN LÝ THIẾT BỊ THEO TỪNG NHÀ (MỖI NHÀ CÓ DANH SÁCH THIẾT BỊ RIÊNG) */}
      {activeTab === 'devices' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Top Bar: Chọn Tòa Nhà Phụ Trách & Thêm Thiết Bị Mới */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 text-xs text-indigo-400 bg-indigo-500/10 border border-indigo-500/30 px-2.5 py-0.5 rounded-full font-bold">
                <Cpu className="w-3.5 h-3.5" />
                <span>Mỗi Nhà Có Danh Sách Thiết Bị Riêng</span>
              </div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Quản Lý Danh Sách Thiết Bị Của Tòa Nhà
              </h3>
              <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
                Người quản lý lập danh sách thiết bị cho từng nhà. Nếu thiết bị được đánh dấu là <strong>Dùng chung (công cộng)</strong> thì phục vụ toàn tòa nhà (ví dụ máy giặt sảnh, trạm sạc, cổng từ). Nếu <strong>không dùng chung</strong> thì sẽ được gán và lắp đặt vào từng phòng để người thuê phòng đó độc quyền sử dụng và báo hỏng.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 self-start md:self-auto">
              {/* Chọn Tòa Nhà */}
              <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800 text-xs">
                <Building2 className="w-4 h-4 text-blue-400 ml-1.5 flex-shrink-0" />
                <span className="text-slate-400 hidden sm:inline">Tòa nhà:</span>
                <select
                  value={selectedBuildingForDevices}
                  onChange={(e) => {
                    setSelectedBuildingForDevices(Number(e.target.value));
                    setSelectedRoomFilter('ALL');
                  }}
                  className="bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-white font-bold outline-none focus:border-indigo-500 text-xs"
                >
                  {myBuildings.map((b) => (
                    <option key={b.nodeId} value={b.nodeId}>
                      {b.nodeName} ({b.nodeCode})
                    </option>
                  ))}
                </select>
              </div>

              {/* Nút Xem & Chỉnh Sửa Bảng Giá Thiết Bị Theo Tháng */}
              <button
                type="button"
                onClick={() => setShowPriceScheduleModal(true)}
                className="px-4 py-2.5 rounded-xl bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-500/50 text-indigo-300 hover:text-white font-bold text-xs flex items-center gap-1.5 shadow transition-all active:scale-95 whitespace-nowrap"
                title="Bảng giá của thiết bị theo từng tháng (cục phát wifi, điều hòa, tủ lạnh...)"
              >
                <Calendar className="w-4 h-4 text-indigo-400" />
                <span>📊 Bảng Giá Thiết Bị Theo Tháng</span>
              </button>

              {/* Nút Thêm Thiết Bị Cho Tòa Nhà Này */}
              <button
                type="button"
                onClick={() => {
                  setNewDevBuildingId(currentBuildingId);
                  setNewDevIsShared(false);
                  setNewDevRoomId(roomsInCurrentBuilding[0]?.nodeId || null);
                  setNewDevName('');
                  setNewDevSerial('');
                  setNewDevLocation(roomsInCurrentBuilding[0] ? `Phòng ${roomsInCurrentBuilding[0].nodeName}` : 'Trong phòng');
                  setNewDevUnitPrice(15000);
                  setNewDevMonthlyRentalPrice(120000);
                  setNewDevImageUrl('');
                  setShowAddDeviceModal(true);
                }}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 transition-all active:scale-95 whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span>+ Thêm Thiết Bị Cho Nhà Này</span>
              </button>
            </div>
          </div>

          {/* Banner Hướng Dẫn: 2 Cách Tính Tiền & Cách Thay Đổi */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/60 to-purple-950/60 border border-indigo-500/40 space-y-2.5 text-xs shadow-lg">
            <div className="flex items-center justify-between">
              <div className="font-bold text-white text-sm flex items-center gap-2">
                <span className="p-1 rounded-lg bg-indigo-500/20 text-indigo-400">💡</span>
                <span>Hướng Dẫn: 2 Cách Tính Tiền Thiết Bị & Cách Thay Đổi Linh Hoạt</span>
              </div>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700/60 font-semibold">
                Đồng bộ hóa đơn tự động
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              <div className="p-3 rounded-xl bg-slate-950/80 border border-emerald-500/30 space-y-1">
                <div className="font-bold text-emerald-400 flex items-center gap-1.5 text-xs">
                  <span>🟢 1. Thiết Bị Tính Tiền Theo Tháng (Lắp Trong Phòng)</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  • <strong>Áp dụng:</strong> Cục phát WiFi riêng từng phòng, điều hòa, tủ lạnh, bình nóng lạnh...<br />
                  • <strong>Cách tính:</strong> Tiền thuê thiết bị cố định hàng tháng (đ/tháng) được cộng vào hóa đơn phòng. Bấm nút <strong>"Bảng giá"</strong> để xem và điều chỉnh giá theo từng tháng (tháng 9, tháng 11...).
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/80 border border-purple-500/30 space-y-1">
                <div className="font-bold text-purple-400 flex items-center gap-1.5 text-xs">
                  <span>🟣 2. Thiết Bị Tính Tiền Theo Lượt Dùng (Dùng Chung Tòa Nhà)</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  • <strong>Áp dụng:</strong> Máy giặt chung công cộng, trạm sạc xe điện EV, cổng kiểm soát an ninh...<br />
                  • <strong>Cách tính:</strong> Cư dân dùng lần nào sẽ ghi nhận theo lượt (đ/lượt) và cộng dồn vào mục phí dùng chung trong hóa đơn phòng cuối tháng.
                </p>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-indigo-950/50 border border-indigo-600/40 flex items-center justify-between text-[11px] text-indigo-200">
              <div>
                <strong>🔄 Cách đổi cách tính tiền:</strong> Bấm trực tiếp nút <strong>"⚙️ Đổi Cách Tính Tiền"</strong> trên thẻ thiết bị bên dưới để chuyển giữa <em>Theo tháng</em> ⇄ <em>Theo lượt</em> và cập nhật đơn giá tức thì!
              </div>
            </div>
          </div>

          {/* 4 Thẻ Thống Kê Thiết Bị Của Tòa Nhà Này */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-slate-400 font-medium">Tổng thiết bị của tòa nhà:</span>
              <div className="text-2xl font-bold text-white font-mono">{devicesOfSelectedBuilding.length}</div>
              <div className="text-[11px] text-slate-500">{currentBuildingNode?.nodeName}</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-purple-500/30 space-y-1">
              <span className="text-purple-300 font-semibold flex items-center gap-1">
                <span>🏢 Dùng chung công cộng:</span>
              </span>
              <div className="text-2xl font-bold text-purple-400 font-mono">{sharedDevicesInBuilding.length}</div>
              <div className="text-[11px] text-slate-500">Máy giặt sảnh, trạm sạc, cổng...</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-emerald-500/30 space-y-1">
              <span className="text-emerald-300 font-semibold flex items-center gap-1">
                <span>🏠 Trang bị trong các phòng:</span>
              </span>
              <div className="text-2xl font-bold text-emerald-400 font-mono">{roomDevicesInBuilding.length}</div>
              <div className="text-[11px] text-slate-500">Phân bổ cho {roomsInCurrentBuilding.length} phòng</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-rose-500/30 space-y-1">
              <span className="text-rose-300 font-semibold flex items-center gap-1">
                <span>⚠️ Thiết bị có phản ánh:</span>
              </span>
              <div className="text-2xl font-bold text-rose-400 font-mono">
                {devicesOfSelectedBuilding.filter((d) => d.currentCondition > 0).length}
              </div>
              <div className="text-[11px] text-slate-500">Hư hỏng / Hay bẩn / Khó dùng</div>
            </div>
          </div>

          {/* Thanh Bộ Lọc & Tìm Kiếm Thiết Bị */}
          <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            {/* Lọc theo Phạm vi: Tất cả / Dùng chung / Trong phòng / Chưa gán */}
            <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setDeviceCategoryFilter('ALL');
                  setSelectedRoomFilter('ALL');
                }}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  deviceCategoryFilter === 'ALL' && selectedRoomFilter === 'ALL'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Tất Cả ({devicesOfSelectedBuilding.length})
              </button>

              <button
                type="button"
                onClick={() => {
                  setDeviceCategoryFilter('SHARED');
                  setSelectedRoomFilter('ALL');
                }}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1 ${
                  deviceCategoryFilter === 'SHARED'
                    ? 'bg-purple-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>🏢 Dùng Chung Công Cộng ({sharedDevicesInBuilding.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setDeviceCategoryFilter('ROOM')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1 ${
                  deviceCategoryFilter === 'ROOM'
                    ? 'bg-emerald-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>🏠 Trong Các Phòng ({roomDevicesInBuilding.length})</span>
              </button>

              {unassignedDevicesInBuilding.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setDeviceCategoryFilter('UNASSIGNED');
                    setSelectedRoomFilter('ALL');
                  }}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1 ${
                    deviceCategoryFilter === 'UNASSIGNED'
                      ? 'bg-amber-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span>📦 Kho Chưa Gán ({unassignedDevicesInBuilding.length})</span>
                </button>
              )}
            </div>

            {/* Lọc theo từng Phòng cụ thể trong tòa nhà */}
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-medium whitespace-nowrap">Lọc theo phòng:</span>
              <select
                value={selectedRoomFilter}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedRoomFilter(val === 'ALL' ? 'ALL' : Number(val));
                  if (val !== 'ALL') {
                    setDeviceCategoryFilter('ALL');
                  }
                }}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-white outline-none focus:border-indigo-500 font-medium text-xs max-w-xs"
              >
                <option value="ALL">-- Tất cả các phòng ({roomDevicesInBuilding.length} TB) --</option>
                {roomsInCurrentBuilding.map((r) => {
                  const devCount = devicesOfSelectedBuilding.filter(
                    (d) => d.roomNodeId === r.nodeId || d.parentNodeId === r.nodeId
                  ).length;
                  return (
                    <option key={r.nodeId} value={r.nodeId}>
                      {r.nodeName} ({devCount} thiết bị)
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* Lưới Danh Sách Thiết Bị Của Tòa Nhà */}
          {(() => {
            const displayedDevices = devicesOfSelectedBuilding.filter((dev) => {
              if (deviceCategoryFilter === 'SHARED' && !dev.isShared) return false;
              if (deviceCategoryFilter === 'ROOM' && (dev.isShared || !dev.roomNodeId)) return false;
              if (deviceCategoryFilter === 'UNASSIGNED' && (dev.isShared || dev.roomNodeId)) return false;
              if (selectedRoomFilter !== 'ALL' && dev.roomNodeId !== selectedRoomFilter && dev.parentNodeId !== selectedRoomFilter) {
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
                    Hãy bấm nút "+ Thêm Thiết Bị Cho Nhà Này" bên trên để thêm thiết bị dùng chung hoặc thêm thiết bị cho từng phòng!
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setNewDevBuildingId(currentBuildingId);
                      setNewDevIsShared(false);
                      setNewDevRoomId(roomsInCurrentBuilding[0]?.nodeId || null);
                      setNewDevName('');
                      setNewDevSerial('');
                      setShowAddDeviceModal(true);
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
                        {/* Top Badges: Phân Loại Dùng Chung vs Trong Phòng & Tình Trạng */}
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
                              ? '✓ Hoạt động tốt'
                              : dev.currentCondition === 3
                              ? '🔥 Hư hỏng'
                              : dev.currentCondition === 1
                              ? '✨ Hay bẩn'
                              : '❓ Khó sử dụng'}
                          </span>
                        </div>

                        {/* Tên Thiết Bị & Icon & Ảnh Chụp */}
                        <div className="flex items-start gap-2.5">
                          <button
                            type="button"
                            onClick={() => setSelectedDeviceForPhoto(dev)}
                            className="w-12 h-12 rounded-xl overflow-hidden border border-slate-700/80 bg-slate-950 flex-shrink-0 relative group/pic cursor-pointer hover:border-indigo-400 transition-all flex items-center justify-center"
                            title="Bấm để xem ảnh chụp thực tế"
                          >
                            <img 
                              src={getDevicePhotoUrl(dev)} 
                              alt={dev.nodeName} 
                              className="w-full h-full object-cover group-hover/pic:scale-110 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/pic:opacity-100 flex items-center justify-center transition-opacity">
                              <Eye className="w-3.5 h-3.5 text-white" />
                            </div>
                          </button>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-white text-sm truncate flex items-center gap-1.5" title={dev.nodeName}>
                              <span>{getDeviceCategoryIcon(dev)}</span>
                              <span className="truncate">{dev.nodeName}</span>
                            </h4>
                            <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                              Mã: <span className="text-slate-300 font-semibold">{dev.nodeCode}</span>
                              {dev.serialNumber && ` • SN: ${dev.serialNumber}`}
                            </div>
                          </div>
                        </div>

                        {/* Vị trí lắp đặt & Đơn vị tính/Đơn giá */}
                        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1 text-xs">
                          <div className="flex justify-between text-slate-400">
                            <span>Vị trí lắp đặt:</span>
                            <span className="text-slate-200 font-medium truncate max-w-[160px]">
                              {dev.addressOrLocation || (isShared ? 'Khu vực công cộng' : targetRoom ? `Phòng ${targetRoom.nodeName}` : 'Kho')}
                            </span>
                          </div>

                          {isShared ? (
                            <div className="flex justify-between items-center text-slate-400 pt-1 border-t border-slate-900">
                              <span className="text-purple-300 font-medium">Phí dùng chung:</span>
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono text-purple-400 font-bold">
                                  {(dev.unitPrice || 0).toLocaleString('vi-VN')} đ/lượt
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleOpenAssignDevice(dev)}
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
                                    setSelectedDevForPriceSchedule(dev.nodeId);
                                    setShowPriceScheduleModal(true);
                                  }}
                                  className="text-[10px] text-indigo-400 hover:text-indigo-300 underline font-semibold cursor-pointer"
                                  title="Xem bảng giá theo từng tháng của thiết bị này"
                                >
                                  Bảng giá
                                </button>
                              </div>
                            </div>
                          )}

                          {dev.warrantyExpiryDate && (
                            <div className="flex justify-between text-slate-400 pt-1 border-t border-slate-900 text-[11px]">
                              <span>Hạn bảo hành:</span>
                              <span className="font-mono text-cyan-400">{formatDateVN(dev.warrantyExpiryDate)}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Các Nút Thao Tác: Đổi cách tính tiền & phòng, Điều chỉnh giá, Cập nhật tình trạng, Xóa */}
                      <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-1.5 text-xs">
                        {/* Nút Đổi Cách Tính Tiền & Vị Trí */}
                        <button
                          type="button"
                          onClick={() => handleOpenAssignDevice(dev)}
                          className="px-2.5 py-1.5 rounded-xl bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 hover:text-white font-medium text-[11px] border border-indigo-700/50 flex items-center gap-1 transition-all flex-1 justify-center"
                          title="Thay đổi cách tính tiền (Theo tháng <-> Theo lượt dùng) và vị trí lắp đặt"
                        >
                          <Sliders className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                          <span className="truncate">Đổi Cách Tính Tiền</span>
                        </button>

                        {/* Nút Chỉnh Giá */}
                        <button
                          type="button"
                          onClick={() => {
                            if (isShared) {
                              handleOpenAssignDevice(dev);
                            } else {
                              setSelectedDevForPriceSchedule(dev.nodeId);
                              setShowPriceScheduleModal(true);
                            }
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-medium text-[11px] border border-slate-700/60 flex items-center gap-1 transition-all whitespace-nowrap"
                          title={isShared ? "Sửa phí dùng chung theo lượt" : "Xem và sửa bảng giá thuê theo tháng"}
                        >
                          <DollarSign className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                          <span>{isShared ? 'Sửa Giá' : 'Bảng Giá'}</span>
                        </button>

                        {/* Nút Đổi Tình Trạng */}
                        {onUpdateCondition && (
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
                            title="Chuyển đổi nhanh tình trạng bình thường / báo hỏng"
                          >
                            {dev.currentCondition === 0 ? 'Báo sự cố' : 'Sửa xong'}
                          </button>
                        )}

                        {/* Nút Xóa Thiết Bị Khỏi Nhà */}
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

      {/* 3. TAB TRUNG TÂM BÁO CÁO THIẾT BỊ (HƯ HỎNG, HAY BẨN, KHÓ DÙNG) */}
      {activeTab === 'deviceHealth' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex justify-between items-center text-xs">
            <div>
              <h4 className="font-bold text-white text-sm">
                Danh Sách Phản Ánh Tình Trạng Thiết Bị (Thuộc Tòa Nhà Phụ Trách)
              </h4>
              <p className="text-slate-400">
                Phân loại theo yêu cầu: <strong>Hư hỏng</strong> (gọi thợ/bảo hành), <strong>Hay bẩn</strong> (gọi tạp vụ), <strong>Khó sử dụng</strong> (dán tem HD).
              </p>
            </div>
            <span className="px-3 py-1 rounded-lg bg-slate-950 font-mono text-emerald-400 border border-slate-800">
              {myIssues.length} bản ghi
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {myIssues.map((iss) => (
              <div 
                key={iss.reportId} 
                className={`p-5 rounded-2xl border flex flex-col justify-between gap-4 ${
                  iss.issueType === 'DAMAGED' 
                    ? 'bg-rose-950/20 border-rose-500/40' 
                    : iss.issueType === 'DIRTY' 
                    ? 'bg-orange-950/20 border-orange-500/40' 
                    : 'bg-amber-950/20 border-amber-500/40'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                      iss.issueType === 'DAMAGED'
                        ? 'bg-rose-900/60 text-rose-300'
                        : iss.issueType === 'DIRTY'
                        ? 'bg-orange-900/60 text-orange-300'
                        : 'bg-amber-900/60 text-amber-300'
                    }`}>
                      {iss.issueType === 'DAMAGED' ? '🔥 Hư hỏng' : iss.issueType === 'DIRTY' ? '✨ Hay bẩn' : '❓ Khó sử dụng'}
                    </span>

                    <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                      iss.status === 'RESOLVED' 
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' 
                        : 'bg-slate-800 text-slate-300'
                    }`}>
                      {iss.status === 'RESOLVED' ? '✓ Đã xong' : 'Chưa xử lý'}
                    </span>
                  </div>

                  <h5 className="font-bold text-white text-sm">{iss.deviceName}</h5>
                  <div className="text-[11px] text-slate-400">Vị trí: {iss.location}</div>
                  <p className="text-xs text-slate-300 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                    "{iss.description}"
                  </p>
                  {iss.warrantyInfo && (
                    <div className="text-[11px] text-cyan-400 bg-cyan-950/30 p-2 rounded border border-cyan-800/40 font-mono">
                      {iss.warrantyInfo}
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs">
                  <span className="text-[11px] text-slate-500">Bởi: {iss.reportedByName} • {formatDateTimeVN(iss.reportedAt)}</span>
                  {iss.status !== 'RESOLVED' ? (
                    <button
                      onClick={() => onResolveIssue(iss.reportId, 'Đã cử nhân sự xử lý xong hoàn toàn.')}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow"
                    >
                      Đánh Dấu Xong
                    </button>
                  ) : (
                    <span className="text-emerald-400 font-semibold text-[11px]">Đã giải quyết</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. TAB CHỐT CHỈ SỐ ĐIỆN NƯỚC & QUẢN TRỊ HÓA ĐƠN CÁC THÁNG */}
      {activeTab === 'meterEntry' && (
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-white text-base">Quản Lý Hóa Đơn, Điện Nước &amp; Chốt Sổ Phê Duyệt</h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                  Lưu Trữ Bất Biến
                </span>
              </div>
              <p className="text-slate-400 max-w-2xl">
                Quy tắc nghiệp vụ: Khi lập hóa đơn mới, hệ thống tự động <strong>lấy giá mới nhất</strong> của thiết bị theo danh mục bảng giá. Khi Quản lý <strong>Duyệt Hóa Đơn</strong>, hệ thống sẽ lưu cố định gồm tháng, năm và đơn giá thiết bị đã chốt. Khi sang Tháng 11 hoặc tương lai, xem lại hóa đơn các tháng trước mà <strong>không cần phải tính lại toàn bộ</strong>.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowCreateInvoiceModal(true)}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all shadow flex items-center gap-1.5"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Lập Hóa Đơn Tháng Mới</span>
              </button>

              <button
                type="button"
                onClick={() => setShowPriceScheduleModal(true)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition-all border border-slate-700 flex items-center gap-1.5"
              >
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <span>Bảng Giá Thiết Bị</span>
              </button>

              {myBuildings.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    const b = myBuildings[0];
                    setManagerEditingBuildingRates(b);
                    setManagerEditBuildingElecRate(b.electricRate || 3800);
                    setManagerEditBuildingWaterRate(b.waterRate || 30000);
                    setManagerEditBuildingSanitationRate(b.sanitationFeePerPerson || 30000);
                    setManagerEditBuildingResidenceRate(b.residenceFeePerPerson || 100000);
                  }}
                  className="px-4 py-2 rounded-xl bg-amber-950/80 hover:bg-amber-900 border border-amber-500/40 text-amber-300 font-semibold transition-all flex items-center gap-1.5"
                  title="Cài đặt đơn giá điện nước và phí vệ sinh, tạm trú cho tòa nhà phụ trách"
                >
                  <Sliders className="w-4 h-4 text-amber-400" />
                  <span>⚡💧 Đơn Giá &amp; Phí Tòa Nhà</span>
                </button>
              )}
            </div>
          </div>

          {/* Bộ lọc theo kỳ hóa đơn */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <span className="text-slate-400 font-medium whitespace-nowrap">Lọc theo kỳ:</span>
            {['ALL', ...Array.from(new Set(myInvoices.map((i) => i.monthYear)))].map((mYear) => (
              <button
                key={mYear}
                type="button"
                onClick={() => setSelectedInvoiceMonthFilter(mYear)}
                className={`px-3 py-1.5 rounded-xl font-semibold transition-all whitespace-nowrap ${
                  selectedInvoiceMonthFilter === mYear
                    ? 'bg-emerald-600 text-white shadow ring-2 ring-emerald-400/40'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {mYear === 'ALL' ? 'Tất cả các tháng' : `Tháng ${mYear}`}
              </button>
            ))}
          </div>

          {/* Danh sách hóa đơn */}
          <div className="space-y-3">
            {myInvoices
              .filter((inv) => selectedInvoiceMonthFilter === 'ALL' || inv.monthYear === selectedInvoiceMonthFilter)
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
                          ? `Đã chốt sổ bởi: ${inv.approvedByName || 'Người Quản Trị'} lúc ${formatDateTimeVN(inv.approvedAt) || 'cuối tháng'}. Đơn giá thiết bị được lưu vĩnh viễn không tính lại.`
                          : 'Hóa đơn đang ở dạng dự thảo. Quản lý có thể cập nhật số điện nước và bấm Duyệt để chốt sổ cố định.'}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block">Tổng hóa đơn:</span>
                        <span className="text-xl font-bold font-mono text-emerald-400">
                          {inv.totalAmount.toLocaleString('vi-VN')} đ
                        </span>
                      </div>

                      {!inv.isApproved && (
                        <button
                          type="button"
                          onClick={() => {
                            setManagerEditingInvoiceMeters(inv);
                            setManagerEditInvCurrElec(inv.currElectric);
                            setManagerEditInvCurrWater(inv.currWater);
                            setManagerEditInvElecRate(inv.electricRate || 3800);
                            setManagerEditInvWaterRate(inv.waterRate || 30000);
                            setManagerEditInvOccupantCount(inv.occupantCount || 1);
                            setManagerEditInvSanitationRate(inv.sanitationFeePerPerson || 30000);
                            setManagerEditInvResidenceRate(inv.residenceFeePerPerson || 100000);
                            setManagerEditInvApplyResidence(inv.isResidenceFeeApplied ?? false);
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
                            alert(`Đã duyệt & chốt sổ hóa đơn Kỳ ${inv.monthYear} cho ${inv.roomName}! Đơn giá thiết bị và số tiền đã được lưu cố định.`);
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

                  {/* Nhập số điện nước & hiển thị đơn giá */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-slate-400 block text-[10px]">Số điện (Cũ: {inv.prevElectric})</span>
                          <span className="text-[10px] text-amber-500/90 font-mono font-semibold">@{inv.electricRate.toLocaleString('vi-VN')} đ/kWh</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            defaultValue={inv.currElectric}
                            disabled={inv.isApproved}
                            onBlur={(e) => onUpdateInvoiceMeters(inv.invoiceId, Number(e.target.value), inv.currWater, inv.electricRate, inv.waterRate)}
                            className={`bg-slate-900 border border-slate-800 rounded px-2 py-0.5 font-mono font-bold w-20 outline-none text-sm ${
                              inv.isApproved ? 'text-slate-400 cursor-not-allowed' : 'text-amber-400 focus:border-amber-500'
                            }`}
                          />
                          <span className="text-slate-400 text-xs font-medium">kWh</span>
                          <span className="text-amber-400 font-mono font-semibold text-xs ml-1">
                            = {((inv.currElectric - inv.prevElectric) * inv.electricRate).toLocaleString('vi-VN')} đ
                          </span>
                        </div>
                      </div>

                      <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-slate-400 block text-[10px]">Số nước (Cũ: {inv.prevWater})</span>
                          <span className="text-[10px] text-cyan-500/90 font-mono font-semibold">@{inv.waterRate.toLocaleString('vi-VN')} đ/m³</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            defaultValue={inv.currWater}
                            disabled={inv.isApproved}
                            onBlur={(e) => onUpdateInvoiceMeters(inv.invoiceId, inv.currElectric, Number(e.target.value), inv.electricRate, inv.waterRate)}
                            className={`bg-slate-900 border border-slate-800 rounded px-2 py-0.5 font-mono font-bold w-20 outline-none text-sm ${
                              inv.isApproved ? 'text-slate-400 cursor-not-allowed' : 'text-cyan-400 focus:border-cyan-500'
                            }`}
                          />
                          <span className="text-slate-400 text-xs font-medium">m³</span>
                          <span className="text-cyan-400 font-mono font-semibold text-xs ml-1">
                            = {((inv.currWater - inv.prevWater) * inv.waterRate).toLocaleString('vi-VN')} đ
                          </span>
                        </div>
                      </div>

                      <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 space-y-0.5 text-xs">
                        <div className="text-slate-400">
                          Phí vệ sinh ({inv.occupantCount || 1} người): <strong className="text-emerald-400 font-mono">{(inv.sanitationFee ?? ((inv.occupantCount || 1) * (inv.sanitationFeePerPerson || 30000))).toLocaleString('vi-VN')} đ</strong>
                        </div>
                        <div className="text-slate-400">
                          Phí tạm trú: <strong className={inv.residenceFee && inv.residenceFee > 0 ? "text-indigo-400 font-mono" : "text-slate-500 font-mono"}>
                            {inv.residenceFee && inv.residenceFee > 0 ? `${(inv.residenceFee).toLocaleString('vi-VN')} đ (${inv.occupantCount || 1} ng/năm)` : '0 đ (Miễn thu tháng này)'}
                          </strong>
                        </div>
                      </div>

                      <div className="text-slate-400 space-y-0.5 text-xs">
                        <div>Tiền phòng: <strong className="text-slate-200">{inv.roomRent.toLocaleString('vi-VN')} đ</strong></div>
                        <div>Dùng chung &amp; Rác: <strong className="text-slate-200">{(inv.sharedDeviceCost + inv.internetAndTrash).toLocaleString('vi-VN')} đ</strong></div>
                      </div>
                    </div>

                    <div>
                      {inv.isApproved ? (
                        <span className="text-[11px] bg-slate-950 text-slate-400 border border-slate-800 px-3 py-1 rounded-lg">
                          🔒 Đã khóa sổ • Không bị tính lại
                        </span>
                      ) : (
                        <span className="text-[11px] bg-blue-950 text-blue-300 border border-blue-800 px-3 py-1 rounded-lg">
                          Tự tính lại khi sửa chỉ số
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
          </div>

          {/* MODAL LẬP HÓA ĐƠN THÁNG MỚI */}
          {showCreateInvoiceModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl space-y-4 p-6">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
                      <PlusCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-base">Lập Hóa Đơn Tháng Mới</h4>
                      <p className="text-xs text-slate-400">Tự động lấy giá mới nhất từ danh mục bảng giá thiết bị</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCreateInvoiceModal(false)}
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
                        createInvContractId,
                        createInvMonthYear,
                        createInvCurrElec,
                        createInvCurrWater,
                        createInvSharedCost,
                        createInvElectricRate,
                        createInvWaterRate,
                        createInvOccupantCount,
                        createInvSanitationRate,
                        createInvResidenceRate,
                        createInvApplyResidence
                      );
                      setShowCreateInvoiceModal(false);
                      alert(`Đã lập thành công hóa đơn Kỳ ${createInvMonthYear}!\n- Điện: ${createInvElectricRate.toLocaleString('vi-VN')} đ/kWh\n- Nước: ${createInvWaterRate.toLocaleString('vi-VN')} đ/m³\n- Vệ sinh: ${createInvOccupantCount} người × ${createInvSanitationRate.toLocaleString('vi-VN')} đ = ${(createInvOccupantCount * createInvSanitationRate).toLocaleString('vi-VN')} đ\n- Phí tạm trú: ${createInvApplyResidence ? `${(createInvOccupantCount * createInvResidenceRate).toLocaleString('vi-VN')} đ (${createInvOccupantCount} người)` : '0 đ (Miễn thu kỳ này)'}`);
                    }
                  }}
                  className="space-y-3.5 text-xs"
                >
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Chọn Hợp Đồng Phòng Thuê:</label>
                    <select
                      value={createInvContractId}
                      onChange={(e) => {
                        const cid = Number(e.target.value);
                        setCreateInvContractId(cid);
                        const targetContract = myContracts.find(c => c.contractId === cid);
                        if (targetContract) {
                          const bNode = nodes.find(n => n.nodeId === targetContract.buildingNodeId);
                          if (bNode?.electricRate) setCreateInvElectricRate(bNode.electricRate);
                          if (bNode?.waterRate) setCreateInvWaterRate(bNode.waterRate);
                          if (bNode?.sanitationFeePerPerson) setCreateInvSanitationRate(bNode.sanitationFeePerPerson);
                          if (bNode?.residenceFeePerPerson) setCreateInvResidenceRate(bNode.residenceFeePerPerson);
                          const count = getRoomOccupantCount(targetContract, roommates);
                          setCreateInvOccupantCount(count);
                          const resCheck = checkIsResidenceFeeBillingMonth(targetContract.actualCheckInDate || targetContract.startDateContract, createInvMonthYear);
                          setCreateInvApplyResidence(resCheck.isBillingMonth);
                        }
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-blue-500"
                    >
                      {myContracts.map((c) => (
                        <option key={c.contractId} value={c.contractId}>
                          {c.roomName} - Khách: {c.primaryTenantName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Kỳ Hóa Đơn (Tháng/Năm - MM/YYYY):</label>
                    <input
                      type="text"
                      value={createInvMonthYear}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCreateInvMonthYear(val);
                        const targetContract = myContracts.find(c => c.contractId === createInvContractId);
                        if (targetContract && val.length >= 7) {
                          const resCheck = checkIsResidenceFeeBillingMonth(targetContract.actualCheckInDate || targetContract.startDateContract, val);
                          setCreateInvApplyResidence(resCheck.isBillingMonth);
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
                        value={createInvCurrElec}
                        onChange={(e) => setCreateInvCurrElec(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-amber-400 font-mono font-bold outline-none focus:border-amber-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Chỉ số nước mới (m³):</label>
                      <input
                        type="number"
                        value={createInvCurrWater}
                        onChange={(e) => setCreateInvCurrWater(Number(e.target.value))}
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
                        value={createInvElectricRate}
                        onChange={(e) => setCreateInvElectricRate(Number(e.target.value))}
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
                        value={createInvWaterRate}
                        onChange={(e) => setCreateInvWaterRate(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-cyan-400 font-mono font-bold outline-none focus:border-cyan-500"
                        required
                      />
                    </div>
                  </div>

                  {/* Phí vệ sinh & Phí tạm trú theo đầu người */}
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
                          value={createInvOccupantCount}
                          onChange={(e) => setCreateInvOccupantCount(Number(e.target.value))}
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
                          value={createInvSanitationRate}
                          onChange={(e) => setCreateInvSanitationRate(Number(e.target.value))}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-emerald-400 font-mono font-bold outline-none focus:border-emerald-500"
                          required
                        />
                        <span className="text-[10px] text-emerald-400/80 block mt-0.5">
                          = {(createInvOccupantCount * createInvSanitationRate).toLocaleString('vi-VN')} đ/tháng
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
                          value={createInvResidenceRate}
                          onChange={(e) => setCreateInvResidenceRate(Number(e.target.value))}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-indigo-400 font-mono font-bold outline-none focus:border-indigo-500"
                          required
                        />
                        <span className="text-[10px] text-indigo-400/80 block mt-0.5">
                          = {(createInvOccupantCount * createInvResidenceRate).toLocaleString('vi-VN')} đ/năm
                        </span>
                      </div>
                    </div>

                    {/* Kiểm tra chu kỳ 12 tháng của phí tạm trú */}
                    {(() => {
                      const curCont = myContracts.find(c => c.contractId === createInvContractId);
                      const resCheck = checkIsResidenceFeeBillingMonth(curCont?.actualCheckInDate || curCont?.startDateContract || '', createInvMonthYear);
                      return (
                        <div className="p-2.5 rounded-xl bg-indigo-950/30 border border-indigo-500/30 text-[11px] space-y-1.5">
                          <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-200">
                            <input
                              type="checkbox"
                              checked={createInvApplyResidence}
                              onChange={(e) => setCreateInvApplyResidence(e.target.checked)}
                              className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0"
                            />
                            <span>Kê phí tạm trú tạm vắng vào hóa đơn kỳ này (+{(createInvOccupantCount * createInvResidenceRate).toLocaleString('vi-VN')} đ)</span>
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
                      value={createInvSharedCost}
                      onChange={(e) => setCreateInvSharedCost(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-purple-400 font-mono font-bold outline-none focus:border-purple-500"
                      required
                    />
                  </div>

                  <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-900/60 text-[11px] text-blue-300">
                    ℹ️ Hệ thống sẽ tự động đối chiếu danh mục bảng giá và áp dụng mức giá mới nhất có hiệu lực của từng thiết bị trong phòng cho kỳ này.
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setShowCreateInvoiceModal(false)}
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

      {/* 4. TAB ĐÁNH GIÁ KHÁCH & KHÓA KHI TRẢ PHÒNG */}
      {activeTab === 'tenantReviews' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs space-y-1">
            <h4 className="font-bold text-white text-sm">Đánh Giá Khách Thuê Sau Khi Trả Phòng</h4>
            <p className="text-slate-400">
              Quy tắc hệ thống: Khi hoàn tất trả phòng, đánh giá của Quản lý sẽ được <strong>khóa bảo chứng</strong> và hiển thị minh bạch tại mục Nhận Định.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 max-w-xl mx-auto space-y-4 text-xs">
            <form onSubmit={handleManagerReviewSubmit} className="space-y-4">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Chọn Hợp Đồng Khách Thuê:</label>
                <select
                  value={selectedContractForReview}
                  onChange={(e) => setSelectedContractForReview(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-blue-500"
                >
                  {myContracts.map((c) => (
                    <option key={c.contractId} value={c.contractId}>
                      {c.roomName} - {c.primaryTenantName} ({c.status === 'ACTIVE' ? 'Đang thuê' : 'Đã trả phòng'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Mức Điểm Đánh Giá (1 - 5 Sao):</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setMgrRating(star)}
                      className={`w-10 h-10 rounded-xl font-bold flex items-center justify-center transition-all ${
                        mgrRating >= star ? 'bg-amber-500 text-slate-950' : 'bg-slate-950 text-slate-500 border border-slate-800'
                      }`}
                    >
                      ★ {star}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Nhận Xét Của Quản Lý:</label>
                <textarea
                  rows={3}
                  value={mgrComment}
                  onChange={(e) => setMgrComment(e.target.value)}
                  placeholder="Ví dụ: Khách giữ gìn phòng sạch sẽ, thanh toán đúng hạn..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-blue-500 placeholder-slate-500"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition-all shadow"
              >
                Gửi Đánh Giá Của Quản Lý
              </button>
            </form>

            {mgrReviewSavedAlert && (
              <div className="p-3 rounded-xl bg-emerald-950 border border-emerald-800 text-emerald-300 text-center font-semibold">
                ✓ Đã lưu đánh giá thành công!
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. TAB ĐĂNG BÀI VIẾT THÔNG BÁO / GIỚI THIỆU */}
      {activeTab === 'createPost' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs">
            <h4 className="font-bold text-white text-sm">Đăng Bài Viết Thông Báo / Nội Quy Tòa Nhà</h4>
            <p className="text-slate-400">
              Bài viết sẽ được đăng trực tiếp lên Trang Chủ để người xem và khách thuê nắm được thông tin vận hành.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 max-w-xl mx-auto text-xs">
            <form onSubmit={handlePublishPostSubmit} className="space-y-3">
              <div>
                <label className="block text-slate-300 mb-1">Tòa Nhà Áp Dụng:</label>
                <select
                  value={postBuildingId}
                  onChange={(e) => setPostBuildingId(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-blue-500"
                >
                  {myBuildings.map((b) => (
                    <option key={b.nodeId} value={b.nodeId}>{b.nodeName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Tiêu Đề Bài Viết:</label>
                <input
                  type="text"
                  value={postTitle}
                  onChange={(e) => setPostTitle(e.target.value)}
                  placeholder="Ví dụ: Lịch bảo dưỡng định kỳ máy giặt và thang máy..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-blue-500 placeholder-slate-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Tóm Tắt Ngắn Gọn:</label>
                <input
                  type="text"
                  value={postSummary}
                  onChange={(e) => setPostSummary(e.target.value)}
                  placeholder="Tóm tắt 1-2 câu để hiển thị ngoài danh sách..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-blue-500 placeholder-slate-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Nội Dung Chi Tiết:</label>
                <textarea
                  rows={4}
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  placeholder="Kính gửi quý cư dân, ban quản lý xin thông báo..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-blue-500 placeholder-slate-500"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all shadow"
              >
                Đăng Bài Viết Lên Hệ Thống
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 7. TAB PHÂN QUYỀN & ẤN ĐỊNH QUẢN LÝ NGANG QUYỀN (CẤP 2) */}
      {activeTab === 'staff' && (
        <div className="space-y-6">
          {/* Banner Thẩm Quyền Quản Lý Cấp 2 */}
          <div className="p-5 rounded-3xl bg-gradient-to-r from-blue-950/70 via-slate-900 to-indigo-950/60 border border-blue-500/40 space-y-2 shadow-xl">
            <div className="flex items-center gap-2 text-blue-400 text-xs font-bold uppercase tracking-wider">
              <UserCheck className="w-4 h-4 text-blue-400" />
              <span>Thẩm Quyền Của Người Quản Lý (Cấp 2)</span>
            </div>
            <h3 className="text-lg font-bold text-white">
              Phân Quyền &amp; Ấn Định Quản Lý Ngang Quyền
            </h3>
            <div className="text-xs text-slate-300 space-y-1.5 leading-relaxed max-w-4xl">
              <p>
                • <strong>Quy tắc hệ thống:</strong> Người dùng khi tự đăng ký tài khoản luôn mặc định là <strong>Cấp 3 (Khách thuê / Cư dân - cấp thấp nhất)</strong>.
              </p>
              <p>
                • <strong>Ấn định ngang quyền:</strong> Tài khoản Quản lý (Cấp 2) do <strong>Admin Cấp 1 chỉ định</strong>. Đồng thời, Người quản lý (Cấp 2) được phép <strong>ấn định các tài khoản khác thành Quản Lý (Cấp 2) ngang quyền mình</strong> — hàm ý tài khoản được ấn định sẽ có <strong>đầy đủ các tính năng của người quản lý</strong> (quản lý tòa nhà, thêm/bớt phòng, ấn định giá thuê, thêm/gán thiết bị, chốt công tơ điện nước, và tiếp tục ấn định tài khoản khác ngang quyền).
              </p>
              <p>
                • <strong>Giới hạn an toàn:</strong> Người quản lý (Cấp 2) có thể đưa tài khoản về Cấp 3 (Khách thuê), nhưng <strong>không được phép can thiệp vào tài khoản của Admin Cấp 1</strong>.
              </p>
            </div>
          </div>

          {/* Thanh tìm kiếm & Bộ lọc vai trò */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs">
            <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
              <span className="text-slate-400 font-medium">Lọc vai trò:</span>
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setStaffRoleFilter('ALL')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                    staffRoleFilter === 'ALL' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Tất cả ({allUsers.length})
                </button>
                <button
                  type="button"
                  onClick={() => setStaffRoleFilter(2)}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                    staffRoleFilter === 2 ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Quản Lý Cấp 2 ({allUsers.filter(u => u.roleId === 2).length})
                </button>
                <button
                  type="button"
                  onClick={() => setStaffRoleFilter(3)}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                    staffRoleFilter === 3 ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Khách Thuê Cấp 3 ({allUsers.filter(u => u.roleId === 3).length})
                </button>
                <button
                  type="button"
                  onClick={() => setStaffRoleFilter(1)}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                    staffRoleFilter === 1 ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Admin Cấp 1 ({allUsers.filter(u => u.roleId === 1).length})
                </button>
              </div>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={staffSearchQuery}
                onChange={(e) => setStaffSearchQuery(e.target.value)}
                placeholder="Tìm tên, CCCD, SĐT, địa chỉ..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Danh sách người dùng */}
          {(() => {
            const filtered = allUsers.filter((u) => {
              if (staffRoleFilter !== 'ALL' && u.roleId !== staffRoleFilter) return false;
              if (staffSearchQuery.trim()) {
                const q = staffSearchQuery.toLowerCase();
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
                  <span>Hiển thị {filtered.length} tài khoản trong hệ thống:</span>
                  <span className="text-[11px] text-blue-300 font-medium">
                    * Bạn có quyền ấn định tài khoản Cấp 3 thành Quản Lý Cấp 2 ngang quyền mình
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                  {filtered.map((u) => {
                    const isSelf = currentUser.userId === u.userId;
                    const isAdmin = u.roleId === 1;

                    return (
                      <div
                        key={u.userId}
                        className={`p-4 rounded-2xl bg-slate-900 border transition-all space-y-3 flex flex-col justify-between ${
                          u.roleId === 1
                            ? 'border-purple-800/40 opacity-90'
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
                                  <span className="text-[9px] bg-blue-950 text-blue-300 border border-blue-700 px-1.5 py-0.5 rounded font-semibold">
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

                        {/* Các nút hành động ấn định quyền dành cho Quản lý Cấp 2 */}
                        <div className="pt-3 border-t border-slate-800/80 space-y-1.5">
                          <span className="text-[10px] text-slate-400 block font-semibold">
                            Hành động ấn định vai trò:
                          </span>

                          <div className="grid grid-cols-1 gap-1.5">
                            {/* Nếu là Admin Cấp 1 -> Quản lý không có quyền can thiệp */}
                            {isAdmin && (
                              <div className="p-2 rounded-xl bg-purple-950/30 border border-purple-800/40 text-purple-300 text-[10px] flex items-center gap-1.5">
                                <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0 text-purple-400" />
                                <span>Admin Tối Cao (Không được phép can thiệp)</span>
                              </div>
                            )}

                            {/* Nếu là tài khoản của chính mình */}
                            {isSelf && (
                              <div className="p-2 rounded-xl bg-blue-950/30 border border-blue-800/40 text-blue-300 text-[10px] flex items-center gap-1.5">
                                <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 text-blue-400" />
                                <span>Tài khoản của bạn đang đăng nhập</span>
                              </div>
                            )}

                            {/* Nếu là Khách thuê Cấp 3 -> Nút Ấn Định Quản Lý Ngang Quyền (Cấp 2) */}
                            {!isAdmin && !isSelf && u.roleId === 3 && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(`Xác nhận ấn định tài khoản "${u.fullName}" thành Quản Lý Tòa Nhà (Cấp 2) ngang quyền bạn?\n\nNgười này sẽ được cấp đầy đủ các tính năng của người quản lý (vận hành tòa nhà, thêm/bớt phòng, định giá, lập hóa đơn, và ấn định tiếp các quản lý khác).`)) {
                                    onUpdateUserRole && onUpdateUserRole(u.userId, 2);
                                  }
                                }}
                                className="w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-blue-600/25 active:scale-95"
                              >
                                <ShieldCheck className="w-3.5 h-3.5 text-white" />
                                <span>Ấn Định Quản Lý Ngang Quyền (Cấp 2)</span>
                              </button>
                            )}

                            {/* Nếu là Quản lý Cấp 2 khác -> Cho phép đưa về Khách thuê Cấp 3 */}
                            {!isAdmin && !isSelf && u.roleId === 2 && (
                              <div className="space-y-1">
                                <div className="p-1.5 rounded-lg bg-blue-950/40 text-blue-300 text-[10px] border border-blue-800/40 text-center font-medium">
                                  ✓ Đang là Quản Lý Cấp 2 ngang quyền
                                </div>
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
                              </div>
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

      {/* 8. TAB CÂY QUẢN LÝ THỰC THỂ ĐỆ QUY CỦA QUẢN LÝ */}
      {activeTab === 'tree' && (
        <div className="space-y-4">
          <RecursiveTree
            nodes={nodes.filter(n => isNodeInMyBuildings(n) || myBuildings.some(b => b.nodeId === n.nodeId))}
            objectTypes={objectTypes}
            onAddChildNode={(parentNodeId) => {
              if (onOpenAddRoomModal) {
                onOpenAddRoomModal(parentNodeId);
              } else {
                setNewDevBuildingId(parentNodeId);
                setShowAddDeviceModal(true);
              }
            }}
            onUpdateCondition={onUpdateCondition || (() => {})}
            onUpdateNode={onUpdateNode}
            onDeleteNode={onDeleteNode}
          />
        </div>
      )}

      {/* Modal Thêm Phòng Mới Vào Tòa Nhà */}
      {showAddRoomModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <DoorClosed className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-white text-base">Thêm Phòng Thuê Mới</h3>
              </div>
              <button 
                onClick={() => setShowAddRoomModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateRoom} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-medium">Tòa Nhà Thuộc Quyền Quản Lý:</label>
                <select
                  value={newRoomBuildingId}
                  onChange={(e) => setNewRoomBuildingId(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-blue-500"
                >
                  {myBuildings.map((b) => (
                    <option key={b.nodeId} value={b.nodeId}>{b.nodeName}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Mã Phòng:</label>
                  <input
                    type="text"
                    value={newRoomCode}
                    onChange={(e) => setNewRoomCode(e.target.value)}
                    placeholder="VD: P204, P301"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Tên Phòng:</label>
                  <input
                    type="text"
                    value={newRoomName}
                    onChange={(e) => setNewRoomName(e.target.value)}
                    placeholder="VD: Phòng 204 (Studio)"
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
                    value={newRoomRent}
                    onChange={(e) => setNewRoomRent(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none font-mono font-bold text-emerald-400"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Tiền Cọc (đ):</label>
                  <input
                    type="number"
                    step="50000"
                    value={newRoomDeposit}
                    onChange={(e) => setNewRoomDeposit(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Thời Điểm / Ghi Chú Giá:</label>
                <input
                  type="text"
                  value={newRoomPriceNote}
                  onChange={(e) => setNewRoomPriceNote(e.target.value)}
                  placeholder="Ví dụ: Giá mùa cao điểm tháng 9/2026, Giá khuyến mãi..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddRoomModal(false)}
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

      {/* Modal Ấn Định Mức Giá Thuê Theo Từng Thời Điểm */}
      {editingPriceRoom && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="font-bold text-white text-base">Ấn Định Mức Giá Thuê</h3>
                  <p className="text-xs text-slate-400">{editingPriceRoom.nodeName} ({editingPriceRoom.nodeCode})</p>
                </div>
              </div>
              <button 
                onClick={() => setEditingPriceRoom(null)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePrice} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-medium">Mức Giá Thuê Mới (VNĐ/tháng):</label>
                <input
                  type="number"
                  step="50000"
                  value={editPriceValue}
                  onChange={(e) => setEditPriceValue(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white font-mono font-bold text-base text-emerald-400 outline-none focus:border-emerald-400"
                  required
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Giá cũ: {(editingPriceRoom.unitPrice || 4500000).toLocaleString('vi-VN')} đ/tháng
                </span>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Thời Điểm / Chương Trình Định Giá:</label>
                <input
                  type="text"
                  value={editPriceNote}
                  onChange={(e) => setEditPriceNote(e.target.value)}
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
                    onClick={() => setEditPriceNote(sug)}
                    className="text-[10px] px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:border-slate-700"
                  >
                    + {sug}
                  </button>
                ))}
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingPriceRoom(null)}
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

      {/* Modal Thêm Thiết Bị Mới Vào Tòa Nhà (Dùng Chung hoặc Gán Vào Phòng) */}
      {showAddDeviceModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-indigo-400" />
                <div>
                  <h3 className="font-bold text-white text-base">Thêm Thiết Bị Mới Cho Tòa Nhà</h3>
                  <p className="text-xs text-slate-400">Lập danh mục thiết bị riêng biệt theo từng nhà</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddDeviceModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateDeviceSubmit} className="space-y-4 text-xs">
              {/* Chọn Tòa Nhà Nhận Thiết Bị */}
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Tòa Nhà Nhận Thiết Bị:</label>
                <select
                  value={newDevBuildingId}
                  onChange={(e) => {
                    const bId = Number(e.target.value);
                    setNewDevBuildingId(bId);
                    const roomsOfB = nodes.filter(
                      (n) => n.typeId === 3 && (n.parentNodeId === bId || nodes.some(p => p.nodeId === n.parentNodeId && p.parentNodeId === bId))
                    );
                    setNewDevRoomId(roomsOfB[0]?.nodeId || null);
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-semibold outline-none focus:border-indigo-500"
                >
                  {myBuildings.map((b) => (
                    <option key={b.nodeId} value={b.nodeId}>
                      {b.nodeName} ({b.nodeCode})
                    </option>
                  ))}
                </select>
              </div>

              {/* Tên Thiết Bị & Loại Thiết Bị */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Tên Thiết Bị:</label>
                  <input
                    type="text"
                    value={newDevName}
                    onChange={(e) => setNewDevName(e.target.value)}
                    placeholder="VD: Điều Hòa Daikin 9000BTU"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-indigo-500 placeholder-slate-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Loại Thiết Bị:</label>
                  <select
                    value={newDevTypeId}
                    onChange={(e) => setNewDevTypeId(Number(e.target.value))}
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

              {/* LỰA CHỌN QUAN TRỌNG: DÙNG CHUNG TOÀN NHÀ HAY TRANG BỊ TRONG PHÒNG */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <label className="block text-slate-200 font-bold text-xs">
                  Phân Định Phạm Vi Sử Dụng Thiết Bị:
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <label
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-2.5 ${
                      newDevIsShared
                        ? 'bg-purple-950/60 border-purple-500 text-purple-200 shadow'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="deviceUsageScope"
                      checked={newDevIsShared}
                      onChange={() => {
                        setNewDevIsShared(true);
                        setNewDevRoomId(null);
                        setNewDevLocation('Khu công cộng tòa nhà (Sảnh/Sân thượng/Hầm xe)');
                      }}
                      className="mt-0.5 text-purple-600 focus:ring-0"
                    />
                    <div>
                      <div className="font-bold text-xs text-white">🏢 Dùng Chung Công Cộng</div>
                      <div className="text-[10px] text-slate-400 mt-0.5 leading-snug">
                        Phục vụ toàn bộ người thuê trong tòa nhà (Ví dụ: Máy giặt sảnh, trạm sạc xe, cổng vân tay).
                      </div>
                    </div>
                  </label>

                  <label
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-2.5 ${
                      !newDevIsShared
                        ? 'bg-emerald-950/60 border-emerald-500 text-emerald-200 shadow'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="deviceUsageScope"
                      checked={!newDevIsShared}
                      onChange={() => {
                        setNewDevIsShared(false);
                        const rooms = nodes.filter(
                          (n) => n.typeId === 3 && (n.parentNodeId === newDevBuildingId || nodes.some(p => p.nodeId === n.parentNodeId && p.parentNodeId === newDevBuildingId))
                        );
                        setNewDevRoomId(rooms[0]?.nodeId || null);
                        setNewDevLocation(rooms[0] ? `Phòng ${rooms[0].nodeName}` : 'Trong phòng');
                      }}
                      className="mt-0.5 text-emerald-600 focus:ring-0"
                    />
                    <div>
                      <div className="font-bold text-xs text-white">🏠 Trang Bị Trong Phòng</div>
                      <div className="text-[10px] text-slate-400 mt-0.5 leading-snug">
                        Lắp đặt vào 1 phòng cụ thể. Người thuê phòng đó độc quyền dùng và báo hỏng.
                      </div>
                    </div>
                  </label>
                </div>

                {/* Nếu là thiết bị trong phòng: Chọn phòng lắp đặt */}
                {!newDevIsShared && (
                  <div className="pt-2 border-t border-slate-900 space-y-1.5 animate-in fade-in">
                    <label className="block text-slate-300 font-medium">Chọn Phòng Lắp Đặt Thiết Bị:</label>
                    <select
                      value={newDevRoomId || ''}
                      onChange={(e) => {
                        const rId = e.target.value ? Number(e.target.value) : null;
                        setNewDevRoomId(rId);
                        const targetR = nodes.find(n => n.nodeId === rId);
                        if (targetR) {
                          setNewDevLocation(`Phòng ${targetR.nodeName}`);
                        }
                      }}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-semibold outline-none focus:border-emerald-500"
                    >
                      {nodes
                        .filter(
                          (n) => n.typeId === 3 && (n.parentNodeId === newDevBuildingId || nodes.some(p => p.nodeId === n.parentNodeId && p.parentNodeId === newDevBuildingId))
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
                  {newDevIsShared ? (
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
                          value={newDevUnitPrice}
                          onChange={(e) => setNewDevUnitPrice(Number(e.target.value))}
                          placeholder="VD: 15000"
                          className="w-full bg-slate-950 border border-purple-500/50 rounded-xl px-3 py-2 text-white font-mono font-bold outline-none focus:border-purple-400"
                          required
                        />
                        <span className="text-purple-300 font-semibold whitespace-nowrap">đ / lượt dùng</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">
                        Áp dụng cho máy giặt chung (15k/lượt), máy sấy (20k/lượt), trạm sạc xe điện (10k/lượt), cổng vân tay (0đ)...
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
                          value={newDevMonthlyRentalPrice}
                          onChange={(e) => setNewDevMonthlyRentalPrice(Number(e.target.value))}
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
                  {newDevImageUrl && (
                    <button
                      type="button"
                      onClick={() => setNewDevImageUrl('')}
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
                      onChange={handleDevImageUpload}
                    />
                  </label>

                  <input
                    type="url"
                    value={newDevImageUrl}
                    onChange={(e) => setNewDevImageUrl(e.target.value)}
                    placeholder="Hoặc dán link ảnh (https://...)"
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-indigo-500 text-xs"
                  />
                </div>

                {newDevImageUrl && (
                  <div className="mt-2 relative rounded-xl overflow-hidden border border-slate-700/80 h-32 bg-slate-900 group">
                    <img src={newDevImageUrl} alt="Ảnh thiết bị" className="w-full h-full object-cover" />
                    <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur text-emerald-400 text-[10px] font-semibold px-2 py-0.5 rounded-lg border border-emerald-500/30 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Ảnh xem trước thiết bị</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Vị trí lắp đặt & Số Serial */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Vị Trí Cụ Thể:</label>
                  <input
                    type="text"
                    value={newDevLocation}
                    onChange={(e) => setNewDevLocation(e.target.value)}
                    placeholder="VD: Ban công phòng, Tường chính, Sảnh T1..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1">Số Serial / Mã Model (nếu có):</label>
                  <input
                    type="text"
                    value={newDevSerial}
                    onChange={(e) => setNewDevSerial(e.target.value)}
                    placeholder="VD: SN-2026-9988"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddDeviceModal(false)}
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

      {/* Modal Đổi Cách Tính Tiền & Vị Trí Lắp Đặt Thiết Bị */}
      {assigningDevice && (
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
                    {assigningDevice.nodeName} ({assigningDevice.nodeCode})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAssigningDevice(null)}
                className="text-slate-400 hover:text-white text-sm p-1 rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAssignDeviceSubmit} className="space-y-4 text-xs">
              {/* Trạng thái tính tiền hiện tại */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="text-slate-400 text-[11px]">Trạng thái tính tiền hiện tại:</div>
                <div className="text-white font-semibold flex items-center gap-2">
                  {assigningDevice.isShared ? (
                    <span className="text-purple-400 flex items-center gap-1.5 font-bold">
                      <span>🏢 Dùng chung cả tòa nhà • Tính tiền THEO LƯỢT DÙNG</span>
                      <span className="font-mono text-purple-300">({(assigningDevice.unitPrice || 0).toLocaleString('vi-VN')} đ/lượt)</span>
                    </span>
                  ) : (
                    <span className="text-emerald-400 flex items-center gap-1.5 font-bold">
                      <span>🏠 Thiết bị theo phòng • Tính tiền THEO THÁNG</span>
                      <span className="font-mono text-emerald-300">({(assigningDevice.monthlyRentalPrice || 0).toLocaleString('vi-VN')} đ/tháng)</span>
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
                    onClick={() => setAssigningBillingMode('MONTHLY')}
                    className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                      assigningBillingMode === 'MONTHLY'
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
                    onClick={() => setAssigningBillingMode('PER_USE')}
                    className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                      assigningBillingMode === 'PER_USE'
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
              {assigningBillingMode === 'MONTHLY' ? (
                <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/40 space-y-3">
                  <div>
                    <label className="block text-emerald-300 font-semibold mb-1">
                      1. Chọn Phòng Lắp Đặt Thiết Bị:
                    </label>
                    <select
                      value={targetRoomForAssign || ''}
                      onChange={(e) => setTargetRoomForAssign(e.target.value ? Number(e.target.value) : null)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-semibold outline-none focus:border-emerald-500"
                    >
                      <option value="">-- Kho (Chưa gán phòng cụ thể) --</option>
                      {roomsInCurrentBuilding.map((r) => (
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
                      value={assigningMonthlyPrice}
                      onChange={(e) => setAssigningMonthlyPrice(Number(e.target.value))}
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
                      🏢 Khu vực công cộng dùng chung của cả tòa nhà ({currentBuildingNode?.nodeName})
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
                      value={assigningUnitPrice}
                      onChange={(e) => setAssigningUnitPrice(Number(e.target.value))}
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
                  onClick={() => setAssigningDevice(null)}
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
      {showPriceScheduleModal && (
        <DevicePriceScheduleModal
          isOpen={showPriceScheduleModal}
          onClose={() => {
            setShowPriceScheduleModal(false);
            setSelectedDevForPriceSchedule(null);
          }}
          buildings={myBuildings}
          nodes={nodes}
          invoices={invoices}
          objectTypes={objectTypes}
          initialSelectedDeviceNodeId={selectedDevForPriceSchedule}
          onUpdateDeviceMonthlyPrice={onUpdateDeviceMonthlyPrice || (() => {})}
          onRecalculateInvoicesForMonth={onRecalculateInvoicesForMonth}
          onOpenPhotoModal={(dev) => setSelectedDeviceForPhoto(dev)}
        />
      )}

      {/* Modal Xem Ảnh Chụp Thực Tế Thiết Bị */}
      {selectedDeviceForPhoto && (
        <DevicePhotoModal
          deviceNode={selectedDeviceForPhoto}
          isOpen={!!selectedDeviceForPhoto}
          onClose={() => setSelectedDeviceForPhoto(null)}
          buildingName={nodes.find(n => n.nodeId === selectedDeviceForPhoto.buildingNodeId)?.nodeName || myBuildings.find(b => b.nodeId === selectedBuildingForDevices)?.nodeName}
          roomName={nodes.find(n => n.nodeId === selectedDeviceForPhoto.roomNodeId || n.nodeId === selectedDeviceForPhoto.parentNodeId)?.nodeName}
          onUpdateNode={onUpdateNode}
        />
      )}

      {/* Modal Cài Đặt Đơn Giá Điện Nước & Phí Dịch Vụ Tòa Nhà (Quản Lý) */}
      {managerEditingBuildingRates && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-base">Cài Đặt Đơn Giá &amp; Phí Tòa Nhà</h4>
                  <p className="text-xs text-slate-400">{managerEditingBuildingRates.nodeName} ({managerEditingBuildingRates.nodeCode})</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setManagerEditingBuildingRates(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (onUpdateBuildingUtilityRates && managerEditingBuildingRates) {
                  onUpdateBuildingUtilityRates(
                    managerEditingBuildingRates.nodeId,
                    managerEditBuildingElecRate,
                    managerEditBuildingWaterRate,
                    managerEditBuildingSanitationRate,
                    managerEditBuildingResidenceRate
                  );
                  alert(`Đã cập nhật đơn giá cho tòa nhà ${managerEditingBuildingRates.nodeName}!\n- Điện: ${managerEditBuildingElecRate.toLocaleString('vi-VN')} đ/kWh\n- Nước: ${managerEditBuildingWaterRate.toLocaleString('vi-VN')} đ/m³\n- Phí vệ sinh: ${managerEditBuildingSanitationRate.toLocaleString('vi-VN')} đ/người/tháng\n- Phí tạm trú: ${managerEditBuildingResidenceRate.toLocaleString('vi-VN')} đ/người/năm`);
                  setManagerEditingBuildingRates(null);
                }
              }}
              className="space-y-3.5 text-xs"
            >
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-300 space-y-1">
                <p>
                  Đơn giá và mức phí này được sử dụng làm <strong>mức giá cơ sở mặc định</strong> khi tự động lập hóa đơn hàng tháng cho các phòng trong tòa nhà phụ trách.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-amber-300 font-semibold mb-1 flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-400" />
                    Đơn Giá Điện (đ/kWh):
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={100}
                    value={managerEditBuildingElecRate}
                    onChange={(e) => setManagerEditBuildingElecRate(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-amber-400 font-mono font-bold text-sm outline-none focus:border-amber-500"
                    required
                  />
                  <span className="text-[10px] text-slate-500">Mặc định: 3.800 đ/kWh</span>
                </div>

                <div>
                  <label className="block text-cyan-300 font-semibold mb-1 flex items-center gap-1.5">
                    <Droplets className="w-4 h-4 text-cyan-400" />
                    Đơn Giá Nước (đ/m³):
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    value={managerEditBuildingWaterRate}
                    onChange={(e) => setManagerEditBuildingWaterRate(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-cyan-400 font-mono font-bold text-sm outline-none focus:border-cyan-500"
                    required
                  />
                  <span className="text-[10px] text-slate-500">Mặc định: 30.000 đ/m³</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-emerald-300 font-semibold mb-1 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    Phí Vệ Sinh (đ/người/tháng):
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={5000}
                    value={managerEditBuildingSanitationRate}
                    onChange={(e) => setManagerEditBuildingSanitationRate(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-emerald-400 font-mono font-bold text-sm outline-none focus:border-emerald-500"
                    required
                  />
                  <span className="text-[10px] text-slate-500">Tính theo đầu người mỗi tháng</span>
                </div>

                <div>
                  <label className="block text-indigo-300 font-semibold mb-1 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-indigo-400" />
                    Phí Tạm Trú (đ/người/năm):
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={10000}
                    value={managerEditBuildingResidenceRate}
                    onChange={(e) => setManagerEditBuildingResidenceRate(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-indigo-400 font-mono font-bold text-sm outline-none focus:border-indigo-500"
                    required
                  />
                  <span className="text-[10px] text-slate-500">Định kỳ sau mỗi 12 tháng</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setManagerEditingBuildingRates(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold hover:bg-slate-700"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold shadow"
                >
                  Lưu Đơn Giá Tòa Nhà
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Sửa Chỉ Số, Đơn Giá & Phí Dịch Vụ Cho Hóa Đơn (Quản Lý) */}
      {managerEditingInvoiceMeters && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-base">Sửa Chỉ Số &amp; Phí Dịch Vụ Hóa Đơn</h4>
                  <p className="text-xs text-slate-400">{managerEditingInvoiceMeters.roomName} • Kỳ {managerEditingInvoiceMeters.monthYear}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setManagerEditingInvoiceMeters(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (onUpdateInvoiceMeters && managerEditingInvoiceMeters) {
                  onUpdateInvoiceMeters(
                    managerEditingInvoiceMeters.invoiceId,
                    managerEditInvCurrElec,
                    managerEditInvCurrWater,
                    managerEditInvElecRate,
                    managerEditInvWaterRate,
                    managerEditInvOccupantCount,
                    managerEditInvSanitationRate,
                    managerEditInvResidenceRate,
                    managerEditInvApplyResidence
                  );
                  alert(`Đã cập nhật hóa đơn Kỳ ${managerEditingInvoiceMeters.monthYear} phòng ${managerEditingInvoiceMeters.roomName}! Hệ thống đã tính lại tổng tiền.`);
                  setManagerEditingInvoiceMeters(null);
                }
              }}
              className="space-y-4 text-xs"
            >
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-300">
                Cho phép điều chỉnh linh hoạt cả <strong>chỉ số công tơ điện nước</strong>, <strong>đơn giá tháng này</strong>, và <strong>phí vệ sinh / phí tạm trú</strong> tính theo đầu người.
              </div>

              {/* Điện */}
              <div className="p-3.5 rounded-2xl bg-amber-950/20 border border-amber-500/30 space-y-3">
                <div className="font-bold text-amber-300 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>Điện Sinh Hoạt (Số cũ: {managerEditingInvoiceMeters.prevElectric} kWh)</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 mb-1">Chỉ số điện mới (kWh):</label>
                    <input
                      type="number"
                      value={managerEditInvCurrElec}
                      onChange={(e) => setManagerEditInvCurrElec(Number(e.target.value))}
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
                      value={managerEditInvElecRate}
                      onChange={(e) => setManagerEditInvElecRate(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-amber-400 font-mono font-bold outline-none focus:border-amber-500"
                      required
                    />
                  </div>
                </div>
                <div className="text-[11px] text-amber-400/80 font-mono">
                  Sử dụng: {Math.max(0, managerEditInvCurrElec - managerEditingInvoiceMeters.prevElectric)} kWh × {managerEditInvElecRate.toLocaleString('vi-VN')} đ = {(Math.max(0, managerEditInvCurrElec - managerEditingInvoiceMeters.prevElectric) * managerEditInvElecRate).toLocaleString('vi-VN')} đ
                </div>
              </div>

              {/* Nước */}
              <div className="p-3.5 rounded-2xl bg-cyan-950/20 border border-cyan-500/30 space-y-3">
                <div className="font-bold text-cyan-300 flex items-center gap-1.5">
                  <Droplets className="w-4 h-4 text-cyan-400" />
                  <span>Nước Sinh Hoạt (Số cũ: {managerEditingInvoiceMeters.prevWater} m³)</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 mb-1">Chỉ số nước mới (m³):</label>
                    <input
                      type="number"
                      value={managerEditInvCurrWater}
                      onChange={(e) => setManagerEditInvCurrWater(Number(e.target.value))}
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
                      value={managerEditInvWaterRate}
                      onChange={(e) => setManagerEditInvWaterRate(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-cyan-400 font-mono font-bold outline-none focus:border-cyan-500"
                      required
                    />
                  </div>
                </div>
                <div className="text-[11px] text-cyan-400/80 font-mono">
                  Sử dụng: {Math.max(0, managerEditInvCurrWater - managerEditingInvoiceMeters.prevWater)} m³ × {managerEditInvWaterRate.toLocaleString('vi-VN')} đ = {(Math.max(0, managerEditInvCurrWater - managerEditingInvoiceMeters.prevWater) * managerEditInvWaterRate).toLocaleString('vi-VN')} đ
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
                      value={managerEditInvOccupantCount}
                      onChange={(e) => setManagerEditInvOccupantCount(Number(e.target.value))}
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
                      value={managerEditInvSanitationRate}
                      onChange={(e) => setManagerEditInvSanitationRate(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-emerald-400 font-mono font-bold outline-none focus:border-emerald-500"
                      required
                    />
                    <div className="text-[10px] text-emerald-400/80 font-mono mt-1">
                      = {(managerEditInvOccupantCount * managerEditInvSanitationRate).toLocaleString('vi-VN')} đ
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 mb-1">Đơn giá phí tạm trú (đ/người/năm):</label>
                    <input
                      type="number"
                      min={0}
                      step={10000}
                      value={managerEditInvResidenceRate}
                      onChange={(e) => setManagerEditInvResidenceRate(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-indigo-400 font-mono font-bold outline-none focus:border-indigo-500"
                      required
                    />
                    <div className="text-[10px] text-indigo-400/80 font-mono mt-1">
                      = {(managerEditInvOccupantCount * managerEditInvResidenceRate).toLocaleString('vi-VN')} đ
                    </div>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-indigo-950/30 border border-indigo-500/30 text-[11px] space-y-1">
                  <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-200">
                    <input
                      type="checkbox"
                      checked={managerEditInvApplyResidence}
                      onChange={(e) => setManagerEditInvApplyResidence(e.target.checked)}
                      className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0"
                    />
                    <span>Kê phí tạm trú tạm vắng vào kỳ này (+{managerEditInvApplyResidence ? (managerEditInvOccupantCount * managerEditInvResidenceRate).toLocaleString('vi-VN') : 0} đ)</span>
                  </label>
                  <p className="text-[10px] text-slate-400">
                    {managerEditingInvoiceMeters.residenceFeeNote || 'Thu từ tháng bắt đầu ở và định kỳ sau mỗi 12 tháng'}
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setManagerEditingInvoiceMeters(null)}
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
