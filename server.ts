import express from 'express';
import http from 'http';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import sql from 'mssql';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Biến lưu trạng thái kết nối SQL Server
let sqlPool: sql.ConnectionPool | null = null;
let currentConfig: sql.config | null = null;

// Helper hàm tạo config SQL Server
function getSqlConfig(override?: Partial<sql.config>): sql.config {
  return {
    server: override?.server || process.env.MSSQL_SERVER || 'localhost',
    port: override?.port || parseInt(process.env.MSSQL_PORT || '1433', 10),
    database: override?.database || process.env.MSSQL_DATABASE || 'RentalPropertyManagementDB',
    user: override?.user || process.env.MSSQL_USER || 'sa',
    password: override?.password || process.env.MSSQL_PASSWORD || '',
    options: {
      encrypt: override?.options?.encrypt ?? false, // Cho local SQL Server Express thường tắt encrypt
      trustServerCertificate: true, // Chấp nhận self-signed cert
      connectTimeout: 15000,
      requestTimeout: 30000
    }
  };
}

// 0.1 Tự động tạo bảng nếu chưa có (Khởi tạo lược đồ an toàn)
async function ensureSchemaAndTables(pool: sql.ConnectionPool) {
  await pool.request().query(`
    -- 1. Roles
    IF OBJECT_ID('dbo.Roles', 'U') IS NULL
    BEGIN
      CREATE TABLE dbo.Roles (
        RoleId TINYINT PRIMARY KEY,
        RoleCode VARCHAR(30) UNIQUE NOT NULL,
        RoleName NVARCHAR(50) NOT NULL,
        Description NVARCHAR(255) NULL
      );
    END

    -- 2. Users
    IF OBJECT_ID('dbo.Users', 'U') IS NULL
    BEGIN
      CREATE TABLE dbo.Users (
        UserId BIGINT IDENTITY(1,1) PRIMARY KEY,
        RoleId TINYINT NOT NULL,
        FullName NVARCHAR(100) NOT NULL,
        CitizenId VARCHAR(20) NOT NULL,
        CitizenIdFrontImg VARCHAR(MAX) NULL,
        CitizenIdBackImg VARCHAR(MAX) NULL,
        PhoneNumber VARCHAR(15) NOT NULL,
        Address NVARCHAR(255) NULL,
        PasswordHash VARCHAR(255) NOT NULL DEFAULT('plain_or_hash_123'),
        AvatarUrl VARCHAR(MAX) NULL,
        IsActive BIT DEFAULT(1),
        CreatedAt DATETIME2 DEFAULT SYSDATETIME(),
        UpdatedAt DATETIME2 NULL
      );
    END

    -- 3. ObjectTypes
    IF OBJECT_ID('dbo.ObjectTypes', 'U') IS NULL
    BEGIN
      CREATE TABLE dbo.ObjectTypes (
        TypeId INT IDENTITY(1,1) PRIMARY KEY,
        TypeCode VARCHAR(30) UNIQUE NOT NULL,
        TypeName NVARCHAR(100) NOT NULL,
        CategoryGroup NVARCHAR(50) NOT NULL,
        MetricUnit NVARCHAR(20) NULL,
        HasSubItems BIT DEFAULT(0)
      );
    END

    -- 4. ManagementNodes
    IF OBJECT_ID('dbo.ManagementNodes', 'U') IS NULL
    BEGIN
      CREATE TABLE dbo.ManagementNodes (
        NodeId BIGINT IDENTITY(1,1) PRIMARY KEY,
        ParentNodeId BIGINT NULL,
        TypeId INT NOT NULL,
        NodeCode VARCHAR(50) NOT NULL,
        NodeName NVARCHAR(150) NOT NULL,
        UnitPrice DECIMAL(12,2) DEFAULT(0),
        DepositAmount DECIMAL(12,2) DEFAULT(0),
        AddressOrLocation NVARCHAR(255) NULL,
        HardwareMacOrTopic VARCHAR(150) NULL,
        SerialNumber VARCHAR(50) NULL,
        WarrantyExpiryDate DATE NULL,
        ElectricityRate DECIMAL(12,2) DEFAULT(3800),
        WaterRate DECIMAL(12,2) DEFAULT(30000),
        SanitationFee DECIMAL(12,2) DEFAULT(30000),
        ResidenceFee DECIMAL(12,2) DEFAULT(100000),
        MonthlyRentalPrice DECIMAL(12,2) DEFAULT(0),
        CurrentCondition TINYINT DEFAULT(0),
        IsActive BIT DEFAULT(1),
        CreatedAt DATETIME2 DEFAULT SYSDATETIME()
      );
    END

    -- 5. ManagerBuildingAssignments
    IF OBJECT_ID('dbo.ManagerBuildingAssignments', 'U') IS NULL
    BEGIN
      CREATE TABLE dbo.ManagerBuildingAssignments (
        AssignmentId INT IDENTITY(1,1) PRIMARY KEY,
        ManagerUserId BIGINT NOT NULL,
        BuildingNodeId BIGINT NOT NULL,
        AssignedAt DATETIME2 DEFAULT SYSDATETIME(),
        IsPrimaryManager BIT DEFAULT(1)
      );
    END

    -- 6. RentalContracts
    IF OBJECT_ID('dbo.RentalContracts', 'U') IS NULL
    BEGIN
      CREATE TABLE dbo.RentalContracts (
        ContractId BIGINT IDENTITY(1,1) PRIMARY KEY,
        ContractCode VARCHAR(50) NOT NULL,
        RoomNodeId BIGINT NOT NULL,
        PrimaryTenantId BIGINT NOT NULL,
        ContractStartDate DATE NOT NULL,
        ContractEndDate DATE NOT NULL,
        ActualCheckInDate DATE NULL,
        ActualCheckOutDate DATE NULL,
        AgreedMonthlyPrice DECIMAL(12,2) NOT NULL,
        DepositPaid DECIMAL(12,2) NOT NULL,
        DepositRefunded DECIMAL(12,2) DEFAULT(0),
        ContractStatus TINYINT DEFAULT(1),
        Notes NVARCHAR(500) NULL,
        CreatedAt DATETIME2 DEFAULT SYSDATETIME()
      );
    END

    -- 7. RoomOccupants
    IF OBJECT_ID('dbo.RoomOccupants', 'U') IS NULL
    BEGIN
      CREATE TABLE dbo.RoomOccupants (
        OccupantId BIGINT IDENTITY(1,1) PRIMARY KEY,
        ContractId BIGINT NOT NULL,
        UserId BIGINT NOT NULL,
        Relationship NVARCHAR(50) NULL,
        JoinDate DATE NOT NULL,
        LeaveDate DATE NULL,
        HasGateAccess BIT DEFAULT(1)
      );
    END

    -- 8. MonthlyInvoices
    IF OBJECT_ID('dbo.MonthlyInvoices', 'U') IS NULL
    BEGIN
      CREATE TABLE dbo.MonthlyInvoices (
        InvoiceId BIGINT IDENTITY(1,1) PRIMARY KEY,
        ContractId BIGINT NOT NULL,
        BillingPeriod VARCHAR(10) NOT NULL,
        RoomFee DECIMAL(12,2) NOT NULL,
        RoomDeviceRentalCost DECIMAL(12,2) DEFAULT(0),
        ElectricityFee DECIMAL(12,2) DEFAULT(0),
        WaterFee DECIMAL(12,2) DEFAULT(0),
        SharedServicesFee DECIMAL(12,2) DEFAULT(0),
        TotalAmountDue DECIMAL(12,2) NOT NULL,
        PaymentStatus TINYINT DEFAULT(0),
        IsApproved BIT DEFAULT(0),
        ApprovalStatus VARCHAR(20) DEFAULT('DRAFT'),
        ApprovedAt DATETIME2 NULL,
        ApprovedByManagerId BIGINT NULL,
        IsLocked BIT DEFAULT(0),
        PaidAt DATETIME2 NULL
      );
    END

    -- 9. DeviceHealthFeedbacks
    IF OBJECT_ID('dbo.DeviceHealthFeedbacks', 'U') IS NULL
    BEGIN
      CREATE TABLE dbo.DeviceHealthFeedbacks (
        FeedbackId BIGINT IDENTITY(1,1) PRIMARY KEY,
        NodeId BIGINT NOT NULL,
        ReporterUserId BIGINT NOT NULL,
        FeedbackCategory VARCHAR(30) NOT NULL,
        Severity TINYINT DEFAULT(1),
        IssueDescription NVARCHAR(500) NOT NULL,
        PhotoProofUrl VARCHAR(500) NULL,
        ResolutionStatus VARCHAR(20) DEFAULT('PENDING'),
        ActionTaken NVARCHAR(255) NULL,
        RepairCost DECIMAL(12,2) DEFAULT(0),
        CreatedAt DATETIME2 DEFAULT SYSDATETIME(),
        ResolvedAt DATETIME2 NULL
      );
    END

    -- 10. TwoWayReviews
    IF OBJECT_ID('dbo.TwoWayReviews', 'U') IS NULL
    BEGIN
      CREATE TABLE dbo.TwoWayReviews (
        ReviewId BIGINT IDENTITY(1,1) PRIMARY KEY,
        ContractId BIGINT NOT NULL,
        ReviewType TINYINT NOT NULL,
        ReviewerUserId BIGINT NOT NULL,
        TargetUserId BIGINT NOT NULL,
        RatingScore TINYINT NOT NULL,
        Comment NVARCHAR(1000) NULL,
        IsLocked BIT DEFAULT(0),
        LockedAt DATETIME2 NULL,
        LockedReason NVARCHAR(150) NULL,
        CreatedAt DATETIME2 DEFAULT SYSDATETIME()
      );
    END

    -- 11. BuildingArticles
    IF OBJECT_ID('dbo.BuildingArticles', 'U') IS NULL
    BEGIN
      CREATE TABLE dbo.BuildingArticles (
        ArticleId INT IDENTITY(1,1) PRIMARY KEY,
        AuthorUserId BIGINT NOT NULL,
        BuildingNodeId BIGINT NULL,
        Title NVARCHAR(200) NOT NULL,
        Slug VARCHAR(250) NOT NULL,
        CoverImageUrl VARCHAR(500) NULL,
        ContentHtml NVARCHAR(MAX) NOT NULL,
        IsPublished BIT DEFAULT(1),
        PublishedAt DATETIME2 DEFAULT SYSDATETIME()
      );
    END

    -- 12. RoomReservations
    IF OBJECT_ID('dbo.RoomReservations', 'U') IS NULL
    BEGIN
      CREATE TABLE dbo.RoomReservations (
        ReservationId BIGINT IDENTITY(1,1) PRIMARY KEY,
        RoomNodeId BIGINT NOT NULL,
        BuildingNodeId BIGINT NOT NULL,
        UserId BIGINT NOT NULL,
        RequestedAt DATETIME2 DEFAULT SYSDATETIME(),
        ExpectedCheckInDate DATE NOT NULL,
        MonthlyRent DECIMAL(12,2) DEFAULT(0),
        DepositAmount DECIMAL(12,2) DEFAULT(0),
        Status VARCHAR(20) DEFAULT('PENDING'),
        ContractEndDate DATE NULL
      );
    END

    -- AUTO MIGRATION: Đảm bảo bảng dbo.ManagementNodes có đầy đủ trường MonthlyRentalPrice và các chi phí khác
    IF OBJECT_ID('dbo.ManagementNodes', 'U') IS NOT NULL
    BEGIN
      IF COL_LENGTH('dbo.ManagementNodes', 'MonthlyRentalPrice') IS NULL
        ALTER TABLE dbo.ManagementNodes ADD MonthlyRentalPrice DECIMAL(12,2) DEFAULT(0);
      IF COL_LENGTH('dbo.ManagementNodes', 'SanitationFee') IS NULL
        ALTER TABLE dbo.ManagementNodes ADD SanitationFee DECIMAL(12,2) DEFAULT(30000);
      IF COL_LENGTH('dbo.ManagementNodes', 'ResidenceFee') IS NULL
        ALTER TABLE dbo.ManagementNodes ADD ResidenceFee DECIMAL(12,2) DEFAULT(100000);
      IF COL_LENGTH('dbo.ManagementNodes', 'ElectricityRate') IS NULL
        ALTER TABLE dbo.ManagementNodes ADD ElectricityRate DECIMAL(12,2) DEFAULT(3800);
      IF COL_LENGTH('dbo.ManagementNodes', 'WaterRate') IS NULL
        ALTER TABLE dbo.ManagementNodes ADD WaterRate DECIMAL(12,2) DEFAULT(30000);
    END

    -- AUTO MIGRATION: Đảm bảo bảng dbo.Users có đầy đủ các cột Address, ảnh CCCD
    IF OBJECT_ID('dbo.Users', 'U') IS NOT NULL
    BEGIN
      IF COL_LENGTH('dbo.Users', 'Address') IS NULL
        ALTER TABLE dbo.Users ADD Address NVARCHAR(255) NULL;
      IF COL_LENGTH('dbo.Users', 'CitizenIdFrontImg') IS NULL
        ALTER TABLE dbo.Users ADD CitizenIdFrontImg VARCHAR(MAX) NULL;
      IF COL_LENGTH('dbo.Users', 'CitizenIdBackImg') IS NULL
        ALTER TABLE dbo.Users ADD CitizenIdBackImg VARCHAR(MAX) NULL;
      IF COL_LENGTH('dbo.Users', 'AvatarUrl') IS NULL
        ALTER TABLE dbo.Users ADD AvatarUrl VARCHAR(MAX) NULL;
    END

    -- AUTO MIGRATION: Đảm bảo bảng dbo.RentalContracts có đầy đủ các cột
    IF OBJECT_ID('dbo.RentalContracts', 'U') IS NOT NULL
    BEGIN
      IF COL_LENGTH('dbo.RentalContracts', 'AgreedMonthlyPrice') IS NULL
        ALTER TABLE dbo.RentalContracts ADD AgreedMonthlyPrice DECIMAL(12,2) DEFAULT(0);
      IF COL_LENGTH('dbo.RentalContracts', 'DepositPaid') IS NULL
        ALTER TABLE dbo.RentalContracts ADD DepositPaid DECIMAL(12,2) DEFAULT(0);
      IF COL_LENGTH('dbo.RentalContracts', 'DepositRefunded') IS NULL
        ALTER TABLE dbo.RentalContracts ADD DepositRefunded DECIMAL(12,2) DEFAULT(0);
    END
  `);
}

// 0.2 Hàm Khử Trùng Lặp CSDL (Deduplication) - Xóa triệt để bản ghi trùng
async function deduplicateDatabase(pool: sql.ConnectionPool) {
  try {
    // 1. Đồng nhất mã định danh cũ từ seed script sang mã chuẩn của App để không bị trùng 2 bản ghi cho 1 phòng/thiết bị
    const legacyAliases = [
      { oldCode: 'P201', newCode: 'P201-CG' },
      { oldCode: 'CG01-FAC', newCode: 'TI-CG01' },
      { oldCode: 'CG01-F2', newCode: 'F2-CG01' },
      { oldCode: 'EM-201', newCode: 'MTR-E201' },
      { oldCode: 'WM-201', newCode: 'MTR-W201' },
      { oldCode: 'FR-201', newCode: 'FRG-201' },
      { oldCode: 'WH-201', newCode: 'WHT-201' }
    ];

    for (const alias of legacyAliases) {
      await pool.request().query(`
        IF EXISTS (SELECT 1 FROM dbo.ManagementNodes WHERE NodeCode = '${alias.oldCode}')
           AND EXISTS (SELECT 1 FROM dbo.ManagementNodes WHERE NodeCode = '${alias.newCode}')
        BEGIN
          DECLARE @OldId BIGINT = (SELECT TOP 1 NodeId FROM dbo.ManagementNodes WHERE NodeCode = '${alias.oldCode}');
          DECLARE @NewId BIGINT = (SELECT TOP 1 NodeId FROM dbo.ManagementNodes WHERE NodeCode = '${alias.newCode}');

          -- Cập nhật liên kết cha sang node mới
          UPDATE dbo.ManagementNodes SET ParentNodeId = @NewId WHERE ParentNodeId = @OldId;
          -- Cập nhật hợp đồng
          IF OBJECT_ID('dbo.RentalContracts', 'U') IS NOT NULL
            UPDATE dbo.RentalContracts SET RoomNodeId = @NewId WHERE RoomNodeId = @OldId;
          -- Cập nhật phân công quản lý
          IF OBJECT_ID('dbo.ManagerBuildingAssignments', 'U') IS NOT NULL
            UPDATE dbo.ManagerBuildingAssignments SET BuildingNodeId = @NewId WHERE BuildingNodeId = @OldId;
          -- Cập nhật sự cố thiết bị
          IF OBJECT_ID('dbo.DeviceHealthFeedbacks', 'U') IS NOT NULL
            UPDATE dbo.DeviceHealthFeedbacks SET NodeId = @NewId WHERE NodeId = @OldId;

          -- Xóa node cũ bị trùng
          DELETE FROM dbo.ManagementNodes WHERE NodeId = @OldId;
        END
        ELSE IF EXISTS (SELECT 1 FROM dbo.ManagementNodes WHERE NodeCode = '${alias.oldCode}')
        BEGIN
          UPDATE dbo.ManagementNodes SET NodeCode = '${alias.newCode}' WHERE NodeCode = '${alias.oldCode}';
        END
      `);
    }

    // 2. Khử trùng trong bảng dbo.ManagementNodes theo NodeCode (giữ lại 1 bản ghi duy nhất)
    await pool.request().query(`
      IF OBJECT_ID('dbo.ManagementNodes', 'U') IS NOT NULL
      BEGIN
        ;WITH DupNodes AS (
          SELECT NodeId, NodeCode,
                 ROW_NUMBER() OVER (PARTITION BY NodeCode ORDER BY NodeId ASC) as rn,
                 FIRST_VALUE(NodeId) OVER (PARTITION BY NodeCode ORDER BY NodeId ASC) as keepId
          FROM dbo.ManagementNodes
          WHERE NodeCode IS NOT NULL AND RTRIM(NodeCode) <> ''
        )
        SELECT NodeId, keepId INTO #NodesToDelete FROM DupNodes WHERE rn > 1;

        IF EXISTS (SELECT 1 FROM #NodesToDelete)
        BEGIN
          -- Trỏ lại các liên kết khóa ngoại trước khi xóa
          UPDATE m SET m.ParentNodeId = d.keepId
          FROM dbo.ManagementNodes m
          JOIN #NodesToDelete d ON m.ParentNodeId = d.NodeId;

          IF OBJECT_ID('dbo.RentalContracts', 'U') IS NOT NULL
            UPDATE c SET c.RoomNodeId = d.keepId
            FROM dbo.RentalContracts c
            JOIN #NodesToDelete d ON c.RoomNodeId = d.NodeId;

          IF OBJECT_ID('dbo.ManagerBuildingAssignments', 'U') IS NOT NULL
            UPDATE a SET a.BuildingNodeId = d.keepId
            FROM dbo.ManagerBuildingAssignments a
            JOIN #NodesToDelete d ON a.BuildingNodeId = d.NodeId;

          IF OBJECT_ID('dbo.DeviceHealthFeedbacks', 'U') IS NOT NULL
            UPDATE f SET f.NodeId = d.keepId
            FROM dbo.DeviceHealthFeedbacks f
            JOIN #NodesToDelete d ON f.NodeId = d.NodeId;

          DELETE FROM dbo.ManagementNodes WHERE NodeId IN (SELECT NodeId FROM #NodesToDelete);
        END

        IF OBJECT_ID('tempdb..#NodesToDelete') IS NOT NULL DROP TABLE #NodesToDelete;
      END
    `);

    // 3. Khử trùng trong bảng dbo.Users theo CitizenId hoặc PhoneNumber
    await pool.request().query(`
      IF OBJECT_ID('dbo.Users', 'U') IS NOT NULL
      BEGIN
        ;WITH DupUsers AS (
          SELECT UserId, CitizenId,
                 ROW_NUMBER() OVER (PARTITION BY CitizenId ORDER BY UserId ASC) as rn,
                 FIRST_VALUE(UserId) OVER (PARTITION BY CitizenId ORDER BY UserId ASC) as keepId
          FROM dbo.Users
          WHERE CitizenId IS NOT NULL AND RTRIM(CitizenId) <> ''
        )
        SELECT UserId, keepId INTO #UsersToDelete FROM DupUsers WHERE rn > 1;

        IF EXISTS (SELECT 1 FROM #UsersToDelete)
        BEGIN
          IF OBJECT_ID('dbo.RentalContracts', 'U') IS NOT NULL
            UPDATE c SET c.PrimaryTenantId = d.keepId
            FROM dbo.RentalContracts c
            JOIN #UsersToDelete d ON c.PrimaryTenantId = d.UserId;

          IF OBJECT_ID('dbo.RoomOccupants', 'U') IS NOT NULL
            UPDATE o SET o.UserId = d.keepId
            FROM dbo.RoomOccupants o
            JOIN #UsersToDelete d ON o.UserId = d.UserId;

          IF OBJECT_ID('dbo.ManagerBuildingAssignments', 'U') IS NOT NULL
            UPDATE a SET a.ManagerUserId = d.keepId
            FROM dbo.ManagerBuildingAssignments a
            JOIN #UsersToDelete d ON a.ManagerUserId = d.UserId;

          DELETE FROM dbo.Users WHERE UserId IN (SELECT UserId FROM #UsersToDelete);
        END

        IF OBJECT_ID('tempdb..#UsersToDelete') IS NOT NULL DROP TABLE #UsersToDelete;
      END
    `);
  } catch (err: any) {
    console.warn('[Deduplicate Warning]:', err?.message);
  }
}

// 0.3 Hàm Đồng Bộ Toàn Bộ Dữ Liệu vào MS SQL Server (Deduplicated Comprehensive Sync)
async function syncAllDataToSqlServer(pool: sql.ConnectionPool, payload: any) {
  // 1. Tạo bảng nếu chưa có
  await ensureSchemaAndTables(pool);

  // 2. Khử trùng lặp các bản ghi cũ
  await deduplicateDatabase(pool);

  const { 
    users = [], 
    nodes = [], 
    objectTypes = [], 
    contracts = [], 
    roommates = [], 
    invoices = [], 
    issues = [], 
    reviews = [], 
    posts = [], 
    reservations = [] 
  } = payload || {};

  // 3. Đồng bộ Roles
  await pool.request().query(`
    IF NOT EXISTS (SELECT 1 FROM dbo.Roles WHERE RoleId = 1)
      INSERT INTO dbo.Roles (RoleId, RoleCode, RoleName, Description) VALUES (1, 'ADMIN', N'Quản trị viên cấp cao', N'Toàn quyền quản trị hệ thống');
    IF NOT EXISTS (SELECT 1 FROM dbo.Roles WHERE RoleId = 2)
      INSERT INTO dbo.Roles (RoleId, RoleCode, RoleName, Description) VALUES (2, 'BUILDING_MANAGER', N'Quản lý tòa nhà', N'Quản lý các tòa nhà trọ được phân công');
    IF NOT EXISTS (SELECT 1 FROM dbo.Roles WHERE RoleId = 3)
      INSERT INTO dbo.Roles (RoleId, RoleCode, RoleName, Description) VALUES (3, 'TENANT', N'Khách thuê / Cư dân', N'Khách thuê phòng và người ở cùng');
  `);

  // 4. Đồng bộ ObjectTypes
  if (Array.isArray(objectTypes) && objectTypes.length > 0) {
    for (const ot of objectTypes) {
      const r = pool.request();
      r.input('TypeCode', sql.VarChar(30), ot.typeCode);
      r.input('TypeName', sql.NVarChar(100), ot.typeName);
      r.input('CategoryGroup', sql.NVarChar(50), ot.categoryGroup || 'PROPERTY');
      r.input('MetricUnit', sql.NVarChar(20), ot.metricUnit || null);
      r.input('HasSubItems', sql.Bit, ot.hasSubItems ? 1 : 0);

      await r.query(`
        IF EXISTS (SELECT 1 FROM dbo.ObjectTypes WHERE TypeCode = @TypeCode)
        BEGIN
          UPDATE dbo.ObjectTypes 
          SET TypeName = @TypeName, CategoryGroup = @CategoryGroup, MetricUnit = @MetricUnit, HasSubItems = @HasSubItems
          WHERE TypeCode = @TypeCode;
        END
        ELSE
        BEGIN
          INSERT INTO dbo.ObjectTypes (TypeCode, TypeName, CategoryGroup, MetricUnit, HasSubItems)
          VALUES (@TypeCode, @TypeName, @CategoryGroup, @MetricUnit, @HasSubItems);
        END
      `);
    }
  }

  // 5. Đồng bộ Users (Tránh trùng CCCD & Số điện thoại)
  let usersCount = 0;
  if (Array.isArray(users) && users.length > 0) {
    for (const u of users) {
      if (!u.citizenId) continue;
      const r = pool.request();
      r.input('RoleId', sql.TinyInt, u.roleId || 3);
      r.input('FullName', sql.NVarChar(100), u.fullName || 'Người dùng');
      r.input('CitizenId', sql.VarChar(20), String(u.citizenId).trim());
      r.input('CitizenIdFrontImg', sql.VarChar(sql.MAX), u.citizenIdFrontImg || null);
      r.input('CitizenIdBackImg', sql.VarChar(sql.MAX), u.citizenIdBackImg || null);
      r.input('PhoneNumber', sql.VarChar(15), String(u.phoneNumber || '0900000000').trim());
      r.input('Address', sql.NVarChar(255), u.address || '');
      r.input('AvatarUrl', sql.VarChar(sql.MAX), u.avatarUrl || null);
      r.input('IsActive', sql.Bit, u.isActive !== false ? 1 : 0);

      await r.query(`
        IF EXISTS (SELECT 1 FROM dbo.Users WHERE CitizenId = @CitizenId)
        BEGIN
          UPDATE dbo.Users 
          SET RoleId = @RoleId,
              FullName = @FullName,
              PhoneNumber = @PhoneNumber,
              Address = @Address,
              CitizenIdFrontImg = ISNULL(@CitizenIdFrontImg, CitizenIdFrontImg),
              CitizenIdBackImg = ISNULL(@CitizenIdBackImg, CitizenIdBackImg),
              AvatarUrl = ISNULL(@AvatarUrl, AvatarUrl),
              IsActive = @IsActive
          WHERE CitizenId = @CitizenId;
        END
        ELSE IF EXISTS (SELECT 1 FROM dbo.Users WHERE PhoneNumber = @PhoneNumber)
        BEGIN
          -- Tránh lỗi xung đột UNIQUE PhoneNumber nếu CitizenId thay đổi
          UPDATE dbo.Users 
          SET RoleId = @RoleId,
              FullName = @FullName,
              CitizenId = @CitizenId,
              Address = @Address,
              CitizenIdFrontImg = ISNULL(@CitizenIdFrontImg, CitizenIdFrontImg),
              CitizenIdBackImg = ISNULL(@CitizenIdBackImg, CitizenIdBackImg),
              AvatarUrl = ISNULL(@AvatarUrl, AvatarUrl),
              IsActive = @IsActive
          WHERE PhoneNumber = @PhoneNumber;
        END
        ELSE
        BEGIN
          INSERT INTO dbo.Users (RoleId, FullName, CitizenId, CitizenIdFrontImg, CitizenIdBackImg, PhoneNumber, Address, PasswordHash, AvatarUrl, IsActive)
          VALUES (@RoleId, @FullName, @CitizenId, @CitizenIdFrontImg, @CitizenIdBackImg, @PhoneNumber, @Address, 'plain_or_hash_123', @AvatarUrl, @IsActive);
        END
      `);
      usersCount++;
    }
  }

  // 6. Đồng bộ ManagementNodes (Khử trùng, duy trì cây cha-con đệ quy)
  let nodesCount = 0;
  if (Array.isArray(nodes) && nodes.length > 0) {
    const nodesMap = new Map<number, any>();
    nodes.forEach((n: any) => nodesMap.set(n.nodeId, n));

    // Phân tầng thứ bậc: Root nodes trước (parentNodeId == null), sau đó tới con và cháu
    const roots: any[] = [];
    const children: any[] = [];
    nodes.forEach((n: any) => {
      if (!n.parentNodeId) roots.push(n);
      else children.push(n);
    });
    const sortedNodes = [...roots, ...children];

    for (const item of sortedNodes) {
      if (!item.nodeCode) continue;

      // Tìm nodeCode của cha (nếu có)
      const parentNode = item.parentNodeId ? nodesMap.get(item.parentNodeId) : null;
      const parentCode = parentNode?.nodeCode || null;

      // Với phòng (typeId === 3), unitPrice chính là giá thuê phòng hàng tháng (MonthlyRentalPrice)
      const isRoom = item.typeId === 3;
      const unitPriceVal = item.unitPrice ?? (isRoom ? item.monthlyRentalPrice : 0) ?? 0;
      const monthlyRentalPriceVal = item.monthlyRentalPrice ?? (isRoom ? item.unitPrice : 0) ?? 0;

      const r = pool.request();
      r.input('NodeCode', sql.VarChar(50), String(item.nodeCode).trim());
      r.input('ParentNodeCode', sql.VarChar(50), parentCode ? String(parentCode).trim() : null);
      r.input('TypeId', sql.Int, item.typeId || 1);
      r.input('NodeName', sql.NVarChar(150), item.nodeName || 'Đối tượng');
      r.input('UnitPrice', sql.Decimal(12, 2), unitPriceVal);
      r.input('DepositAmount', sql.Decimal(12, 2), item.depositAmount || 0);
      r.input('AddressOrLocation', sql.NVarChar(255), item.addressOrLocation || '');
      r.input('HardwareMacOrTopic', sql.VarChar(150), item.hardwareMacOrTopic || null);
      r.input('SerialNumber', sql.VarChar(50), item.serialNumber || null);
      r.input('WarrantyExpiryDate', sql.Date, item.warrantyExpiryDate ? new Date(item.warrantyExpiryDate) : null);
      r.input('ElectricityRate', sql.Decimal(12, 2), item.electricRate || 3800);
      r.input('WaterRate', sql.Decimal(12, 2), item.waterRate || 30000);
      r.input('SanitationFee', sql.Decimal(12, 2), item.sanitationFeePerPerson || 30000);
      r.input('ResidenceFee', sql.Decimal(12, 2), item.residenceFeePerPerson || 100000);
      r.input('MonthlyRentalPrice', sql.Decimal(12, 2), monthlyRentalPriceVal);
      r.input('CurrentCondition', sql.TinyInt, item.currentCondition || 0);
      r.input('IsActive', sql.Bit, item.isActive !== false ? 1 : 0);

      await r.query(`
        DECLARE @ResolvedParentId BIGINT = NULL;
        IF @ParentNodeCode IS NOT NULL
        BEGIN
          SELECT TOP 1 @ResolvedParentId = NodeId FROM dbo.ManagementNodes WHERE NodeCode = @ParentNodeCode;
        END

        IF EXISTS (SELECT 1 FROM dbo.ManagementNodes WHERE NodeCode = @NodeCode)
        BEGIN
          UPDATE dbo.ManagementNodes
          SET ParentNodeId = @ResolvedParentId,
              TypeId = @TypeId,
              NodeName = @NodeName,
              UnitPrice = @UnitPrice,
              DepositAmount = @DepositAmount,
              AddressOrLocation = @AddressOrLocation,
              HardwareMacOrTopic = @HardwareMacOrTopic,
              SerialNumber = @SerialNumber,
              WarrantyExpiryDate = @WarrantyExpiryDate,
              ElectricityRate = @ElectricityRate,
              WaterRate = @WaterRate,
              SanitationFee = @SanitationFee,
              ResidenceFee = @ResidenceFee,
              MonthlyRentalPrice = @MonthlyRentalPrice,
              CurrentCondition = @CurrentCondition,
              IsActive = @IsActive
          WHERE NodeCode = @NodeCode;
        END
        ELSE
        BEGIN
          INSERT INTO dbo.ManagementNodes (
            ParentNodeId, TypeId, NodeCode, NodeName, UnitPrice, DepositAmount,
            AddressOrLocation, HardwareMacOrTopic, SerialNumber, WarrantyExpiryDate,
            ElectricityRate, WaterRate, SanitationFee, ResidenceFee,
            MonthlyRentalPrice, CurrentCondition, IsActive
          )
          VALUES (
            @ResolvedParentId, @TypeId, @NodeCode, @NodeName, @UnitPrice, @DepositAmount,
            @AddressOrLocation, @HardwareMacOrTopic, @SerialNumber, @WarrantyExpiryDate,
            @ElectricityRate, @WaterRate, @SanitationFee, @ResidenceFee,
            @MonthlyRentalPrice, @CurrentCondition, @IsActive
          );
        END
      `);
      nodesCount++;
    }

    // Gán phân công quản lý tòa nhà
    for (const item of nodes) {
      if (item.typeId === 1 && item.managerUserId) {
        const mgrUser = users.find((u: any) => u.userId === item.managerUserId);
        const mgrCitizen = mgrUser?.citizenId || null;

        const r = pool.request();
        r.input('BuildingCode', sql.VarChar(50), item.nodeCode);
        r.input('ManagerCitizenId', sql.VarChar(20), mgrCitizen);

        await r.query(`
          DECLARE @BNodeId BIGINT = (SELECT TOP 1 NodeId FROM dbo.ManagementNodes WHERE NodeCode = @BuildingCode);
          DECLARE @MUserId BIGINT = (SELECT TOP 1 UserId FROM dbo.Users WHERE CitizenId = @ManagerCitizenId);
          IF @BNodeId IS NOT NULL AND @MUserId IS NOT NULL
          BEGIN
            IF NOT EXISTS (SELECT 1 FROM dbo.ManagerBuildingAssignments WHERE BuildingNodeId = @BNodeId)
            BEGIN
              INSERT INTO dbo.ManagerBuildingAssignments (ManagerUserId, BuildingNodeId, IsPrimaryManager)
              VALUES (@MUserId, @BNodeId, 1);
            END
            ELSE
            BEGIN
              UPDATE dbo.ManagerBuildingAssignments
              SET ManagerUserId = @MUserId
              WHERE BuildingNodeId = @BNodeId;
            END
          END
        `);
      }
    }
  }

  // 7. Đồng bộ RentalContracts
  let contractsCount = 0;
  if (Array.isArray(contracts) && contracts.length > 0) {
    for (const c of contracts) {
      const roomNode = nodes.find((n: any) => n.nodeId === c.roomNodeId);
      const roomCode = roomNode?.nodeCode || null;
      const tenantUser = users.find((u: any) => u.userId === c.primaryTenantUserId);
      const tenantCitizen = tenantUser?.citizenId || null;
      const contractCode = c.contractCode || `HD-${c.contractId}`;

      const r = pool.request();
      r.input('ContractCode', sql.VarChar(50), contractCode);
      r.input('RoomCode', sql.VarChar(50), roomCode);
      r.input('TenantCitizenId', sql.VarChar(20), tenantCitizen);
      r.input('StartDate', sql.Date, c.startDateContract ? new Date(c.startDateContract) : new Date());
      r.input('EndDate', sql.Date, c.endDateContract ? new Date(c.endDateContract) : new Date());
      r.input('CheckIn', sql.Date, c.actualCheckInDate ? new Date(c.actualCheckInDate) : null);
      r.input('CheckOut', sql.Date, c.actualCheckOutDate ? new Date(c.actualCheckOutDate) : null);
      r.input('MonthlyRent', sql.Decimal(12, 2), c.monthlyRent || 0);
      r.input('DepositPaid', sql.Decimal(12, 2), c.depositAmount || 0);
      r.input('Status', sql.TinyInt, c.status === 'ACTIVE' ? 1 : c.status === 'CHECKED_OUT' ? 2 : 0);
      r.input('Notes', sql.NVarChar(500), c.notes || null);

      await r.query(`
        DECLARE @RNodeId BIGINT = (SELECT TOP 1 NodeId FROM dbo.ManagementNodes WHERE NodeCode = @RoomCode);
        DECLARE @TUserId BIGINT = (SELECT TOP 1 UserId FROM dbo.Users WHERE CitizenId = @TenantCitizenId);

        IF @RNodeId IS NOT NULL AND @TUserId IS NOT NULL
        BEGIN
          IF EXISTS (SELECT 1 FROM dbo.RentalContracts WHERE ContractCode = @ContractCode)
          BEGIN
            UPDATE dbo.RentalContracts
            SET RoomNodeId = @RNodeId,
                PrimaryTenantId = @TUserId,
                ContractStartDate = @StartDate,
                ContractEndDate = @EndDate,
                ActualCheckInDate = @CheckIn,
                ActualCheckOutDate = @CheckOut,
                AgreedMonthlyPrice = @MonthlyRent,
                DepositPaid = @DepositPaid,
                ContractStatus = @Status,
                Notes = @Notes
            WHERE ContractCode = @ContractCode;
          END
          ELSE
          BEGIN
            INSERT INTO dbo.RentalContracts (
              ContractCode, RoomNodeId, PrimaryTenantId, ContractStartDate, 
              ContractEndDate, ActualCheckInDate, ActualCheckOutDate, 
              AgreedMonthlyPrice, DepositPaid, ContractStatus, Notes
            )
            VALUES (
              @ContractCode, @RNodeId, @TUserId, @StartDate, 
              @EndDate, @CheckIn, @CheckOut, 
              @MonthlyRent, @DepositPaid, @Status, @Notes
            );
          END
        END
      `);
      contractsCount++;
    }
  }

  // 8. Đồng bộ Roommates (RoomOccupants)
  let roommatesCount = 0;
  if (Array.isArray(roommates) && roommates.length > 0) {
    for (const rm of roommates) {
      const tenantUser = users.find((u: any) => u.userId === rm.userId);
      const tenantCitizen = tenantUser?.citizenId || rm.citizenId;

      const r = pool.request();
      r.input('ContractId', sql.BigInt, rm.contractId);
      r.input('TenantCitizenId', sql.VarChar(20), tenantCitizen);
      r.input('Relationship', sql.NVarChar(50), rm.relationship || 'Bạn cùng phòng');
      r.input('JoinDate', sql.Date, rm.joinedAt ? new Date(rm.joinedAt) : new Date());
      r.input('HasGateAccess', sql.Bit, rm.hasGateAccess ? 1 : 0);

      await r.query(`
        DECLARE @OUserId BIGINT = (SELECT TOP 1 UserId FROM dbo.Users WHERE CitizenId = @TenantCitizenId);
        IF @OUserId IS NOT NULL
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM dbo.RoomOccupants WHERE ContractId = @ContractId AND UserId = @OUserId)
          BEGIN
            INSERT INTO dbo.RoomOccupants (ContractId, UserId, Relationship, JoinDate, HasGateAccess)
            VALUES (@ContractId, @OUserId, @Relationship, @JoinDate, @HasGateAccess);
          END
          ELSE
          BEGIN
            UPDATE dbo.RoomOccupants
            SET Relationship = @Relationship, HasGateAccess = @HasGateAccess
            WHERE ContractId = @ContractId AND UserId = @OUserId;
          END
        END
      `);
      roommatesCount++;
    }
  }

  // 9. Đồng bộ Hóa đơn (MonthlyInvoices)
  let invoicesCount = 0;
  if (Array.isArray(invoices) && invoices.length > 0) {
    for (const inv of invoices) {
      const period = inv.monthYear || '09/2026';
      const r = pool.request();
      r.input('ContractId', sql.BigInt, inv.contractId || 1);
      r.input('BillingPeriod', sql.VarChar(10), period);
      r.input('RoomFee', sql.Decimal(12, 2), inv.roomRent || 0);
      r.input('RoomDeviceCost', sql.Decimal(12, 2), inv.roomDeviceRentalCost || 0);
      r.input('ElecFee', sql.Decimal(12, 2), (inv.currElectric - inv.prevElectric) * (inv.electricRate || 3800));
      r.input('WaterFee', sql.Decimal(12, 2), (inv.currWater - inv.prevWater) * (inv.waterRate || 30000));
      r.input('SharedCost', sql.Decimal(12, 2), inv.sharedDeviceCost || 0);
      r.input('TotalAmount', sql.Decimal(12, 2), inv.totalAmount || 0);
      r.input('PaymentStatus', sql.TinyInt, inv.status === 'PAID' ? 1 : 0);
      r.input('IsApproved', sql.Bit, inv.isApproved ? 1 : 0);
      r.input('ApprovalStatus', sql.VarChar(20), inv.approvalStatus || 'APPROVED');
      r.input('IsLocked', sql.Bit, inv.isLocked ? 1 : 0);

      await r.query(`
        IF EXISTS (SELECT 1 FROM dbo.MonthlyInvoices WHERE ContractId = @ContractId AND BillingPeriod = @BillingPeriod)
        BEGIN
          UPDATE dbo.MonthlyInvoices
          SET RoomFee = @RoomFee,
              RoomDeviceRentalCost = @RoomDeviceCost,
              ElectricityFee = @ElecFee,
              WaterFee = @WaterFee,
              SharedServicesFee = @SharedCost,
              TotalAmountDue = @TotalAmount,
              PaymentStatus = @PaymentStatus,
              IsApproved = @IsApproved,
              ApprovalStatus = @ApprovalStatus,
              IsLocked = @IsLocked
          WHERE ContractId = @ContractId AND BillingPeriod = @BillingPeriod;
        END
        ELSE
        BEGIN
          INSERT INTO dbo.MonthlyInvoices (
            ContractId, BillingPeriod, RoomFee, RoomDeviceRentalCost,
            ElectricityFee, WaterFee, SharedServicesFee, TotalAmountDue,
            PaymentStatus, IsApproved, ApprovalStatus, IsLocked
          )
          VALUES (
            @ContractId, @BillingPeriod, @RoomFee, @RoomDeviceCost,
            @ElecFee, @WaterFee, @SharedCost, @TotalAmount,
            @PaymentStatus, @IsApproved, @ApprovalStatus, @IsLocked
          );
        END
      `);
      invoicesCount++;
    }
  }

  // 10. Đồng bộ Báo cáo sự cố (DeviceHealthFeedbacks)
  let issuesCount = 0;
  if (Array.isArray(issues) && issues.length > 0) {
    for (const iss of issues) {
      const node = nodes.find((n: any) => n.nodeId === iss.nodeId);
      const nodeCode = node?.nodeCode || null;
      const reporterUser = users.find((u: any) => u.userId === iss.reportedByUserId);
      const repCitizen = reporterUser?.citizenId || null;

      const r = pool.request();
      r.input('NodeCode', sql.VarChar(50), nodeCode);
      r.input('ReporterCitizenId', sql.VarChar(20), repCitizen);
      r.input('Category', sql.VarChar(30), iss.issueType || 'DAMAGED');
      r.input('Description', sql.NVarChar(500), iss.description || 'Sự cố thiết bị');
      r.input('Status', sql.VarChar(20), iss.status || 'PENDING');

      await r.query(`
        DECLARE @TNodeId BIGINT = (SELECT TOP 1 NodeId FROM dbo.ManagementNodes WHERE NodeCode = @NodeCode);
        DECLARE @RptUserId BIGINT = (SELECT TOP 1 UserId FROM dbo.Users WHERE CitizenId = @ReporterCitizenId);
        IF @TNodeId IS NOT NULL AND @RptUserId IS NOT NULL
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM dbo.DeviceHealthFeedbacks WHERE NodeId = @TNodeId AND ReporterUserId = @RptUserId AND IssueDescription = @Description)
          BEGIN
            INSERT INTO dbo.DeviceHealthFeedbacks (NodeId, ReporterUserId, FeedbackCategory, IssueDescription, ResolutionStatus)
            VALUES (@TNodeId, @RptUserId, @Category, @Description, @Status);
          END
          ELSE
          BEGIN
            UPDATE dbo.DeviceHealthFeedbacks
            SET ResolutionStatus = @Status
            WHERE NodeId = @TNodeId AND ReporterUserId = @RptUserId AND IssueDescription = @Description;
          END
        END
      `);
      issuesCount++;
    }
  }

  // 11. Đồng bộ Đặt trước / Giữ phòng (RoomReservations)
  let reservationsCount = 0;
  if (Array.isArray(reservations) && reservations.length > 0) {
    for (const resItem of reservations) {
      const room = nodes.find((n: any) => n.nodeId === resItem.roomNodeId);
      const rCode = room?.nodeCode || null;
      const bldg = nodes.find((n: any) => n.nodeId === resItem.buildingNodeId);
      const bCode = bldg?.nodeCode || null;
      const usr = users.find((u: any) => u.userId === resItem.userId);
      const uCitizen = usr?.citizenId || resItem.userCitizenId || null;

      const r = pool.request();
      r.input('RoomCode', sql.VarChar(50), rCode);
      r.input('BuildingCode', sql.VarChar(50), bCode);
      r.input('CitizenId', sql.VarChar(20), uCitizen);
      r.input('ExpectedDate', sql.Date, resItem.expectedCheckInDate ? new Date(resItem.expectedCheckInDate) : new Date());
      r.input('Rent', sql.Decimal(12, 2), resItem.monthlyRent || 0);
      r.input('Deposit', sql.Decimal(12, 2), resItem.depositAmount || 0);
      r.input('Status', sql.VarChar(20), resItem.status || 'PENDING');

      await r.query(`
        DECLARE @ResRoomId BIGINT = (SELECT TOP 1 NodeId FROM dbo.ManagementNodes WHERE NodeCode = @RoomCode);
        DECLARE @ResBldgId BIGINT = (SELECT TOP 1 NodeId FROM dbo.ManagementNodes WHERE NodeCode = @BuildingCode);
        DECLARE @ResUserId BIGINT = (SELECT TOP 1 UserId FROM dbo.Users WHERE CitizenId = @CitizenId);

        IF @ResRoomId IS NOT NULL AND @ResUserId IS NOT NULL
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM dbo.RoomReservations WHERE RoomNodeId = @ResRoomId AND UserId = @ResUserId)
          BEGIN
            INSERT INTO dbo.RoomReservations (RoomNodeId, BuildingNodeId, UserId, ExpectedCheckInDate, MonthlyRent, DepositAmount, Status)
            VALUES (@ResRoomId, ISNULL(@ResBldgId, 1), @ResUserId, @ExpectedDate, @Rent, @Deposit, @Status);
          END
          ELSE
          BEGIN
            UPDATE dbo.RoomReservations
            SET ExpectedCheckInDate = @ExpectedDate, MonthlyRent = @Rent, DepositAmount = @Deposit, Status = @Status
            WHERE RoomNodeId = @ResRoomId AND UserId = @ResUserId;
          END
        END
      `);
      reservationsCount++;
    }
  }

  return {
    success: true,
    message: `Đã cập nhật toàn bộ dữ liệu vào CSDL MS SQL Server thành công! Khử sạch trùng lặp, bảo toàn cây đệ quy đa cấp.`,
    counts: {
      users: usersCount,
      nodes: nodesCount,
      contracts: contractsCount,
      invoices: invoicesCount,
      roommates: roommatesCount,
      issues: issuesCount,
      reservations: reservationsCount
    }
  };
}

// 1. API: Đăng nhập & Kiểm tra kết nối tới MS SQL Server
// TÍNH NĂNG MỚI: Tự động cập nhật mọi dữ liệu vào CSDL ngay sau khi đăng nhập thành công
app.post('/api/sql/test-connection', async (req, res) => {
  const { server, port, database, user, password, encrypt, autoSync, payload } = req.body;
  const config = getSqlConfig({
    server,
    port: port ? parseInt(port, 10) : 1433,
    database: database || 'RentalPropertyManagementDB',
    user,
    password,
    options: {
      encrypt: encrypt === true,
      trustServerCertificate: true
    }
  });

  try {
    // Đóng pool cũ nếu có
    if (sqlPool) {
      await sqlPool.close().catch(() => {});
      sqlPool = null;
    }

    const pool = await new sql.ConnectionPool(config).connect();
    sqlPool = pool;
    currentConfig = config;

    // Lấy thông tin phiên bản SQL Server & database hiện tại
    const result = await pool.request().query(`
      SELECT 
        @@VERSION AS SqlVersion,
        DB_NAME() AS DatabaseName,
        CONVERT(VARCHAR(30), GETDATE(), 120) AS ServerTime,
        (SELECT COUNT(*) FROM sys.tables) AS TableCount
    `);

    // Lấy danh sách các bảng đã tạo
    const tablesResult = await pool.request().query(`
      SELECT TABLE_NAME, TABLE_TYPE 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = 'dbo'
      ORDER BY TABLE_NAME
    `);

    let syncResult: any = null;
    // NẾU CÓ DỮ LIỆU HOẶC autoSync ĐƯỢC BẬT: CẬP NHẬT NGAY VÀO CSDL SAU KHI ĐĂNG NHẬP
    if (payload && (autoSync !== false)) {
      try {
        syncResult = await syncAllDataToSqlServer(pool, payload);
      } catch (syncErr: any) {
        console.error('[Auto Sync After Login Error]:', syncErr);
        syncResult = {
          success: false,
          message: 'Lỗi khi tự động cập nhật dữ liệu vào CSDL: ' + syncErr.message
        };
      }
    }

    return res.json({
      success: true,
      connected: true,
      message: syncResult?.success 
        ? 'Đăng nhập kết nối SQL Server thành công và đã tự động cập nhật toàn bộ dữ liệu vào CSDL!' 
        : 'Kết nối MS SQL Server thành công!',
      syncResult,
      serverInfo: {
        server: config.server,
        port: config.port,
        database: config.database,
        user: config.user,
        version: result.recordset[0]?.SqlVersion || 'MS SQL Server',
        databaseName: result.recordset[0]?.DatabaseName,
        serverTime: result.recordset[0]?.ServerTime,
        tableCount: result.recordset[0]?.TableCount || 0,
        tables: tablesResult.recordset.map((t: any) => t.TABLE_NAME)
      }
    });
  } catch (error: any) {
    sqlPool = null;
    return res.status(200).json({
      success: false,
      connected: false,
      message: error?.message || 'Không thể kết nối tới MS SQL Server.',
      errorCode: error?.code,
      errorDetails: {
        server: config.server,
        port: config.port,
        database: config.database,
        hint: getTroubleshootingHint(error)
      }
    });
  }
});

// Helper gợi ý sửa lỗi kết nối SQL Server
function getTroubleshootingHint(err: any): string {
  const msg = err?.message || '';
  if (msg.includes('ELOGIN') || msg.includes('Login failed')) {
    return 'Sai tài khoản hoặc mật khẩu SQL Server (thường là sa). Hãy kiểm tra SQL Server Authentication có bật Mixed Mode hay chưa.';
  }
  if (msg.includes('ESOCKET') || msg.includes('Failed to connect') || msg.includes('ECONNREFUSED')) {
    return 'Không thể kết nối TCP tới cổng 1433. Hãy mở "SQL Server Configuration Manager" -> "SQL Server Network Configuration" -> Bật "TCP/IP" -> Đặt TCP Port = 1433 và Restart SQL Server service.';
  }
  if (msg.includes('Cannot open database')) {
    return 'Database chưa được tạo. Hãy chạy lệnh CREATE DATABASE RentalPropertyManagementDB trên SQL Server Management Studio (SSMS).';
  }
  return 'Hãy đảm bảo MS SQL Server Express đang bật, dịch vụ SQL Server Browser hoạt động và tường lửa Windows cho phép cổng 1433.';
}

// 2. API: Lấy trạng thái kết nối SQL hiện thời
app.get('/api/sql/status', async (_req, res) => {
  if (!sqlPool || !sqlPool.connected) {
    return res.json({
      connected: false,
      message: 'Chưa có phiên kết nối trực tiếp MS SQL Server nào đang mở.',
      currentConfig: currentConfig ? {
        server: currentConfig.server,
        database: currentConfig.database,
        user: currentConfig.user
      } : null
    });
  }

  try {
    const result = await sqlPool.request().query('SELECT DB_NAME() AS db, GETDATE() as now');
    return res.json({
      connected: true,
      database: result.recordset[0]?.db,
      serverTime: result.recordset[0]?.now
    });
  } catch {
    return res.json({ connected: false });
  }
});

// 3. API: Đồng bộ / Lưu người dùng (Users) trực tiếp vào SQL Server
app.post('/api/sql/sync-user', async (req, res) => {
  if (!sqlPool || !sqlPool.connected) {
    return res.status(400).json({
      success: false,
      message: 'Chưa kết nối tới MS SQL Server. Vui lòng kết nối trước.'
    });
  }

  const { fullName, citizenId, citizenIdFrontImg, citizenIdBackImg, phoneNumber, address, roleId } = req.body;

  try {
    const request = sqlPool.request();
    request.input('RoleId', sql.TinyInt, roleId || 3);
    request.input('FullName', sql.NVarChar(100), fullName);
    request.input('CitizenId', sql.VarChar(20), citizenId);
    request.input('CitizenIdFrontImg', sql.VarChar(sql.MAX), citizenIdFrontImg || null);
    request.input('CitizenIdBackImg', sql.VarChar(sql.MAX), citizenIdBackImg || null);
    request.input('PhoneNumber', sql.VarChar(15), phoneNumber);
    request.input('Address', sql.NVarChar(255), address);
    request.input('PasswordHash', sql.VarChar(255), 'plain_or_hash_123');

    const result = await request.query(`
      IF NOT EXISTS (SELECT 1 FROM dbo.Users WHERE CitizenId = @CitizenId)
      BEGIN
        INSERT INTO dbo.Users (RoleId, FullName, CitizenId, CitizenIdFrontImg, CitizenIdBackImg, PhoneNumber, Address, PasswordHash, IsActive)
        VALUES (@RoleId, @FullName, @CitizenId, @CitizenIdFrontImg, @CitizenIdBackImg, @PhoneNumber, @Address, @PasswordHash, 1);
        SELECT SCOPE_IDENTITY() AS NewUserId, 'INSERTED' AS Operation;
      END
      ELSE
      BEGIN
        UPDATE dbo.Users 
        SET FullName = @FullName, 
            PhoneNumber = @PhoneNumber, 
            Address = @Address,
            CitizenIdFrontImg = ISNULL(@CitizenIdFrontImg, CitizenIdFrontImg),
            CitizenIdBackImg = ISNULL(@CitizenIdBackImg, CitizenIdBackImg)
        WHERE CitizenId = @CitizenId;
        SELECT UserId AS NewUserId, 'UPDATED' AS Operation FROM dbo.Users WHERE CitizenId = @CitizenId;
      END
    `);

    return res.json({
      success: true,
      message: 'Đã lưu tài khoản và trường Address vào MS SQL Server thành công!',
      data: result.recordset[0]
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lưu vào bảng dbo.Users trên SQL Server: ' + error.message
    });
  }
});

// 4. API: Đồng bộ Tòa nhà (Building Node) vào bảng ManagementNodes trên SQL Server
app.post('/api/sql/sync-building', async (req, res) => {
  if (!sqlPool || !sqlPool.connected) {
    return res.status(400).json({
      success: false,
      message: 'Chưa kết nối tới MS SQL Server.'
    });
  }

  const { nodeCode, nodeName, addressOrLocation, managerUserId } = req.body;

  try {
    const request = sqlPool.request();
    request.input('NodeCode', sql.VarChar(50), nodeCode);
    request.input('NodeName', sql.NVarChar(150), nodeName);
    request.input('AddressOrLocation', sql.NVarChar(255), addressOrLocation);
    request.input('ManagerUserId', sql.BigInt, managerUserId || 4);

    const result = await request.query(`
      IF NOT EXISTS (SELECT 1 FROM dbo.ManagementNodes WHERE NodeCode = @NodeCode)
      BEGIN
        INSERT INTO dbo.ManagementNodes (ParentNodeId, TypeId, NodeCode, NodeName, UnitPrice, DepositAmount, AddressOrLocation, CurrentCondition, IsActive)
        VALUES (NULL, 1, @NodeCode, @NodeName, 0, 0, @AddressOrLocation, 0, 1);
        
        DECLARE @NewNodeId BIGINT = SCOPE_IDENTITY();
        
        IF @ManagerUserId IS NOT NULL
        BEGIN
          INSERT INTO dbo.ManagerBuildingAssignments (ManagerUserId, BuildingNodeId, IsPrimaryManager)
          VALUES (@ManagerUserId, @NewNodeId, 1);
        END

        SELECT @NewNodeId AS NodeId, 'INSERTED' AS Operation;
      END
      ELSE
      BEGIN
        UPDATE dbo.ManagementNodes
        SET NodeName = @NodeName, AddressOrLocation = @AddressOrLocation
        WHERE NodeCode = @NodeCode;

        SELECT NodeId, 'UPDATED' AS Operation FROM dbo.ManagementNodes WHERE NodeCode = @NodeCode;
      END
    `);

    return res.json({
      success: true,
      message: 'Đã lưu tòa nhà vào bảng dbo.ManagementNodes trên SQL Server!',
      data: result.recordset[0]
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lưu tòa nhà vào SQL Server: ' + error.message
    });
  }
});

// 5. API: Khởi tạo bảng & nạp cấu trúc từ init_rental_tree_schema.sql
app.post('/api/sql/init-schema', async (_req, res) => {
  if (!sqlPool || !sqlPool.connected) {
    return res.status(400).json({ success: false, message: 'Chưa kết nối tới MS SQL Server. Vui lòng kết nối trước.' });
  }

  try {
    const schemaPath = path.resolve(__dirname, 'sql', 'init_rental_tree_schema.sql');
    if (!fs.existsSync(schemaPath)) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy file sql/init_rental_tree_schema.sql' });
    }

    let fileContent = fs.readFileSync(schemaPath, 'utf8');
    // Bỏ dòng USE master và USE RentalPropertyManagementDB
    fileContent = fileContent.replace(/^\s*USE\s+[^\r\n;]+;?/gim, '');

    // Cắt từng khối theo GO
    const batches = fileContent
      .split(/^\s*GO\s*$/gim)
      .map((b) => b.trim())
      .filter((b) => b.length > 0);

    for (const batch of batches) {
      if (batch) {
        try {
          await sqlPool.request().query(batch);
        } catch (bErr: any) {
          console.warn('[init-schema warning]:', bErr?.message);
        }
      }
    }

    const chk = await sqlPool.request().query('SELECT COUNT(*) AS TableCount FROM sys.tables');
    const tableCount = chk.recordset[0]?.TableCount || 0;

    return res.json({
      success: true,
      message: `Khởi tạo CSDL thành công! Đã tạo và cấu hình ${tableCount} bảng trên SQL Server.`,
      tableCount
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi thực thi khởi tạo CSDL: ' + error.message
    });
  }
});

// 6. API: Kéo toàn bộ dữ liệu từ SQL Server về Web (Pull Data)
app.get('/api/sql/pull-all-data', async (_req, res) => {
  if (!sqlPool || !sqlPool.connected) {
    return res.status(400).json({ success: false, message: 'Chưa kết nối tới MS SQL Server.' });
  }

  try {
    const chk = await sqlPool.request().query(`
      SELECT 
        (SELECT COUNT(*) FROM sys.tables WHERE name = 'Users') AS HasUsers,
        (SELECT COUNT(*) FROM sys.tables WHERE name = 'ManagementNodes') AS HasNodes,
        (SELECT COUNT(*) FROM sys.tables WHERE name = 'RentalContracts') AS HasContracts,
        (SELECT COUNT(*) FROM sys.tables WHERE name = 'RoomOccupants') AS HasOccupants,
        (SELECT COUNT(*) FROM sys.tables WHERE name = 'MonthlyInvoices') AS HasInvoices,
        (SELECT COUNT(*) FROM sys.tables WHERE name = 'DeviceHealthFeedbacks') AS HasIssues,
        (SELECT COUNT(*) FROM sys.tables WHERE name = 'RoomReservations') AS HasReservations
    `);

    const hasUsers = (chk.recordset[0]?.HasUsers || 0) > 0;
    const hasNodes = (chk.recordset[0]?.HasNodes || 0) > 0;
    const hasContracts = (chk.recordset[0]?.HasContracts || 0) > 0;
    const hasOccupants = (chk.recordset[0]?.HasOccupants || 0) > 0;
    const hasInvoices = (chk.recordset[0]?.HasInvoices || 0) > 0;
    const hasIssues = (chk.recordset[0]?.HasIssues || 0) > 0;
    const hasReservations = (chk.recordset[0]?.HasReservations || 0) > 0;

    if (!hasUsers || !hasNodes) {
      return res.json({
        success: true,
        hasData: false,
        message: 'Các bảng dữ liệu (Users, ManagementNodes) chưa được tạo trong CSDL.'
      });
    }

    // 1. Users
    const usersResult = await sqlPool.request().query(`
      SELECT UserId, RoleId, FullName, CitizenId, CitizenIdFrontImg, CitizenIdBackImg, PhoneNumber, Address, AvatarUrl, IsActive, CreatedAt
      FROM dbo.Users
      ORDER BY UserId ASC
    `);
    const users = usersResult.recordset.map((u: any) => ({
      userId: Number(u.UserId),
      roleId: Number(u.RoleId),
      fullName: u.FullName,
      citizenId: u.CitizenId,
      citizenIdFrontImg: u.CitizenIdFrontImg,
      citizenIdBackImg: u.CitizenIdBackImg,
      phoneNumber: u.PhoneNumber,
      address: u.Address || '',
      avatarUrl: u.AvatarUrl,
      isActive: Boolean(u.IsActive),
      createdAt: u.CreatedAt ? new Date(u.CreatedAt).toISOString().split('T')[0] : '2026-08-01'
    }));

    // 2. Nodes
    const nodesResult = await sqlPool.request().query(`
      SELECT m.*, a.ManagerUserId
      FROM dbo.ManagementNodes m
      LEFT JOIN dbo.ManagerBuildingAssignments a ON m.NodeId = a.BuildingNodeId
      ORDER BY m.NodeId ASC
    `);

    // Tạo map để suy ra buildingNodeId và roomNodeId cho thiết bị
    const rawNodes = nodesResult.recordset;
    const rawMap = new Map<number, any>();
    rawNodes.forEach((r: any) => rawMap.set(Number(r.NodeId), r));

    const nodes = rawNodes.map((n: any) => {
      const nId = Number(n.NodeId);
      const pId = n.ParentNodeId ? Number(n.ParentNodeId) : null;
      const typeId = Number(n.TypeId);

      // Tìm buildingNodeId và roomNodeId
      let buildingId: number | undefined = undefined;
      let roomId: number | null = null;

      if (typeId === 1) {
        buildingId = nId;
      } else {
        let curr = pId;
        while (curr) {
          const p = rawMap.get(curr);
          if (p) {
            if (Number(p.TypeId) === 3 && roomId === null) {
              roomId = Number(p.NodeId);
            }
            if (Number(p.TypeId) === 1) {
              buildingId = Number(p.NodeId);
              break;
            }
            curr = p.ParentNodeId ? Number(p.ParentNodeId) : null;
          } else {
            break;
          }
        }
      }

      const isSharedDevice = typeId >= 4 ? (roomId === null) : false;

      const rawUnitPrice = n.UnitPrice !== null ? Number(n.UnitPrice) : 0;
      const rawMonthlyRent = n.MonthlyRentalPrice !== null ? Number(n.MonthlyRentalPrice) : 0;
      const effUnitPrice = rawUnitPrice > 0 ? rawUnitPrice : (typeId === 3 ? rawMonthlyRent : 0);
      const effMonthlyRent = rawMonthlyRent > 0 ? rawMonthlyRent : (typeId === 3 ? rawUnitPrice : 0);

      return {
        nodeId: nId,
        parentNodeId: pId,
        typeId,
        nodeCode: n.NodeCode,
        nodeName: n.NodeName,
        unitPrice: effUnitPrice,
        depositAmount: n.DepositAmount !== null ? Number(n.DepositAmount) : 0,
        addressOrLocation: n.AddressOrLocation || '',
        hardwareMacOrTopic: n.HardwareMacOrTopic || '',
        serialNumber: n.SerialNumber || '',
        warrantyExpiryDate: n.WarrantyExpiryDate ? new Date(n.WarrantyExpiryDate).toISOString().split('T')[0] : undefined,
        currentCondition: Number(n.CurrentCondition || 0),
        isActive: Boolean(n.IsActive),
        createdAt: n.CreatedAt ? new Date(n.CreatedAt).toISOString().split('T')[0] : '2026-08-01',
        managerUserId: n.ManagerUserId ? Number(n.ManagerUserId) : undefined,
        electricRate: n.ElectricityRate !== null ? Number(n.ElectricityRate) : 3800,
        waterRate: n.WaterRate !== null ? Number(n.WaterRate) : 30000,
        sanitationFeePerPerson: n.SanitationFee !== null ? Number(n.SanitationFee) : 30000,
        residenceFeePerPerson: n.ResidenceFee !== null ? Number(n.ResidenceFee) : 100000,
        monthlyRentalPrice: effMonthlyRent,
        isShared: isSharedDevice,
        buildingNodeId: buildingId,
        roomNodeId: roomId
      };
    });

    // 3. Contracts
    let contracts: any[] = [];
    if (hasContracts) {
      const contractsResult = await sqlPool.request().query(`
        SELECT c.*, u.FullName AS TenantName, r.NodeName AS RoomName, r.NodeCode AS RoomNodeCode
        FROM dbo.RentalContracts c
        LEFT JOIN dbo.Users u ON c.PrimaryTenantId = u.UserId
        LEFT JOIN dbo.ManagementNodes r ON c.RoomNodeId = r.NodeId
        ORDER BY c.ContractId ASC
      `);
      contracts = contractsResult.recordset.map((c: any) => ({
        contractId: Number(c.ContractId),
        contractCode: c.ContractCode,
        roomNodeId: Number(c.RoomNodeId),
        roomName: c.RoomName || `Phòng ${c.RoomNodeCode || c.RoomNodeId}`,
        primaryTenantUserId: Number(c.PrimaryTenantId),
        primaryTenantName: c.TenantName || 'Khách Thuê',
        startDateContract: c.ContractStartDate ? new Date(c.ContractStartDate).toISOString().split('T')[0] : '2026-09-01',
        endDateContract: c.ContractEndDate ? new Date(c.ContractEndDate).toISOString().split('T')[0] : '2027-02-28',
        actualCheckInDate: c.ActualCheckInDate ? new Date(c.ActualCheckInDate).toISOString().split('T')[0] : '2026-08-28',
        actualCheckOutDate: c.ActualCheckOutDate ? new Date(c.ActualCheckOutDate).toISOString().split('T')[0] : null,
        monthlyRent: Number(c.AgreedMonthlyPrice || 0),
        depositAmount: Number(c.DepositPaid || 0),
        status: c.ContractStatus === 1 ? 'ACTIVE' : c.ContractStatus === 2 ? 'CHECKED_OUT' : 'PENDING',
        notes: c.Notes || ''
      }));
    }

    // 4. Roommates (RoomOccupants)
    let roommates: any[] = [];
    if (hasOccupants) {
      const occResult = await sqlPool.request().query(`
        SELECT o.*, u.FullName, u.PhoneNumber, u.CitizenId
        FROM dbo.RoomOccupants o
        LEFT JOIN dbo.Users u ON o.UserId = u.UserId
      `);
      roommates = occResult.recordset.map((o: any) => ({
        occupantId: Number(o.OccupantId),
        contractId: Number(o.ContractId),
        userId: Number(o.UserId),
        fullName: o.FullName || 'Người ở cùng',
        phoneNumber: o.PhoneNumber || '',
        citizenId: o.CitizenId || '',
        relationship: o.Relationship || 'Bạn cùng phòng',
        joinedAt: o.JoinDate ? new Date(o.JoinDate).toISOString().split('T')[0] : '2026-08-28',
        hasGateAccess: Boolean(o.HasGateAccess)
      }));
    }

    // 5. MonthlyInvoices
    let invoices: any[] = [];
    if (hasInvoices) {
      const invResult = await sqlPool.request().query(`
        SELECT * FROM dbo.MonthlyInvoices ORDER BY InvoiceId ASC
      `);
      invoices = invResult.recordset.map((i: any) => ({
        invoiceId: Number(i.InvoiceId),
        contractId: Number(i.ContractId),
        monthYear: i.BillingPeriod || '09/2026',
        roomRent: Number(i.RoomFee || 0),
        roomDeviceRentalCost: Number(i.RoomDeviceRentalCost || 0),
        currElectric: 1105,
        prevElectric: 1000,
        electricRate: 3800,
        currWater: 15,
        prevWater: 10,
        waterRate: 30000,
        sharedDeviceCost: Number(i.SharedServicesFee || 0),
        internetAndTrash: 150000,
        sanitationFee: 30000,
        residenceFee: 0,
        totalAmount: Number(i.TotalAmountDue || 0),
        status: i.PaymentStatus === 1 ? 'PAID' : 'UNPAID',
        isApproved: Boolean(i.IsApproved),
        approvalStatus: i.ApprovalStatus || 'DRAFT',
        isLocked: Boolean(i.IsLocked)
      }));
    }

    // 6. Issues (DeviceHealthFeedbacks)
    let issues: any[] = [];
    if (hasIssues) {
      const issResult = await sqlPool.request().query(`
        SELECT f.*, m.NodeName, u.FullName AS ReporterName
        FROM dbo.DeviceHealthFeedbacks f
        LEFT JOIN dbo.ManagementNodes m ON f.NodeId = m.NodeId
        LEFT JOIN dbo.Users u ON f.ReporterUserId = u.UserId
      `);
      issues = issResult.recordset.map((f: any) => ({
        reportId: Number(f.FeedbackId),
        nodeId: Number(f.NodeId),
        deviceName: f.NodeName || 'Thiết bị',
        reportedByUserId: Number(f.ReporterUserId),
        reportedByName: f.ReporterName || 'Khách thuê',
        issueType: f.FeedbackCategory || 'DAMAGED',
        description: f.IssueDescription,
        status: f.ResolutionStatus || 'PENDING',
        reportedAt: f.CreatedAt ? new Date(f.CreatedAt).toISOString().split('T')[0] : '2026-09-01'
      }));
    }

    // 7. Reservations (RoomReservations)
    let reservations: any[] = [];
    if (hasReservations) {
      const resResult = await sqlPool.request().query(`
        SELECT r.*, m.NodeName AS RoomName, u.FullName, u.PhoneNumber, u.CitizenId
        FROM dbo.RoomReservations r
        LEFT JOIN dbo.ManagementNodes m ON r.RoomNodeId = m.NodeId
        LEFT JOIN dbo.Users u ON r.UserId = u.UserId
      `);
      reservations = resResult.recordset.map((r: any) => ({
        reservationId: Number(r.ReservationId),
        roomNodeId: Number(r.RoomNodeId),
        roomName: r.RoomName || 'Phòng',
        buildingNodeId: Number(r.BuildingNodeId),
        userId: Number(r.UserId),
        userName: r.FullName || 'Khách',
        userPhone: r.PhoneNumber || '',
        userCitizenId: r.CitizenId || '',
        status: r.Status || 'PENDING',
        expectedCheckInDate: r.ExpectedCheckInDate ? new Date(r.ExpectedCheckInDate).toISOString().split('T')[0] : '2026-10-01',
        monthlyRent: Number(r.MonthlyRent || 0),
        depositAmount: Number(r.DepositAmount || 0)
      }));
    }

    return res.json({
      success: true,
      hasData: users.length > 0 || nodes.length > 0,
      data: {
        users,
        nodes,
        contracts,
        roommates,
        invoices,
        issues,
        reservations
      },
      message: `Đã nạp ${nodes.length} đối tượng (cây phân cấp), ${users.length} tài khoản, ${contracts.length} hợp đồng và ${invoices.length} hóa đơn từ SQL Server!`
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi đọc dữ liệu từ SQL Server: ' + error.message
    });
  }
});

// 7. API: Đẩy toàn bộ dữ liệu Web hiện tại lên SQL Server (Push Data với Khử Trùng Lặp)
app.post('/api/sql/push-all-data', async (req, res) => {
  if (!sqlPool || !sqlPool.connected) {
    return res.status(400).json({ success: false, message: 'Chưa kết nối tới MS SQL Server.' });
  }

  try {
    const result = await syncAllDataToSqlServer(sqlPool, req.body);
    return res.json(result);
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật dữ liệu lên SQL Server: ' + error.message
    });
  }
});

// 8. API: Khử Trùng Lặp CSDL (Deduplication Endpoint)
app.post('/api/sql/deduplicate', async (_req, res) => {
  if (!sqlPool || !sqlPool.connected) {
    return res.status(400).json({ success: false, message: 'Chưa kết nối tới MS SQL Server.' });
  }

  try {
    await deduplicateDatabase(sqlPool);
    return res.json({
      success: true,
      message: 'Đã dọn sạch và khử toàn bộ các bản ghi trùng lặp trong CSDL SQL Server!'
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi khử trùng lặp CSDL: ' + error.message
    });
  }
});

// Setup Vite middleware trong môi trường dev hoặc serve static trong prod
async function startServer() {
  const httpServer = http.createServer(app);

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const isHmrDisabled = process.env.DISABLE_HMR === 'true';
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: isHmrDisabled ? false : { server: httpServer }
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  const portNumber = Number(PORT);
  const host = process.env.HOST || '0.0.0.0';
  httpServer.listen(portNumber, host, () => {
    console.log(`Server đang chạy tại http://localhost:${portNumber} và trên mạng LAN qua IP máy (host: ${host})`);
  });
}

startServer();
