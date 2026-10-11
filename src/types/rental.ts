export type RoleType = 1 | 2 | 3; // 1: Admins, 2: Quản lý tòa nhà, 3: Người dùng

export interface Role {
  roleId: RoleType;
  roleCode: 'ADMIN' | 'BUILDING_MANAGER' | 'TENANT';
  roleName: string;
  description: string;
}

export interface User {
  userId: number;
  roleId: RoleType;
  fullName: string;
  citizenId: string; // Số CCCD duy nhất (12 số)
  citizenIdFrontImg?: string; // Ảnh mặt trước CCCD
  citizenIdBackImg?: string; // Ảnh mặt sau CCCD
  phoneNumber: string; // Số điện thoại duy nhất
  address: string; // Địa chỉ thường trú / quê quán (MỚI BỔ SUNG)
  password?: string;
  avatarUrl?: string;
  isActive: boolean;
  createdAt: string;
  designatedByUserId?: number; // ID người đã ấn định / bổ nhiệm vai trò này
  designatedByName?: string; // Tên người đã ấn định / bổ nhiệm vai trò này
}

export interface ObjectType {
  typeId: number;
  typeCode: string;
  typeName: string;
  categoryGroup: 'PROPERTY' | 'ROOM' | 'DEVICE' | 'PUBLIC_SERVICE';
  metricUnit?: string; // 'Lần', 'kWh', 'Khối', 'Phút', 'Tháng'
  hasSubItems: boolean;
}

export type DeviceCondition = 0 | 1 | 2 | 3; // 0: Bình thường, 1: Hay bẩn, 2: Khó dùng, 3: Hư hỏng

export interface DevicePriceHistoryRecord {
  recordId: number;
  effectiveMonthYear: string; // Tháng bắt đầu áp dụng (VD: '09/2026', '11/2026', '01/2027')
  oldPrice?: number; // Mức giá trước đó (VD: 70000)
  newPrice: number; // Mức giá điều chỉnh mới (VD: 82000)
  changedAt: string; // Ngày thực hiện điều chỉnh
  changedByName?: string; // Người thực hiện điều chỉnh
  reason?: string; // Lý do điều chỉnh (VD: 'Nâng cấp gói cước WiFi cáp quang 1Gbps', 'Điều chỉnh trượt giá năm 2027')
}

// Danh mục bảng giá theo thời gian của từng thiết bị
export interface DevicePriceCatalogEntry {
  catalogId: number;
  effectiveFromMonthYear: string; // VD: '08/2026', '11/2026', '01/2027'
  monthlyRentalPrice: number; // Đơn giá thuê thiết bị hàng tháng (đ/tháng)
  note?: string; // Ghi chú (VD: 'Giá thuê ban đầu', 'Năm sau điều chỉnh lên 82.000đ')
  createdAt: string;
  createdByName?: string;
}

export interface ManagementNode {
  nodeId: number;
  parentNodeId: number | null;
  typeId: number;
  nodeCode: string;
  nodeName: string;
  unitPrice?: number;
  depositAmount?: number;
  addressOrLocation?: string;
  hardwareMacOrTopic?: string;
  serialNumber?: string;
  warrantyExpiryDate?: string;
  currentCondition: DeviceCondition;
  isActive: boolean;
  createdAt: string;
  notes?: string;
  managerUserId?: number; // Quản lý phụ trách tòa nhà (hoặc người tạo)
  pricePeriodNote?: string; // Ghi chú thời điểm định giá (ví dụ: 'Giá mùa cao điểm tháng 9/2026', 'Giá khuyến mãi hè')
  seasonalPrices?: { [period: string]: number }; // Bảng giá theo các thời điểm
  isShared?: boolean; // true: Thiết bị dùng chung (công cộng) của tòa nhà; false: Thiết bị trong phòng
  buildingNodeId?: number; // ID tòa nhà mà thiết bị trực thuộc (Mỗi nhà có danh sách thiết bị riêng)
  roomNodeId?: number | null; // ID phòng mà thiết bị được lắp đặt (nếu không dùng chung)
  deviceCategory?: string; // Loại: 'AIR_COND' | 'FRIDGE' | 'WATER_HEATER' | 'WASHING_MACHINE' | 'WIFI_ROUTER' | 'SECURITY_GATE' | 'EV_CHARGER' | 'OTHER'
  imageUrl?: string; // Ảnh chụp thực tế của nhà, phòng hoặc thiết bị
  monthlyRentalPrice?: number; // Tiền thuê thiết bị theo tháng (dành cho thiết bị trang bị theo phòng, ví dụ cục phát WiFi, tủ lạnh...)
  monthlyPriceSchedule?: { [monthYear: string]: number }; // Bảng giá của thiết bị theo từng tháng (ví dụ: {'09/2026': 70000, '11/2026': 82000})
  electricRate?: number; // Đơn giá điện quy định của tòa nhà / phòng (đ/kWh, ví dụ: 3800)
  waterRate?: number; // Đơn giá nước quy định của tòa nhà / phòng (đ/m³, ví dụ: 30000)
  sanitationFeePerPerson?: number; // Phí vệ sinh tính trên đầu người / tháng (đ/người/tháng, ví dụ: 30000)
  residenceFeePerPerson?: number; // Phí tạm trú tạm vắng tính trên đầu người / năm (đ/người/năm, ví dụ: 100000)
  priceCatalog?: DevicePriceCatalogEntry[]; // Danh mục bảng giá qua các thời kỳ của thiết bị
  priceHistory?: DevicePriceHistoryRecord[]; // Lịch sử biến động giá của thiết bị theo thời gian để chủ nhà theo dõi
  children?: ManagementNode[];
}

export interface RentalContract {
  contractId: number;
  roomNodeId: number;
  roomName: string;
  buildingName: string;
  buildingNodeId: number;
  primaryTenantUserId: number;
  primaryTenantName: string;
  startDateContract: string; // Hợp đồng từ ngày
  endDateContract: string; // Hợp đồng đến ngày
  actualCheckInDate: string; // Ngày đến thực tế (Bắt đầu ở)
  actualCheckOutDate?: string | null; // Ngày trả thực tế
  monthlyRent: number;
  depositAmount: number;
  occupantCount?: number; // Số người ở đăng ký (mặc định = 1 khách chính + số người cùng phòng)
  status: 'ACTIVE' | 'CHECKED_OUT' | 'PENDING';
  notes?: string;
}

export interface Roommate {
  roommateId: number;
  contractId: number;
  fullName: string;
  citizenId: string;
  phoneNumber: string;
  address: string; // Địa chỉ thường trú
  hasGateAccess: boolean;
  relationship: string; // Bạn cùng phòng, Vợ/chồng, Em ruột...
}

export interface MonthlyInvoice {
  invoiceId: number;
  contractId: number;
  roomNodeId: number;
  roomName: string;
  monthYear: string; // '09/2026', '11/2026'
  month?: number; // 9, 11
  year?: number; // 2026
  prevElectric: number;
  currElectric: number;
  electricRate: number; // 3800đ/kWh
  prevWater: number;
  currWater: number;
  waterRate: number; // 30000đ/khối
  roomRent: number;
  roomDeviceRentalCost?: number; // Tiền thuê thiết bị trang bị theo phòng tháng này (tính theo bảng giá tháng)
  sharedDeviceCost: number; // Tiền máy giặt, sạc xe, điện thoại công cộng tính theo lượt dùng...
  occupantCount?: number; // Số người ở trong phòng tại thời điểm lập hóa đơn
  sanitationFeePerPerson?: number; // Đơn giá phí vệ sinh trên đầu người / tháng (đ/người/tháng)
  sanitationFee?: number; // Tổng phí vệ sinh tháng này = occupantCount * sanitationFeePerPerson
  residenceFeePerPerson?: number; // Đơn giá phí tạm trú tạm vắng trên đầu người / năm (đ/người/năm)
  isResidenceFeeApplied?: boolean; // Kỳ này có áp dụng thu phí tạm trú (chu kỳ 12 tháng từ tháng bắt đầu ở)
  residenceFee?: number; // Phí tạm trú tạm vắng kỳ này (0 nếu trong chu kỳ 12 tháng đã thu trước đó)
  residenceFeeNote?: string; // Ghi chú chu kỳ (Ví dụ: 'Thu phí tạm trú năm thứ 1', 'Đã miễn thu theo chu kỳ 12 tháng')
  internetAndTrash: number; // Phí rác / dịch vụ mạng
  totalAmount: number;
  status: 'PAID' | 'UNPAID';
  paymentDate?: string;
  isApproved?: boolean; // Người quản trị đã duyệt hóa đơn
  approvalStatus?: 'DRAFT' | 'APPROVED'; // Trạng thái duyệt
  approvedAt?: string; // Thời điểm duyệt hóa đơn
  approvedByName?: string; // Tên người quản trị duyệt hóa đơn
  isLocked?: boolean; // Chốt sổ: Lưu cố định đơn giá thiết bị và số tiền, không tính lại sau này
  deviceBreakdown?: {
    deviceNodeId: number;
    deviceCode?: string;
    deviceName: string;
    monthlyPrice: number; // Đơn giá thuê thiết bị của tháng đấy
    category?: string;
    snapshotAppliedAt?: string;
  }[]; // Chi tiết đơn giá thuê từng thiết bị của tháng đấy được lưu lại
}

export interface DeviceIssueReport {
  reportId: number;
  nodeId: number;
  deviceName: string;
  location: string;
  isSharedDevice?: boolean; // Phân biệt báo hỏng thiết bị dùng chung tòa nhà hay trong phòng
  roomNodeId?: number | null;
  buildingNodeId?: number;
  reportedByUserId: number;
  reportedByName: string;
  issueType: 'DAMAGED' | 'DIRTY' | 'DIFFICULT_TO_USE';
  description: string;
  photoUrl?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED';
  reportedAt: string;
  resolvedAt?: string;
  resolutionNote?: string;
  warrantyInfo?: string;
}

export interface SharedDeviceLog {
  logId: number;
  deviceNodeId: number;
  deviceName: string;
  tenantUserId: number;
  tenantName: string;
  roomNodeId: number;
  roomName: string;
  unitCount: number;
  cost: number;
  activatedAt: string;
  durationMinutes: number;
}

export interface TwoWayReview {
  reviewId: number;
  contractId: number;
  roomName: string;
  reviewerUserId: number;
  reviewerName: string;
  reviewerRole: 'BUILDING_MANAGER' | 'TENANT';
  targetUserId: number;
  targetUserName: string;
  rating: number; // 1 - 5 sao
  comment: string;
  isLocked: boolean; // Gửi xong là khóa hoàn toàn
  createdAt: string;
}

export interface BuildingPost {
  postId: number;
  buildingNodeId: number;
  buildingName: string;
  authorName: string;
  authorRole: string;
  title: string;
  summary: string;
  content: string;
  coverImage: string;
  createdAt: string;
}

export interface RoomReservation {
  reservationId: number;
  roomNodeId: number;
  roomName: string;
  buildingNodeId: number;
  buildingName: string;
  userId: number;
  userName: string;
  userPhone: string;
  userCitizenId: string;
  userAddress: string;
  status: 'PENDING' | 'CONFIRMED' | 'REJECTED';
  requestedAt: string;
  expectedCheckInDate: string;
  monthlyRent: number;
  depositAmount: number;
  availableReason: 'ROOM_VACANT' | 'CONTRACT_EXPIRING_SOON';
  contractEndDate?: string;
  daysRemaining?: number;
  managerNotes?: string;
}

