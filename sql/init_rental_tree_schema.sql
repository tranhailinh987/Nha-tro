-- =====================================================================================
-- HỆ THỐNG QUẢN LÝ 100 NHÀ TRỌ & THIẾT BỊ ĐA CẤP (100 BUILDINGS & IOT MANAGEMENT)
-- Hệ Quản Trị CSDL: Microsoft SQL Server (MS SQL Server Express / Standard / Azure SQL)
-- Kiến Trúc: Mô hình Cây Hướng Đối Tượng (Self-Referencing Node Composite Tree)
-- Phân Quyền: 3 Cấp Độ Chặt Chẽ (Admins -> Quản lý Tòa nhà -> Người dùng)
-- =====================================================================================

USE master;
GO

-- 1. Tạo Database nếu chưa có
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'RentalPropertyManagementDB')
BEGIN
    CREATE DATABASE RentalPropertyManagementDB;
END
GO

USE RentalPropertyManagementDB;
GO

-- =====================================================================================
-- PHẦN 1: BẢNG PHÂN QUYỀN & TÀI KHOẢN NGƯỜI DÙNG (USER & AUTHENTICATION)
-- =====================================================================================

-- 1.1 Bảng Phân Quyền (3 Cấp duy nhất: Admins, Quản lý tòa nhà, Người dùng)
IF OBJECT_ID('dbo.Roles', 'U') IS NOT NULL DROP TABLE dbo.Roles;
CREATE TABLE dbo.Roles (
    RoleId TINYINT PRIMARY KEY,
    RoleCode VARCHAR(30) UNIQUE NOT NULL,      -- 'ADMIN', 'BUILDING_MANAGER', 'TENANT'
    RoleName NVARCHAR(50) NOT NULL,            -- N'Quản trị viên cấp cao', N'Quản lý tòa nhà', N'Người dùng / Khách thuê'
    Description NVARCHAR(255) NULL
);
GO

-- 1.2 Bảng Tài Khoản Người Dùng (1 người chỉ 1 tài khoản duy nhất qua CCCD)
IF OBJECT_ID('dbo.Users', 'U') IS NOT NULL DROP TABLE dbo.Users;
CREATE TABLE dbo.Users (
    UserId BIGINT IDENTITY(1,1) PRIMARY KEY,
    RoleId TINYINT NOT NULL FOREIGN KEY REFERENCES dbo.Roles(RoleId),
    FullName NVARCHAR(100) NOT NULL,
    CitizenId VARCHAR(20) UNIQUE NOT NULL,     -- Số Căn cước công dân (DUY NHẤT)
    CitizenIdFrontImg VARCHAR(255) NULL,       -- URL ảnh mặt trước CCCD (Lưu Storage/Cloud)
    CitizenIdBackImg VARCHAR(255) NULL,        -- URL ảnh mặt sau CCCD (Lưu Storage/Cloud)
    PhoneNumber VARCHAR(15) UNIQUE NOT NULL,   -- Số điện thoại đăng nhập (DUY NHẤT)
    Address NVARCHAR(255) NULL,                -- Địa chỉ thường trú / quê quán (MỚI BỔ SUNG)
    PasswordHash VARCHAR(255) NOT NULL,        -- Mật khẩu mã hóa BCrypt
    AvatarUrl VARCHAR(255) NULL,
    IsActive BIT DEFAULT(1),                   -- 1: Kích hoạt, 0: Đang bị khóa
    CreatedAt DATETIME2 DEFAULT SYSDATETIME(),
    UpdatedAt DATETIME2 NULL
);
GO

-- =====================================================================================
-- PHẦN 2: BẢNG DANH MỤC LOẠI ĐỐI TƯỢNG & CÂY QUẢN LÝ (OBJECT-ORIENTED TREE)
-- =====================================================================================

-- 2.1 Bảng Danh mục Loại Đối Tượng mở rộng (ObjectTypes)
-- Quản lý có thể thêm đối tượng mới: Điện thoại công cộng, WiFi, Trạm sạc... mà không sửa code
IF OBJECT_ID('dbo.ObjectTypes', 'U') IS NOT NULL DROP TABLE dbo.ObjectTypes;
CREATE TABLE dbo.ObjectTypes (
    TypeId INT IDENTITY(1,1) PRIMARY KEY,
    TypeCode VARCHAR(30) UNIQUE NOT NULL,      -- 'BUILDING', 'FLOOR', 'ROOM', 'WASHING_MACHINE', 'EV_CHARGER', 'PUBLIC_PHONE', 'PUBLIC_WIFI', 'FRIDGE', 'AIR_COND'
    TypeName NVARCHAR(100) NOT NULL,          -- Tên hiển thị loại
    CategoryGroup NVARCHAR(50) NOT NULL,      -- 'PROPERTY', 'ROOM', 'DEVICE', 'PUBLIC_SERVICE'
    MetricUnit NVARCHAR(20) NULL,             -- Đơn vị đo: N'Lần', 'kWh', N'Khối', N'Phút', N'Tháng'
    HasSubItems BIT DEFAULT(0)                -- 1: Có chứa node con (Nhà, Phòng); 0: Node lá (Thiết bị)
);
GO

-- 2.2 Bảng Nút Cây Quản Lý Đa Cấp (ManagementNodes)
-- Chứa toàn bộ Tòa nhà, Tầng, Phòng, Thiết bị, Dịch vụ theo quan hệ ParentNodeId đệ quy
IF OBJECT_ID('dbo.ManagementNodes', 'U') IS NOT NULL DROP TABLE dbo.ManagementNodes;
CREATE TABLE dbo.ManagementNodes (
    NodeId BIGINT IDENTITY(1,1) PRIMARY KEY,
    ParentNodeId BIGINT NULL FOREIGN KEY REFERENCES dbo.ManagementNodes(NodeId), -- Tự tham chiếu đệ quy
    TypeId INT NOT NULL FOREIGN KEY REFERENCES dbo.ObjectTypes(TypeId),
    NodeCode VARCHAR(50) NOT NULL,            -- Mã nhận diện: HN-CG01, P201, EV-01, TEL-01
    NodeName NVARCHAR(150) NOT NULL,          -- Tên cụ thể
    UnitPrice DECIMAL(12,2) DEFAULT(0),       -- Giá thuê phòng / Giá 1 số điện / 1 khối nước / 1 lần giặt
    DepositAmount DECIMAL(12,2) DEFAULT(0),   -- Tiền cọc phòng
    AddressOrLocation NVARCHAR(255) NULL,     -- Địa chỉ tòa nhà hoặc vị trí phòng
    HardwareMacOrTopic VARCHAR(150) NULL,     -- Địa chỉ MAC khóa cổng, rơ-le IoT hoặc topic MQTT
    SerialNumber VARCHAR(50) NULL,            -- Serial thiết bị (nếu là thiết bị)
    WarrantyExpiryDate DATE NULL,             -- Hạn bảo hành thiết bị
    ElectricityRate DECIMAL(12,2) DEFAULT(3800), -- Đơn giá điện quy định của tòa nhà / phòng (đ/kWh)
    WaterRate DECIMAL(12,2) DEFAULT(30000),       -- Đơn giá nước quy định của tòa nhà / phòng (đ/m³)
    CurrentCondition TINYINT DEFAULT(0),      -- 0: Bình thường, 1: Báo bẩn, 2: Khó dùng, 3: Hư hỏng
    IsActive BIT DEFAULT(1),
    CreatedAt DATETIME2 DEFAULT SYSDATETIME()
);
GO

-- 2.3 Bảng Phân Quyền Quản Lý Tòa Nhà (1 người quản lý 1 hoặc nhiều tòa nhà)
IF OBJECT_ID('dbo.ManagerBuildingAssignments', 'U') IS NOT NULL DROP TABLE dbo.ManagerBuildingAssignments;
CREATE TABLE dbo.ManagerBuildingAssignments (
    AssignmentId INT IDENTITY(1,1) PRIMARY KEY,
    ManagerUserId BIGINT NOT NULL FOREIGN KEY REFERENCES dbo.Users(UserId),
    BuildingNodeId BIGINT NOT NULL FOREIGN KEY REFERENCES dbo.ManagementNodes(NodeId),
    AssignedAt DATETIME2 DEFAULT SYSDATETIME(),
    IsPrimaryManager BIT DEFAULT(1)
);
GO

-- =====================================================================================
-- PHẦN 3: HỢP ĐỒNG THUÊ & THEO DÕI CƯ DÂN Ở CÙNG (CONTRACTS & OCCUPANTS)
-- =====================================================================================

-- 3.1 Bảng Hợp Đồng Thuê Phòng
IF OBJECT_ID('dbo.RentalContracts', 'U') IS NOT NULL DROP TABLE dbo.RentalContracts;
CREATE TABLE dbo.RentalContracts (
    ContractId BIGINT IDENTITY(1,1) PRIMARY KEY,
    ContractCode VARCHAR(30) UNIQUE NOT NULL,
    RoomNodeId BIGINT NOT NULL FOREIGN KEY REFERENCES dbo.ManagementNodes(NodeId),
    PrimaryTenantId BIGINT NOT NULL FOREIGN KEY REFERENCES dbo.Users(UserId), -- Người ký hợp đồng chính
    ContractStartDate DATE NOT NULL,          -- Ngày bắt đầu trên HỢP ĐỒNG
    ContractEndDate DATE NOT NULL,            -- Ngày kết thúc trên HỢP ĐỒNG
    ActualCheckInDate DATE NULL,              -- Ngày đến nhận phòng THỰC TẾ
    ActualCheckOutDate DATE NULL,             -- Ngày trả phòng THỰC TẾ
    AgreedMonthlyPrice DECIMAL(12,2) NOT NULL,-- Tiền thuê hàng tháng đã chốt
    DepositPaid DECIMAL(12,2) NOT NULL,       -- Tiền cọc đã nộp
    DepositRefunded DECIMAL(12,2) DEFAULT(0), -- Tiền cọc hoàn trả sau khi trừ điện nước/thiết bị
    ContractStatus TINYINT DEFAULT(1),        -- 0: Chờ nhận, 1: Đang ở, 2: Đã thanh lý hoàn tất
    Notes NVARCHAR(500) NULL,
    CreatedAt DATETIME2 DEFAULT SYSDATETIME()
);
GO

-- 3.2 Bảng Danh Sách Người Ở Cùng (RoomOccupants - 1 phòng nhiều người)
IF OBJECT_ID('dbo.RoomOccupants', 'U') IS NOT NULL DROP TABLE dbo.RoomOccupants;
CREATE TABLE dbo.RoomOccupants (
    OccupantId BIGINT IDENTITY(1,1) PRIMARY KEY,
    ContractId BIGINT NOT NULL FOREIGN KEY REFERENCES dbo.RentalContracts(ContractId),
    UserId BIGINT NOT NULL FOREIGN KEY REFERENCES dbo.Users(UserId), -- Tài khoản người ở cùng (có CCCD)
    Relationship NVARCHAR(50) NULL,           -- 'Bạn cùng phòng', 'Vợ chồng', 'Anh em'
    JoinDate DATE NOT NULL,                   -- Ngày bắt đầu vào ở
    LeaveDate DATE NULL,                      -- Ngày rời đi (nếu rời phòng trước)
    HasGateAccess BIT DEFAULT(1)              -- 1: Được cấp quyền mở cổng nhà
);
GO

-- =====================================================================================
-- PHẦN 4: ĐO ĐẾM DỊCH VỤ, ĐIỆN NƯỚC & HÓA ĐƠN THÁNG (UTILITIES & INVOICES)
-- =====================================================================================

-- 4.1 Bảng Nhật ký Đo đếm Thiết bị dùng chung (Quẹt thẻ/App: Sạc xe, Máy giặt, Điện thoại...)
-- Tiền dịch vụ tự động cộng dồn vào hóa đơn phòng cuối tháng
IF OBJECT_ID('dbo.NodeUsageLogs', 'U') IS NOT NULL DROP TABLE dbo.NodeUsageLogs;
CREATE TABLE dbo.NodeUsageLogs (
    LogId BIGINT IDENTITY(1,1) PRIMARY KEY,
    NodeId BIGINT NOT NULL FOREIGN KEY REFERENCES dbo.ManagementNodes(NodeId),     -- Thiết bị đã bật
    UserId BIGINT NOT NULL FOREIGN KEY REFERENCES dbo.Users(UserId),               -- Người quét thẻ/kích hoạt
    RoomNodeId BIGINT NOT NULL FOREIGN KEY REFERENCES dbo.ManagementNodes(NodeId), -- Tính vào phòng nào
    Quantity DECIMAL(8,2) NOT NULL,           -- Số lần / Số kWh / Số phút gọi
    UnitPrice DECIMAL(12,2) NOT NULL,         -- Đơn giá tại thời điểm dùng
    TotalCost DECIMAL(12,2) NOT NULL,         -- Thành tiền
    StartTime DATETIME2 NOT NULL,
    EndTime DATETIME2 NULL,
    ChargedIntoInvoiceId BIGINT NULL          -- NULL: Chưa chốt hóa đơn; > 0: Đã đưa vào hóa đơn tháng
);
GO

-- 4.2 Bảng Chỉ Số Điện Nước Hàng Tháng (Có ảnh chụp mặt đồng hồ làm bằng chứng)
IF OBJECT_ID('dbo.RoomUtilityReadings', 'U') IS NOT NULL DROP TABLE dbo.RoomUtilityReadings;
CREATE TABLE dbo.RoomUtilityReadings (
    ReadingId BIGINT IDENTITY(1,1) PRIMARY KEY,
    RoomNodeId BIGINT NOT NULL FOREIGN KEY REFERENCES dbo.ManagementNodes(NodeId),
    BillingMonth TINYINT NOT NULL,            -- 1 - 12
    BillingYear SMALLINT NOT NULL,            -- 2026...
    ElectricityOldNum INT NOT NULL,           -- Số điện cũ
    ElectricityNewNum INT NOT NULL,           -- Số điện mới
    ElectricityPhotoUrl VARCHAR(255) NULL,    -- Ảnh chụp công tơ điện
    WaterOldNum INT NOT NULL,                 -- Số nước cũ
    WaterNewNum INT NOT NULL,                 -- Số nước mới
    WaterPhotoUrl VARCHAR(255) NULL,          -- Ảnh chụp đồng hồ nước
    RecordedByManagerId BIGINT NOT NULL FOREIGN KEY REFERENCES dbo.Users(UserId),
    RecordedAt DATETIME2 DEFAULT SYSDATETIME()
);
GO

-- 4.3 Bảng Hóa Đơn Tổng Hợp Hàng Tháng
IF OBJECT_ID('dbo.MonthlyInvoices', 'U') IS NOT NULL DROP TABLE dbo.MonthlyInvoices;
CREATE TABLE dbo.MonthlyInvoices (
    InvoiceId BIGINT IDENTITY(1,1) PRIMARY KEY,
    ContractId BIGINT NOT NULL FOREIGN KEY REFERENCES dbo.RentalContracts(ContractId),
    BillingPeriod VARCHAR(7) NOT NULL,        -- '2026-09', '2026-11'
    RoomFee DECIMAL(12,2) NOT NULL,           -- Tiền phòng
    RoomDeviceRentalCost DECIMAL(12,2) DEFAULT(0), -- Tiền thuê thiết bị trang bị theo phòng (tính theo bảng giá tháng)
    ElectricityRate DECIMAL(12,2) DEFAULT(3800),  -- Đơn giá điện tháng này (đ/kWh)
    ElectricityFee DECIMAL(12,2) NOT NULL,    -- Tiền điện
    WaterRate DECIMAL(12,2) DEFAULT(30000),       -- Đơn giá nước tháng này (đ/m³)
    WaterFee DECIMAL(12,2) NOT NULL,          -- Tiền nước
    SharedServicesFee DECIMAL(12,2) DEFAULT(0),-- Tiền giặt, sạc, điện thoại chung
    TotalAmountDue DECIMAL(12,2) NOT NULL,    -- Tổng tiền phải đóng
    PaymentStatus TINYINT DEFAULT(0),         -- 0: Chưa đóng, 1: Đã đóng đủ, 2: Nợ một phần
    IsApproved BIT DEFAULT(0),                -- Người quản trị đã duyệt hóa đơn
    ApprovalStatus VARCHAR(20) DEFAULT('DRAFT'), -- 'DRAFT', 'APPROVED'
    ApprovedAt DATETIME2 NULL,                -- Thời điểm duyệt
    ApprovedByManagerId BIGINT NULL FOREIGN KEY REFERENCES dbo.Users(UserId), -- Quản trị viên duyệt
    IsLocked BIT DEFAULT(0),                  -- Đã khóa sổ: Đơn giá và chi tiết cố định vĩnh viễn, không tính lại
    PaidAt DATETIME2 NULL,
    CreatedAt DATETIME2 DEFAULT SYSDATETIME()
);
GO

-- 4.4 BẢNG DANH MỤC BẢNG GIÁ THIẾT BỊ THEO THỜI KỲ (DevicePriceCatalog)
-- Nơi lưu trữ bảng giá và lịch sử điều chỉnh giá của từng thiết bị theo thời gian
-- Ví dụ: Cục phát WiFi: từ 08/2026 giá 70.000đ/tháng; từ 11/2026 giá 82.000đ/tháng
IF OBJECT_ID('dbo.DevicePriceCatalog', 'U') IS NOT NULL DROP TABLE dbo.DevicePriceCatalog;
CREATE TABLE dbo.DevicePriceCatalog (
    CatalogId BIGINT IDENTITY(1,1) PRIMARY KEY,
    NodeId BIGINT NOT NULL FOREIGN KEY REFERENCES dbo.ManagementNodes(NodeId), -- Mã thiết bị
    EffectiveFromMonthYear VARCHAR(7) NOT NULL,  -- Tháng năm bắt đầu áp dụng ('2026-08', '2026-11')
    MonthlyRentalPrice DECIMAL(12,2) NOT NULL,   -- Đơn giá thuê theo tháng (VD: 70000, 82000)
    Note NVARCHAR(255) NULL,                    -- Ghi chú điều chỉnh giá / lý do
    CreatedAt DATETIME2 DEFAULT SYSDATETIME(),
    CreatedByUserId BIGINT NULL FOREIGN KEY REFERENCES dbo.Users(UserId)
);
GO

-- 4.5 BẢNG CHI TIẾT ĐƠN GIÁ THIẾT BỊ THEO HÓA ĐƠN ĐÃ DUYỆT (InvoiceDeviceSnapshots)
-- Nơi lưu giữ ĐƠN GIÁ THIẾT BỊ CỦA THÁNG ĐẤY sau khi Quản trị viên bấm Duyệt hóa đơn.
-- Sau này (đến tháng 11 hay các năm sau) mở lại các tháng trước, hệ thống đọc trực tiếp bảng này
-- mà không cần tính lại toàn bộ, bảo đảm tính toàn vẹn lịch sử.
IF OBJECT_ID('dbo.InvoiceDeviceSnapshots', 'U') IS NOT NULL DROP TABLE dbo.InvoiceDeviceSnapshots;
CREATE TABLE dbo.InvoiceDeviceSnapshots (
    SnapshotId BIGINT IDENTITY(1,1) PRIMARY KEY,
    InvoiceId BIGINT NOT NULL FOREIGN KEY REFERENCES dbo.MonthlyInvoices(InvoiceId),
    DeviceNodeId BIGINT NOT NULL FOREIGN KEY REFERENCES dbo.ManagementNodes(NodeId),
    DeviceName NVARCHAR(150) NOT NULL,
    MonthlyPrice DECIMAL(12,2) NOT NULL,        -- Đơn giá thuê thiết bị của tháng hóa đơn đấy
    AppliedMonthYear VARCHAR(7) NOT NULL,       -- '2026-09', '2026-11'
    IsLocked BIT DEFAULT(1),                    -- Khóa cứng đơn giá snapshot
    CreatedAt DATETIME2 DEFAULT SYSDATETIME()
);
GO

-- =====================================================================================
-- PHẦN 5: BÁO CÁO THIẾT BỊ HƯ HỎNG / BẨN / KHÓ DÙNG & ĐÁNH GIÁ 2 CHIỀU CÓ KHÓA
-- =====================================================================================

-- 5.1 Bảng Báo Cáo Tình Trạng Thiết Bị (Bảo hành, Bảo trì, Thay thế)
IF OBJECT_ID('dbo.DeviceHealthFeedbacks', 'U') IS NOT NULL DROP TABLE dbo.DeviceHealthFeedbacks;
CREATE TABLE dbo.DeviceHealthFeedbacks (
    FeedbackId BIGINT IDENTITY(1,1) PRIMARY KEY,
    NodeId BIGINT NOT NULL FOREIGN KEY REFERENCES dbo.ManagementNodes(NodeId),     -- Thiết bị gặp sự cố
    ReporterUserId BIGINT NOT NULL FOREIGN KEY REFERENCES dbo.Users(UserId),       -- Người phản ánh
    FeedbackCategory VARCHAR(30) NOT NULL,    -- 'DAMAGED' (Hư hỏng), 'DIRTY' (Hay bẩn), 'DIFFICULT_TO_USE' (Khó dùng)
    Severity TINYINT DEFAULT(1),              -- 1: Nhẹ, 2: Trung bình, 3: Nghiêm trọng
    IssueDescription NVARCHAR(500) NOT NULL,  -- Chi tiết hiện tượng
    PhotoProofUrl VARCHAR(255) NULL,          -- Ảnh đính kèm
    ResolutionStatus VARCHAR(20) DEFAULT('PENDING'), -- 'PENDING', 'IN_REPAIR', 'RESOLVED'
    ActionTaken NVARCHAR(255) NULL,           -- 'Bảo hành hãng', 'Vệ sinh định kỳ', 'Dán tem hướng dẫn', 'Thay mới'
    RepairCost DECIMAL(12,2) DEFAULT(0),      -- Chi phí sửa chữa
    CreatedAt DATETIME2 DEFAULT SYSDATETIME(),
    ResolvedAt DATETIME2 NULL
);
GO

-- 5.2 Bảng Đánh Giá 2 Chiều Có Khóa (Two-Way Reviews)
IF OBJECT_ID('dbo.TwoWayReviews', 'U') IS NOT NULL DROP TABLE dbo.TwoWayReviews;
CREATE TABLE dbo.TwoWayReviews (
    ReviewId BIGINT IDENTITY(1,1) PRIMARY KEY,
    ContractId BIGINT NOT NULL FOREIGN KEY REFERENCES dbo.RentalContracts(ContractId),
    ReviewType TINYINT NOT NULL,              -- 1: Quản lý đánh giá khách, 2: Khách đánh giá quản lý
    ReviewerUserId BIGINT NOT NULL FOREIGN KEY REFERENCES dbo.Users(UserId),
    TargetUserId BIGINT NOT NULL FOREIGN KEY REFERENCES dbo.Users(UserId),
    RatingScore TINYINT NOT NULL,             -- 1 đến 5 sao
    Comment NVARCHAR(1000) NULL,
    IsLocked BIT DEFAULT(0),                  -- 1: ĐÃ KHÓA HOÀN TOÀN (Cấm sửa / xóa)
    LockedAt DATETIME2 NULL,
    LockedReason NVARCHAR(150) NULL,
    CreatedAt DATETIME2 DEFAULT SYSDATETIME()
);
GO

-- 5.3 Bảng Bài Viết Giới Thiệu & Tiện Ích Tòa Nhà (CMS)
IF OBJECT_ID('dbo.BuildingArticles', 'U') IS NOT NULL DROP TABLE dbo.BuildingArticles;
CREATE TABLE dbo.BuildingArticles (
    ArticleId INT IDENTITY(1,1) PRIMARY KEY,
    AuthorUserId BIGINT NOT NULL FOREIGN KEY REFERENCES dbo.Users(UserId),
    BuildingNodeId BIGINT NULL FOREIGN KEY REFERENCES dbo.ManagementNodes(NodeId), -- NULL: Thông báo toàn quốc của Admin
    Title NVARCHAR(200) NOT NULL,
    Slug VARCHAR(250) NOT NULL,
    CoverImageUrl VARCHAR(255) NULL,
    ContentHtml NVARCHAR(MAX) NOT NULL,
    IsPublished BIT DEFAULT(1),
    PublishedAt DATETIME2 DEFAULT SYSDATETIME()
);
GO

-- =====================================================================================
-- PHẦN 6: CHÈN DỮ LIỆU MẪU ĐẦY ĐỦ (SEED DATA)
-- =====================================================================================

-- 6.1 Chèn 3 Vai trò chuẩn
INSERT INTO dbo.Roles (RoleId, RoleCode, RoleName, Description) VALUES
(1, 'ADMIN', N'Quản trị viên cấp cao', N'3 người điều khiển toàn bộ hệ thống 100 nhà'),
(2, 'BUILDING_MANAGER', N'Quản lý tòa nhà', N'Quản lý 1 hoặc nhiều tòa nhà trọ'),
(3, 'TENANT', N'Người dùng / Khách thuê', N'Khách thuê phòng và người ở cùng');
GO

-- 6.2 Chèn Tài khoản: 3 Admins, Quản lý, và Khách thuê (CCCD duy nhất)
INSERT INTO dbo.Users (RoleId, FullName, CitizenId, PhoneNumber, Address, PasswordHash, IsActive) VALUES
-- 3 Admins cao nhất
(1, N'Trần Hải Linh (Admin 1)', '001085001111', '0901111111', N'Số 1 Đại Cồ Việt, Hai Bà Trưng, Hà Nội', '$2a$12$e8Yd8w...', 1),
(1, N'Lê Minh Tuấn (Admin 2)', '001085002222', '0902222222', N'Tòa Landmark 81, Bình Thạnh, TP.HCM', '$2a$12$e8Yd8w...', 1),
(1, N'Phạm Quang Huy (Admin 3)', '001085003333', '0903333333', N'Khu Đô thị Ecopark, Hưng Yên', '$2a$12$e8Yd8w...', 1),
-- Quản lý tòa nhà
(2, N'Lê Văn Hoàng (Quản lý Cầu Giấy)', '001090004444', '0914444444', N'Tổ 8, Phường Mai Dịch, Cầu Giấy, Hà Nội', '$2a$12$e8Yd8w...', 1),
(2, N'Vũ Thị Bích (Quản lý Đống Đa)', '001090005555', '0915555555', N'Ngõ 119 Chùa Bộc, Đống Đa, Hà Nội', '$2a$12$e8Yd8w...', 1),
-- Người dùng (Khách thuê)
(3, N'Nguyễn Văn An', '034098006666', '0986666666', N'Thôn 3, Xã Đông Hưng, Thái Bình', '$2a$12$e8Yd8w...', 1),
(3, N'Trần Thị Mai', '034098007777', '0987777777', N'Khu 2, Phường Bãi Cháy, Hạ Long, Quảng Ninh', '$2a$12$e8Yd8w...', 1),
(3, N'Hoàng Quốc Bảo (Ở cùng An)', '034098008888', '0988888888', N'Xã Tân Yên, Tuyên Quang', '$2a$12$e8Yd8w...', 1);
GO

-- 6.3 Chèn Danh mục Loại Đối Tượng mở rộng (ObjectTypes)
INSERT INTO dbo.ObjectTypes (TypeCode, TypeName, CategoryGroup, MetricUnit, HasSubItems) VALUES
('BUILDING', N'Tòa nhà trọ', 'PROPERTY', NULL, 1),
('FLOOR', N'Tầng lầu', 'PROPERTY', NULL, 1),
('ROOM', N'Phòng trọ', 'ROOM', N'Tháng', 1),
('FACILITY_GROUP', N'Khu tiện ích dùng chung', 'PROPERTY', NULL, 1),
('ELEC_METER', N'Công tơ điện phòng', 'DEVICE', 'kWh', 0),
('WATER_METER', N'Đồng hồ nước phòng', 'DEVICE', N'Khối', 0),
('AIR_COND', N'Điều hòa máy lạnh', 'DEVICE', NULL, 0),
('FRIDGE', N'Tủ lạnh', 'DEVICE', NULL, 0),
('WATER_HEATER', N'Bình nóng lạnh', 'DEVICE', NULL, 0),
('GATE_LOCK', N'Cổng an ninh thẻ từ / vân tay', 'DEVICE', NULL, 0),
('WASHING_MACHINE', N'Máy giặt dùng chung', 'PUBLIC_SERVICE', N'Lần', 0),
('EV_CHARGER', N'Trạm sạc xe điện', 'PUBLIC_SERVICE', 'kWh', 0),
('PUBLIC_PHONE', N'Điện thoại công cộng nội bộ', 'PUBLIC_SERVICE', N'Phút', 0),
('PUBLIC_WIFI', N'Internet / WiFi công cộng', 'PUBLIC_SERVICE', N'Gói', 0);
GO

-- 6.4 Chèn Cây Đối Tượng Mẫu (ManagementNodes)
-- Nút 1: Tòa nhà 01 - Cầu Giấy
INSERT INTO dbo.ManagementNodes (ParentNodeId, TypeId, NodeCode, NodeName, UnitPrice, AddressOrLocation) VALUES
(NULL, 1, 'HN-CG01', N'Tòa nhà Hoa Mai (Cầu Giấy)', 0, N'Số 18 Dịch Vọng Hậu, Cầu Giấy, Hà Nội');

DECLARE @Building1Id BIGINT = SCOPE_IDENTITY();

-- Phân quyền cho Quản lý Lê Văn Hoàng phụ trách Tòa nhà 1
INSERT INTO dbo.ManagerBuildingAssignments (ManagerUserId, BuildingNodeId, IsPrimaryManager) 
VALUES (4, @Building1Id, 1);

-- Con của Nhà 1: Khu tiện ích dùng chung
INSERT INTO dbo.ManagementNodes (ParentNodeId, TypeId, NodeCode, NodeName) VALUES
(@Building1Id, 4, 'CG01-FAC', N'Khu vực Tiện ích dùng chung Tầng 1');

DECLARE @Facility1Id BIGINT = SCOPE_IDENTITY();

-- Các thiết bị dùng chung thuộc Khu tiện ích 1:
INSERT INTO dbo.ManagementNodes (ParentNodeId, TypeId, NodeCode, NodeName, UnitPrice, SerialNumber, WarrantyExpiryDate, CurrentCondition) VALUES
(@Facility1Id, 11, 'WASH-01', N'Máy giặt chung Electrolux 11kg #1', 15000, 'SN-ELX-9988', '2026-12-15', 3), -- Báo hỏng
(@Facility1Id, 12, 'EV-01', N'Trạm sạc xe điện thông minh 3.5kW', 4000, 'SN-EV-3321', '2027-05-20', 2),   -- Khó dùng
(@Facility1Id, 13, 'TEL-01', N'Điện thoại nội bộ / liên lạc sảnh', 1000, 'SN-TEL-1100', '2026-11-30', 3),   -- Báo hỏng
(@Facility1Id, 10, 'GATE-01', N'Cổng từ vân tay an ninh ra vào', 0, 'SN-LOCK-TUYA', '2027-01-01', 0);

-- Con của Nhà 1: Tầng 2
INSERT INTO dbo.ManagementNodes (ParentNodeId, TypeId, NodeCode, NodeName) VALUES
(@Building1Id, 2, 'CG01-F2', N'Tầng 2 Tòa nhà Hoa Mai');

DECLARE @Floor2Id BIGINT = SCOPE_IDENTITY();

-- Con của Tầng 2: Phòng 201
INSERT INTO dbo.ManagementNodes (ParentNodeId, TypeId, NodeCode, NodeName, UnitPrice, DepositAmount) VALUES
(@Floor2Id, 3, 'P201', N'Phòng 201 (Studio VIP)', 4500000, 4500000);

DECLARE @Room201Id BIGINT = SCOPE_IDENTITY();

-- Thiết bị riêng trong Phòng 201:
INSERT INTO dbo.ManagementNodes (ParentNodeId, TypeId, NodeCode, NodeName, UnitPrice, SerialNumber, WarrantyExpiryDate, CurrentCondition) VALUES
(@Room201Id, 5, 'EM-201', N'Công tơ điện tử WiFi P.201', 3800, 'EM-WIFI-201', '2028-01-01', 0),
(@Room201Id, 6, 'WM-201', N'Đồng hồ nước lạnh P.201', 30000, 'WM-201', '2028-01-01', 0),
(@Room201Id, 7, 'AC-201', N'Điều hòa Daikin Inverter 9000BTU', 0, 'DK-9000-201', '2027-08-10', 0),
(@Room201Id, 8, 'FR-201', N'Tủ lạnh mini Funiki 90L', 0, 'FN-90-201', '2025-01-01', 1), -- Báo bẩn / đọng tuyết
(@Room201Id, 9, 'WH-201', N'Bình nước nóng Ariston 20L', 0, 'AR-20-201', '2027-04-15', 0);
GO

-- 6.5 Chèn Hợp Đồng Thuê & Cư Dân Ở Cùng
DECLARE @RoomNodeId BIGINT = (SELECT NodeId FROM dbo.ManagementNodes WHERE NodeCode = 'P201');
DECLARE @TenantId BIGINT = (SELECT UserId FROM dbo.Users WHERE CitizenId = '034098006666'); -- Nguyễn Văn An
DECLARE @RoommateId BIGINT = (SELECT UserId FROM dbo.Users WHERE CitizenId = '034098008888'); -- Hoàng Quốc Bảo

INSERT INTO dbo.RentalContracts (ContractCode, RoomNodeId, PrimaryTenantId, ContractStartDate, ContractEndDate, ActualCheckInDate, AgreedMonthlyPrice, DepositPaid, ContractStatus)
VALUES ('HD-2026-P201', @RoomNodeId, @TenantId, '2026-09-01', '2027-02-28', '2026-08-28', 4500000, 4500000, 1);

DECLARE @ContractId BIGINT = SCOPE_IDENTITY();

-- Người ở cùng phòng 201 với An:
INSERT INTO dbo.RoomOccupants (ContractId, UserId, Relationship, JoinDate, HasGateAccess) VALUES
(@ContractId, @RoommateId, N'Bạn cùng phòng', '2026-08-28', 1);
GO

-- 6.6 Chèn Báo Cáo Sự Cố Thiết Bị (DeviceHealthFeedbacks)
DECLARE @WashNodeId BIGINT = (SELECT NodeId FROM dbo.ManagementNodes WHERE NodeCode = 'WASH-01');
DECLARE @EVNodeId BIGINT = (SELECT NodeId FROM dbo.ManagementNodes WHERE NodeCode = 'EV-01');
DECLARE @FridgeNodeId BIGINT = (SELECT NodeId FROM dbo.ManagementNodes WHERE NodeCode = 'FR-201');
DECLARE @TenantId BIGINT = (SELECT UserId FROM dbo.Users WHERE CitizenId = '034098006666');
DECLARE @ManagerId BIGINT = (SELECT UserId FROM dbo.Users WHERE CitizenId = '001090004444');

INSERT INTO dbo.DeviceHealthFeedbacks (NodeId, ReporterUserId, FeedbackCategory, Severity, IssueDescription, ResolutionStatus, ActionTaken) VALUES
(@WashNodeId, @TenantId, 'DAMAGED', 3, N'Máy rung lắc mạnh khi vắt lồng giặt và báo lỗi E20 không thoát được nước xả.', 'IN_REPAIR', N'Bảo hành chính hãng'),
(@EVNodeId, @TenantId, 'DIFFICULT_TO_USE', 2, N'Chạm thẻ từ 3-4 lần máy mới nhận, màn hình led hiển thị chữ bị mờ khó đọc.', 'PENDING', N'Dán tem hướng dẫn'),
(@FridgeNodeId, @ManagerId, 'DIRTY', 1, N'Kiểm tra bàn giao phòng: ngăn đá đóng tuyết dày, ron cửa bị ố vàng cần tẩy rửa.', 'RESOLVED', N'Vệ sinh định kỳ');
GO

-- 6.7 Chèn Nhật Ký Đo Đếm Sử Dụng Thiết Bị Dùng Chung (NodeUsageLogs)
DECLARE @WashNodeId BIGINT = (SELECT NodeId FROM dbo.ManagementNodes WHERE NodeCode = 'WASH-01');
DECLARE @RoomNodeId BIGINT = (SELECT NodeId FROM dbo.ManagementNodes WHERE NodeCode = 'P201');
DECLARE @TenantId BIGINT = (SELECT UserId FROM dbo.Users WHERE CitizenId = '034098006666');

INSERT INTO dbo.NodeUsageLogs (NodeId, UserId, RoomNodeId, Quantity, UnitPrice, TotalCost, StartTime, EndTime) VALUES
(@WashNodeId, @TenantId, @RoomNodeId, 1.0, 15000, 15000, '2026-09-20 09:00', '2026-09-20 09:45'),
(@WashNodeId, @TenantId, @RoomNodeId, 1.0, 15000, 15000, '2026-09-23 20:15', '2026-09-23 21:00');
GO

-- 6.8 Chèn Danh Mục Bảng Giá Thiết Bị Theo Thời Kỳ (DevicePriceCatalog)
-- Ví dụ: Cục phát WiFi phòng 201 bắt đầu 70.000đ/tháng từ tháng 08/2026, đến tháng 11/2026 điều chỉnh lên 82.000đ/tháng
DECLARE @WifiNodeId BIGINT = (SELECT NodeId FROM dbo.ManagementNodes WHERE NodeCode = 'WF-201');
DECLARE @AdminId BIGINT = (SELECT UserId FROM dbo.Users WHERE CitizenId = '001090001111');

IF @WifiNodeId IS NOT NULL
BEGIN
    INSERT INTO dbo.DevicePriceCatalog (NodeId, EffectiveFromMonthYear, MonthlyRentalPrice, Note, CreatedByUserId) VALUES
    (@WifiNodeId, '2026-08', 70000, N'Bảng giá thuê ban đầu khi bàn giao thiết bị phòng', @AdminId),
    (@WifiNodeId, '2026-11', 82000, N'Điều chỉnh tăng lên 82.000đ/tháng do nâng cấp gói cước WiFi cáp quang 1Gbps', @AdminId);
END
GO

-- 6.9 Chèn Hóa Đơn & Lưu Chi Tiết Đơn Giá Đã Khóa Khi Quản Trị Viên Duyệt (MonthlyInvoices & InvoiceDeviceSnapshots)
DECLARE @ContractId BIGINT = (SELECT ContractId FROM dbo.RentalContracts WHERE ContractCode = 'HD-2026-P201');
DECLARE @ManagerId BIGINT = (SELECT UserId FROM dbo.Users WHERE CitizenId = '001090004444');
DECLARE @WifiNodeId BIGINT = (SELECT NodeId FROM dbo.ManagementNodes WHERE NodeCode = 'WF-201');

IF @ContractId IS NOT NULL
BEGIN
    -- Hóa đơn Tháng 09/2026 (Đã duyệt & Đã chốt khóa sổ: đơn giá WiFi = 70.000đ)
    INSERT INTO dbo.MonthlyInvoices (ContractId, BillingPeriod, RoomFee, RoomDeviceRentalCost, ElectricityFee, WaterFee, SharedServicesFee, TotalAmountDue, PaymentStatus, IsApproved, ApprovalStatus, ApprovedAt, ApprovedByManagerId, IsLocked, PaidAt)
    VALUES (@ContractId, '2026-09', 4500000, 70000, 399000, 150000, 30000, 5249000, 1, 1, 'APPROVED', '2026-10-02 08:30', @ManagerId, 1, '2026-10-03 14:00');
    DECLARE @Inv09Id BIGINT = SCOPE_IDENTITY();

    IF @WifiNodeId IS NOT NULL
    BEGIN
        INSERT INTO dbo.InvoiceDeviceSnapshots (InvoiceId, DeviceNodeId, DeviceName, MonthlyPrice, AppliedMonthYear, IsLocked)
        VALUES (@Inv09Id, @WifiNodeId, N'Cục phát WiFi Deco M4 - Phòng 201', 70000, '2026-09', 1);
    END

    -- Hóa đơn Tháng 11/2026 (Đã duyệt & Đã chốt khóa sổ: đơn giá WiFi = 82.000đ)
    INSERT INTO dbo.MonthlyInvoices (ContractId, BillingPeriod, RoomFee, RoomDeviceRentalCost, ElectricityFee, WaterFee, SharedServicesFee, TotalAmountDue, PaymentStatus, IsApproved, ApprovalStatus, ApprovedAt, ApprovedByManagerId, IsLocked, PaidAt)
    VALUES (@ContractId, '2026-11', 4500000, 82000, 429400, 180000, 30000, 5321400, 1, 1, 'APPROVED', '2026-12-02 09:00', @ManagerId, 1, '2026-12-03 10:15');
    DECLARE @Inv11Id BIGINT = SCOPE_IDENTITY();

    IF @WifiNodeId IS NOT NULL
    BEGIN
        INSERT INTO dbo.InvoiceDeviceSnapshots (InvoiceId, DeviceNodeId, DeviceName, MonthlyPrice, AppliedMonthYear, IsLocked)
        VALUES (@Inv11Id, @WifiNodeId, N'Cục phát WiFi Deco M4 - Phòng 201', 82000, '2026-11', 1);
    END
END
GO

PRINT N'========================================================================';
PRINT N'KHỞI TẠO CSDL & CHÈN TOÀN BỘ DỮ LIỆU THÀNH CÔNG!';
PRINT N'Hệ thống sẵn sàng vận hành mô hình cây và thuật toán đệ quy!';
PRINT N'========================================================================';
