import { 
  User, 
  ObjectType, 
  ManagementNode, 
  RentalContract, 
  Roommate, 
  MonthlyInvoice, 
  DeviceIssueReport, 
  SharedDeviceLog, 
  TwoWayReview, 
  BuildingPost 
} from '../types/rental';

export const INITIAL_USERS: User[] = [
  // 3 Quản trị viên cấp cao nhất (Admins)
  {
    userId: 1,
    roleId: 1,
    fullName: 'Trần Hải Linh (Admin Cấp Cao)',
    citizenId: '001085001111',
    phoneNumber: '0901111111',
    address: 'Số 1 Đại Cồ Việt, Phường Bách Khoa, Hai Bà Trưng, Hà Nội',
    citizenIdFrontImg: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop&q=80',
    citizenIdBackImg: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop&q=80',
    isActive: true,
    createdAt: '2026-01-01'
  },
  {
    userId: 2,
    roleId: 1,
    fullName: 'Nguyễn Minh Quân (Admin Cấp Cao)',
    citizenId: '001085002222',
    phoneNumber: '0902222222',
    address: 'Số 54 Liễu Giai, Ba Đình, Hà Nội',
    citizenIdFrontImg: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop&q=80',
    citizenIdBackImg: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop&q=80',
    isActive: true,
    createdAt: '2026-01-01'
  },
  {
    userId: 3,
    roleId: 1,
    fullName: 'Đặng Thái Sơn (Admin Cấp Cao)',
    citizenId: '001085003333',
    phoneNumber: '0903333333',
    address: 'Số 18 Nguyễn Trãi, Thanh Xuân, Hà Nội',
    citizenIdFrontImg: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop&q=80',
    citizenIdBackImg: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop&q=80',
    isActive: true,
    createdAt: '2026-01-01'
  },

  // Quản lý tòa nhà (Cấp 2)
  {
    userId: 4,
    roleId: 2,
    fullName: 'Lê Văn Hoàng (Quản Lý Tòa Nhà)',
    citizenId: '001090004444',
    phoneNumber: '0914444444',
    address: 'Tổ 8, Phường Mai Dịch, Cầu Giấy, Hà Nội',
    citizenIdFrontImg: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=500&auto=format&fit=crop&q=80',
    citizenIdBackImg: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=500&auto=format&fit=crop&q=80',
    isActive: true,
    createdAt: '2026-01-15'
  },
  {
    userId: 5,
    roleId: 2,
    fullName: 'Vũ Thị Mai (Quản Lý Tòa Nhà)',
    citizenId: '001092005555',
    phoneNumber: '0915555555',
    address: 'Số 25 Phố Huế, Hoàn Kiếm, Hà Nội',
    citizenIdFrontImg: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=500&auto=format&fit=crop&q=80',
    citizenIdBackImg: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=500&auto=format&fit=crop&q=80',
    isActive: true,
    createdAt: '2026-02-01'
  },

  // Khách thuê (Cấp 3) - 1 người có thể thuê nhiều phòng đồng thời
  {
    userId: 6,
    roleId: 3,
    fullName: 'Nguyễn Văn An (Khách Thuê)',
    citizenId: '034098006666',
    phoneNumber: '0986666666',
    address: 'Thôn 3, Xã Đông Hưng, Huyện Đông Hưng, Tỉnh Thái Bình',
    citizenIdFrontImg: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80',
    citizenIdBackImg: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80',
    isActive: true,
    createdAt: '2026-08-20'
  },
  {
    userId: 7,
    roleId: 3,
    fullName: 'Trần Thu Trang',
    citizenId: '036099007777',
    phoneNumber: '0987777777',
    address: 'Xã Hải Hậu, Huyện Hải Hậu, Tỉnh Nam Định',
    citizenIdFrontImg: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&auto=format&fit=crop&q=80',
    citizenIdBackImg: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&auto=format&fit=crop&q=80',
    isActive: true,
    createdAt: '2026-08-25'
  },
  {
    userId: 8,
    roleId: 3,
    fullName: 'Phạm Đức Minh (Đã Trả Phòng)',
    citizenId: '031097008888',
    phoneNumber: '0988888888',
    address: 'Số 12 Lạch Tray, Phường Đằng Giang, Ngô Quyền, Hải Phòng',
    citizenIdFrontImg: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=80',
    citizenIdBackImg: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=80',
    isActive: true,
    createdAt: '2026-01-10'
  }
];

export const INITIAL_OBJECT_TYPES: ObjectType[] = [
  { typeId: 1, typeCode: 'BUILDING', typeName: 'Tòa Nhà Trọ', categoryGroup: 'PROPERTY', hasSubItems: true },
  { typeId: 2, typeCode: 'FLOOR', typeName: 'Tầng Nhà', categoryGroup: 'PROPERTY', hasSubItems: true },
  { typeId: 3, typeCode: 'ROOM', typeName: 'Phòng Cho Thuê', categoryGroup: 'ROOM', metricUnit: 'Tháng', hasSubItems: true },
  { typeId: 4, typeCode: 'WASHING_MACHINE', typeName: 'Máy Giặt Chung', categoryGroup: 'DEVICE', metricUnit: 'Lần', hasSubItems: false },
  { typeId: 5, typeCode: 'EV_CHARGER', typeName: 'Trạm Sạc Xe Điện', categoryGroup: 'DEVICE', metricUnit: 'kWh', hasSubItems: false },
  { typeId: 6, typeCode: 'PUBLIC_PHONE', typeName: 'Điện Thoại Sảnh', categoryGroup: 'PUBLIC_SERVICE', metricUnit: 'Phút', hasSubItems: false },
  { typeId: 7, typeCode: 'PUBLIC_WIFI', typeName: 'WiFi Công Cộng Tốc Độ Cao', categoryGroup: 'PUBLIC_SERVICE', metricUnit: 'Tháng', hasSubItems: false },
  { typeId: 8, typeCode: 'SECURITY_GATE', typeName: 'Cổng Cửa An Ninh Vân Tay/Thẻ', categoryGroup: 'DEVICE', hasSubItems: false },
  { typeId: 9, typeCode: 'POWER_METER', typeName: 'Công Tơ Điện Thông Minh', categoryGroup: 'DEVICE', metricUnit: 'kWh', hasSubItems: false },
  { typeId: 10, typeCode: 'WATER_METER', typeName: 'Đồng Hồ Đo Nước Lạnh', categoryGroup: 'DEVICE', metricUnit: 'Khối', hasSubItems: false },
  { typeId: 11, typeCode: 'AIR_COND', typeName: 'Điều Hòa Không Khí Inverter', categoryGroup: 'DEVICE', metricUnit: 'Tháng', hasSubItems: false },
  { typeId: 12, typeCode: 'FRIDGE', typeName: 'Tủ Lạnh Mini / Phòng', categoryGroup: 'DEVICE', metricUnit: 'Tháng', hasSubItems: false },
  { typeId: 13, typeCode: 'WATER_HEATER', typeName: 'Bình Nước Nóng Ariston', categoryGroup: 'DEVICE', metricUnit: 'Tháng', hasSubItems: false },
  { typeId: 14, typeCode: 'WIFI_ROUTER', typeName: 'Cục Phát WiFi Riêng (Phòng)', categoryGroup: 'DEVICE', metricUnit: 'Tháng', hasSubItems: false }
];

export const INITIAL_TREE_NODES: ManagementNode[] = [
  // --- TÒA NHÀ 01 (CẦU GIẤY) ---
  {
    nodeId: 1,
    parentNodeId: null,
    typeId: 1,
    nodeCode: 'HN-CG01',
    nodeName: 'Tòa Nhà 01 - Cầu Giấy (Nhà Hoa Mai)',
    addressOrLocation: 'Số 18 Ngõ 19 Dịch Vọng Hậu, Cầu Giấy, Hà Nội',
    managerUserId: 4, // Lê Văn Hoàng quản lý
    notes: 'Quản lý phụ trách: Lê Văn Hoàng (ID: 4)',
    electricRate: 3800, // Đơn giá 1 số điện: 3.800 đ/kWh
    waterRate: 30000,   // Đơn giá 1 khối nước: 30.000 đ/m³
    sanitationFeePerPerson: 30000, // Phí vệ sinh: 30.000 đ/người/tháng
    residenceFeePerPerson: 100000, // Phí tạm trú tạm vắng: 100.000 đ/người/năm
    currentCondition: 0,
    isActive: true,
    createdAt: '2026-01-01'
  },
  // Tiện ích chung Tầng 1 (Tòa 01)
  {
    nodeId: 2,
    parentNodeId: 1,
    typeId: 2,
    nodeCode: 'TI-CG01',
    nodeName: 'Khu Tiện Ích Dùng Chung (Sảnh & Để Xe Tầng 1)',
    addressOrLocation: 'Tầng 1 sảnh',
    currentCondition: 0,
    isActive: true,
    createdAt: '2026-01-01'
  },
  {
    nodeId: 3,
    parentNodeId: 2,
    typeId: 4,
    nodeCode: 'WASH-01',
    nodeName: 'Máy Giặt Chung Electrolux 11kg Inverter (Sảnh T1)',
    unitPrice: 15000,
    serialNumber: 'ELX-2026-8889',
    warrantyExpiryDate: '2027-12-31',
    currentCondition: 3, // Báo hư hỏng: kêu to khi vắt
    isActive: true,
    isShared: true,
    buildingNodeId: 1,
    deviceCategory: 'WASHING_MACHINE',
    addressOrLocation: 'Tầng 1 Sảnh dùng chung',
    createdAt: '2026-01-05'
  },
  {
    nodeId: 4,
    parentNodeId: 2,
    typeId: 5,
    nodeCode: 'EV-01',
    nodeName: 'Trạm Sạc Xe Điện Thông Minh 3.5kW',
    unitPrice: 4000,
    serialNumber: 'EV-AUTO-4421',
    warrantyExpiryDate: '2028-06-30',
    currentCondition: 2, // Khó sử dụng: chập chờn khi quét thẻ NFC
    isActive: true,
    isShared: true,
    buildingNodeId: 1,
    deviceCategory: 'EV_CHARGER',
    addressOrLocation: 'Hầm để xe dùng chung Tầng 1',
    createdAt: '2026-01-10'
  },
  {
    nodeId: 5,
    parentNodeId: 2,
    typeId: 6,
    nodeCode: 'TEL-01',
    nodeName: 'Điện Thoại Công Cộng / Liên Lạc Sảnh',
    unitPrice: 1000,
    currentCondition: 0,
    isActive: true,
    isShared: true,
    buildingNodeId: 1,
    deviceCategory: 'PUBLIC_PHONE',
    addressOrLocation: 'Bàn lễ tân sảnh Tầng 1',
    createdAt: '2026-01-10'
  },
  {
    nodeId: 6,
    parentNodeId: 2,
    typeId: 8,
    nodeCode: 'GATE-01',
    nodeName: 'Cổng An Ninh Tự Động Rơ-le WiFi & Vân Tay',
    hardwareMacOrTopic: 'relay/gate/cg01/open',
    currentCondition: 0,
    isActive: true,
    isShared: true,
    buildingNodeId: 1,
    deviceCategory: 'SECURITY_GATE',
    addressOrLocation: 'Cổng chính ra vào Tòa 01',
    createdAt: '2026-01-01'
  },

  // Tầng 2 (Tòa 01)
  {
    nodeId: 7,
    parentNodeId: 1,
    typeId: 2,
    nodeCode: 'F2-CG01',
    nodeName: 'Tầng 2 (Khu Căn Hộ Studio)',
    currentCondition: 0,
    isActive: true,
    createdAt: '2026-01-01'
  },
  // Phòng 201
  {
    nodeId: 8,
    parentNodeId: 7,
    typeId: 3,
    nodeCode: 'P201-CG',
    nodeName: 'Phòng 201 (VIP Studio Có Ban Công)',
    unitPrice: 4500000,
    depositAmount: 4500000,
    addressOrLocation: 'Phòng 201 - Tòa 01',
    currentCondition: 0,
    isActive: true,
    createdAt: '2026-01-01'
  },
  {
    nodeId: 9,
    parentNodeId: 8,
    typeId: 9,
    nodeCode: 'MTR-E201',
    nodeName: 'Công Tơ Điện WiFi P.201',
    unitPrice: 3800,
    currentCondition: 0,
    isActive: true,
    isShared: false,
    buildingNodeId: 1,
    roomNodeId: 8,
    deviceCategory: 'POWER_METER',
    addressOrLocation: 'Tủ điện Phòng 201',
    createdAt: '2026-01-01'
  },
  {
    nodeId: 10,
    parentNodeId: 8,
    typeId: 10,
    nodeCode: 'MTR-W201',
    nodeName: 'Đồng Hồ Đo Nước Lạnh P.201',
    unitPrice: 30000,
    currentCondition: 0,
    isActive: true,
    isShared: false,
    buildingNodeId: 1,
    roomNodeId: 8,
    deviceCategory: 'WATER_METER',
    addressOrLocation: 'Hộp kỹ thuật Phòng 201',
    createdAt: '2026-01-01'
  },
  {
    nodeId: 11,
    parentNodeId: 8,
    typeId: 11,
    nodeCode: 'AC-201',
    nodeName: 'Điều Hòa Daikin 12000BTU Inverter',
    serialNumber: 'DK-2025-9912',
    warrantyExpiryDate: '2027-05-15',
    currentCondition: 0,
    isActive: true,
    isShared: false,
    buildingNodeId: 1,
    roomNodeId: 8,
    deviceCategory: 'AIR_COND',
    addressOrLocation: 'Tường chính Phòng 201',
    monthlyRentalPrice: 120000,
    monthlyPriceSchedule: {
      '09/2026': 120000,
      '10/2026': 120000,
      '11/2026': 80000,
      '12/2026': 80000
    },
    createdAt: '2026-01-01'
  },
  {
    nodeId: 12,
    parentNodeId: 8,
    typeId: 12,
    nodeCode: 'FRG-201',
    nodeName: 'Tủ Lạnh Mini Funiki 90L',
    serialNumber: 'FNK-90L-3341',
    warrantyExpiryDate: '2026-11-20',
    currentCondition: 1, // Hay bẩn / đóng tuyết ngăn đá
    isActive: true,
    isShared: false,
    buildingNodeId: 1,
    roomNodeId: 8,
    deviceCategory: 'FRIDGE',
    addressOrLocation: 'Góc bếp Phòng 201',
    monthlyRentalPrice: 100000,
    monthlyPriceSchedule: {
      '09/2026': 100000,
      '10/2026': 100000,
      '11/2026': 100000,
      '12/2026': 100000
    },
    createdAt: '2026-01-01'
  },
  {
    nodeId: 13,
    parentNodeId: 8,
    typeId: 13,
    nodeCode: 'WHT-201',
    nodeName: 'Bình Nước Nóng Ariston 20L',
    serialNumber: 'ARS-20L-1102',
    warrantyExpiryDate: '2028-09-01',
    currentCondition: 0,
    isActive: true,
    isShared: false,
    buildingNodeId: 1,
    roomNodeId: 8,
    deviceCategory: 'WATER_HEATER',
    addressOrLocation: 'Phòng tắm P.201',
    monthlyRentalPrice: 0, // Miễn phí đi kèm
    createdAt: '2026-01-01'
  },
  // Cục phát WiFi riêng trong phòng 201 (Ví dụ thực tế: Khách thuê thêm cục phát WiFi với giá 70.000đ/tháng, năm sau điều chỉnh lên 82.000đ/tháng)
  {
    nodeId: 307,
    parentNodeId: 8,
    typeId: 14,
    nodeCode: 'WIFI-201',
    nodeName: 'Cục Phát WiFi 6 Gigabit Ruijie Reyee P.201',
    serialNumber: 'RJ-WIFI6-2026',
    warrantyExpiryDate: '2028-01-15',
    currentCondition: 0,
    isActive: true,
    isShared: false,
    buildingNodeId: 1,
    roomNodeId: 8,
    deviceCategory: 'WIFI_ROUTER',
    addressOrLocation: 'Tường phòng khách P.201',
    monthlyRentalPrice: 82000, // Giá thuê mới nhất theo danh mục bảng giá (82.000đ/tháng)
    // Danh mục bảng giá theo thời gian của thiết bị
    priceCatalog: [
      {
        catalogId: 1,
        effectiveFromMonthYear: '08/2026',
        monthlyRentalPrice: 70000,
        note: 'Giá thuê ban đầu: Khách phòng 201 đăng ký lắp thêm Cục phát WiFi riêng giá 70.000đ/tháng',
        createdAt: '2026-08-01',
        createdByName: 'Lê Văn Hoàng (Quản lý)'
      },
      {
        catalogId: 2,
        effectiveFromMonthYear: '11/2026',
        monthlyRentalPrice: 82000,
        note: 'Điều chỉnh nâng giá thuê lên 82.000đ/tháng do nâng cấp băng thông cáp quang Gigabit và áp dụng cho các hóa đơn từ Tháng 11',
        createdAt: '2026-11-01',
        createdByName: 'Lê Văn Hoàng (Quản lý)'
      }
    ],
    monthlyPriceSchedule: {
      '08/2026': 70000,
      '09/2026': 70000,
      '10/2026': 70000,
      '11/2026': 82000, // Đến tháng 11 lấy giá mới nhất là 82.000đ
      '12/2026': 82000,
      '01/2027': 82000,
      '02/2027': 82000
    },
    priceHistory: [
      {
        recordId: 1,
        effectiveMonthYear: '08/2026',
        oldPrice: 0,
        newPrice: 70000,
        changedAt: '2026-08-01',
        changedByName: 'Lê Văn Hoàng (Quản lý)',
        reason: 'Khách thuê Phòng 201 đăng ký thuê thêm Cục phát WiFi riêng giá 70.000đ/tháng'
      },
      {
        recordId: 2,
        effectiveMonthYear: '11/2026',
        oldPrice: 70000,
        newPrice: 82000,
        changedAt: '2026-11-01',
        changedByName: 'Lê Văn Hoàng (Quản lý)',
        reason: 'Nâng cấp gói cước WiFi cáp quang 1Gbps, điều chỉnh giá thuê lên 82.000đ/tháng'
      }
    ],
    notes: 'Khách thuê thêm cục phát WiFi riêng 70.000đ/tháng, điều chỉnh tháng 11 lên 82.000đ/tháng',
    createdAt: '2026-01-01'
  },
  // Máy giặt riêng trong phòng 201 (Thỏa mãn: Người dùng có thể sử dụng máy giặt của phòng đang thuê, hoặc máy giặt của tòa nhà)
  {
    nodeId: 301,
    parentNodeId: 8,
    typeId: 4,
    nodeCode: 'WASH-P201',
    nodeName: 'Máy Giặt Riêng Phòng 201 Electrolux 8kg',
    unitPrice: 0, // Dùng miễn phí theo tiền thuê phòng
    monthlyRentalPrice: 0,
    serialNumber: 'ELX-P201-8833',
    warrantyExpiryDate: '2027-10-15',
    currentCondition: 0,
    isActive: true,
    isShared: false,
    buildingNodeId: 1,
    roomNodeId: 8,
    deviceCategory: 'WASHING_MACHINE',
    addressOrLocation: 'Ban công giặt phơi Phòng 201',
    notes: 'Máy giặt riêng của phòng 201, khách sử dụng độc quyền',
    createdAt: '2026-01-01'
  },

  // Phòng 202
  {
    nodeId: 14,
    parentNodeId: 7,
    typeId: 3,
    nodeCode: 'P202-CG',
    nodeName: 'Phòng 202 (Studio Cơ Bản Khép Kín)',
    unitPrice: 3800000,
    depositAmount: 3800000,
    currentCondition: 0,
    isActive: true,
    createdAt: '2026-01-01'
  },
  {
    nodeId: 15,
    parentNodeId: 14,
    typeId: 9,
    nodeCode: 'MTR-E202',
    nodeName: 'Công Tơ Điện WiFi P.202',
    unitPrice: 3800,
    currentCondition: 0,
    isActive: true,
    isShared: false,
    buildingNodeId: 1,
    roomNodeId: 14,
    deviceCategory: 'POWER_METER',
    addressOrLocation: 'Tủ điện Phòng 202',
    createdAt: '2026-01-01'
  },
  {
    nodeId: 16,
    parentNodeId: 14,
    typeId: 10,
    nodeCode: 'MTR-W202',
    nodeName: 'Đồng Hồ Nước P.202',
    unitPrice: 30000,
    currentCondition: 0,
    isActive: true,
    isShared: false,
    buildingNodeId: 1,
    roomNodeId: 14,
    deviceCategory: 'WATER_METER',
    addressOrLocation: 'Hộp kỹ thuật Phòng 202',
    createdAt: '2026-01-01'
  },
  {
    nodeId: 17,
    parentNodeId: 14,
    typeId: 11,
    nodeCode: 'AC-202',
    nodeName: 'Điều Hòa Casper 9000BTU Eco',
    serialNumber: 'CSP-9K-8812',
    warrantyExpiryDate: '2027-03-10',
    currentCondition: 0,
    isActive: true,
    isShared: false,
    buildingNodeId: 1,
    roomNodeId: 14,
    deviceCategory: 'AIR_COND',
    addressOrLocation: 'Tường chính Phòng 202',
    createdAt: '2026-01-01'
  },
  {
    nodeId: 302,
    parentNodeId: 14,
    typeId: 12,
    nodeCode: 'FRG-202',
    nodeName: 'Tủ Lạnh Aqua 90L Inverter',
    serialNumber: 'AQUA-90L-8821',
    warrantyExpiryDate: '2027-01-15',
    currentCondition: 0,
    isActive: true,
    isShared: false,
    buildingNodeId: 1,
    roomNodeId: 14,
    deviceCategory: 'FRIDGE',
    addressOrLocation: 'Bếp Phòng 202',
    createdAt: '2026-01-01'
  },
  {
    nodeId: 303,
    parentNodeId: 14,
    typeId: 13,
    nodeCode: 'WHT-202',
    nodeName: 'Bình Nước Nóng Rossi 15L',
    serialNumber: 'ROSSI-15L-7711',
    warrantyExpiryDate: '2028-04-10',
    currentCondition: 0,
    isActive: true,
    isShared: false,
    buildingNodeId: 1,
    roomNodeId: 14,
    deviceCategory: 'WATER_HEATER',
    addressOrLocation: 'Phòng tắm P.202',
    createdAt: '2026-01-01'
  },

  // Phòng 203 (Phòng trống 100% - Sẵn sàng cho giữ phòng / đặt trước)
  {
    nodeId: 27,
    parentNodeId: 7,
    typeId: 3,
    nodeCode: 'P203-CG',
    nodeName: 'Phòng 203 (VIP Ban Công Thoáng Mát)',
    unitPrice: 4600000,
    depositAmount: 4600000,
    addressOrLocation: 'Tầng 2 - Tòa 01 Cầu Giấy',
    currentCondition: 0,
    isActive: true,
    createdAt: '2026-01-01'
  },
  {
    nodeId: 310,
    parentNodeId: 27,
    typeId: 9,
    nodeCode: 'MTR-E203',
    nodeName: 'Công Tơ Điện WiFi P.203',
    unitPrice: 3800,
    currentCondition: 0,
    isActive: true,
    isShared: false,
    buildingNodeId: 1,
    roomNodeId: 27,
    deviceCategory: 'POWER_METER',
    addressOrLocation: 'Tủ điện kỹ thuật Phòng 203',
    createdAt: '2026-01-01'
  },
  {
    nodeId: 311,
    parentNodeId: 27,
    typeId: 10,
    nodeCode: 'MTR-W203',
    nodeName: 'Đồng Hồ Đo Nước P.203',
    unitPrice: 30000,
    currentCondition: 0,
    isActive: true,
    isShared: false,
    buildingNodeId: 1,
    roomNodeId: 27,
    deviceCategory: 'WATER_METER',
    addressOrLocation: 'Hộp kỹ thuật nước Phòng 203',
    createdAt: '2026-01-01'
  },
  {
    nodeId: 312,
    parentNodeId: 27,
    typeId: 11,
    nodeCode: 'AC-203',
    nodeName: 'Điều Hòa Daikin 12000BTU Inverter P.203',
    serialNumber: 'DK-2025-7731',
    warrantyExpiryDate: '2027-08-30',
    currentCondition: 0,
    isActive: true,
    isShared: false,
    buildingNodeId: 1,
    roomNodeId: 27,
    deviceCategory: 'AIR_COND',
    addressOrLocation: 'Tường phòng ngủ VIP Phòng 203',
    createdAt: '2026-01-01'
  },
  {
    nodeId: 313,
    parentNodeId: 27,
    typeId: 12,
    nodeCode: 'FRG-203',
    nodeName: 'Tủ Lạnh Casper 120L 2 Cánh Tiết Kiệm Điện',
    serialNumber: 'CSP-120L-4412',
    warrantyExpiryDate: '2027-04-18',
    currentCondition: 0,
    isActive: true,
    isShared: false,
    buildingNodeId: 1,
    roomNodeId: 27,
    deviceCategory: 'FRIDGE',
    addressOrLocation: 'Khu vực bếp nấu Phòng 203',
    createdAt: '2026-01-01'
  },
  {
    nodeId: 314,
    parentNodeId: 27,
    typeId: 13,
    nodeCode: 'WHT-203',
    nodeName: 'Bình Nước Nóng Ariston 20L Chống Giật ELCB',
    serialNumber: 'ARS-20L-6689',
    warrantyExpiryDate: '2028-11-20',
    currentCondition: 0,
    isActive: true,
    isShared: false,
    buildingNodeId: 1,
    roomNodeId: 27,
    deviceCategory: 'WATER_HEATER',
    addressOrLocation: 'Phòng tắm khép kín P.203',
    createdAt: '2026-01-01'
  },
  {
    nodeId: 315,
    parentNodeId: 27,
    typeId: 4,
    nodeCode: 'WASH-P203',
    nodeName: 'Máy Giặt Riêng LG Inverter 8.5kg Ban Công',
    unitPrice: 0,
    serialNumber: 'LG-85KG-3321',
    warrantyExpiryDate: '2027-12-05',
    currentCondition: 0,
    isActive: true,
    isShared: false,
    buildingNodeId: 1,
    roomNodeId: 27,
    deviceCategory: 'WASHING_MACHINE',
    addressOrLocation: 'Ban công giặt phơi đón nắng P.203',
    notes: 'Máy giặt riêng của phòng 203, khách thuê độc quyền sử dụng',
    createdAt: '2026-01-01'
  },

  // Phòng 102 (Hợp đồng cũ sắp hết hạn trong 18 ngày - Cho phép giữ phòng / đặt trước)
  {
    nodeId: 28,
    parentNodeId: 1,
    typeId: 3,
    nodeCode: 'P102-CG',
    nodeName: 'Phòng 102 (Studio Tầng 1 Tiện Lợi)',
    unitPrice: 4000000,
    depositAmount: 4000000,
    addressOrLocation: 'Tầng 1 - Tòa 01 Cầu Giấy',
    currentCondition: 0,
    isActive: true,
    createdAt: '2026-01-01'
  },
  {
    nodeId: 316,
    parentNodeId: 28,
    typeId: 9,
    nodeCode: 'MTR-E102',
    nodeName: 'Công Tơ Điện WiFi P.102',
    unitPrice: 3800,
    currentCondition: 0,
    isActive: true,
    isShared: false,
    buildingNodeId: 1,
    roomNodeId: 28,
    deviceCategory: 'POWER_METER',
    addressOrLocation: 'Tủ điện Phòng 102',
    createdAt: '2026-01-01'
  },
  {
    nodeId: 317,
    parentNodeId: 28,
    typeId: 10,
    nodeCode: 'MTR-W102',
    nodeName: 'Đồng Hồ Đo Nước P.102',
    unitPrice: 30000,
    currentCondition: 0,
    isActive: true,
    isShared: false,
    buildingNodeId: 1,
    roomNodeId: 28,
    deviceCategory: 'WATER_METER',
    addressOrLocation: 'Hộp kỹ thuật Phòng 102',
    createdAt: '2026-01-01'
  },
  {
    nodeId: 318,
    parentNodeId: 28,
    typeId: 11,
    nodeCode: 'AC-102',
    nodeName: 'Điều Hòa Casper 9000BTU Eco Inverter',
    serialNumber: 'CSP-9K-4421',
    warrantyExpiryDate: '2027-02-15',
    currentCondition: 0,
    isActive: true,
    isShared: false,
    buildingNodeId: 1,
    roomNodeId: 28,
    deviceCategory: 'AIR_COND',
    addressOrLocation: 'Tường phòng ngủ Phòng 102',
    createdAt: '2026-01-01'
  },
  {
    nodeId: 319,
    parentNodeId: 28,
    typeId: 12,
    nodeCode: 'FRG-102',
    nodeName: 'Tủ Lạnh Mini Funiki 90L Khử Mùi Nano',
    serialNumber: 'FNK-90L-9988',
    warrantyExpiryDate: '2026-12-10',
    currentCondition: 0,
    isActive: true,
    isShared: false,
    buildingNodeId: 1,
    roomNodeId: 28,
    deviceCategory: 'FRIDGE',
    addressOrLocation: 'Góc bếp tiện lợi Phòng 102',
    createdAt: '2026-01-01'
  },
  {
    nodeId: 320,
    parentNodeId: 28,
    typeId: 13,
    nodeCode: 'WHT-102',
    nodeName: 'Bình Nước Nóng Rossi 15L Siêu Bền',
    serialNumber: 'ROSSI-15L-3329',
    warrantyExpiryDate: '2028-06-25',
    currentCondition: 0,
    isActive: true,
    isShared: false,
    buildingNodeId: 1,
    roomNodeId: 28,
    deviceCategory: 'WATER_HEATER',
    addressOrLocation: 'Phòng tắm Phòng 102',
    createdAt: '2026-01-01'
  },

  // --- TÒA NHÀ 02 (ĐỐNG ĐA) ---
  {
    nodeId: 18,
    parentNodeId: null,
    typeId: 1,
    nodeCode: 'HN-DD02',
    nodeName: 'Tòa Nhà 02 - Đống Đa (Nhà Sen Vàng)',
    addressOrLocation: 'Số 45 Ngõ 102 Thái Thịnh, Đống Đa, Hà Nội',
    managerUserId: 5, // Vũ Thị Mai quản lý
    notes: 'Quản lý phụ trách: Vũ Thị Mai (ID: 5)',
    electricRate: 4000, // Đơn giá 1 số điện: 4.000 đ/kWh
    waterRate: 32000,   // Đơn giá 1 khối nước: 32.000 đ/m³
    sanitationFeePerPerson: 35000, // Phí vệ sinh: 35.000 đ/người/tháng
    residenceFeePerPerson: 100000, // Phí tạm trú tạm vắng: 100.000 đ/người/năm
    currentCondition: 0,
    isActive: true,
    createdAt: '2026-02-01'
  },
  {
    nodeId: 19,
    parentNodeId: 18,
    typeId: 2,
    nodeCode: 'TI-DD02',
    nodeName: 'Khu Tiện Ích Chung Đống Đa',
    addressOrLocation: 'Sân thượng Tầng 6',
    currentCondition: 0,
    isActive: true,
    createdAt: '2026-02-01'
  },
  {
    nodeId: 20,
    parentNodeId: 19,
    typeId: 4,
    nodeCode: 'WASH-DD02',
    nodeName: 'Máy Giặt Sấy Chung Toshiba 10.5kg (Sân Thượng T6)',
    unitPrice: 20000,
    serialNumber: 'TSB-10KG-7721',
    warrantyExpiryDate: '2027-08-20',
    currentCondition: 0,
    isActive: true,
    isShared: true,
    buildingNodeId: 18,
    deviceCategory: 'WASHING_MACHINE',
    addressOrLocation: 'Sân thượng Tầng 6 dùng chung',
    createdAt: '2026-02-05'
  },
  {
    nodeId: 21,
    parentNodeId: 18,
    typeId: 2,
    nodeCode: 'F3-DD02',
    nodeName: 'Tầng 3 Tòa Đống Đa',
    currentCondition: 0,
    isActive: true,
    createdAt: '2026-02-01'
  },
  {
    nodeId: 22,
    parentNodeId: 21,
    typeId: 3,
    nodeCode: 'P304-DD',
    nodeName: 'Phòng 304 (Deluxe Ban Công Thoáng Mát)',
    unitPrice: 5200000,
    depositAmount: 5200000,
    currentCondition: 0,
    isActive: true,
    createdAt: '2026-02-01'
  },
  {
    nodeId: 23,
    parentNodeId: 22,
    typeId: 9,
    nodeCode: 'MTR-E304',
    nodeName: 'Công Tơ Điện WiFi P.304',
    unitPrice: 3800,
    currentCondition: 0,
    isActive: true,
    isShared: false,
    buildingNodeId: 18,
    roomNodeId: 22,
    deviceCategory: 'POWER_METER',
    addressOrLocation: 'Tủ điện P.304',
    createdAt: '2026-02-01'
  },
  {
    nodeId: 24,
    parentNodeId: 22,
    typeId: 10,
    nodeCode: 'MTR-W304',
    nodeName: 'Đồng Hồ Đo Nước P.304',
    unitPrice: 30000,
    currentCondition: 0,
    isActive: true,
    isShared: false,
    buildingNodeId: 18,
    roomNodeId: 22,
    deviceCategory: 'WATER_METER',
    addressOrLocation: 'Hộp kỹ thuật P.304',
    createdAt: '2026-02-01'
  },
  {
    nodeId: 25,
    parentNodeId: 22,
    typeId: 11,
    nodeCode: 'AC-304',
    nodeName: 'Điều Hòa Panasonic 12000BTU Inverter',
    serialNumber: 'PNS-12K-6650',
    warrantyExpiryDate: '2027-11-15',
    currentCondition: 0,
    isActive: true,
    isShared: false,
    buildingNodeId: 18,
    roomNodeId: 22,
    deviceCategory: 'AIR_COND',
    addressOrLocation: 'Tường phòng khách P.304',
    createdAt: '2026-02-01'
  },
  {
    nodeId: 305,
    parentNodeId: 22,
    typeId: 12,
    nodeCode: 'FRG-304',
    nodeName: 'Tủ Lạnh Sharp 165L 2 Cánh P.304',
    serialNumber: 'SHARP-165L-9921',
    warrantyExpiryDate: '2027-09-30',
    currentCondition: 0,
    isActive: true,
    isShared: false,
    buildingNodeId: 18,
    roomNodeId: 22,
    deviceCategory: 'FRIDGE',
    addressOrLocation: 'Khu bếp P.304',
    createdAt: '2026-02-01'
  },
  {
    nodeId: 306,
    parentNodeId: 22,
    typeId: 13,
    nodeCode: 'WHT-304',
    nodeName: 'Bình Nước Nóng Ariston 30L P.304',
    serialNumber: 'ARS-30L-5522',
    warrantyExpiryDate: '2028-12-01',
    currentCondition: 0,
    isActive: true,
    isShared: false,
    buildingNodeId: 18,
    roomNodeId: 22,
    deviceCategory: 'WATER_HEATER',
    addressOrLocation: 'Phòng tắm P.304',
    createdAt: '2026-02-01'
  }
];

// Hợp đồng thuê phòng (Chứng minh 1 người thuê nhiều phòng + ngày HĐ vs ngày thực tế)
export const INITIAL_CONTRACTS: RentalContract[] = [
  // Khách Nguyễn Văn An thuê Phòng 201 (Cầu Giấy): Ký từ 01/09/2026, nhưng đến nhận phòng sớm ngày 28/08/2026!
  {
    contractId: 1,
    roomNodeId: 8,
    roomName: 'Phòng 201 - Tòa 01 Cầu Giấy',
    buildingName: 'Tòa Nhà 01 - Cầu Giấy',
    buildingNodeId: 1,
    primaryTenantUserId: 6,
    primaryTenantName: 'Nguyễn Văn An',
    startDateContract: '2026-09-01',
    endDateContract: '2027-02-28',
    actualCheckInDate: '2026-08-28', // Đến sớm 3 ngày
    actualCheckOutDate: null,
    monthlyRent: 4500000,
    depositAmount: 4500000,
    status: 'ACTIVE',
    notes: 'Đến nhận phòng trước 3 ngày để dọn đồ, tính phụ phí hỗ trợ.'
  },
  // Khách Nguyễn Văn An cũng thuê thêm Phòng 304 (Đống Đa) làm văn phòng / kho nhỏ: Ký từ 15/09/2026, đến đúng ngày 15/09/2026!
  {
    contractId: 2,
    roomNodeId: 22,
    roomName: 'Phòng 304 - Tòa 02 Đống Đa',
    buildingName: 'Tòa Nhà 02 - Đống Đa',
    buildingNodeId: 18,
    primaryTenantUserId: 6,
    primaryTenantName: 'Nguyễn Văn An',
    startDateContract: '2026-09-15',
    endDateContract: '2027-03-14',
    actualCheckInDate: '2026-09-15',
    actualCheckOutDate: null,
    monthlyRent: 5200000,
    depositAmount: 5200000,
    status: 'ACTIVE',
    notes: 'Khách thuê phòng thứ 2 để làm việc online và chứa hàng mẫu.'
  },
  // Trần Thu Trang thuê Phòng 202
  {
    contractId: 3,
    roomNodeId: 14,
    roomName: 'Phòng 202 - Tòa 01 Cầu Giấy',
    buildingName: 'Tòa Nhà 01 - Cầu Giấy',
    buildingNodeId: 1,
    primaryTenantUserId: 7,
    primaryTenantName: 'Trần Thu Trang',
    startDateContract: '2026-09-01',
    endDateContract: '2027-02-28',
    actualCheckInDate: '2026-09-02', // Đến trễ 1 ngày do bận việc ở quê Nam Định
    actualCheckOutDate: null,
    monthlyRent: 3800000,
    depositAmount: 3800000,
    status: 'ACTIVE'
  },
  // Phạm Đức Minh (Đã trả phòng và thanh toán xong để test tính năng Đánh giá bị Khóa!)
  {
    contractId: 4,
    roomNodeId: 8,
    roomName: 'Phòng 101 - Tòa 01 Cầu Giấy',
    buildingName: 'Tòa Nhà 01 - Cầu Giấy',
    buildingNodeId: 1,
    primaryTenantUserId: 8,
    primaryTenantName: 'Phạm Đức Minh',
    startDateContract: '2026-01-01',
    endDateContract: '2026-08-31',
    actualCheckInDate: '2026-01-01',
    actualCheckOutDate: '2026-08-25', // Trả phòng sớm 6 ngày
    monthlyRent: 4200000,
    depositAmount: 4200000,
    status: 'CHECKED_OUT',
    notes: 'Đã hoàn tất thanh toán & hoàn tiền cọc ngày 26/08/2026.'
  },
  // Hợp đồng sắp hết hạn trong vòng 18 ngày (Ngày kết thúc: 15/10/2026) -> Mở cho người dùng ĐẶT TRƯỚC / GIỮ PHÒNG!
  {
    contractId: 5,
    roomNodeId: 28,
    roomName: 'Phòng 102 - Tòa 01 Cầu Giấy',
    buildingName: 'Tòa Nhà 01 - Cầu Giấy',
    buildingNodeId: 1,
    primaryTenantUserId: 8,
    primaryTenantName: 'Khách sắp trả phòng',
    startDateContract: '2026-04-15',
    endDateContract: '2026-10-15', // Hết hạn ngày 15/10/2026 (còn 18 ngày, nằm trong 30 ngày)
    actualCheckInDate: '2026-04-15',
    actualCheckOutDate: null,
    monthlyRent: 4000000,
    depositAmount: 4000000,
    status: 'ACTIVE',
    notes: 'Khách đã thông báo sẽ không gia hạn hợp đồng sau ngày 15/10/2026. Mở đặt trước cho khách mới.'
  }
];

// Danh sách người cùng ở trong 1 phòng (1 phòng nhiều người)
export const INITIAL_ROOMMATES: Roommate[] = [
  {
    roommateId: 1,
    contractId: 1,
    fullName: 'Hoàng Quốc Bảo',
    citizenId: '034098008888',
    phoneNumber: '0988889999',
    address: 'Tổ 2, Phường Tân Hà, TP. Tuyên Quang, Tỉnh Tuyên Quang',
    hasGateAccess: true,
    relationship: 'Bạn cùng phòng thời đại học'
  },
  {
    roommateId: 2,
    contractId: 1,
    fullName: 'Lê Minh Tuấn',
    citizenId: '034099009999',
    phoneNumber: '0977771122',
    address: 'Xã Đông Phương, Huyện Đông Hưng, Tỉnh Thái Bình',
    hasGateAccess: true,
    relationship: 'Em họ'
  }
];

// Hóa đơn hàng tháng
export const INITIAL_INVOICES: MonthlyInvoice[] = [
  // 1. Hóa đơn Tháng 09/2026 Phòng 201 - ĐÃ DUYỆT & CHỐT SỔ (WiFi: 70.000đ/tháng)
  {
    invoiceId: 1,
    contractId: 1,
    roomNodeId: 8,
    roomName: 'Phòng 201 - Tòa 01 Cầu Giấy',
    monthYear: '09/2026',
    month: 9,
    year: 2026,
    prevElectric: 1120,
    currElectric: 1265, // 145 kWh * 3800 = 551.000đ
    electricRate: 3800,
    prevWater: 42,
    currWater: 50, // 8 m³ * 30000 = 240.000đ
    waterRate: 30000,
    roomRent: 4500000,
    roomDeviceRentalCost: 290000, // Cục phát WiFi 70k + Điều hòa 120k + Tủ lạnh 100k (Lưu cố định của tháng 9)
    sharedDeviceCost: 75000, // 3 lần giặt (45k) + 1 lần sạc xe (30k) theo lượt dùng
    occupantCount: 3, // 3 người ở (Nguyễn Văn An + 2 bạn cùng phòng)
    sanitationFeePerPerson: 30000, // 30.000 đ/người/tháng
    sanitationFee: 90000, // 3 * 30.000đ = 90.000đ
    residenceFeePerPerson: 100000,
    isResidenceFeeApplied: false, // Bắt đầu ở từ 08/2026, tháng 09/2026 là tháng thứ 2 (đang trong chu kỳ 12 tháng)
    residenceFee: 0,
    residenceFeeNote: 'Đang trong chu kỳ 12 tháng của Năm 1 (Đã thu tại kỳ 08/2026)',
    internetAndTrash: 60000,
    totalAmount: 5806000,
    status: 'PAID',
    paymentDate: '2026-10-02',
    isApproved: true,
    approvalStatus: 'APPROVED',
    isLocked: true, // Chốt sổ: Không tính lại khi đổi giá sau này
    approvedByName: 'Lê Văn Hoàng (Quản Lý)',
    approvedAt: '2026-09-30 17:30',
    deviceBreakdown: [
      { deviceNodeId: 307, deviceCode: 'WIFI-201', deviceName: 'Cục Phát WiFi 6 Gigabit Ruijie Reyee P.201', monthlyPrice: 70000, category: 'WIFI_ROUTER', snapshotAppliedAt: '2026-09-30' },
      { deviceNodeId: 11, deviceCode: 'AC-201', deviceName: 'Điều Hòa Daikin 12000BTU Inverter', monthlyPrice: 120000, category: 'AIR_COND', snapshotAppliedAt: '2026-09-30' },
      { deviceNodeId: 12, deviceCode: 'FRG-201', deviceName: 'Tủ Lạnh Mini Funiki 90L', monthlyPrice: 100000, category: 'FRIDGE', snapshotAppliedAt: '2026-09-30' }
    ]
  },
  // 2. Hóa đơn Tháng 09/2026 Phòng 304 - ĐÃ DUYỆT & CHỐT SỔ
  {
    invoiceId: 2,
    contractId: 2,
    roomNodeId: 22,
    roomName: 'Phòng 304 - Tòa 02 Đống Đa',
    monthYear: '09/2026',
    month: 9,
    year: 2026,
    prevElectric: 450,
    currElectric: 510, // 60 kWh * 3800 = 228.000đ
    electricRate: 3800,
    prevWater: 18,
    currWater: 21, // 3 m³ * 30000 = 90.000đ
    waterRate: 30000,
    roomRent: 5200000,
    roomDeviceRentalCost: 410000, // WiFi Asus 150k + Điều hòa 150k + Tủ lạnh 110k
    sharedDeviceCost: 40000, // 2 lần giặt sấy theo lượt dùng
    occupantCount: 1, // 1 người ở
    sanitationFeePerPerson: 35000, // 35.000 đ/người/tháng
    sanitationFee: 35000, // 1 * 35.000đ
    residenceFeePerPerson: 100000,
    isResidenceFeeApplied: true, // Tháng đầu tiên bắt đầu ở (09/2026) -> Thu phí tạm trú Năm 1
    residenceFee: 100000, // 1 * 100.000đ
    residenceFeeNote: 'Tháng đầu tiên bắt đầu ở (09/2026) • Thu phí tạm trú Năm thứ 1',
    internetAndTrash: 15000,
    totalAmount: 6118000,
    status: 'PAID',
    paymentDate: '2026-10-03',
    isApproved: true,
    approvalStatus: 'APPROVED',
    isLocked: true,
    approvedByName: 'Lê Văn Hoàng (Quản Lý)',
    approvedAt: '2026-09-30 17:45',
    deviceBreakdown: [
      { deviceNodeId: 308, deviceCode: 'WIFI-304', deviceName: 'Cục Phát WiFi Mesh Asus ZenWiFi Gaming P.304', monthlyPrice: 150000, category: 'WIFI_ROUTER', snapshotAppliedAt: '2026-09-30' },
      { deviceNodeId: 25, deviceCode: 'AC-304', deviceName: 'Điều Hòa Panasonic 12000BTU Inverter', monthlyPrice: 150000, category: 'AIR_COND', snapshotAppliedAt: '2026-09-30' },
      { deviceNodeId: 305, deviceCode: 'FRG-304', deviceName: 'Tủ Lạnh Sharp 165L 2 Cánh P.304', monthlyPrice: 110000, category: 'FRIDGE', snapshotAppliedAt: '2026-09-30' }
    ]
  },
  // 3. Hóa đơn Tháng 10/2026 Phòng 201 - ĐÃ DUYỆT & CHỐT SỔ (WiFi vẫn 70.000đ, điều hòa giảm sang mùa thu 100k)
  {
    invoiceId: 3,
    contractId: 1,
    roomNodeId: 8,
    roomName: 'Phòng 201 - Tòa 01 Cầu Giấy',
    monthYear: '10/2026',
    month: 10,
    year: 2026,
    prevElectric: 1265,
    currElectric: 1395, // 130 kWh * 3800 = 494.000đ
    electricRate: 3800,
    prevWater: 50,
    currWater: 57, // 7 m³ * 30000 = 210.000đ
    waterRate: 30000,
    roomRent: 4500000,
    roomDeviceRentalCost: 270000, // Cục phát WiFi 70k + Điều hòa 100k + Tủ lạnh 100k (Lưu cố định của tháng 10)
    sharedDeviceCost: 45000,
    occupantCount: 3,
    sanitationFeePerPerson: 30000,
    sanitationFee: 90000,
    residenceFeePerPerson: 100000,
    isResidenceFeeApplied: false,
    residenceFee: 0,
    residenceFeeNote: 'Đang trong chu kỳ 12 tháng của Năm 1 (Đã thu tại kỳ 08/2026)',
    internetAndTrash: 60000,
    totalAmount: 5669000,
    status: 'PAID',
    paymentDate: '2026-11-02',
    isApproved: true,
    approvalStatus: 'APPROVED',
    isLocked: true,
    approvedByName: 'Lê Văn Hoàng (Quản Lý)',
    approvedAt: '2026-10-31 16:00',
    deviceBreakdown: [
      { deviceNodeId: 307, deviceCode: 'WIFI-201', deviceName: 'Cục Phát WiFi 6 Gigabit Ruijie Reyee P.201', monthlyPrice: 70000, category: 'WIFI_ROUTER', snapshotAppliedAt: '2026-10-31' },
      { deviceNodeId: 11, deviceCode: 'AC-201', deviceName: 'Điều Hòa Daikin 12000BTU Inverter', monthlyPrice: 100000, category: 'AIR_COND', snapshotAppliedAt: '2026-10-31' },
      { deviceNodeId: 12, deviceCode: 'FRG-201', deviceName: 'Tủ Lạnh Mini Funiki 90L', monthlyPrice: 100000, category: 'FRIDGE', snapshotAppliedAt: '2026-10-31' }
    ]
  },
  // 4. Hóa đơn Tháng 11/2026 Phòng 201 - ĐÃ DUYỆT & CHỐT SỔ (LẤY GIÁ MỚI NHẤT: Cục phát WiFi tăng lên 82.000đ)
  {
    invoiceId: 4,
    contractId: 1,
    roomNodeId: 8,
    roomName: 'Phòng 201 - Tòa 01 Cầu Giấy',
    monthYear: '11/2026',
    month: 11,
    year: 2026,
    prevElectric: 1395,
    currElectric: 1530, // 135 kWh * 3800 = 513.000đ
    electricRate: 3800,
    prevWater: 57,
    currWater: 65, // 8 m³ * 30000 = 240.000đ
    waterRate: 30000,
    roomRent: 4500000,
    roomDeviceRentalCost: 262000, // Cục phát WiFi 82k (Giá mới nhất) + Điều hòa 80k + Tủ lạnh 100k
    sharedDeviceCost: 60000,
    occupantCount: 3,
    sanitationFeePerPerson: 30000,
    sanitationFee: 90000,
    residenceFeePerPerson: 100000,
    isResidenceFeeApplied: false,
    residenceFee: 0,
    residenceFeeNote: 'Đang trong chu kỳ 12 tháng của Năm 1 (Đã thu tại kỳ 08/2026)',
    internetAndTrash: 60000,
    totalAmount: 5725000,
    status: 'UNPAID',
    isApproved: true,
    approvalStatus: 'APPROVED',
    isLocked: true,
    approvedByName: 'Lê Văn Hoàng (Quản Lý)',
    approvedAt: '2026-11-30 18:00',
    deviceBreakdown: [
      { deviceNodeId: 307, deviceCode: 'WIFI-201', deviceName: 'Cục Phát WiFi 6 Gigabit Ruijie Reyee P.201', monthlyPrice: 82000, category: 'WIFI_ROUTER', snapshotAppliedAt: '2026-11-30' },
      { deviceNodeId: 11, deviceCode: 'AC-201', deviceName: 'Điều Hòa Daikin 12000BTU Inverter', monthlyPrice: 80000, category: 'AIR_COND', snapshotAppliedAt: '2026-11-30' },
      { deviceNodeId: 12, deviceCode: 'FRG-201', deviceName: 'Tủ Lạnh Mini Funiki 90L', monthlyPrice: 100000, category: 'FRIDGE', snapshotAppliedAt: '2026-11-30' }
    ]
  },
  // 5. Hóa đơn Tháng 12/2026 Phòng 201 - DỰ THẢO CHỜ DUYỆT (LẤY GIÁ MỚI NHẤT: WiFi 82k, Admin có thể duyệt)
  {
    invoiceId: 5,
    contractId: 1,
    roomNodeId: 8,
    roomName: 'Phòng 201 - Tòa 01 Cầu Giấy',
    monthYear: '12/2026',
    month: 12,
    year: 2026,
    prevElectric: 1530,
    currElectric: 1660, // 130 kWh * 3800 = 494.000đ
    electricRate: 3800,
    prevWater: 65,
    currWater: 72, // 7 m³ * 30000 = 210.000đ
    waterRate: 30000,
    roomRent: 4500000,
    roomDeviceRentalCost: 262000, // Cục phát WiFi 82k (Giá mới nhất) + Điều hòa 80k + Tủ lạnh 100k
    sharedDeviceCost: 50000,
    occupantCount: 3,
    sanitationFeePerPerson: 30000,
    sanitationFee: 90000,
    residenceFeePerPerson: 100000,
    isResidenceFeeApplied: false,
    residenceFee: 0,
    residenceFeeNote: 'Đang trong chu kỳ 12 tháng của Năm 1 (Đã thu tại kỳ 08/2026)',
    internetAndTrash: 60000,
    totalAmount: 5666000,
    status: 'UNPAID',
    isApproved: false,
    approvalStatus: 'DRAFT',
    isLocked: false,
    deviceBreakdown: [
      { deviceNodeId: 307, deviceCode: 'WIFI-201', deviceName: 'Cục Phát WiFi 6 Gigabit Ruijie Reyee P.201', monthlyPrice: 82000, category: 'WIFI_ROUTER', snapshotAppliedAt: '2026-12-01' },
      { deviceNodeId: 11, deviceCode: 'AC-201', deviceName: 'Điều Hòa Daikin 12000BTU Inverter', monthlyPrice: 80000, category: 'AIR_COND', snapshotAppliedAt: '2026-12-01' },
      { deviceNodeId: 12, deviceCode: 'FRG-201', deviceName: 'Tủ Lạnh Mini Funiki 90L', monthlyPrice: 100000, category: 'FRIDGE', snapshotAppliedAt: '2026-12-01' }
    ]
  }
];

// Danh sách sự cố thiết bị (Damaged, Dirty, Difficult to use)
export const INITIAL_DEVICE_ISSUES: DeviceIssueReport[] = [
  {
    reportId: 1,
    nodeId: 3,
    deviceName: 'Máy Giặt Electrolux 11kg (Tầng 1)',
    location: 'Tòa 01 - Sảnh Tầng 1',
    reportedByUserId: 6,
    reportedByName: 'Nguyễn Văn An',
    issueType: 'DAMAGED', // Hư hỏng
    description: 'Lồng giặt kêu rất to và rung lắc mạnh ở chu trình vắt 1200 vòng/phút. Nghi hỏng giảm xóc hoặc lỏng ốc treo.',
    status: 'IN_PROGRESS',
    reportedAt: '2026-09-25 14:30',
    warrantyInfo: 'Hạn bảo hành Electrolux: 31/12/2027 (Số máy: ELX-2026-8889)'
  },
  {
    reportId: 2,
    nodeId: 4,
    deviceName: 'Trạm Sạc Xe Điện Thông Minh 3.5kW',
    location: 'Tòa 01 - Hầm Xe',
    reportedByUserId: 7,
    reportedByName: 'Trần Thu Trang',
    issueType: 'DIFFICULT_TO_USE', // Khó sử dụng
    description: 'Màn hình hiển thị bị lóa dưới ánh đèn và hướng dẫn quẹt thẻ chưa rõ, khách mới thuê không biết bấm phím nào để bắt đầu nạp.',
    status: 'PENDING',
    reportedAt: '2026-09-26 09:15',
    warrantyInfo: 'Cần dán tem Decal hướng dẫn 3 bước thao tác bằng tiếng Việt.'
  },
  {
    reportId: 3,
    nodeId: 12,
    deviceName: 'Tủ Lạnh Mini Funiki 90L',
    location: 'Phòng 201 - Tòa 01',
    reportedByUserId: 6,
    reportedByName: 'Nguyễn Văn An',
    issueType: 'DIRTY', // Hay bẩn
    description: 'Ngăn đông bị đóng tuyết dày làm bẩn khay chứa nước phía sau, cần đội tạp vụ hỗ trợ xả tuyết và vệ sinh diệt khuẩn.',
    status: 'PENDING',
    reportedAt: '2026-09-27 08:00',
    warrantyInfo: 'Bảo hành Funiki: 20/11/2026'
  }
];

// Nhật ký sử dụng thiết bị dùng chung
export const INITIAL_SHARED_LOGS: SharedDeviceLog[] = [
  {
    logId: 1,
    deviceNodeId: 3,
    deviceName: 'Máy Giặt Electrolux 11kg',
    tenantUserId: 6,
    tenantName: 'Nguyễn Văn An',
    roomNodeId: 8,
    roomName: 'Phòng 201',
    unitCount: 1,
    cost: 15000,
    activatedAt: '2026-09-26 19:40',
    durationMinutes: 45
  },
  {
    logId: 2,
    deviceNodeId: 4,
    deviceName: 'Trạm Sạc Xe Điện Thông Minh 3.5kW',
    tenantUserId: 6,
    tenantName: 'Nguyễn Văn An',
    roomNodeId: 8,
    roomName: 'Phòng 201',
    unitCount: 7.5,
    cost: 30000,
    activatedAt: '2026-09-27 07:15',
    durationMinutes: 180
  }
];

// Đánh giá 2 chiều (Quản lý đánh giá khách - Khóa sau khi trả phòng; Khách đánh giá quản lý - Khóa hoàn toàn sau gửi)
export const INITIAL_REVIEWS: TwoWayReview[] = [
  // 1. Quản lý đánh giá khách thuê đang ở (Chưa khóa vì đang ở)
  {
    reviewId: 1,
    contractId: 1,
    roomName: 'Phòng 201 - Tòa 01 Cầu Giấy',
    reviewerUserId: 4,
    reviewerName: 'Lê Văn Hoàng (Quản lý)',
    reviewerRole: 'BUILDING_MANAGER',
    targetUserId: 6,
    targetUserName: 'Nguyễn Văn An (Khách thuê)',
    rating: 5,
    comment: 'Khách ở giữ gìn vệ sinh chung, chấp hành nghiêm quy định phòng cháy chữa cháy, đóng tiền phòng đúng hạn.',
    isLocked: false, // Chưa trả phòng nên quản lý còn có thể cập nhật
    createdAt: '2026-09-20'
  },
  // 2. Khách thuê cũ (Phạm Đức Minh) đã trả phòng & thanh toán xong -> Đánh giá Quản lý -> KHÓA VĨNH VIỄN
  {
    reviewId: 2,
    contractId: 4,
    roomName: 'Phòng 101 - Tòa 01 Cầu Giấy',
    reviewerUserId: 8,
    reviewerName: 'Phạm Đức Minh (Khách cũ)',
    reviewerRole: 'TENANT',
    targetUserId: 4,
    targetUserName: 'Lê Văn Hoàng (Quản lý)',
    rating: 5,
    comment: 'Anh Hoàng quản lý rất nhiệt tình, thiết bị hỏng gọi thợ đến xử lý trong ngày. Hoàn tiền cọc nhanh chóng và minh bạch.',
    isLocked: true, // ĐÃ KHÓA HOÀN TOÀN, không thể sửa đổi
    createdAt: '2026-08-26'
  },
  // 3. Khách thuê Trần Thu Trang đánh giá Quản lý Lê Văn Hoàng -> 4 sao
  {
    reviewId: 3,
    contractId: 3,
    roomName: 'Phòng 202 - Tòa 01 Cầu Giấy',
    reviewerUserId: 7,
    reviewerName: 'Trần Thu Trang (Khách thuê)',
    reviewerRole: 'TENANT',
    targetUserId: 4,
    targetUserName: 'Lê Văn Hoàng (Quản lý)',
    rating: 4,
    comment: 'Tòa nhà an ninh và văn minh, mở cổng từ xa rất nhạy. Chỉ có khu trạm sạc xe điện tầng hầm giờ cao điểm hơi đông người sạc, mong quản lý lắp thêm ổ cắm.',
    isLocked: true,
    createdAt: '2026-09-18'
  },
  // 4. Quản lý Vũ Thị Mai đánh giá khách thuê -> 3 sao
  {
    reviewId: 4,
    contractId: 2,
    roomName: 'Phòng 304 - Tòa 02 Đống Đa',
    reviewerUserId: 5,
    reviewerName: 'Vũ Thị Mai (Quản lý Đống Đa)',
    reviewerRole: 'BUILDING_MANAGER',
    targetUserId: 6,
    targetUserName: 'Nguyễn Văn An (Khách thuê)',
    rating: 3,
    comment: 'Khách thanh toán tiền phòng đúng hẹn nhưng thỉnh thoảng để giày dép ngoài hành lang chung làm cản trở lối thoát hiểm, đã nhắc nhở và khách đã tiếp thu.',
    isLocked: false,
    createdAt: '2026-09-15'
  },
  // 5. Khách thuê Hoàng Quốc Bảo đánh giá Quản lý Vũ Thị Mai -> 5 sao
  {
    reviewId: 5,
    contractId: 2,
    roomName: 'Phòng 304 - Tòa 02 Đống Đa',
    reviewerUserId: 6,
    reviewerName: 'Nguyễn Văn An (Khách thuê)',
    reviewerRole: 'TENANT',
    targetUserId: 5,
    targetUserName: 'Vũ Thị Mai (Quản lý)',
    rating: 5,
    comment: 'Chị Mai quản lý rất chuyên nghiệp, thủ tục nhận phòng và cấp quyền thẻ từ chỉ mất 5 phút. Tòa nhà yên tĩnh để làm việc.',
    isLocked: true,
    createdAt: '2026-09-16'
  }
];

// Danh sách giữ phòng mẫu
export const INITIAL_RESERVATIONS: import('../types/rental').RoomReservation[] = [
  {
    reservationId: 101,
    roomNodeId: 27,
    roomName: 'Phòng 203 (VIP Ban Công) - Tòa 01 Cầu Giấy',
    buildingNodeId: 1,
    buildingName: 'Tòa Nhà 01 - Cầu Giấy',
    userId: 7,
    userName: 'Trần Thu Trang',
    userPhone: '0987777777',
    userCitizenId: '036099007777',
    userAddress: 'Xã Hải Hậu, Huyện Hải Hậu, Tỉnh Nam Định',
    status: 'PENDING',
    requestedAt: '2026-09-27 10:15',
    expectedCheckInDate: '2026-10-05',
    monthlyRent: 4600000,
    depositAmount: 4600000,
    availableReason: 'ROOM_VACANT'
  }
];

// Bài viết giới thiệu tòa nhà & tiện ích
export const INITIAL_POSTS: BuildingPost[] = [
  {
    postId: 1,
    buildingNodeId: 1,
    buildingName: 'Tòa Nhà 01 - Cầu Giấy',
    authorName: 'Lê Văn Hoàng',
    authorRole: 'Quản Lý Tòa Nhà',
    title: 'Chào đón cư dân mới: Hướng dẫn mở cổng từ xa & sử dụng trạm sạc xe điện',
    summary: 'Tổng hợp tiện ích công nghệ cao tại Tòa nhà 01: Khóa vân tay, trạm sạc thông minh 3.5kW tự ngắt và máy giặt sảnh tầng 1.',
    content: 'Kính gửi quý cư dân, để đảm bảo an ninh tuyệt đối cho toàn bộ tòa nhà, cổng chính được trang bị hệ thống chốt điện từ tích hợp ứng dụng điện thoại. Quý cư dân có thể bấm nút "Mở Cổng Từ Xa" trên ứng dụng khi về đến nhà. Trạm sạc xe điện dưới tầng hầm sẽ tự ngắt điện khi pin xe được sạc đầy 100%.',
    coverImage: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&auto=format&fit=crop&q=80',
    createdAt: '2026-09-01'
  },
  {
    postId: 2,
    buildingNodeId: 18,
    buildingName: 'Tòa Nhà 02 - Đống Đa',
    authorName: 'Trần Hải Linh',
    authorRole: 'Ban Quản Trị Cấp Cao',
    title: 'Khai trương không gian giặt sấy trên sân thượng view Landmark 72',
    summary: 'Trang bị cụm máy giặt sấy Toshiba 10.5kg công nghệ Inverter siêu êm cùng khu phơi đồ đón nắng tự nhiên.',
    content: 'Ban quản trị đã hoàn tất lắp đặt cụm tiện ích giặt sấy thông minh tại sân thượng Tòa nhà 02 Đống Đa. Mọi chi phí sử dụng sẽ được cộng trực tiếp vào bảng kê chi phí phòng cuối tháng, cư dân không cần chuẩn bị tiền mặt hay xu đổi.',
    coverImage: 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=800&auto=format&fit=crop&q=80',
    createdAt: '2026-09-10'
  }
];
