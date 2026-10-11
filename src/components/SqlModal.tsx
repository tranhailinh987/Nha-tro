import React, { useState } from 'react';
import { FileCode2, Copy, Check, Download, Database, Layers, ShieldCheck } from 'lucide-react';

interface SqlModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SqlModal: React.FC<SqlModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const sqlSample = `-- =====================================================================================
-- HỆ THỐNG QUẢN LÝ 100 NHÀ TRỌ & THIẾT BỊ ĐA CẤP (100 BUILDINGS & IOT MANAGEMENT)
-- Hệ Quản Trị CSDL: Microsoft SQL Server (MS SQL Server Express / Standard / Azure SQL)
-- Kiến Trúc: Mô hình Cây Hướng Đối Tượng (Self-Referencing Node Composite Tree)
-- Phân Quyền: 3 Cấp Độ Chặt Chẽ (Admins -> Quản lý Tòa nhà -> Người dùng)
-- =====================================================================================

USE master;
GO

IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'RentalPropertyManagementDB')
BEGIN
    CREATE DATABASE RentalPropertyManagementDB;
END
GO

USE RentalPropertyManagementDB;
GO

-- 1.1 Bảng Phân Quyền (3 Cấp duy nhất: Admins, Quản lý tòa nhà, Người dùng)
CREATE TABLE dbo.Roles (
    RoleId TINYINT PRIMARY KEY,
    RoleCode VARCHAR(30) UNIQUE NOT NULL,      -- 'ADMIN', 'BUILDING_MANAGER', 'TENANT'
    RoleName NVARCHAR(50) NOT NULL,
    Description NVARCHAR(255) NULL
);

-- 1.2 Bảng Tài Khoản Người Dùng (1 người chỉ 1 tài khoản duy nhất qua CCCD)
CREATE TABLE dbo.Users (
    UserId BIGINT IDENTITY(1,1) PRIMARY KEY,
    RoleId TINYINT NOT NULL FOREIGN KEY REFERENCES dbo.Roles(RoleId),
    FullName NVARCHAR(100) NOT NULL,
    CitizenId VARCHAR(20) UNIQUE NOT NULL,     -- Số CCCD (DUY NHẤT)
    CitizenIdFrontImg VARCHAR(255) NULL,       -- URL ảnh mặt trước CCCD
    CitizenIdBackImg VARCHAR(255) NULL,        -- URL ảnh mặt sau CCCD
    PhoneNumber VARCHAR(15) UNIQUE NOT NULL,   -- SĐT đăng nhập (DUY NHẤT)
    Address NVARCHAR(255) NULL,                -- ĐỊA CHỈ THƯỜNG TRÚ / QUÊ QUÁN (MỚI BỔ SUNG)
    PasswordHash VARCHAR(255) NOT NULL,
    IsActive BIT DEFAULT(1),
    CreatedAt DATETIME2 DEFAULT SYSDATETIME()
);

-- 2.1 Bảng Danh mục Loại Đối Tượng mở rộng (ObjectTypes)
-- Khi phát sinh đối tượng mới (WiFi, Trạm sạc, Điện thoại công cộng...), chỉ việc thêm loại vào bảng này mà không sửa code
CREATE TABLE dbo.ObjectTypes (
    TypeId INT IDENTITY(1,1) PRIMARY KEY,
    TypeCode VARCHAR(30) UNIQUE NOT NULL,      -- 'BUILDING', 'FLOOR', 'ROOM', 'WASHING_MACHINE', 'EV_CHARGER', 'PUBLIC_PHONE'
    TypeName NVARCHAR(100) NOT NULL,
    CategoryGroup NVARCHAR(50) NOT NULL,
    MetricUnit NVARCHAR(20) NULL,             -- Đơn vị: Lần, kWh, Khối, Phút, Tháng
    HasSubItems BIT DEFAULT(0)
);

-- 2.2 Bảng Nút Cây Quản Lý Đa Cấp (ManagementNodes)
-- Thiết bị đi theo từng nhà: IsShared = 1 (Dùng chung cả nhà), IsShared = 0 (Lắp trong phòng)
CREATE TABLE dbo.ManagementNodes (
    NodeId BIGINT IDENTITY(1,1) PRIMARY KEY,
    ParentNodeId BIGINT NULL FOREIGN KEY REFERENCES dbo.ManagementNodes(NodeId), -- Đệ quy cây
    TypeId INT NOT NULL FOREIGN KEY REFERENCES dbo.ObjectTypes(TypeId),
    NodeCode VARCHAR(50) NOT NULL,
    NodeName NVARCHAR(150) NOT NULL,
    UnitPrice DECIMAL(12,2) DEFAULT(0),
    DepositAmount DECIMAL(12,2) DEFAULT(0),
    AddressOrLocation NVARCHAR(255) NULL,
    HardwareMacOrTopic VARCHAR(150) NULL,     -- MAC relay IoT mở cổng
    SerialNumber VARCHAR(50) NULL,            -- Số Serial bảo hành
    WarrantyExpiryDate DATE NULL,             -- Hạn bảo hành
    CurrentCondition TINYINT DEFAULT(0),      -- 0: Bình thường, 1: Hay bẩn, 2: Khó dùng, 3: Hư hỏng
    IsShared BIT DEFAULT(1),                  -- 1: Thiết bị dùng chung tòa nhà, 0: Thiết bị trong phòng
    BuildingNodeId BIGINT NULL FOREIGN KEY REFERENCES dbo.ManagementNodes(NodeId), -- Tòa nhà trực thuộc
    RoomNodeId BIGINT NULL FOREIGN KEY REFERENCES dbo.ManagementNodes(NodeId),     -- Phòng lắp đặt (nếu isShared = 0)
    DeviceCategory VARCHAR(50) NULL,          -- Loại: 'AIR_COND', 'FRIDGE', 'WASHING_MACHINE', etc.
    IsActive BIT DEFAULT(1),
    CreatedAt DATETIME2 DEFAULT SYSDATETIME()
);

-- 3.1 Bảng Báo Cáo Tình Trạng Thiết Bị (DeviceHealthFeedbacks)
-- Khách thuê báo hỏng thiết bị phòng mình hoặc máy dùng chung của nhà, không nhầm lẫn với phòng khác
CREATE TABLE dbo.DeviceHealthFeedbacks (
    FeedbackId BIGINT IDENTITY(1,1) PRIMARY KEY,
    NodeId BIGINT NOT NULL FOREIGN KEY REFERENCES dbo.ManagementNodes(NodeId),
    BuildingNodeId BIGINT NULL FOREIGN KEY REFERENCES dbo.ManagementNodes(NodeId),
    RoomNodeId BIGINT NULL FOREIGN KEY REFERENCES dbo.ManagementNodes(NodeId),
    IsSharedDevice BIT DEFAULT(0),            -- 1: Báo hỏng máy dùng chung; 0: Máy trong phòng
    ReportedByUserId BIGINT NOT NULL FOREIGN KEY REFERENCES dbo.Users(UserId),
    IssueType VARCHAR(30) NOT NULL,           -- 'DAMAGED', 'DIRTY', 'DIFFICULT_TO_USE'
    Description NVARCHAR(MAX) NOT NULL,
    Status VARCHAR(20) DEFAULT('PENDING'),    -- 'PENDING', 'IN_PROGRESS', 'RESOLVED'
    CreatedAt DATETIME2 DEFAULT SYSDATETIME()
);

-- 3.2 Bảng Đánh Giá Hai Chiều (TwoWayReviews)
-- Quản lý đánh giá khách đến khi trả phòng thì KHÓA; Khách đánh giá xong KHÓA VĨNH VIỄN
CREATE TABLE dbo.TwoWayReviews (
    ReviewId BIGINT IDENTITY(1,1) PRIMARY KEY,
    ContractId BIGINT NOT NULL,
    ReviewerUserId BIGINT NOT NULL FOREIGN KEY REFERENCES dbo.Users(UserId),
    ReviewerRole VARCHAR(30) NOT NULL,
    TargetUserId BIGINT NOT NULL FOREIGN KEY REFERENCES dbo.Users(UserId),
    Rating TINYINT CHECK (Rating BETWEEN 1 AND 5),
    Comment NVARCHAR(MAX) NOT NULL,
    IsLocked BIT DEFAULT(0),                  -- CỜ KHÓA ĐÁNH GIÁ
    CreatedAt DATETIME2 DEFAULT SYSDATETIME()
);`;

  const handleCopy = () => {
    navigator.clipboard.writeText(sqlSample);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full p-6 space-y-4 shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <FileCode2 className="w-5 h-5 text-cyan-400" />
            <h3 className="font-bold text-white text-base">
              Mã Nguồn CSDL MS SQL Server Express (Đã có cột Address)
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-sm">✕</button>
        </div>

        <div className="text-xs text-slate-400 flex flex-wrap items-center justify-between gap-2">
          <span>
            Vị trí tệp trong dự án: <code>/sql/init_rental_tree_schema.sql</code> (Chạy trực tiếp trên SSMS)
          </span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow transition-all"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Đã sao chép!' : 'Sao chép toàn bộ SQL'}</span>
          </button>
        </div>

        <div className="flex-1 bg-slate-950 p-4 rounded-2xl border border-slate-800 overflow-y-auto font-mono text-xs text-slate-300 leading-relaxed selection:bg-blue-600 selection:text-white">
          <pre>{sqlSample}</pre>
        </div>

        <div className="pt-2 flex justify-between items-center text-xs text-slate-500">
          <span>Chuẩn T-SQL • Tự động tạo quan hệ Foreign Key & Unique Index</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
