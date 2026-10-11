import express from 'express';
import http from 'http';
import dotenv from 'dotenv';
import path from 'path';
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
      requestTimeout: 15000
    }
  };
}

// 1. API: Kiểm tra kết nối tới MS SQL Server
app.post('/api/sql/test-connection', async (req, res) => {
  const { server, port, database, user, password, encrypt } = req.body;
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

    // Lấy danh sách các bảng đã tạo (nếu có)
    const tablesResult = await pool.request().query(`
      SELECT TABLE_NAME, TABLE_TYPE 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = 'dbo'
      ORDER BY TABLE_NAME
    `);

    return res.json({
      success: true,
      connected: true,
      message: 'Kết nối MS SQL Server thành công!',
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
